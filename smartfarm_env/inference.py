"""
SmartFarm OpenEnv — Inference Script

This script evaluates an LLM agent within the SmartFarm environment.
It must be located in the root directory and use the OpenAI client.

STDOUT FORMAT (Mandatory):
    [START] task=...
    [STEP]  step=...
    [END]   success=... score=... rewards=...
"""

import json
import os
import sys
import traceback
import textwrap
from typing import Any, Dict, List, Optional

from openai import OpenAI

# ── Configuration ──────────────────────────────────────────────────────
# Prioritize OPENAI_API_KEY as per hackathon instructions
API_KEY = os.getenv("HF_TOKEN") or os.getenv("OPENAI_API_KEY") or os.getenv("API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini")

if not API_KEY:
    # We fallback to a dummy if not present for local validation, 
    # but the instructions say it's mandatory.
    API_KEY = "mock_key"

client = OpenAI(
    base_url=API_BASE_URL,
    api_key=API_KEY,
)

# ── Add smartfarm_env to path ─────────────────────────────────────────
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from smartfarm_env.environment import SmartFarmEnvironment
    from smartfarm_env.models import SmartFarmAction
    from smartfarm_env.tasks import list_tasks
except ImportError:
    from environment import SmartFarmEnvironment
    from models import SmartFarmAction
    from tasks import list_tasks

# ── Agent System Prompt ────────────────────────────────────────────────
SYSTEM_PROMPT = textwrap.dedent("""
    You are an expert agricultural AI assistant. You have access to tools:
    1. analyze_soil(lat, lon)
    2. check_disease(crop_name, season)
    3. recommend_crop(lat, lon, season, budget)
    4. assess_risk(lat, lon)
    5. submit_plan(plan)

    Respond ONLY with a JSON object: {"action_type": "...", "parameters": {...}}
""").strip()

def parse_agent_action(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        if text.startswith("json"): text = text[4:].strip()
    try:
        return json.loads(text)
    except:
        return {"action_type": "submit_plan", "parameters": {"plan": text}}

def run_agent_on_task(task_name: str, max_steps: int = 20) -> Dict[str, Any]:
    env = SmartFarmEnvironment()
    rewards: List[float] = []
    step_count = 0
    success = False
    total_score = 0.0

    print(f"[START] task={task_name} env=smartfarm_env model={MODEL_NAME}")

    try:
        obs = env.reset(task_name=task_name)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"TASK: {obs.task_description}\nAvailable actions: {obs.available_actions}"}
        ]

        for step in range(1, max_steps + 1):
            step_count = step
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    temperature=0.2,
                )
                agent_text = response.choices[0].message.content or ""
            except Exception as e:
                rewards.append(0.01)
                print(f"[STEP]  step={step} action=error reward=0.01 done=true error={str(e)}")
                break

            action_dict = parse_agent_action(agent_text)
            action_type = action_dict.get("action_type", "submit_plan")
            params = action_dict.get("parameters", {})

            try:
                action = SmartFarmAction(action_type=action_type, parameters=params)
                obs = env.step(action)
            except Exception as e:
                rewards.append(0.01)
                print(f"[STEP]  step={step} action={action_type} reward=0.01 done=true error={str(e)}")
                break

            reward = float(obs.reward or 0.01)
            rewards.append(reward)
            
            # Format action for display
            action_disp = f"{action_type}({','.join(f'{k}={v}' for k, v in params.items())})" if params else action_type
            print(f"[STEP]  step={step} action={action_disp} reward={reward:.2f} done={str(obs.done).lower()} error={obs.last_action_error or 'null'}")

            if obs.done:
                total_score = obs.score or sum(rewards)
                success = total_score >= 0.1
                break

            messages.append({"role": "assistant", "content": agent_text})
            messages.append({"role": "user", "content": f"Result: {json.dumps(obs.tool_result)}"})

    except Exception as e:
        if not rewards: rewards.append(0.01)
        print(f"[DEBUG] Unexpected error: {str(e)}", file=sys.stderr)
    
    finally:
        env.close()
        total_score = sum(rewards)
        rewards_str = ",".join(f"{r:.2f}" for r in rewards)
        print(f"[END]   success={str(success).lower()} steps={step_count} score={total_score:.2f} rewards={rewards_str}")

    return {"task": task_name, "success": success, "steps": step_count, "score": total_score}

def main():
    tasks = list_tasks()
    results = []
    for task_name in tasks:
        results.append(run_agent_on_task(task_name))
        print()

    print("\n=== BASELINE RESULTS ===", file=sys.stderr)
    for r in results:
        print(f"  {r['task']}: score={r['score']:.2f} success={r['success']}", file=sys.stderr)

if __name__ == "__main__":
    main()
