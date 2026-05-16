import { useState } from 'react'
import './App.css'

function App() {
  const [text, setText] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResponse('')

    if (!text.trim()) {
      setError('Ingresa un texto para consultar al modelo.')
      return
    }

    setLoading(true)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const result = await fetch(`${apiBase}/api/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      const payload = await result.json()

      if (!result.ok) {
        throw new Error(payload.error || 'Error consultando el modelo.')
      }

      setResponse(payload.response || '')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container">
      <h1>Demo React + Node + Python IA</h1>
      <p className="subtitle">
        Escribe un texto, se enviará al backend Express y luego al modelo Python.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Ejemplo: resume este texto..."
          rows={5}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Consultando...' : 'Enviar al modelo'}
        </button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <section className="response">
        <h2>Respuesta</h2>
        <p>{response || 'Aún no hay respuesta del modelo.'}</p>
      </section>
    </main>
  )
}

export default App
