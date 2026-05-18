# iPad + Mac mini Setup Guide
## Remembrance Pipelines — Field Recording & Processing Workflow

This guide covers the full setup for the two-device workflow:
- **Mac mini** — the processing hub (Whisper, pyannote, Claude API, Chroma)
- **iPad** — the field device (recording interviews, intake form, remote access)

---

## Part 1 — Mac mini Setup

### 1. System Requirements

- macOS 13 Ventura or later
- 8 GB RAM minimum (16 GB recommended for Whisper large-v3)
- 20 GB free disk space (models + dependencies)
- Apple Silicon (M1/M2/M3) or Intel — both work; Apple Silicon is faster for Whisper

---

### 2. Xcode Command Line Tools

```bash
xcode-select --install
```

A dialog will appear — click **Install**. This installs `git`, `make`, and compilers.

---

### 3. Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the prompts. After install, run the two `export` commands it prints (adds Homebrew to PATH).

Verify:
```bash
brew --version
```

---

### 4. Python 3.11

Install `pyenv` to manage Python versions cleanly:

```bash
brew install pyenv
```

Add to your shell profile (`~/.zshrc` or `~/.bash_profile`):

```bash
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc
source ~/.zshrc
```

Install Python 3.11:

```bash
pyenv install 3.11.9
pyenv global 3.11.9
python --version   # should print Python 3.11.9
```

---

### 5. uv (fast package manager)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.zshrc
uv --version
```

---

### 6. Clone the Repository

```bash
cd ~
git clone https://github.com/azeem19/remembrance-pipelines.git
cd remembrance-pipelines
```

---

### 7. Virtual Environment + Dependencies

```bash
uv venv .venv --python 3.11
source .venv/bin/activate
uv pip install -r requirements.txt
```

> **Note — Apple Silicon:** PyTorch installs a CPU build by default via pip. For faster Whisper on M-series chips, install the MPS-enabled build:
> ```bash
> uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
> ```
> Whisper will automatically use MPS acceleration on M1/M2/M3.

---

### 8. HuggingFace Token (required for pyannote)

`pyannote.audio` (diarization) requires accepting a model license on HuggingFace and a token.

1. Create a free account at https://huggingface.co
2. Accept the license for `pyannote/speaker-diarization-3.1`
3. Create an access token: **Settings → Access Tokens → New token** (read permission is enough)

---

### 9. Environment Variables

```bash
cp env.example .env
```

Open `.env` and fill in every value:

```
ANTHROPIC_API_KEY=sk-ant-...          # from console.anthropic.com
AIRTABLE_TOKEN=pat...                  # from airtable.com/create/tokens
AIRTABLE_BASE_ID=appXFYw4mym1tKckG    # your base ID
AIRTABLE_TABLE_NAME=Consent Records
WORKER_URL=https://...                 # your Cloudflare Worker URL
HF_TOKEN=hf_...                        # HuggingFace token from step 8
```

> **.env is gitignored.** Never commit this file.

---

### 10. Smoke Test

```bash
python -m pytest tests/ -v
```

All tests should pass. If `test_consent_gate.py` fails, check that `pyyaml` and `pydantic` installed correctly.

---

### 11. Enable SSH Access for iPad

Go to **System Settings → General → Sharing** and turn on **Remote Login**.

Note your Mac's local IP:
```bash
ipconfig getifaddr en0
```

You'll use this IP when connecting from the iPad.

---

### 12. (Optional) Keep Mac mini Awake

For long pipeline runs, prevent sleep:

```bash
# Install caffeinate alias or use built-in:
caffeinate -i python -m pipeline.transcribe --audio ... --consent ...
```

Or in **System Settings → Battery → Power Adapter** — set "Prevent Mac from sleeping" to **Never**.

---

## Part 2 — iPad Setup

### 13. Recording App

| App | Cost | Notes |
|-----|------|-------|
| **Voice Record Pro** | Free/IAP | Best control over format; exports WAV/M4A |
| **Just Press Record** | $4.99 | One-tap record widget; auto-transcription optional |
| **Native Voice Memos** | Free | Works, but limited export options |

Record in **M4A or WAV** — both are supported by Whisper. Aim for quiet environments; Whisper handles accents and overlapping speech well but degrades in heavy background noise.

---

### 14. SSH Terminal App (to run pipeline from iPad)

| App | Cost | Notes |
|-----|------|-------|
| **Blink Shell** | $19.99/yr | Best-in-class; tmux support, Mosh |
| **Termius** | Free/Premium | Clean UI; free tier covers SSH |
| **SSH Files** | Free | SSH + SFTP file browser in one |

**Blink / Termius setup:**

1. Open the app → **New Host**
2. Hostname: `<your Mac mini's local IP from step 11>`
3. Username: your Mac mini username
4. Authentication: password, or set up SSH key (recommended below)

**SSH key setup (recommended — no password prompts):**

On the iPad in Blink/Termius, generate a key and copy the public key. Then on Mac mini:
```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the iPad's public key, save
chmod 600 ~/.ssh/authorized_keys
```

---

### 15. File Transfer — iPad to Mac mini

**Option A — AirDrop** (easiest, same Apple ID or same network):
- Share audio file from Voice Memos / Voice Record Pro → AirDrop → Mac mini

**Option B — SFTP in Termius / SSH Files:**
- Connect to Mac mini via SFTP
- Upload audio to `~/remembrance-pipelines/data/raw/`

**Option C — iCloud Drive:**
- Save recordings to iCloud Drive on iPad
- Access the same folder in Finder on Mac mini

---

### 16. Intake Form (Consent Collection)

The intake form runs as a React app. Two options:

**A — Hosted (easiest):**
Open Safari on the iPad and go to the Vercel-deployed URL of `forms/oral-history-intake`.

**B — Local (if offline):**
On Mac mini, run the dev server:
```bash
cd forms/oral-history-intake
npm install
npm run dev
```
On iPad, open Safari and navigate to `http://<mac-mini-ip>:5173`.

The form exports a signed JSON you can use to create the `consent.yaml` for a recording.

---

### 17. Claude Code on iPad

Claude Code runs in the browser at https://claude.ai/code. Open it in Safari on the iPad to:
- Browse the repo, ask questions about the codebase
- Review outputs or consent files
- Coordinate pipeline runs

For full CLI access, SSH into the Mac mini (step 14) and use Claude Code from the terminal there.

---

## Part 3 — End-to-End Workflow

```
iPad                                    Mac mini
──────────────────────────────────────────────────────────
1. Conduct interview
2. Record audio (Voice Record Pro)
3. Fill intake form → download consent JSON
4. Convert JSON → consent.yaml
                                        5. Receive audio + consent.yaml
                                           (AirDrop or SFTP)
                                        6. Validate consent:
                                           python -m pipeline.consent_gate
5. (Optional) SSH in to watch logs      7. Transcribe:
                                           python -m pipeline.transcribe \
                                             --audio data/raw/interview.m4a \
                                             --consent data/raw/consent.yaml
                                        8. Diarize:
                                           python -m pipeline.diarize ...
                                        9. Tag themes:
                                           python -m pipeline.tag ...
                                       10. Outputs → data/outputs/
```

---

## Part 4 — API Keys Checklist

| Key | Where to get it | Required |
|-----|----------------|---------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Yes — thematic tagging |
| `AIRTABLE_TOKEN` | airtable.com/create/tokens | Yes — consent sync |
| `HF_TOKEN` | huggingface.co/settings/tokens | Yes — pyannote diarization |
| `WORKER_URL` | Cloudflare Workers dashboard | Yes — intake form backend |

---

## Troubleshooting

**Whisper runs slowly on Mac mini Intel:**
Use Google Colab (GPU) for transcription — see README quickstart. Transfer the output JSON back.

**pyannote import error:**
```bash
pip install pyannote.audio --upgrade
# Also ensure HF_TOKEN is exported:
export HF_TOKEN=hf_...
```

**SSH connection refused from iPad:**
Check that Remote Login is on (step 11) and that both devices are on the same Wi-Fi network.

**Consent gate blocks pipeline:**
The YAML must have `signatures.contributor.signed: true` and `signatures.steward.signed: true`, and `retention_until` must be a future date. Use `data/consent_template.yaml` as your starting point.

---

*Built for The Remembrance Day Project | Cypher LLC*
