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

