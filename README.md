# remembrance-pipelines

> **The future is built from the stories we choose to remember.**
> 
> — Robert Azeem Jackson III, Cypher Innovation Studio

Consent-first oral-history archive infrastructure for Black and marginalized communities. Built by Cypher Innovation Studio in partnership with The Remembrance Day Project.

## Non-Extraction Statement

This repository receives memory. It does not extract it.

Community members, elders, and partners own their stories, their data, and their knowledge. Nothing in this codebase is designed to scrape, monetize, re-purpose, or re-use community oral histories without explicit, ongoing consent from the speakers themselves.

Every script in this repo checks `consent.yaml` before processing any audio or text. No exceptions. No backdoors.

**If you use this code, you inherit this commitment.** Privacy is not compliance. It is an act of legacy preservation.

---

## What This Is

A Python + React pipeline for transcribing, tagging, and archiving oral histories with **community governance** at every step:

- **Consent-first intake form** (React) — elders or community members control what gets recorded and how it can be used
- **Whisper transcription** (large-v3) with speaker diarization via pyannote
- **Thematic tagging** with Claude API, preserving speaker attribution
- **Airtable-backed consent gate** — Community Data Council votes before anything goes public
- **Ancestor Search RAG** — community-queryable archive powered by embeddings + Claude API
- **Living Archive** — data stays in the community's hands; Cypher is the steward, not the owner

---

## Active Partners

- **Moorestown WestEnd Descendants Network** (Moorestown, NJ)
- **Moorestown Historical Society** (Moorestown, NJ)
- [pending] NYC/NJ/DC area school partner (curriculum pilot)

---

## Technical Stack

- **Python 3.11** (uv/pip)
- **Whisper large-v3** (transcription)
- **pyannote.audio** (speaker diarization)
- **Claude Sonnet 4.6** (thematic tagging + RAG)
- **Chroma or Pinecone** (vector search)
- **Airtable API** (consent governance + record store)
- **React 18** + TypeScript (intake form UI)
- **Cloudflare Workers** (API backend)

---

## Code Standards

Every contributor must follow these rules. They're not suggestions:

1. **Consent is the gate.** Every Python script checks `consent.yaml` before processing any audio or text. No processing without consent.
2. **No PII in history.** Raw audio files, transcripts, and personal identifiers are in `.gitignore`. They never get committed.
3. **Non-extraction first.** README (this file), CLAUDE.md, and code comments must reflect that community owns the data.
4. **Color palette.** All visualizations use the Du Bois palette: `#215244` (deep teal), `#B37602` (bronze), `#4AB396` (sage green), `#D4A017` (burnt gold).

---

## Getting Started

See `CLAUDE.md` for the full architecture, toolchain decisions, and partner context.

To run the transcription pipeline locally:

```bash
uv run python -m pipelines.transcribe path/to/audio.wav
