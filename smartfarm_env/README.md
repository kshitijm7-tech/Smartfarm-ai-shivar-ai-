---
title: SmartFarm OpenEnv
emoji: 🌾
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
tags:
  - openenv
  - agriculture
  - rl-environment
---
# 🌾 SmartFarm OpenEnv — Agricultural AI Environment

A real-world farm management RL environment for the [Meta OpenEnv Hackathon](https://github.com/meta-pytorch/OpenEnv). Agents interact with agricultural tools to solve farming advisory tasks — from simple soil analysis to comprehensive farm management planning.

## 🎯 Motivation

Farmers in India and worldwide face daily decisions about soil management, crop selection, disease prevention, and risk mitigation. This environment simulates these real-world tasks, challenging AI agents to gather data using agricultural tools and produce actionable farm management plans.

Unlike toy environments, every task maps to a decision a real agricultural advisor makes — analyzing soil health, choosing the right crop for local conditions, and planning against environmental risks.

## 🏗️ Environment Overview

| Component | Description |
|-----------|-------------|
| **Interface** | OpenEnv-compliant (reset/step/state) |
| **Runtime** | FastAPI server via `openenv.core.env_server` |
| **Actions** | 5 action types (4 tools + plan submission) |
| **Observations** | Tool results, task descriptions, scores |
| **Rewards** | Incremental (+0.1 per tool) + final graded score |
| **Tasks** | 3 tasks (easy → hard) |

## 📋 Action Space

The agent can perform these actions via `SmartFarmAction`:

| Action | Parameters | Description |
|--------|-----------|-------------|
| `analyze_soil` | `{lat, lon}` | Returns NPK, pH, moisture, health score, soil type |
| `check_disease` | `{crop_name, season?}` | Returns disease risk, symptoms, prevention |
| `recommend_crop` | `{lat, lon, season?, budget?}` | Returns top crop recommendations |
| `assess_risk` | `{lat, lon}` | Returns weather, risk factors, profit estimates |
| `submit_plan` | `{plan: str}` | Submits farm plan for grading (ends episode) |

## 📊 Observation Space

`SmartFarmObservation` includes:

| Field | Type | Description |
|-------|------|-------------|
| `task_description` | `str?` | The farming scenario (on reset) |
| `tool_result` | `dict?` | Result from last tool call |
| `last_action_error` | `str?` | Error message if action failed |
| `score` | `float?` | Final score (0.0–1.0) after plan submission |
| `tools_used` | `list[str]` | Tools used so far |
| `steps_remaining` | `int?` | Steps before auto-termination |
| `done` | `bool` | Whether episode has ended |
| `reward` | `float` | Reward for the current step |

## 🎮 Tasks

### Task 1: Soil Health Report (Easy)
- **Objective**: Analyze soil at Pune coordinates and produce a health summary
- **Required Tools**: `analyze_soil`
- **Max Steps**: 10
- **Grading**: Tool usage (30%) + Key metrics mentioned (40%) + Report quality (30%)

### Task 2: Crop Selection (Medium)
- **Objective**: Recommend a crop for Nashik given constraints (season, budget, water)
- **Required Tools**: `analyze_soil`, `assess_risk`, `recommend_crop`
- **Max Steps**: 15
- **Grading**: Tool usage (20%) + Soil analysis (20%) + Risk awareness (20%) + Crop recommendation (25%) + Financial (15%)

### Task 3: Full Farm Plan (Hard)
- **Objective**: Create a comprehensive management plan for a Punjab farm
- **Required Tools**: All 4 tools
- **Max Steps**: 20
- **Grading**: Tool usage (20%) + Plan completeness (30%) + Risk awareness (15%) + Financial viability (15%) + Actionability (20%)

## 🚀 Setup & Usage

### Docker (Recommended)

```bash
cd smartfarm_env
docker build -t smartfarm-env:latest .
docker run --rm -p 7860:7860 smartfarm-env:latest
```

Health check:
```bash
curl http://localhost:7860/health
# {"status":"healthy"}
```

### Without Docker

```bash
cd smartfarm_env
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn server.app:app --host 0.0.0.0 --port 7860
```

### Running Inference

```bash
export HF_TOKEN="your_token_here"
export API_BASE_URL="https://api.openai.com/v1"  # optional, has default
export MODEL_NAME="gpt-4.1-mini"                  # optional, has default
python inference.py
```

### API Examples

**Reset** (start a task):
```bash
curl -X POST http://localhost:7860/reset \
  -H "Content-Type: application/json" \
  -d '{"task_name": "soil_health_report"}'
```

**Step** (use a tool):
```bash
curl -X POST http://localhost:7860/step \
  -H "Content-Type: application/json" \
  -d '{"action": {"action_type": "analyze_soil", "parameters": {"lat": 18.52, "lon": 73.86}}}'
```

**Step** (submit plan):
```bash
curl -X POST http://localhost:7860/step \
  -H "Content-Type: application/json" \
  -d '{"action": {"action_type": "submit_plan", "parameters": {"plan": "Soil analysis shows..."}}}'
```

## 📈 Baseline Performance

| Task | Score | Steps | Model |
|------|-------|-------|-------|
| soil_health_report | ~0.65 | 2-3 | gpt-4.1-mini |
| crop_selection | ~0.55 | 4-5 | gpt-4.1-mini |
| full_farm_plan | ~0.50 | 5-7 | gpt-4.1-mini |

*Baseline scores are approximate and may vary with different models.*

## 📁 Project Structure

```
smartfarm_env/
├── __init__.py          # Package init
├── models.py            # Pydantic Action/Observation models
├── tasks.py             # Task definitions (3 tasks)
├── tools.py             # Agricultural tool implementations
├── graders.py           # Programmatic graders (0.0-1.0)
├── environment.py       # Main Environment class
├── openenv.yaml         # OpenEnv metadata
├── inference.py         # Baseline inference script
├── Dockerfile           # Container deployment
├── requirements.txt     # Python dependencies
├── README.md            # This file
├── data/
│   └── crop_database.json  # 1000+ crop database
└── server/
    ├── __init__.py
    └── app.py           # FastAPI server entry point
```

## 🏷️ Tags

`openenv` `agriculture` `farm-management` `rl-environment`
