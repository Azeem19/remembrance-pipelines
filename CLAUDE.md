# CLAUDE.md — remembrance-pipelines

## Owner
Robert Azeem Jackson III | Cypher LLC | The Remembrance Day Project

## Mission
Build generative knowledge infrastructure for Black and marginalized communities
through oral history preservation, consent-first data pipelines, and community
archiving tools. This repo receives memory. It does not extract it.

## Brand
Deep teal #215244 | Gold/Bronze #B37602 | Sage Green #2D5A52| Accent #4AB396 | burnt gold accents #D4A017

## Core Values
- Data sovereignty: community owns its data at every step
- Non-extraction: no scraping, no re-use without consent
- Consent-first: every pipeline requires consent.yaml before processing
- Archival permanence: outputs are built to last, not to trend

## Active Partners
- Moorestown WestEnd Descendants Network
- Moorestown Historical Society
- [pending] NYC/NJ/DC area School Partner (curriculum pilot)

## What Lives Here
- Oral-history transcription pipeline (Whisper + pyannote diarization)
- Claude API thematic tagging with speaker attribution
- consent.yaml schema (consent_for, retention_until, embargo, community_review)
- Ancestor Search RAG (Chroma/Pinecone + Claude API)
- Interview intake form (Claude Artifact, persistent storage, JSON export)

## Technical Stack
Python 3.11 | uv/pip | Whisper large-v3 | pyannote | Claude API (claude-sonnet-4-6)
Chroma or Pinecone | sentence-transformers | pandas | Google Colab (GPU)

## Code Standards
- Every script must check consent.yaml before processing any audio/text
- No PII in commit history — use .gitignore for raw audio and transcripts
- README must include Non-Extraction Statement and partner attribution
- Du Bois color palette for all visualizations: #215244, #B37602, #4AB396

## Reading Foundations

Before architecting any new pipeline, retrieval system, or QA mechanism,
Claude Code MUST consult `/journal/READING_INDEX.md`.

That index logs research methodologies the owner has vetted through Journal Club.
When a tag matches the task at hand:
- Propose how the paper's method applies before suggesting your own approach
- Cite the source in code comments where the method is implemented
- Flag if you're choosing a different approach and why

The reading is the architecture. The code is the inheritance.

## Philosophical Anchor
"If you have some power, then your job is to empower somebody else."
— Toni Morrison
