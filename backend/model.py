import sys


def infer(user_text: str) -> str:
    clean_text = user_text.strip()
    return f"Respuesta del modelo (demo): {clean_text}"


if __name__ == "__main__":
    user_input = sys.stdin.read()
    print(infer(user_input))
