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

def test_numeric_safety():
    print("VERIFYING NUMERIC SAFETY (1-DECIMAL, NO NULLS):")
    env = SmartFarmEnvironment()
    
    # 1. Test Reset
    obs = env.reset(task_name="soil_health_report")
    obs_json = json.loads(obs.model_dump_json())
    print(f"Reset score: {obs_json.get('score')}")
    assert obs_json.get('score') == 0.1, f"Expected 0.1, got {obs_json.get('score')}"

    # 2. Test Tool Call (Successful)
    action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": 18.52, "lon": 73.86})
    obs = env.step(action)
    obs_json = json.loads(obs.model_dump_json())
    print(f"Tool call score: {obs_json.get('score')}")
    assert obs_json.get('score') == 0.1, f"Expected 0.1, got {obs_json.get('score')}"

    # 3. Test Invalid Action
    action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": "invalid"})
    obs = env.step(action)
    obs_json = json.loads(obs.model_dump_json())
    print(f"Invalid action score: {obs_json.get('score')}")
    assert obs_json.get('score') == 0.1

    # 4. Test Final Submission
    action = SmartFarmAction(action_type="submit_plan", parameters={"plan": "This is a detailed soil report for nitrogen, phosphorus, and potassium. Soil pH is healthy. We recommend fertilizer."})
    obs = env.step(action)
    obs_json = json.loads(obs.model_dump_json())
    print(f"Final score: {obs_json.get('score')}")
    assert 0.1 <= obs_json.get('score') <= 0.9, f"Final score {obs_json.get('score')} out of range!"

    print("\nNUMERIC SAFETY CHECK PASSED: NO NULLS FOUND.")

if __name__ == "__main__":
    try:
        test_numeric_safety()
    except Exception as e:
        print(f"\nNUMERIC SAFETY CHECK FAILED: {str(e)}")
        sys.exit(1)
