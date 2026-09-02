#!/usr/bin/env bash
# One-time environment setup for the voice-clone-narration skill.
#
#   bash scripts/setup_env.sh            # creates ~/.voice-clone/venv
#   VOICE_CLONE_HOME=/data/vc bash scripts/setup_env.sh
#
# Installs: torch (CUDA build when nvidia-smi is present, otherwise the
# default wheel, which covers CPU and Apple Silicon/MPS), qwen-tts, and
# sounddevice for microphone capture.
set -euo pipefail

VOICE_CLONE_HOME="${VOICE_CLONE_HOME:-$HOME/.voice-clone}"
VENV="$VOICE_CLONE_HOME/venv"
PY="${PYTHON:-python3}"

echo "[setup] home: $VOICE_CLONE_HOME"
mkdir -p "$VOICE_CLONE_HOME/profiles" "$VOICE_CLONE_HOME/recordings" "$VOICE_CLONE_HOME/outputs"

if [ ! -x "$VENV/bin/python" ]; then
  "$PY" -m venv "$VENV"
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install -q --upgrade pip

if command -v nvidia-smi >/dev/null 2>&1; then
  echo "[setup] NVIDIA GPU detected -> installing CUDA torch"
  pip install -q torch torchaudio
elif [ "$(uname -s)" = "Linux" ]; then
  echo "[setup] no GPU on Linux -> installing CPU-only torch (much smaller)"
  pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu
else
  echo "[setup] installing default torch (Apple Silicon uses MPS automatically)"
  pip install -q torch torchaudio
fi

pip install -q -U qwen-tts
pip install -q sounddevice || echo "[setup] sounddevice failed (PortAudio missing?) - recording will fall back to ffmpeg/arecord/sox"

# optional extras: uncomment if you want free-text references auto-transcribed
# pip install -q faster-whisper

for tool in ffmpeg sox; do
  if ! command -v $tool >/dev/null 2>&1; then
    echo "[setup] note: '$tool' not on PATH (optional: mp3 export / m4a decoding / fallback recorder)"
  fi
done

python - <<'PYEOF'
import torch, qwen_tts
dev = "cuda" if torch.cuda.is_available() else ("mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu")
print(f"[setup] torch {torch.__version__} | device: {dev} | qwen-tts ok")
if dev == "cpu":
    print("[setup] CPU only: use --model 0.6B for narration; expect roughly 5-15x slower than realtime.")
PYEOF

echo
echo "[setup] done. Activate with:  source $VENV/bin/activate"
echo "[setup] next:  python scripts/record_voice.py --script ko"
