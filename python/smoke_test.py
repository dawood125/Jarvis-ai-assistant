import sys
from pathlib import Path

from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from python.main import app


def run():
    client = TestClient(app)

    health = client.get("/health")
    print("health:", health.status_code, health.json())

    bootstrap = client.get("/api/memory/bootstrap")
    print("bootstrap:", bootstrap.status_code, bootstrap.json().keys())

    note = client.post("/api/memory/note", json={"text": "Smoke test note"})
    print("note:", note.status_code, note.json())

    profile = client.get("/api/memory/profile")
    print("profile:", profile.status_code, profile.json().get("ok"))


if __name__ == "__main__":
    run()
