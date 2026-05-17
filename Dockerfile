# 1. Build the frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2. Build the backend (node deps)
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/

# 3. Final image: llama.cpp server + backend + frontend
FROM ghcr.io/ggml-org/llama.cpp:server
WORKDIR /app

# Install node 22 + python (llama.cpp image is Debian/Ubuntu based)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates python3 python3-pip python3-requests wget bash && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /app/backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Script that downloads the model (if needed) and starts llama + backend
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV MODEL_DIR=/models
ENV MODEL_FILE=Qwen_Qwen3-4B-Q4_K_M.gguf
ENV MODEL_URL=https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf
ENV MODEL_API_URL=http://127.0.0.1:8080/v1/chat/completions
ENV PORT=3001

#VOLUME ["/models"]
EXPOSE 3001 8080
CMD /usr/bin/bash /app/start.sh
