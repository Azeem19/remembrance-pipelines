# Remembrance Pipelines

Generative knowledge infrastructure for Black and marginalized communities — built on oral history preservation, consent-first data pipelines, and community archiving tools.

> "If you have some power, then your job is to empower somebody else." — Toni Morrison

---

## Non-Extraction Statement

This repository receives memory. It does not extract it.

No audio, transcript, or personal narrative processed by these pipelines may be re-used, re-trained on, sold, licensed, or shared outside the originating community without explicit, renewed consent from the contributor. Consent is not a checkbox — it is an ongoing relationship. Every pipeline enforces a `consent.yaml` before touching any data.

---

## What This Does

An end-to-end pipeline for oral history preservation:

1. **Transcription** — Whisper large-v3 converts audio to text
2. **Diarization** — pyannote identifies and attributes speakers
3. **Thematic Tagging** — Claude API (`claude-sonnet-4-6`) extracts themes with speaker attribution
4. **Consent Enforcement** — every stage checks `consent.yaml` before proceeding
5. **Archival Output** — structured JSON/Markdown outputs built to last

---

## Consent-First Principles

- Every recording requires a valid `consent.yaml` co-signed by the contributor **before** any processing begins
- `retention_until` dates are enforced — data is deleted when the window closes
- `embargo` fields hold materials from public access until the community lifts the hold
- `community_review` gates outputs behind a human review step before any release
- No PII ever enters the git history — raw audio and transcripts are `.gitignore`d

See [`consent.yaml`](./consent.yaml) for the full schema and a placeholder template.

---

## Project Structure

```
rememebrance-pipelines/
├── consent.yaml              # Consent schema — required before any processing
├── pipeline/
│   ├── consent_check.py      # Validates consent.yaml; halts pipeline if invalid
│   ├── transcribe.py         # Whisper large-v3 transcription
│   ├── diarize.py            # pyannote speaker diarization
│   └── tag.py                # Claude API thematic tagging + speaker attribution
├── data/
│   ├── raw/                  # .gitignored — raw audio files
│   ├── transcripts/          # .gitignored — intermediate transcripts
│   └── outputs/              # Structured archival outputs
├── tests/
│   └── test_consent_check.py
├── pyproject.toml
└── requirements.txt
```

---

## Stack

| Component | Tool |
|---|---|
| Runtime | Python 3.11 |
| Package manager | uv / pip |
| Transcription | openai-whisper large-v3 |
| Diarization | pyannote.audio |
| Thematic tagging | Claude API — `claude-sonnet-4-6` |
| Vector search | Chroma / Pinecone |
| Embeddings | sentence-transformers |
| Data | pandas |
| GPU runtime | Google Colab |

---

## Quickstart

```bash
# Install dependencies
pip install -r requirements.txt

# Copy and fill out consent template for your recording
cp consent.yaml data/raw/my-interview-consent.yaml
# Edit the file — every field is required

# Run the pipeline
python -m pipeline.transcribe --audio data/raw/interview.wav \
                               --consent data/raw/my-interview-consent.yaml
```

The pipeline will refuse to run if `consent.yaml` is missing, unsigned, or expired.

---

## Partners

- **Moorestown WestEnd Descendants Network** — community stewardship and oral history contributors
- **Moorestown Historical Society** — archival partnership and research support
- **KIPP NYC** — curriculum pilot program

---

## Data Sovereignty

Community contributors retain full ownership of their stories at every stage. Cypher LLC and The Remembrance Day Project act as stewards, not owners. All data is stored in contributor-controlled storage. Nothing leaves without written consent.

---

## License

Community data is not licensed. Code in this repository is released under [MIT License](./LICENSE) for the infrastructure only — not the stories it carries.

---

*Built by Robert Azeem Jackson III | Cypher LLC | The Remembrance Day Project*
