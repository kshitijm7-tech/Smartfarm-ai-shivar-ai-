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
    print("VERIFYING NUMERIC SAFETY (NO NULL SCORES):")
    env = SmartFarmEnvironment()
    
    # 1. Test Reset
    obs = env.reset(task_name="soil_health_report")
    obs_json = json.loads(obs.model_dump_json())
    print(f"Reset score: {obs_json.get('score')} (Type: {type(obs_json.get('score'))})")
    assert obs_json.get('score') is not None, "Score is null on reset!"
    assert 0.0 < obs_json.get('score') < 1.0, "Score out of range on reset!"

    # 2. Test Tool Call (Successful)
    action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": 18.52, "lon": 73.86})
    obs = env.step(action)
    obs_json = json.loads(obs.model_dump_json())
    print(f"Tool call score: {obs_json.get('score')} (Type: {type(obs_json.get('score'))})")
    assert obs_json.get('score') is not None, "Score is null on tool call!"
    assert 0.0 < obs_json.get('score') < 1.0, "Score out of range on tool call!"

    # 3. Test Invalid Action
    action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": "invalid"})
    obs = env.step(action)
    obs_json = json.loads(obs.model_dump_json())
    print(f"Invalid action score: {obs_json.get('score')} (Type: {type(obs_json.get('score'))})")
    assert obs_json.get('score') is not None, "Score is null on error!"

    # 4. Test Final Submission
    action = SmartFarmAction(action_type="submit_plan", parameters={"plan": "This is a detailed soil report for nitrogen, phosphorus, and potassium. Soil pH is healthy. We recommend fertilizer."})
    obs = env.step(action)
    obs_json = json.loads(obs.model_dump_json())
    print(f"Final score: {obs_json.get('score')} (Type: {type(obs_json.get('score'))})")
    assert obs_json.get('score') is not None, "Score is null on terminal step!"
    assert 0.0 < obs_json.get('score') < 1.0, "Final score out of range!"

    print("\n✅ NUMERIC SAFETY CHECK PASSED: NO NULLS FOUND.")

if __name__ == "__main__":
    try:
        test_numeric_safety()
    except Exception as e:
        print(f"\n❌ NUMERIC SAFETY CHECK FAILED: {str(e)}")
        sys.exit(1)
