#!/usr/bin/env python3
"""Record a reference clip of the user's voice (default 30 s) for cloning.

Shows the reference script to read, counts down, records from the default
microphone at 24 kHz mono, then reports level / clipping / silence so the
user can re-record before wasting a model run on a bad reference.

Backends, in order: sounddevice (PortAudio) -> ffmpeg -> arecord -> sox.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tts_common import HOME, TARGET_SR, analyse_audio, die, load_audio, log, save_wav  # noqa: E402

SCRIPTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "reference_scripts"


def show_script(lang: str) -> str:
    path = SCRIPTS_DIR / f"{lang}.txt"
    if not path.exists():
        die(f"no reference script for '{lang}'. Available: {[p.stem for p in SCRIPTS_DIR.glob('*.txt')]}")
    text = path.read_text(encoding="utf-8").strip()
    print("\n" + "=" * 70)
    print("  READ THIS ALOUD, naturally, at your normal narration pace:")
    print("=" * 70)
    print(text)
    print("=" * 70 + "\n")
    return text


def countdown(seconds: int) -> None:
    for i in range(seconds, 0, -1):
        print(f"  recording starts in {i}...", end="\r", flush=True)
        time.sleep(1)
    print("  ● RECORDING — speak now                       ", flush=True)


def record_sounddevice(seconds: float, sr: int, device):
    import sounddevice as sd
    frames = int(seconds * sr)
    audio = sd.rec(frames, samplerate=sr, channels=1, dtype="float32", device=device)
    started = time.time()
    while time.time() - started < seconds:
        remaining = seconds - (time.time() - started)
        print(f"  ● {remaining:5.1f}s left ", end="\r", flush=True)
        time.sleep(0.2)
    sd.wait()
    print(" " * 40, end="\r")
    return audio[:, 0].copy()


def record_cli(seconds: float, sr: int, out: Path) -> None:
    """Fallback recorders that write straight to `out`."""
    ffmpeg, arecord, sox = shutil.which("ffmpeg"), shutil.which("arecord"), shutil.which("sox")
    if ffmpeg:
        if sys.platform == "darwin":
            cmd = [ffmpeg, "-v", "error", "-y", "-f", "avfoundation", "-i", ":0", "-t", str(seconds),
                   "-ac", "1", "-ar", str(sr), str(out)]
        elif sys.platform.startswith("linux"):
            cmd = [ffmpeg, "-v", "error", "-y", "-f", "pulse", "-i", "default", "-t", str(seconds),
                   "-ac", "1", "-ar", str(sr), str(out)]
        else:  # windows
            cmd = [ffmpeg, "-v", "error", "-y", "-f", "dshow", "-i", "audio=default", "-t", str(seconds),
                   "-ac", "1", "-ar", str(sr), str(out)]
        log("recording with ffmpeg: " + " ".join(cmd))
        subprocess.run(cmd, check=True)
        return
    if arecord:
        subprocess.run([arecord, "-q", "-f", "FLOAT_LE", "-r", str(sr), "-c", "1", "-d", str(int(seconds)), str(out)], check=True)
        return
    if sox:
        subprocess.run([sox, "-d", "-r", str(sr), "-c", "1", str(out), "trim", "0", str(seconds)], check=True)
        return
    if sys.platform == "darwin":
        # No CLI recorder, but every Mac ships Voice Memos: open it and hand over.
        subprocess.run(["open", "-a", "Voice Memos"], check=False)
        print(
            "\nNo command-line recorder found, so Voice Memos (음성 메모) was opened instead.\n"
            "  1. Press the red button, read the script above (~30 s), press stop.\n"
            "  2. Drag the new recording from the list onto your Desktop (it becomes a .m4a).\n"
            "  3. Run:  python scripts/create_profile.py --audio ~/Desktop/<name>.m4a --script ko\n"
            "  (To record from here next time: pip install sounddevice, or brew install ffmpeg.)"
        )
        sys.exit(2)
    die("no recorder available. `pip install sounddevice` (needs PortAudio) or install ffmpeg / sox, "
        "or record on your phone / Mac Voice Memos and pass the file to create_profile.py --audio instead.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seconds", type=float, default=30, help="recording length (default 30)")
    ap.add_argument("--out", type=Path, default=HOME / "recordings" / "reference.wav")
    ap.add_argument("--script", default="ko", help="reference script to display: ko | en | none")
    ap.add_argument("--device", default=None, help="sounddevice input device index/name (see --list-devices)")
    ap.add_argument("--list-devices", action="store_true")
    ap.add_argument("--countdown", type=int, default=3)
    args = ap.parse_args()

    if args.list_devices:
        import sounddevice as sd
        print(sd.query_devices())
        return

    if args.script != "none":
        show_script(args.script)
        print("Tip: keep 20-40 cm from the mic, quiet room, no music, speak continuously.\n")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    countdown(args.countdown)

    try:
        import sounddevice  # noqa: F401
        wav = record_sounddevice(args.seconds, TARGET_SR, args.device)
        save_wav(args.out, wav, TARGET_SR)
    except ImportError:
        log("sounddevice not installed; trying a command-line recorder")
        record_cli(args.seconds, TARGET_SR, args.out)
        wav, _ = load_audio(args.out, TARGET_SR)
    except Exception as e:  # PortAudio present but no usable device etc.
        log(f"sounddevice failed ({e}); trying a command-line recorder")
        record_cli(args.seconds, TARGET_SR, args.out)
        wav, _ = load_audio(args.out, TARGET_SR)

    rep = analyse_audio(wav, TARGET_SR)
    print(f"\nSaved: {args.out}")
    print(f"  duration {rep.duration_s:.1f}s | peak {20*np.log10(rep.peak+1e-9):.1f} dBFS | "
          f"rms {rep.rms_db:.1f} dB | silence {rep.silence_ratio*100:.0f}% | clipped {rep.clipped_ratio*100:.2f}%")
    if rep.warnings:
        print("  ⚠ " + "\n  ⚠ ".join(rep.warnings))
        print("  Consider re-recording. If it sounded fine to you, continue anyway.")
    else:
        print("  ✓ recording looks good")
    print(f"\nNext: python scripts/create_profile.py --audio {args.out} --script {args.script}")


if __name__ == "__main__":
    main()
