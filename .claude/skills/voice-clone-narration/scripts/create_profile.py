#!/usr/bin/env python3
"""Turn a reference recording into a reusable voice profile.

A profile is a folder under ~/.voice-clone/profiles/<name>/ holding the
conditioned reference wav, its transcript (ref_text) and metadata.
narrate.py loads it by name, so the user records once and reuses forever.

The transcript matters: Qwen3-TTS's in-context cloning mode aligns the
reference audio with its text. Give the exact words that were spoken —
the bundled scripts make this automatic (`--script ko`). Without any
transcript the profile falls back to x-vector-only mode (speaker embedding
only), which still sounds like the speaker but loses prosody detail.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tts_common import (  # noqa: E402
    DEFAULT_MODEL_SIZE, TARGET_SR, analyse_audio, condition_reference, die, list_profiles,
    load_audio, load_model, log, normalise_language, save_profile, save_wav,
)

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "reference_scripts"
TEST_SENTENCES = {
    "korean": "안녕하세요. 목소리 복제가 완료되었습니다. 이제 어떤 글이든 제 목소리로 읽어 드릴 수 있어요.",
    "english": "Hello. The voice profile is ready. From now on I can narrate any text in this voice.",
}


def resolve_ref_text(args) -> str:
    if args.text:
        return args.text.strip()
    if args.text_file:
        return Path(args.text_file).read_text(encoding="utf-8").strip()
    if args.script and args.script != "none":
        p = SCRIPTS_DIR / f"{args.script}.txt"
        if not p.exists():
            die(f"unknown script '{args.script}'")
        return p.read_text(encoding="utf-8").strip()
    if args.transcribe:
        return transcribe(args.audio, args.language)
    return ""


def transcribe(audio: Path, language: str) -> str:
    """Optional: auto-transcribe with faster-whisper when the user read free text."""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        die("--transcribe needs `pip install faster-whisper`, or pass --text / --text-file / --script instead")
    lang = None if language == "auto" else {"korean": "ko", "english": "en", "japanese": "ja", "chinese": "zh"}.get(language, None)
    log("transcribing reference with faster-whisper (small) ...")
    model = WhisperModel("small", device="auto", compute_type="auto")
    segments, _ = model.transcribe(str(audio), language=lang)
    text = " ".join(s.text.strip() for s in segments)
    log(f"transcript: {text}")
    return text


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--audio", type=Path, required=True, help="reference recording (wav/mp3/m4a/...)")
    ap.add_argument("--name", default="me", help="profile name (default: me)")
    ap.add_argument("--language", default="korean", help="language the reference was spoken in (korean/english/...)")
    src = ap.add_argument_group("transcript of the reference (pick one)")
    src.add_argument("--script", default=None, help="bundled script id that was read aloud: ko | en")
    src.add_argument("--text", default=None, help="exact transcript as a string")
    src.add_argument("--text-file", default=None, help="file containing the transcript")
    src.add_argument("--transcribe", action="store_true", help="auto-transcribe with faster-whisper")
    ap.add_argument("--max-seconds", type=float, default=45.0,
                    help="cap reference length (default 45; a 30 s script often runs 35-40 s, and cutting it "
                         "would break the audio/transcript alignment)")
    ap.add_argument("--model", default=DEFAULT_MODEL_SIZE, help="0.6B | 1.7B for the verification sample")
    ap.add_argument("--device", default="auto")
    ap.add_argument("--no-test", action="store_true", help="skip synthesising a verification sample")
    ap.add_argument("--force", action="store_true", help="overwrite an existing profile")
    args = ap.parse_args()

    if args.name in list_profiles() and not args.force:
        die(f"profile '{args.name}' already exists; pass --force to overwrite or choose --name")

    language = normalise_language(args.language)
    ref_text = resolve_ref_text(args)
    mode = "in-context (ref_text)" if ref_text else "x-vector only (no transcript)"
    if not ref_text:
        log("no transcript given -> x-vector-only mode. Quality is better with --script/--text/--transcribe.")

    wav, sr = load_audio(args.audio, TARGET_SR)
    before = analyse_audio(wav, sr)
    wav = condition_reference(wav, sr, max_seconds=args.max_seconds)
    after = analyse_audio(wav, sr)
    log(f"reference: {before.duration_s:.1f}s raw -> {after.duration_s:.1f}s conditioned, mode={mode}")
    for w in after.warnings:
        log(f"⚠ {w}")

    prof = save_profile(args.name, wav, sr, ref_text, language,
                        extra={"source_audio": str(Path(args.audio).resolve()), "mode": mode})
    print(f"✓ profile '{prof.name}' saved at {prof.dir}")

    if args.no_test:
        return

    model = load_model(args.model, args.device)
    sentence = TEST_SENTENCES.get(language, TEST_SENTENCES["english"])
    log("synthesising a verification sample ...")
    wavs, out_sr = model.generate_voice_clone(
        text=sentence, language=language,
        ref_audio=str(prof.ref_wav), ref_text=ref_text or None,
        x_vector_only_mode=prof.x_vector_only,
    )
    sample = save_wav(prof.dir / "sample.wav", wavs[0], out_sr)
    print(f"✓ verification sample: {sample}")
    print("  Listen to it. If it doesn't sound like you, re-record in a quieter room and run again with --force.")
    print(f"\nNext: python scripts/narrate.py --profile {prof.name} --text \"읽어 줄 문장\" --out narration.wav")


if __name__ == "__main__":
    main()
