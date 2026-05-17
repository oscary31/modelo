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

# 3. Get llama-server from official image
FROM ghcr.io/ggml-org/llama.cpp:server AS llama-base

# 4. Final image: node + llama.cpp
FROM node:22-alpine
WORKDIR /app

# Install python + other deps
RUN apk add --no-cache python3 py3-pip py3-requests wget bash curl

# Download llama-server binary
RUN wget -q https://github.com/ggml-org/llama.cpp/releases/download/b4038/llama-server-b4038-linux-x64 -O /usr/local/bin/llama-server && \
    chmod +x /usr/local/bin/llama-server

COPY --from=backend-builder /app/backend ./backend
COPY --from=frontend-builder /app/frontend/dist ./backend/public
COPY start.js /app/start.js

ENV MODEL_DIR=/models
ENV MODEL_FILE=Qwen_Qwen3-4B-Q4_K_M.gguf
ENV MODEL_URL=https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf
ENV MODEL_API_URL=http://127.0.0.1:8080/v1/chat/completions
ENV PORT=3001

EXPOSE 3001 8080
CMD ["node", "/app/start.js"]