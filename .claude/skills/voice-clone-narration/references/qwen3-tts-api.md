# Qwen3-TTS API notes (qwen-tts 0.1.x)

Verified against the `qwen-tts` package source (`qwen_tts/inference/qwen3_tts_model.py`).

## Models

| Repo id | Size | Cloning |
|---|---|---|
| `Qwen/Qwen3-TTS-12Hz-0.6B-Base` | ~2.5 GB | yes |
| `Qwen/Qwen3-TTS-12Hz-1.7B-Base` | ~4.5 GB | yes |
| `Qwen/Qwen3-TTS-12Hz-*-CustomVoice` | – | no (preset speakers) |
| `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign` | – | no (voice from text description) |

`create_voice_clone_prompt` / `generate_voice_clone` raise on anything but
`tts_model_type == "base"`.

## Loading

```python
import torch
from qwen_tts import Qwen3TTSModel
model = Qwen3TTSModel.from_pretrained(
    "Qwen/Qwen3-TTS-12Hz-1.7B-Base",
    device_map="cuda:0",            # "cpu", "mps" also work
    dtype=torch.bfloat16,           # float32 on cpu
    attn_implementation="sdpa",     # "flash_attention_2" if flash-attn is installed
)
```

`from_pretrained` forwards kwargs to `AutoModel.from_pretrained`, loads the
processor, and picks up `generate_config.json` from the repo if present.

## Voice cloning

```python
# one-shot
wavs, sr = model.generate_voice_clone(
    text="...", language="Korean",
    ref_audio="ref.wav",            # path | URL | base64 | (np.ndarray, sr)
    ref_text="exact transcript of ref.wav",
    x_vector_only_mode=False,
)

# reusable prompt (build once, reuse for every chunk)
prompt = model.create_voice_clone_prompt(ref_audio="ref.wav", ref_text="...", x_vector_only_mode=False)
wavs, sr = model.generate_voice_clone(text=["A.", "B."], language=["Korean", "Korean"], voice_clone_prompt=prompt)
```

- `ref_text` is **required** unless `x_vector_only_mode=True`; in x-vector
  mode only the speaker embedding is used (timbre ok, prosody generic).
- `text` / `language` may be scalars or equal-length lists (batching).
- Returns `(list_of_float32_numpy_arrays, 24000)`.
- The reference is resampled internally for the speaker encoder; the codec
  encodes it at its own rate. Any sample rate is accepted.

## Languages

Validation is case-insensitive against the model config:
`auto, chinese, english, german, italian, portuguese, spanish, japanese, korean, french, russian`.
`"Auto"` lets the model detect from the text.

## Generation kwargs

Merged from user args → `generate_config.json` → hard defaults:

```
do_sample=True, top_k=50, top_p=1.0, temperature=0.9, repetition_penalty=1.05,
subtalker_dosample=True, subtalker_top_k=50, subtalker_top_p=1.0, subtalker_temperature=0.9,
max_new_tokens=2048
```

At 12 Hz codec rate `max_new_tokens=2048` ≈ 170 s of audio per call; the
skill's chunking keeps each call far below that. Lower `temperature`
(0.6–0.8) for steadier long-form narration.

## Streaming / serving

The package ships a Gradio demo (`python -m qwen_tts.cli.demo --help`) and
the upstream repo documents vLLM-Omni offline inference. Neither is needed
for this skill.

Sources: https://github.com/QwenLM/Qwen3-TTS · https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-Base
