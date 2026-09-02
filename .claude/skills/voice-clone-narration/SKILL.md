---
name: voice-clone-narration
description: >-
  Clone the user's own voice from a ~30-second microphone recording with the
  open-source Qwen3-TTS (Qwen3-TTS-12Hz Base) model and narrate any text in
  that voice. Use this skill whenever the user mentions voice cloning, 목소리
  복제, 내 목소리로 읽어줘, 나레이션/내레이션 만들기, TTS with their own voice,
  Qwen3-TTS, recording a voice sample, turning a script/blog/README into
  narrated audio, or wants an audio file spoken in a specific cloned voice —
  even if they don't say "clone" explicitly. Covers setup, recording,
  building a reusable voice profile, and generating wav/mp3 narration.
---

# Voice Clone Narration (Qwen3-TTS)

Turn a 30-second recording of the user's voice into a reusable **voice
profile**, then narrate any text in that voice. Everything runs locally with
`Qwen/Qwen3-TTS-12Hz-*-Base` (the only Qwen3-TTS variants that support
cloning). Only clone a voice you own or have explicit permission to use.

## How it fits together

```
record_voice.py ──▶ reference.wav ──▶ create_profile.py ──▶ ~/.voice-clone/profiles/<name>/
   (30 s, shows a                          (conditions audio,        ├─ ref.wav
    script to read)                         stores transcript,       ├─ ref_text.txt
                                            makes a test sample)     ├─ meta.json
                                                                     └─ sample.wav
                                     narrate.py --profile <name> --text/--file ──▶ narration.wav (+mp3)
```

The transcript of the reference (`ref_text`) is what makes the clone good:
Qwen3-TTS aligns the reference audio with its words (in-context mode). That
is why recording uses a fixed script — the transcript is then known exactly.

All scripts live in `scripts/` next to this file; run them with the venv
python from `~/.voice-clone/venv` (created by `setup_env.sh`). Every script
supports `--help`.

## Workflow

### 0. First time only: set up the environment

```bash
bash scripts/setup_env.sh          # ~/.voice-clone/venv  (torch + qwen-tts + sounddevice)
source ~/.voice-clone/venv/bin/activate
```

The script picks CUDA torch if `nvidia-smi` exists, CPU-only torch on Linux
without a GPU, and the default wheel on macOS (Apple Silicon uses MPS). Model
weights (0.6B ≈ 2.5 GB, 1.7B ≈ 4.5 GB) download from Hugging Face on first
use. No GPU: use `--model 0.6B` everywhere and warn the user that synthesis
is a few times slower than real time (measured: 10 s of Korean audio in
about 35 s on a 4-core CPU). See `references/troubleshooting.md` for
install failures.

### 1. Record the reference (30 s)

```bash
python scripts/record_voice.py --script ko      # or --script en, --seconds 30, --list-devices
```

It prints the script from `assets/reference_scripts/<lang>.txt`, counts
down, records from the default mic at 24 kHz mono, saves
`~/.voice-clone/recordings/reference.wav`, and reports duration / peak /
clipping / silence. Ask the user to re-record when it warns (clipping, very
quiet, >60 % silence).

Recording needs a real microphone on the machine running the script. When
Claude runs remotely (Claude Code on the web, a cloud container, an SSH
box) the user's mic is unreachable, so hand the recording step to them:
show the script from `assets/reference_scripts/<lang>.txt`, have them
record ~30 s with what they already have — macOS Voice Memos (음성 메모) or
QuickTime Player → New Audio Recording, a phone voice-memo app, any format
including m4a — and get the file back through whatever channel exists
(a connected drive, a URL, a commit, a file drop). Then skip to step 2 with
`--audio <their file>`. On a Mac without sounddevice/ffmpeg the recorder
opens Voice Memos and prints these same steps by itself.

Tips to relay to the user: quiet room, 20-40 cm from the mic, no music,
normal narration pace and tone (the clone copies the *style* of the
reference too — a flat reading yields flat narration).

Because the style is copied, match the reference to the job. `ko` / `en`
are formal narration scripts (존댓말, documentary tone): right for
explainers, tutorials, audiobooks. `ko_casual` is an intimate 반말 script
for personal messages to family or friends. When the user wants a warm,
conversational result and the only profile was recorded in narration tone,
suggest recording `--script ko_casual` into a second profile
(`--name me-casual`) rather than fighting the mismatch with sampling
settings.

### 2. Build the voice profile

```bash
python scripts/create_profile.py --audio ~/.voice-clone/recordings/reference.wav --script ko --name me
```

Transcript options (pick one): `--script ko|en` (they read the bundled
script), `--text "..."` / `--text-file` (they read something else — the
transcript must match what was actually said), `--transcribe` (needs
`pip install faster-whisper`), or nothing → x-vector-only mode, which keeps
the timbre but loses prosody; mention that trade-off.

The script trims edge silence, caps the clip at 30 s, peak-normalises,
saves the profile, and synthesises `sample.wav` so the user can verify the
voice before narrating anything long (`--no-test` skips it). Use `--name`
for multiple voices; `--force` to rebuild one.

### 3. Narrate

```bash
python scripts/narrate.py --profile me --text "안녕하세요, 오늘의 에피소드를 시작합니다." --out intro.wav
python scripts/narrate.py --profile me --file docs/episode1.md --out ep1.wav --mp3
cat notes.txt | python scripts/narrate.py --profile me
```

Key flags: `--language` (default: profile language; `auto` lets the model
detect — set it explicitly when the text language differs from the
reference, e.g. Korean reference reading English text), `--model 0.6B|1.7B`
(1.7B sounds better; 0.6B for CPU / low VRAM), `--gap` / `--paragraph-gap`
(pauses in seconds; the model's own padding silence is trimmed so these
are exact), `--max-chars` (chunk size), `--seed` (reproducible output),
`--batch-size` (leave at 1 on CPU, raise to 4-8 on a GPU), `--dry-run`
(show the chunk plan without loading the model), `--list-profiles`.

Output defaults to `~/.voice-clone/outputs/<profile>-<timestamp>.wav`.
Tell the user the path when done.

## Preparing text for narration

The model reads exactly what it is given, so clean the text before passing
it in, especially for markdown or code-heavy sources:

- Strip markdown syntax, URLs, code blocks, tables, and image alt text; turn
  headings into short spoken lead-ins if they matter.
- Expand things a narrator would say differently: "e.g." → "예를 들어",
  "v2.1" → "버전 2.1", abbreviations the user would speak in full.
- Keep paragraphs (blank lines) — they become longer pauses.
- One thought per sentence. Very long sentences are split on commas, which
  can sound abrupt.
- For anything longer than a few paragraphs, run `--dry-run` first and show
  the user the chunk plan; a mis-split sentence is far cheaper to fix before
  synthesis than after.

## Quality checklist when the result is off

| Symptom | Likely cause | Fix |
|---|---|---|
| Doesn't sound like the user | noisy / quiet / clipped reference, or transcript mismatch | re-record, make sure `--script`/`--text` matches what was read, `--force` |
| Right voice, robotic prosody | x-vector-only mode (no transcript) | rebuild the profile with a transcript |
| Right voice, wrong mood (stiff for a personal message, too chatty for a tutorial) | reference tone doesn't match the text; 0.6B also flattens prosody | record a second profile with a matching script (`ko_casual` vs `ko`), use `--model 1.7B`, `--temperature 0.7` |
| Wrong language accent | `--language` left on the reference language | pass `--language` matching the *text* |
| Skips or repeats words | chunk too long or hallucination on odd tokens | lower `--max-chars` to ~120, clean the text, try another `--seed` |
| Slow | CPU inference or 1.7B on small GPU | `--model 0.6B`; on GPU raise `--batch-size`. On CPU keep it at 1: a batch runs until its slowest member stops |
| Uneven pauses | trimming disabled or long chunks | default trimming handles it; otherwise tune `--gap` / `--paragraph-gap` |

More detail: `references/qwen3-tts-api.md` (model API, languages,
generation kwargs) and `references/troubleshooting.md` (install/runtime
errors by platform).
