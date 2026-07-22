# AI Features

## Overview

CyberFrost integrates **Google Gemini AI** for intelligent threat analysis and security insights.

## Capabilities

### Threat Analysis
- Automated analysis of security threats with MITRE ATT&CK mapping
- Attack scenario generation with mitigation recommendations
- Confidence scoring and industry context

### Summarization
- Condense lengthy threat reports into actionable summaries
- Extract key IoCs, TTPs, and affected systems

### Semantic Search (Omnibar)
- AI-powered search across vulnerabilities, threats, and actors
- Vector embedding-based similarity search
- Natural language query support

### AI Insight Generation
- Generate structured security insights from raw data
- Categorize threats by severity and MITRE framework
- Automated report content generation

## Configuration

| Parameter | Location | Description |
|---|---|---|
| `GEMINI_API_KEY` | Environment | Google Gemini API key |
| `GEMINI_MODEL` | Environment | Model: `gemini-2.0-flash` (default) |
| Timeout | Config | 30s generation, 15s embedding |

## Limitations

- AI features require a valid Gemini API key
- Without API key, fallback to simulated analysis
- Token usage varies by query complexity
- AI analysis is advisory — always verify before taking action
