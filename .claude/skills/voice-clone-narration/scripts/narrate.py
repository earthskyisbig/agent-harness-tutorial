#!/usr/bin/env python3
"""Narrate text in a cloned voice.

    narrate.py --profile me --text "안녕하세요" --out hello.wav
    narrate.py --profile me --file script.md --out ep1.wav --mp3
    echo "..." | narrate.py --profile me

Long text is split into sentence-sized chunks, each synthesised with the
same voice-clone prompt (built once, reused), then stitched with short
pauses; paragraph breaks get a slightly longer pause.
"""
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tts_common import (  # noqa: E402
    DEFAULT_MODEL_SIZE, OUTPUT_DIR, die, join_with_gaps, list_profiles, load_model, load_profile, log,
    maybe_encode_mp3, normalise_language, save_wav, split_into_chunks,
)


def read_text(args) -> str:
    if args.text:
        return args.text
    if args.file:
        return Path(args.file).read_text(encoding="utf-8")
    if not sys.stdin.isatty():
        return sys.stdin.read()
    die("give text with --text, --file, or via stdin")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--profile", default="me", help="voice profile name (default: me)")
    ap.add_argument("--text", help="text to narrate")
    ap.add_argument("--file", help="text/markdown file to narrate")
    ap.add_argument("--out", type=Path, default=None, help="output wav (default: ~/.voice-clone/outputs/<timestamp>.wav)")
    ap.add_argument("--language", default=None, help="korean/english/... (default: profile language, or auto)")
    ap.add_argument("--model", default=DEFAULT_MODEL_SIZE, help="0.6B | 1.7B (default 1.7B)")
    ap.add_argument("--model-id", default=None, help="explicit HF repo id or local path of a Base model")
    ap.add_argument("--device", default="auto", help="auto | cuda:0 | mps | cpu")
    ap.add_argument("--dtype", default="auto", help="auto | bfloat16 | float16 | float32")
    ap.add_argument("--max-chars", type=int, default=180, help="max characters per synthesis chunk")
    ap.add_argument("--gap", type=float, default=0.35, help="pause between sentences (s)")
    ap.add_argument("--paragraph-gap", type=float, default=0.8, help="pause between paragraphs (s)")
    ap.add_argument("--batch-size", type=int, default=4, help="chunks synthesised per model call")
    ap.add_argument("--temperature", type=float, default=None)
    ap.add_argument("--top-p", type=float, default=None)
    ap.add_argument("--seed", type=int, default=None, help="fix the sampling seed for repeatable output")
    ap.add_argument("--mp3", action="store_true", help="also export mp3 (needs ffmpeg)")
    ap.add_argument("--list-profiles", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="only print the chunk plan")
    args = ap.parse_args()

    if args.list_profiles:
        print("\n".join(list_profiles()) or "(no profiles)")
        return

    text = read_text(args).strip()
    if not text:
        die("empty text")
    chunks = split_into_chunks(text, max_chars=args.max_chars)
    log(f"{len(text)} chars -> {len(chunks)} chunk(s)")
    if args.dry_run:
        for i, (c, para) in enumerate(chunks, 1):
            print(f"[{i:03d}]{' ¶' if para else '  '} {c}")
        return

    prof = load_profile(args.profile)
    language = normalise_language(args.language or prof.language or "auto")
    out = args.out or (OUTPUT_DIR / f"{prof.name}-{time.strftime('%Y%m%d-%H%M%S')}.wav")

    if args.seed is not None:
        import torch
        torch.manual_seed(args.seed)
        np.random.seed(args.seed)

    model = load_model(args.model, args.device, args.dtype, model_id=args.model_id)
    log(f"building voice prompt from {prof.ref_wav} ({'x-vector only' if prof.x_vector_only else 'in-context'})")
    prompt = model.create_voice_clone_prompt(
        ref_audio=str(prof.ref_wav), ref_text=prof.ref_text or None, x_vector_only_mode=prof.x_vector_only,
    )

    gen_kwargs = {k: v for k, v in {"temperature": args.temperature, "top_p": args.top_p}.items() if v is not None}
    pieces = []
    sr = None
    t0 = time.time()
    for start in range(0, len(chunks), args.batch_size):
        batch = chunks[start:start + args.batch_size]
        texts = [c for c, _ in batch]
        log(f"chunk {start + 1}-{start + len(batch)}/{len(chunks)}: {texts[0][:40]}{'…' if len(texts[0]) > 40 else ''}")
        wavs, sr = model.generate_voice_clone(
            text=texts, language=[language] * len(texts), voice_clone_prompt=prompt, **gen_kwargs,
        )
        for wav, (_, para_break) in zip(wavs, batch):
            pieces.append((np.asarray(wav, dtype=np.float32), args.paragraph_gap if para_break else args.gap))
    # no trailing silence after the last piece
    if pieces:
        pieces[-1] = (pieces[-1][0], 0.0)

    audio = join_with_gaps(pieces, sr)
    save_wav(out, audio, sr)
    dur = len(audio) / sr
    log(f"done: {dur:.1f}s of audio in {time.time() - t0:.1f}s")
    print(f"✓ {out}  ({dur:.1f}s)")
    if args.mp3:
        mp3 = maybe_encode_mp3(out)
        if mp3:
            print(f"✓ {mp3}")


if __name__ == "__main__":
    main()
