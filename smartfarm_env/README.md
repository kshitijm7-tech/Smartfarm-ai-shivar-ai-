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

## 🏗️ Environment Overview

SmartFarm OpenEnv is a highly structured Reinforcement Learning environment designed to train and evaluate agents on complex, multi-tool agricultural advisory tasks. 

| Component | Specification |
|-----------|-------------|
| **Interface** | Full OpenEnv Spec (reset/step/state) |
| **Logic** | Deterministic agricultural tool simulations |
| **Actions** | typed `SmartFarmAction` (Model-based) |
| **Observations** | typed `SmartFarmObservation` (Pydantic) |
| **Rewards** | Shaping for partial progress + Balancing for range safety |
| **Tasks** | 3 tasks (Easy → Medium → Hard) |


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

## 🎮 Tasks & Difficulty Progression

| Task Name | Difficulty | Expected Signal | Required Tools |
|-----------|------------|-----------------|----------------|
| `soil_health_report` | **Easy** | Baseline soil state | `analyze_soil` |
| `crop_selection` | **Medium** | Soil + Weather + Market | `analyze_soil`, `assess_risk`, `recommend_crop` |
| `full_farm_plan` | **Hard** | Holistic optimization | All 4 Tools |

### Task 1: Soil Health Report (Easy)
- **Objective**: Analyze soil at specific coordinates and produce a structured health report.
- **Grading**: Tool usage (30%) + Metric accuracy (40%) + Formatting (30%).

### Task 2: Crop Selection (Medium)
- **Objective**: Match the best crop to a specific parcel of land based on soil, budget, and local season.
- **Grading**: Constraints matching (40%) + Rationale (30%) + Risk awareness (30%).

### Task 3: Full Farm Plan (Hard)
- **Objective**: Create a seasonal management rotation for a large farm parcel.
- **Grading**: Completeness (30%) + Scientific accuracy (30%) + Actionability (40%).


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
