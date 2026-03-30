# Prospect Hunter — Deployment Guide

## What this is
A Claude-powered commercial insurance prospecting tool. You define an Ideal Client Profile (ICP), it searches public sources (NYS DOS, Google, LinkedIn, OSHA, permits) and returns a scored, exportable lead list.

## Project Structure
```
prospect-hunter/
├── index.html                  # The app
├── netlify.toml                # Netlify config
├── netlify/
│   └── functions/
│       └── search.js           # API proxy (keeps your key server-side)
└── README.md
```

## Deploy to Netlify

### Option A — Drag and Drop (easiest)
1. Go to app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag the entire `prospect-hunter` folder into the deploy box
4. Wait for deploy to complete
5. Go to Site Settings → Environment Variables
6. Add: `ANTHROPIC_API_KEY` = your key from platform.anthropic.com
7. Go to Deploys → "Trigger deploy" → "Deploy site" to rebuild with the key active

### Option B — GitHub (recommended for updates)
1. Push this folder to a GitHub repo
2. Go to app.netlify.com → "Add new site" → "Import from Git"
3. Connect your repo
4. Build settings: leave blank (static site)
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Deploy

## Environment Variables
| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | platform.anthropic.com → API Keys → Create Key |

## Usage
1. Open your deployed Netlify URL
2. Fill in ICP: industries, geography, employee range
3. Select lines and data sources
4. Hit "Run Prospect Hunt"
5. Export results to CSV for AMS360 or outreach tracking

## Cost
Each run uses ~3,000–6,000 tokens depending on how many prospects you request.
Approximate cost per run: $0.03–$0.10 at current Anthropic pricing.
