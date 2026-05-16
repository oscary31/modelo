const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const { rateLimit } = require('express-rate-limit')

const app = express()
const port = process.env.PORT || 3001
const predictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta luego.' },
})

app.use(cors())
app.use(express.json())

const publicDir = path.join(__dirname, 'public')
const hasFrontendBuild = fs.existsSync(publicDir)
if (hasFrontendBuild) {
  app.use(express.static(publicDir))
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/predict', predictRateLimit, (req, res) => {
  const { text } = req.body ?? {}

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'El campo "text" es obligatorio.' })
  }

  const modelPath = path.join(__dirname, 'model.py')
  const pythonProcess = spawn('python3', [modelPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  let output = ''
  let errorOutput = ''

  pythonProcess.stdout.on('data', (chunk) => {
    output += chunk.toString()
  })

  pythonProcess.stderr.on('data', (chunk) => {
    errorOutput += chunk.toString()
  })

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: 'No se pudo obtener respuesta del modelo.',
        details: errorOutput.trim(),
      })
    }

    return res.json({ response: output.trim() })
  })

  pythonProcess.stdin.write(text)
  pythonProcess.stdin.end()
})

if (hasFrontendBuild) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Ruta no encontrada.' })
    }

    return res.sendFile(path.join(publicDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`)
})
