import json
import sys
import os
from pathlib import Path

# Ensure the smartfarm_env package is importable
ENV_DIR = Path(__file__).resolve().parent
if str(ENV_DIR) not in sys.path:
    sys.path.insert(0, str(ENV_DIR))

try:
    from environment import SmartFarmEnvironment
    from models import SmartFarmAction
except ImportError:
    from smartfarm_env.environment import SmartFarmEnvironment
    from smartfarm_env.models import SmartFarmAction

def test_cumulative_reward_safety():
    print("VERIFYING REFINED REWARD SHAPING (SUM MUST BE [0.1, 0.95]):")
    env = SmartFarmEnvironment()
    
    # 1. Start Episode
    rewards = []
    obs = env.reset(task_name="soil_health_report")
    rewards.append(obs.reward)
    print(f"Reset reward: {obs.reward}")

    # 2. Call tools (Intermediate rewards)
    # Step 1: New tool (0.05)
    action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": 18.52, "lon": 73.86})
    obs = env.step(action)
    rewards.append(obs.reward)
    print(f"Step 1 (New Tool) reward: {obs.reward}")
    assert obs.reward == 0.05, f"Expected new tool reward 0.05, got {obs.reward}"

    # Step 2: Repeat tool (0.02)
    obs = env.step(action)
    rewards.append(obs.reward)
    print(f"Step 2 (Repeat Tool) reward: {obs.reward}")
    assert obs.reward == 0.02, f"Expected repeat tool reward 0.02, got {obs.reward}"

    # 3. Submit Plan (Final Balancing Reward)
    plan_content = "Soil analysis shows Nitrogen=50, Phosphorus=25, Potassium=100. pH is 6.5. Status is Good."
    action = SmartFarmAction(action_type="submit_plan", parameters={"plan": plan_content})
    obs = env.step(action)
    rewards.append(obs.reward)
    print(f"Final step reward: {obs.reward}")
    
    total_score = sum(rewards)
    print(f"TOTAL CUMULATIVE REWARD (TASK SCORE): {total_score:.2f}")
    
    # Critical Check: Total must be strictly in (0, 1) and match grader final_score
    assert 0.1 <= total_score <= 0.95, f"Cumulative reward {total_score} out of safe range!"
    assert round(total_score, 2) == round(obs.tool_result['final_score'], 2), f"Total {total_score} doesn't match final_score {obs.tool_result['final_score']}"

    print("\nREWARD SHAPING CHECK PASSED: CUMULATIVE SCORE IS BALANCED AND IN RANGE.")

if __name__ == "__main__":
    try:
        test_cumulative_reward_safety()
    except Exception as e:
        print(f"\nREWARD SHAPING CHECK FAILED: {str(e)}")
        sys.exit(1)
