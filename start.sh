#!/usr/bin/bash
set -e

mkdir -p "${MODEL_DIR}"
MODEL_PATH="${MODEL_DIR}/${MODEL_FILE}"

if [ ! -f "${MODEL_PATH}" ]; then
  echo "Downloading model from Hugging Face..."
  wget -q --show-progress -O "${MODEL_PATH}" "${MODEL_URL}"
else
  echo "Model already exists, skipping download."
fi

# Start llama.cpp server in the background
llama-server -m "${MODEL_PATH}" --host 0.0.0.0 --port 8080 &

# Start the backend in the foreground
exec node /app/backend/index.js
