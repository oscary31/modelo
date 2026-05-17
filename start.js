const fs = require('fs')
const path = require('path')
const { Readable } = require('stream')
const { pipeline } = require('stream/promises')
const { spawn } = require('child_process')

const modelDir = process.env.MODEL_DIR || '/models'
const modelFile = process.env.MODEL_FILE || 'Qwen_Qwen3-4B-Q4_K_M.gguf'
const modelUrl = process.env.MODEL_URL ||
  'https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf'

const modelPath = path.join(modelDir, modelFile)

async function ensureModel() {
  await fs.promises.mkdir(modelDir, { recursive: true })

  if (fs.existsSync(modelPath)) {
    console.log('Model already exists, skipping download.')
    return
  }

  console.log('Downloading model from Hugging Face...')
  const response = await fetch(modelUrl)
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status} ${response.statusText}`)
  }

  const body = response.body
  if (!body) {
    throw new Error('Failed to download model: empty response body')
  }

  const readable = Readable.fromWeb(body)
  await pipeline(readable, fs.createWriteStream(modelPath))
}

async function start() {
  await ensureModel()

  const llama = spawn(
    'llama-server',
    ['-m', modelPath, '--host', '0.0.0.0', '--port', '8080'],
    { stdio: 'inherit' }
  )

  const backend = spawn('node', ['/app/backend/index.js'], {
    stdio: 'inherit',
    env: process.env,
  })

  const shutdown = (code) => {
    if (!backend.killed) {
      backend.kill('SIGTERM')
    }
    if (!llama.killed) {
      llama.kill('SIGTERM')
    }
    process.exit(code ?? 0)
  }

  backend.on('exit', (code) => shutdown(code ?? 0))
  llama.on('exit', (code) => shutdown(code ?? 1))

  process.on('SIGTERM', () => shutdown(0))
  process.on('SIGINT', () => shutdown(0))
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
