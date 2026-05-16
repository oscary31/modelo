import os
import sys
import json
import requests


SYSTEM_PROMPT = """Eres un asistente de analisis academico para un liceo venezolano.

ESCALA DE NOTAS VENEZOLANA:
- Las notas van de 0 a 20 puntos.
- La nota minima aprobatoria es 10 puntos.
- Entre 10 y 12: aprobado con dificultad.
- Entre 13 y 15: rendimiento regular.
- Entre 16 y 18: buen rendimiento.
- Entre 19 y 20: excelente rendimiento.

CRITERIOS DE NIVEL DE RIESGO (aplicalos con precision):
- ALTO: promedio menor a 10 (reprobado), O asistencia menor al 65%, O caida de mas de 5 puntos entre la primera y ultima nota del lapso.
- MODERADO: promedio entre 10 y 12, O tendencia descendente sostenida sin llegar a reprobar, O asistencia entre 65% y 75%, O temas debiles que podrian comprometer el siguiente lapso.
- BAJO: promedio de 13 o mas, asistencia sobre 75%, sin tendencia negativa clara.

Indica: nivel de riesgo, patron observado y accion concreta recomendada al docente.

Responde SIEMPRE en espanol. Se directo y conciso. /no_think"""


def analizar_alumno(datos):
    temas_str = ', '.join(datos['temas_debiles']) if datos['temas_debiles'] else "Ninguno"

    prompt = f"""Datos del estudiante:
- Nombre: {datos['nombre']}
- Materia: {datos['materia']}
- Notas del lapso (orden cronologico): {datos['notas']}
- Promedio actual: {datos['promedio']}
- Asistencia: {datos['asistencia']}%
- Temas con dificultad: {temas_str}

"""

    return _call_model(prompt)


def _call_model(prompt: str) -> str:
    api_url = os.getenv("MODEL_API_URL", "http://localhost:8080/v1/chat/completions")
    response = requests.post(
        api_url,
        json={
            "model": "local",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 5000,
            "thinking": False
        },
        timeout=120
    )
    return response.json()["choices"][0]["message"]["content"]


def infer(user_text: str) -> str:
    clean_text = user_text.strip()
    if not clean_text:
        return ""

    try:
        payload = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        return _call_model(clean_text)

    if isinstance(payload, list):
        outputs = []
        for alumno in payload:
            outputs.append("\n" + "=" * 50)
            outputs.append(f"  {alumno['nombre']} — {alumno['materia']}")
            outputs.append("=" * 50)
            try:
                outputs.append(analizar_alumno(alumno))
            except Exception as exc:
                outputs.append(f"Error: {exc}")
        outputs.append("\nAnalisis completado.")
        return "\n".join(outputs)

    if isinstance(payload, dict):
        return analizar_alumno(payload)

    return "Error: el JSON debe ser un objeto o una lista de objetos."


if __name__ == "__main__":
    user_input = sys.stdin.read()
    print(infer(user_input))
