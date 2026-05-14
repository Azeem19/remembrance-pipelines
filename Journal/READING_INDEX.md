# Reading Index — Theoretical Foundations for Cypher Build

This index logs Tuesday Journal Club reflections with tags that map research
methodologies onto active artifacts. Claude Code should consult this file
before architecting new pipelines or proposing methodology changes.

When a tag matches the task at hand, apply the methodology — don't reinvent.

---

## Wk3 | 5.12.26

### Attribution Crisis in LLM Search Results — Estimating Ecosystem Exploitation
- **Theme:** RAG / LLM Evaluation
- **Tags:** attribution, audit, non-extraction, RAG, hurdle-model, citation-gap
- **Source:** Data & Policy (2026), 8: e15 — doi:10.1017/dap.2026.10064
- **Applies to artifacts:**
  - Artifact #4 — Ancestor Search RAG (citation-required outputs)
  - Artifact #5 — Grant-Fit Scoring Agent (auditable attribution)
  - Cypher Impact Lab QA framework
- **Key methodology to adopt:**
  - Hurdle Model for measuring attribution gap (binary occurrence + continuous intensity)
  - Two-question framing: (1) Is there a gap? (2) How large is the gap?
  - Required telemetry: search trace, citation logs, standardized output
- **Three exploitation patterns to defend against:**
  1. No-search (relying on pretrained data without disclosure) — 15–35% occurrence
  2. No-citation (high consumption, zero attribution) — ~30%
  3. High-volume / low-credit (querying many sites, citing few) — Perplexity pattern
- **Cypher principle reinforced:** Citation IS consent. RAG without attribution = extraction.
- **Action for Claude Code:** Every retrieval-based pipeline must log source IDs alongside
  generated output. Build attribution gap measurement into Artifact #4's QA layer.

---

### Cognitive Presence + ENA in GenAI-Integrated Six-Hat Thinking
- **Theme:** Clustering / Learning Analytics
- **Tags:** clustering, learning-analytics, MOOCs, ENA, cognitive-presence, Impact-Lab-QA, six-hat
- **Source:** Yu et al. — Int J Educ Technol High Educ — doi.org/10.1186/s41239-025-00545-x
- **Applies to artifacts:**
  - Artifact #3 — Cohort Learner Journey Clustering
  - Cypher Impact Lab™ measurement upgrade
  - Future: Community Remembrance Circle facilitation tooling
- **Key methodology to adopt:**
  - Epistemic Network Analysis (ENA) via ENA Webkit — app.epistemicnetwork.org
  - Coding scheme: Triggering → Exploration → Integration → Resolution
  - Sliding window co-occurrence for measuring cognitive flow
- **Instruments referenced:** TTCT (Torrance Test for Creativity), SCCT, ENA Webkit
- **Cypher principle reinforced:** Structured cognitive scaffolding produces measurable
  community knowledge production. Frequency alone undersells the work.
- **Critical observation:** GenAI is a springboard for high-creativity users AND a crutch
  for low-creativity users. Cypher facilitation must elevate, not flatten.
- **Action for Claude Code:** When designing Impact Lab tooling, structure conversational
  data capture to allow downstream ENA analysis. Tag conversation segments by cognitive phase.

---

### VogFashion — AI-Driven Intelligent System (CLIP + NEO4j + Microservices)
- **Theme:** RAG / Knowledge Graphs
- **Tags:** RAG, knowledge-graphs, NEO4j, CLIP, microservices, CSUQ, QA, metacognition
- **Source:** Chen, Gao, Guo, Liu, Liu, Zheng, Wang — Wuhan Textile University
- **Applies to artifacts:**
  - Artifact #4 — Ancestor Search RAG (Graph RAG architecture)
  - Cypher Impact Lab — community feedback as QA
  - Future: Multi-agent collaboration prototype
- **Key methodology to adopt:**
  - CSUQ (Computer System Usability Questionnaire) as user-satisfaction QA for GenAI tools
  - NEO4j knowledge graph for relating "how" (tasks) to "what" (memory/assets)
  - Metacognition framework: generate → measure semantic relevance → iterate if below threshold
- **Cypher principle reinforced:** Community feedback IS the QA layer — not artificial
  metrics alone. MEL practice (Monitoring, Evaluation, Learning) maps directly to GenAI QA.
- **Action for Claude Code:** Architect Ancestor Search RAG with a knowledge graph layer
  (consider NEO4j or Neo4j-equivalent) for relationship-aware retrieval, not just vector similarity.

---

## Index Conventions

- **Theme:** One of three — Clustering / RAG / Explainable AI & Fairness
- **Tags:** Searchable keywords for code-task matching
- **Applies to artifacts:** Specific Cypher Build artifacts (#1–#7) or strategic areas
- **Key methodology to adopt:** Concrete technical practices to implement
- **Cypher principle reinforced:** Mission alignment — why this matters for non-extraction
- **Action for Claude Code:** Direct instruction for AI-assisted coding sessions

---

## How Claude Code Should Use This Index

Before scaffolding any new pipeline:
1. Scan tags for matches with the current task.
2. If a methodology applies, propose it explicitly in the plan.
3. Cite the reflection (Wk# + paper title) in code comments where the method is implemented.
4. If no methodology applies, note that this is greenfield design — flag for owner review.

The reading is the architecture. The code is the inheritance.
