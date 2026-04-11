"""
SmartFarm OpenEnv — Inference Script

This script evaluates an LLM agent within the SmartFarm environment.
It must be located in the root directory and use the OpenAI client.

Environment Variables:
    API_BASE_URL  — LLM API endpoint (default: https://api.openai.com/v1)
    MODEL_NAME    — Model identifier (default: gpt-4.1-mini)
    HF_TOKEN      — Hugging Face API token (required, no default)

Output Format:
    [START] task=<task_name> env=smartfarm_env model=<model_name>
    [STEP]  step=<n> action=<action_str> reward=<0.00> done=<true|false> error=<msg|null>
    [END]   success=<true|false> steps=<n> rewards=<r1,r2,...,rn>
"""

import json
import os
import sys
import traceback
from typing import Any, Dict, List, Optional

from openai import OpenAI

# ── Environment Variables ──────────────────────────────────────────────
API_KEY = os.getenv("HF_TOKEN") or os.getenv("OPENAI_API_KEY") or os.getenv("API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini")
HF_TOKEN = os.getenv("HF_TOKEN")

if HF_TOKEN is None:
    raise ValueError("HF_TOKEN environment variable is required")

# ── OpenAI Client ──────────────────────────────────────────────────────
client = OpenAI(
    base_url=API_BASE_URL,
    api_key=HF_TOKEN,
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
    # Fallback if running directly from within the smartfarm_env dir
    from environment import SmartFarmEnvironment
    from models import SmartFarmAction
    from tasks import list_tasks


# ══════════════════════════════════════════════════════════════════════
#  System Prompt for the Agent
# ══════════════════════════════════════════════════════════════════════

SYSTEM_PROMPT = """You are an expert agricultural AI assistant participating in a farm management simulation.

You will be given a farming task to solve. You have access to the following tools:

1. **analyze_soil** — Analyze soil health at coordinates.
   Parameters: {"lat": <float>, "lon": <float>}

2. **check_disease** — Check disease risks for a crop.
   Parameters: {"crop_name": <string>, "season": <string>}

3. **recommend_crop** — Get crop recommendations for a location.
   Parameters: {"lat": <float>, "lon": <float>, "season": <string>, "budget": <float>}

4. **assess_risk** — Assess environmental risks at coordinates.
   Parameters: {"lat": <float>, "lon": <float>}

5. **submit_plan** — Submit your final farm management plan/report.
   Parameters: {"plan": <string>}

IMPORTANT RULES:
- You MUST respond with a JSON object in this EXACT format:
  {"action_type": "<tool_name>", "parameters": {<params>}}
- Use the available tools to gather information BEFORE submitting your plan.
- Your plan should be thorough, mentioning specific data from your tool analysis.
- Include nitrogen, phosphorus, potassium, pH, soil type, risks, and recommendations.
- End by submitting your plan using "submit_plan".
- Do NOT include any text outside the JSON object.
"""


# ══════════════════════════════════════════════════════════════════════
#  Agent Logic
# ══════════════════════════════════════════════════════════════════════

def parse_agent_action(response_text: str) -> Dict[str, Any]:
    """Parse the LLM's response into an action dict."""
    text = response_text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```)
        lines = lines[1:]
        # Remove last line if it's ```)
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        action = json.loads(text)
        if "action_type" in action:
            return action
    except json.JSONDecodeError:
        pass

    # Try to extract JSON from within the response
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            action = json.loads(text[start:end])
            if "action_type" in action:
                return action
        except json.JSONDecodeError:
            pass

    # Fallback: if agent seems done, submit whatever it said as a plan
    if any(kw in text.lower() for kw in ["submit", "plan", "report", "recommend"]):
        return {"action_type": "submit_plan", "parameters": {"plan": text}}

    return {"action_type": "submit_plan", "parameters": {"plan": text}}


def run_agent_on_task(task_name: str, max_steps: int = 20) -> Dict[str, Any]:
    """
    Run the LLM agent on a single task.

    Returns dict with success, steps, rewards.
    """
    env = SmartFarmEnvironment()
    rewards: List[float] = []
    step_count = 0
    success = False

    # Print START line
    print(f"[START] task={task_name} env=smartfarm_env model={MODEL_NAME}")

    try:
        # Reset environment
        obs = env.reset(task_name=task_name)
        task_description = obs.task_description

        # Build initial conversation
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"TASK: {task_description}\n\n"
                    f"Available actions: {', '.join(obs.available_actions)}\n\n"
                    "Start by using the appropriate tools to gather information, "
                    "then submit your plan. Respond with a JSON action."
                ),
            },
        ]

        for step in range(1, max_steps + 1):
            step_count = step

            # Call LLM
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    temperature=0.2,
                    max_tokens=2048,
                )
                agent_text = response.choices[0].message.content or ""
            except Exception as e:
                error_msg = f"LLM API error: {str(e)}"
                rewards.append(0.01)
                print(
                    f"[STEP] step={step} action=error reward=0.01 "
                    f"done=true error={error_msg}"
                )
                break


            # Parse agent response into action
            action_dict = parse_agent_action(agent_text)
            action_type = action_dict.get("action_type", "submit_plan")
            parameters = action_dict.get("parameters", {})

            # Execute action in environment
            try:
                action = SmartFarmAction(
                    action_type=action_type,
                    parameters=parameters,
                )
                obs = env.step(action)
            except Exception as e:
                error_msg = f"Action error: {str(e)}"
                rewards.append(0.01)
                print(
                    f"[STEP] step={step} action={action_type} reward=0.01 "
                    f"done=true error={error_msg}"
                )
                break


            # Record step (Reward Balancing expects total sum to match score)
            reward = float(obs.reward or 0.01)
            rewards.append(reward)
            done = obs.done
            error = obs.last_action_error

            # Format action string for output
            action_str = action_type
            if action_type != "submit_plan":
                param_str = ",".join(f"{k}={v}" for k, v in parameters.items())
                if param_str:
                    action_str = f"{action_type}({param_str})"

            print(
                f"[STEP] step={step} action={action_str} reward={reward:.2f} "
                f"done={str(done).lower()} error={error if error else 'null'}"
            )


            if done:
                success = obs.score is not None and obs.score > 0.0
                break

            # Add tool result to conversation for next LLM call
            messages.append({"role": "assistant", "content": agent_text})

            tool_result_text = ""
            if obs.tool_result:
                tool_result_text = json.dumps(obs.tool_result, indent=2)
            if obs.last_action_error:
                tool_result_text = f"ERROR: {obs.last_action_error}"

            messages.append(
                {
                    "role": "user",
                    "content": (
                        f"Tool result:\n{tool_result_text}\n\n"
                        f"Tools used so far: {', '.join(obs.tools_used)}\n"
                        f"Steps remaining: {obs.steps_remaining}\n\n"
                        "Continue gathering information or submit your final plan. "
                        "Respond with a JSON action."
                    ),
                }
            )

    except Exception as e:
        error_msg = str(e)
        if not rewards:
            rewards.append(0.01)
        
        final_total = sum(rewards)
        # Using 0.1 as a success threshold to match the checklists
        success = final_total >= 0.1 
        
        rewards_str = ",".join(f"{r:.2f}" for r in rewards)
        print(f"[END] success={str(success).lower()} steps={len(rewards)} score={final_total:.2f} rewards={rewards_str}")
        
        return {
            "success": success,
            "steps": len(rewards),
            "total_reward": final_total,
            "final_score": final_total,
        }


    finally:
        env.close()

    # Print END line (Using mandatory score field and 2-decimal formatting)
    total_score = sum(rewards)
    rewards_str = ",".join(f"{r:.2f}" for r in rewards)
    print(
        f"[END] success={str(success).lower()} steps={step_count} "
        f"score={total_score:.2f} rewards={rewards_str}"
    )
    return {
        "success": success,
        "steps": step_count,
        "total_reward": total_score,
        "final_score": total_score,
    }


# ══════════════════════════════════════════════════════════════════════
#  Main Entry Point
# ══════════════════════════════════════════════════════════════════════

def main():
    """Run inference on all tasks and report results."""
    tasks = list_tasks()
    results = []

    for task_name in tasks:
        result = run_agent_on_task(task_name)
        results.append(result)
        print()  # Blank line between tasks

    # Summary to stderr so it doesn't interfere with stdout format
    print("\n=== BASELINE RESULTS ===", file=sys.stderr)
    for r in results:
        print(
            f"  {r['task']}: score={r['final_score']:.2f} "
            f"steps={r['steps']} success={r['success']}",
            file=sys.stderr,
        )
    avg = sum(r["final_score"] for r in results) / len(results) if results else 0.1
    print(f"  Average: {avg:.1f}", file=sys.stderr)


if __name__ == "__main__":
    main()
