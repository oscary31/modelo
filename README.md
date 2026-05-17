# modelo

App básica con:
- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Modelo IA**: script Python (stub inicial)

## Estructura

- `/frontend`: UI para ingresar texto y mostrar respuesta.
- `/backend`: API Express con endpoint `/api/predict` que llama a Python.
- `/backend/model.py`: modelo IA base que procesa el texto recibido.

## Ejecutar en local

### 1) Backend

```bash
cd /home/runner/work/modelo/modelo/backend
npm install
npm start
```

Servidor en `http://localhost:3001`.

### 2) Frontend

```bash
cd /home/runner/work/modelo/modelo/frontend
npm install
npm run dev
```

UI en `http://localhost:5173`.

## Flujo

1. Usuario escribe texto en el home de React.
2. Frontend hace `POST /api/predict` al backend.
3. Backend ejecuta `model.py`, enviando el texto por `stdin`.
4. Python responde y el resultado se muestra en el frontend.

## Ejecutar con Docker

Se incluyen `Dockerfile` para backend y frontend, y un `docker-compose.yml` para orquestarlos.
Tambien se incluye un servicio de modelo con `llama.cpp` que expone `v1/chat/completions`.

Construir y levantar los servicios:

```bash
cd ModeloRepo/modelo
docker compose up --build
```

- El backend quedará en `http://localhost:3001`.
- El frontend (servido por nginx) estará en `http://localhost:5173`.
- El modelo estará en `http://localhost:8080`.

Nota: el modelo se toma desde `backend/llama.cpp/modelos/Qwen_Qwen3-4B-Q4_K_M.gguf` y puede tardar en iniciar.

Para detener y borrar contenedores:

```bash
docker compose down
```

## Ejecutar el modelo sin Docker Compose

Estos comandos replican los servicios `model-downloader` y `llama` con `docker run`.

1) Crear el volumen y descargar el modelo:

```bash
docker volume create llama_models
docker run --rm -v llama_models:/models alpine:latest sh -c "apk add --no-cache wget && mkdir -p /models && if [ ! -f /models/Qwen_Qwen3-4B-Q4_K_M.gguf ]; then echo 'Downloading model from Hugging Face...'; wget -q --show-progress -O /models/Qwen_Qwen3-4B-Q4_K_M.gguf 'https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf'; else echo 'Model already exists, skipping download.'; fi"
```

2) Levantar el servidor del modelo:

```bash
docker run --rm -p 8080:8080 -v llama_models:/models:ro ghcr.io/ggml-org/llama.cpp:server -m /models/Qwen_Qwen3-4B-Q4_K_M.gguf --host 0.0.0.0 --port 8080
```

Si quieres dejarlo en background, agrega `-d` al comando anterior.

## Dockerfile unificado (multistage)

Se incluyo un `Dockerfile` en la raiz que ahora tambien levanta `llama.cpp` y descarga el modelo si no existe. Es util para Railway cuando necesitas un solo servicio. El arranque se hace con un script en Node para evitar depender de `sh`/`bash` en runtime.

Variables utiles:

- `MODEL_URL`: URL del modelo GGUF.
- `MODEL_DIR`: carpeta donde se guarda el modelo (default `/models`).
- `MODEL_FILE`: nombre del archivo del modelo.
- `MODEL_API_URL`: URL usada por el backend para llamar a `llama.cpp`.

Ejemplo (una sola imagen):

```bash
docker build -t modelo-monolith .
docker run -p 3001:3001 -p 8080:8080 -v llama_models:/models modelo-monolith
```

