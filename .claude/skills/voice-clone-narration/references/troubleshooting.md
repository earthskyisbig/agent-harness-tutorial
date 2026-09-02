# Troubleshooting

## Install

| Problem | Fix |
|---|---|
| `pip install qwen-tts` pulls a huge CUDA torch on a CPU-only Linux box | install torch first from `https://download.pytorch.org/whl/cpu` (setup_env.sh does this) |
| `transformers==4.57.3` conflicts with an existing env | always use the dedicated venv at `~/.voice-clone/venv` |
| `sounddevice` import error: `PortAudio library not found` | macOS: `brew install portaudio`; Debian/Ubuntu: `sudo apt install libportaudio2`; or skip it — record_voice.py falls back to ffmpeg/arecord/sox |
| `sox` python package fails / `sox` binary missing | only the 25 Hz tokenizer imports it; the 12 Hz models used here don't need the binary. If import errors appear, `brew install sox` / `apt install sox` |
| flash-attn build fails | ignore; the skill uses `sdpa` automatically |
| Hugging Face download slow / blocked | `export HF_ENDPOINT=https://hf-mirror.com` or pre-download with `huggingface-cli download Qwen/Qwen3-TTS-12Hz-1.7B-Base` and pass `--model-id <local dir>` |

## Recording

| Problem | Fix |
|---|---|
| No input device / wrong mic | `python scripts/record_voice.py --list-devices` then `--device <index>` |
| macOS permission dialog | grant Microphone access to Terminal/iTerm in System Settings → Privacy |
| Running on a remote server (no mic) | record on phone/laptop, copy the file, use `create_profile.py --audio file.m4a` (needs ffmpeg for m4a) |
| Warning: >60 % silence | speak continuously; the speaker embedding averages over the whole clip |

## Runtime

| Problem | Fix |
|---|---|
| `ref_text is required when x_vector_only_mode=False` | the profile lost its transcript; rebuild with `--script/--text` or accept `--no transcript` x-vector mode |
| `Unsupported languages: [...]` | use one of the names listed in `references/qwen3-tts-api.md`; aliases `ko/en/ja/zh` are accepted by the skill scripts |
| CUDA OOM on 1.7B | `--model 0.6B`, `--batch-size 1`, or `--dtype float16` |
| MPS errors on macOS | `--device cpu` (slower but reliable), or `--dtype float32` |
| Very slow on CPU | expected: ~5-15× slower than real time with 0.6B. Narrate short pieces, or run on a GPU box / Colab and copy the profile folder over (it is just files) |
| Output has long silence at the end of a chunk | lower `--max-chars`, or trim with `--gap 0.2` |
| Audio sounds fine in sample.wav but narration drifts after minutes | that is per-chunk sampling variance; set `--seed`, lower `--temperature 0.7` |

## Where things live

```
~/.voice-clone/            (override with VOICE_CLONE_HOME)
├── venv/
├── recordings/reference.wav
├── profiles/<name>/{ref.wav, ref_text.txt, meta.json, sample.wav}
└── outputs/<name>-<timestamp>.wav
```

A profile folder is portable: copy it to another machine with the skill installed and `narrate.py --profile <name>` works unchanged.
