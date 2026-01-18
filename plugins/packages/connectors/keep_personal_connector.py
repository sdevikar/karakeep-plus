
# Minimal Flask + gkeepapi service
from flask import Flask, jsonify
import gkeepapi
import os

app = Flask(__name__)

EMAIL = os.getenv("KEEP_EMAIL")
MASTER_TOKEN = os.getenv("KEEP_MASTER_TOKEN")

keep = gkeepapi.Keep()
keep.authenticate(EMAIL, MASTER_TOKEN)  # Read docs for secure token handling
keep.sync()

@app.get("/notes")
def list_notes():
    notes_list = []
    for n in keep.all():
        labels = [l.name for l in n.labels.all()]
        notes_list.append({
            "id": n.id,
            "title": n.title or "Untitled",
            "text": n.text or "",
            "labels": labels,
            "updated_at": n.timestamps.updated.isoformat(),
            "link": f"https://keep.google.com/#note/{n.id}"
        })
    return jsonify({"notes": notes_list})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
