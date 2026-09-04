"""Shared helpers for the voice-clone-narration skill.

Everything that touches the Qwen3-TTS model, the on-disk voice profile
format, or audio normalisation lives here so that record / clone / narrate
scripts stay small and behave identically.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

import numpy as np

# --------------------------------------------------------------------------- #
# Paths / constants
# --------------------------------------------------------------------------- #

HOME = Path(os.environ.get("VOICE_CLONE_HOME", Path.home() / ".voice-clone")).expanduser()
PROFILES_DIR = HOME / "profiles"
OUTPUT_DIR = HOME / "outputs"

TARGET_SR = 24_000          # Qwen3-TTS outputs 24 kHz; keep references at the same rate
DEFAULT_MODEL_SIZE = "1.7B"
MODEL_IDS = {
    "0.6B": "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
    "1.7B": "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
}
LANGUAGES = ["auto", "korean", "english", "chinese", "japanese", "german",
             "french", "russian", "portuguese", "spanish", "italian"]


def log(msg: str) -> None:
    print(f"[voice-clone] {msg}", file=sys.stderr, flush=True)


def die(msg: str, code: int = 1) -> None:
    log(f"ERROR: {msg}")
    sys.exit(code)


# --------------------------------------------------------------------------- #
# Audio I/O
# --------------------------------------------------------------------------- #

def load_audio(path: Path, target_sr: int = TARGET_SR) -> Tuple[np.ndarray, int]:
    """Load any audio file as mono float32 at target_sr.

    Tries soundfile (wav/flac/ogg), then librosa (adds mp3), then falls back to
    ffmpeg for containers like m4a/aac that phone recorders produce.
    """
    path = Path(path)
    if not path.exists():
        die(f"audio file not found: {path}")

    try:
        import soundfile as sf
        wav, sr = sf.read(str(path), dtype="float32", always_2d=False)
        if wav.ndim > 1:
            wav = wav.mean(axis=1)
    except Exception:
        wav = None
        sr = 0
        try:
            import librosa
            wav, sr = librosa.load(str(path), sr=None, mono=True)
        except Exception:
            wav = None
        if wav is None:
            wav, sr = _ffmpeg_decode(path, target_sr)

    if sr != target_sr:
        import librosa
        wav = librosa.resample(wav.astype(np.float32), orig_sr=sr, target_sr=target_sr)
        sr = target_sr
    return wav.astype(np.float32), sr


def find_ffmpeg() -> Optional[str]:
    """ffmpeg from PATH, else the static binary bundled by the imageio-ffmpeg wheel."""
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def _ffmpeg_decode(path: Path, sr: int) -> Tuple[np.ndarray, int]:
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        die(f"cannot decode {path.suffix} without ffmpeg. `pip install imageio-ffmpeg` (no system install needed), "
            "install ffmpeg, or convert the file to wav first.")
    cmd = [ffmpeg, "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy(), sr


def save_wav(path: Path, wav: np.ndarray, sr: int) -> Path:
    import soundfile as sf
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.clip(wav, -1.0, 1.0), sr)
    return path


def maybe_encode_mp3(wav_path: Path) -> Optional[Path]:
    """Convert a wav to mp3 next to it with ffmpeg. Returns None when ffmpeg is missing."""
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        log("ffmpeg not found; skipping mp3 export (wav is still written). `pip install imageio-ffmpeg` fixes this.")
        return None
    mp3 = wav_path.with_suffix(".mp3")
    subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame",
                    "-q:a", "2", str(mp3)], check=True)
    return mp3


# --------------------------------------------------------------------------- #
# Reference-audio conditioning
# --------------------------------------------------------------------------- #

@dataclass
class AudioReport:
    duration_s: float
    peak: float
    rms_db: float
    clipped_ratio: float
    silence_ratio: float
    warnings: List[str]


def analyse_audio(wav: np.ndarray, sr: int) -> AudioReport:
    dur = len(wav) / sr
    peak = float(np.max(np.abs(wav))) if len(wav) else 0.0
    rms = float(np.sqrt(np.mean(wav ** 2))) if len(wav) else 0.0
    rms_db = 20 * np.log10(rms + 1e-9)
    clipped = float(np.mean(np.abs(wav) >= 0.99)) if len(wav) else 0.0

    frame = int(sr * 0.03)
    if len(wav) >= frame:
        frames = wav[: len(wav) - len(wav) % frame].reshape(-1, frame)
        frame_rms = np.sqrt(np.mean(frames ** 2, axis=1))
        silence = float(np.mean(frame_rms < 0.01))
    else:
        silence = 1.0

    warnings: List[str] = []
    if dur < 3:
        warnings.append("shorter than 3 s: cloning quality will be poor, record at least 10 s")
    elif dur < 8:
        warnings.append("shorter than 8 s: works, but 15-30 s gives a more stable clone")
    if dur > 45:
        warnings.append("longer than 45 s: will be trimmed, the model only needs ~30 s")
    if peak < 0.05:
        warnings.append("very quiet recording (peak < -26 dBFS): move closer to the mic or raise input gain")
    if clipped > 0.001:
        warnings.append("clipping detected: lower the input gain and re-record")
    if silence > 0.6:
        warnings.append("more than 60% silence: speak continuously, pauses confuse the speaker embedding")
    return AudioReport(dur, peak, rms_db, clipped, silence, warnings)


def condition_reference(wav: np.ndarray, sr: int, max_seconds: float = 45.0) -> np.ndarray:
    """Trim edge silence, cap length and peak-normalise a reference recording.

    Qwen3-TTS uses the reference twice: as codec tokens for in-context
    learning and as an x-vector for speaker identity. Long silences at the
    edges leak into both, and a hot signal skews the embedding, so we tidy
    the clip before saving it as the profile reference.
    """
    import librosa
    trimmed, _ = librosa.effects.trim(wav, top_db=35)
    if len(trimmed) > sr * 0.5:
        wav = trimmed
    if len(wav) > int(sr * max_seconds):
        log(f"⚠ reference is {len(wav)/sr:.0f}s, cutting to {max_seconds:.0f}s. If a transcript was given it no "
            "longer matches the tail: pass a larger --max-seconds or shorten the transcript accordingly.")
        wav = wav[: int(sr * max_seconds)]
    peak = np.max(np.abs(wav)) if len(wav) else 0.0
    if peak > 0:
        wav = wav * (0.89 / peak)  # ~-1 dBFS
    return wav.astype(np.float32)


# --------------------------------------------------------------------------- #
# Voice profiles
# --------------------------------------------------------------------------- #

@dataclass
class Profile:
    name: str
    dir: Path
    ref_wav: Path
    ref_text: str
    language: str
    meta: dict

    @property
    def x_vector_only(self) -> bool:
        return not bool(self.ref_text.strip())


def profile_dir(name: str) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9_\-가-힣]+", name):
        die(f"profile name '{name}' may only contain letters, digits, '-' and '_'")
    return PROFILES_DIR / name


def save_profile(name: str, wav: np.ndarray, sr: int, ref_text: str, language: str, extra: dict | None = None) -> Profile:
    d = profile_dir(name)
    d.mkdir(parents=True, exist_ok=True)
    ref = save_wav(d / "ref.wav", wav, sr)
    (d / "ref_text.txt").write_text(ref_text.strip() + "\n", encoding="utf-8")
    meta = {
        "name": name,
        "language": language,
        "sample_rate": sr,
        "duration_s": round(len(wav) / sr, 2),
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "x_vector_only": not bool(ref_text.strip()),
    }
    meta.update(extra or {})
    (d / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return Profile(name, d, ref, ref_text, language, meta)


def load_profile(name: str) -> Profile:
    d = profile_dir(name)
    if not (d / "ref.wav").exists():
        available = list_profiles()
        hint = f" Available: {', '.join(available)}" if available else " No profiles yet: run create_profile.py first."
        die(f"profile '{name}' not found at {d}.{hint}")
    meta = json.loads((d / "meta.json").read_text(encoding="utf-8")) if (d / "meta.json").exists() else {}
    ref_text = (d / "ref_text.txt").read_text(encoding="utf-8") if (d / "ref_text.txt").exists() else ""
    return Profile(name, d, d / "ref.wav", ref_text.strip(), meta.get("language", "auto"), meta)


def list_profiles() -> List[str]:
    if not PROFILES_DIR.exists():
        return []
    return sorted(p.name for p in PROFILES_DIR.iterdir() if (p / "ref.wav").exists())


# --------------------------------------------------------------------------- #
# Model loading
# --------------------------------------------------------------------------- #

def pick_device(requested: str = "auto") -> str:
    import torch
    if requested != "auto":
        return requested
    if torch.cuda.is_available():
        return "cuda:0"
    if getattr(torch.backends, "mps", None) is not None and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def load_model(size: str = DEFAULT_MODEL_SIZE, device: str = "auto", dtype: str = "auto",
               model_id: Optional[str] = None):
    """Load a Qwen3-TTS *Base* model (the only variant that supports voice cloning)."""
    import torch
    from qwen_tts import Qwen3TTSModel

    model_id = model_id or MODEL_IDS.get(size)
    if model_id is None:
        die(f"unknown model size '{size}'. Use one of {list(MODEL_IDS)} or pass --model-id.")

    dev = pick_device(device)
    if dtype == "auto":
        torch_dtype = torch.bfloat16 if dev.startswith("cuda") else torch.float32
    else:
        torch_dtype = getattr(torch, dtype)

    attn = "sdpa"
    if dev.startswith("cuda"):
        try:
            import flash_attn  # noqa: F401
            attn = "flash_attention_2"
        except Exception:
            attn = "sdpa"

    log(f"loading {model_id} on {dev} ({torch_dtype}, attn={attn}) ...")
    t0 = time.time()
    model = Qwen3TTSModel.from_pretrained(model_id, device_map=dev, dtype=torch_dtype, attn_implementation=attn)
    log(f"model ready in {time.time() - t0:.1f}s")
    return model


def normalise_language(lang: str) -> str:
    lang = (lang or "auto").strip().lower()
    aliases = {"ko": "korean", "kr": "korean", "한국어": "korean", "en": "english", "영어": "english",
               "zh": "chinese", "cn": "chinese", "중국어": "chinese", "ja": "japanese", "jp": "japanese",
               "일본어": "japanese", "de": "german", "fr": "french", "ru": "russian", "pt": "portuguese",
               "es": "spanish", "it": "italian"}
    lang = aliases.get(lang, lang)
    if lang not in LANGUAGES:
        die(f"unsupported language '{lang}'. Choose from: {', '.join(LANGUAGES)}")
    return lang


# --------------------------------------------------------------------------- #
# Text chunking for narration
# --------------------------------------------------------------------------- #

_SENT_END = re.compile(r"(?<=[.!?。！？])\s+|(?<=[다요죠네까]\.)\s*|\n+")


def split_into_chunks(text: str, max_chars: int = 180) -> List[Tuple[str, bool]]:
    """Split narration text into (chunk, paragraph_break_after) pairs.

    Qwen3-TTS is happiest with one to three sentences per call: quality stays
    even, a stray hallucination cannot ruin a whole paragraph, and the caller
    can insert natural pauses between chunks. Paragraph breaks are preserved
    so the narration can pause a little longer there.
    """
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text.strip()) if p.strip()]
    chunks: List[Tuple[str, bool]] = []

    def pieces_of(sentence: str) -> List[str]:
        """Break an over-long sentence on clause punctuation, then on spaces."""
        if len(sentence) <= max_chars:
            return [sentence]
        out: List[str] = []
        cur = ""
        for part in re.split(r"(?<=[,，;:])\s*", sentence):
            if not part:
                continue
            if len(part) > max_chars:  # no punctuation at all: hard-wrap on spaces
                for word in part.split(" "):
                    if len(cur) + len(word) + 1 > max_chars and cur:
                        out.append(cur.strip())
                        cur = word
                    else:
                        cur = (cur + " " + word).strip()
                continue
            if len(cur) + len(part) + 1 > max_chars and cur:
                out.append(cur.strip())
                cur = part
            else:
                cur = (cur + " " + part).strip()
        if cur:
            out.append(cur.strip())
        return out

    for para in paragraphs:
        sentences = [s.strip() for s in _SENT_END.split(para.replace("\n", " ")) if s and s.strip()]
        buf = ""
        for sentence in sentences:
            for piece in pieces_of(sentence):
                if buf and len(buf) + len(piece) + 1 > max_chars:
                    chunks.append((buf, False))
                    buf = piece
                else:
                    buf = (buf + " " + piece).strip()
        if buf:
            chunks.append((buf, True))
    if chunks:
        chunks[-1] = (chunks[-1][0], False)
    return chunks


def trim_edges(wav: np.ndarray, sr: int, keep_s: float = 0.08, top_db: float = 40.0) -> np.ndarray:
    """Cut the silence the model pads around each chunk, keeping `keep_s` of headroom.

    Generated chunks typically carry 0.3-1.5 s of silence on both ends. Left
    in place it makes pauses between sentences uneven; trimming lets --gap
    and --paragraph-gap set the pacing deterministically.
    """
    import librosa
    if len(wav) < sr * 0.2:
        return wav
    _, (start, end) = librosa.effects.trim(wav, top_db=top_db)
    keep = int(sr * keep_s)
    return wav[max(0, start - keep): min(len(wav), end + keep)]


def join_with_gaps(pieces: Iterable[Tuple[np.ndarray, float]], sr: int) -> np.ndarray:
    """Concatenate wav pieces, inserting `gap_s` seconds of silence after each."""
    out: List[np.ndarray] = []
    for wav, gap_s in pieces:
        out.append(wav.astype(np.float32))
        if gap_s > 0:
            out.append(np.zeros(int(sr * gap_s), dtype=np.float32))
    return np.concatenate(out) if out else np.zeros(0, dtype=np.float32)
