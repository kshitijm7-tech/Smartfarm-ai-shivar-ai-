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
    print("VERIFYING BULLETPROOF NUMERIC SAFETY (1-DECIMAL, NO NULLS):")
    env = SmartFarmEnvironment()
    
    # 1. Test Reset (Valid)
    obs = env.reset(task_name="soil_health_report")
    print(f"Reset score: {obs.score}")
    assert obs.score == 0.1

    # 2. Test Reset (Invalid Task - Should use fallback)
    obs = env.reset(task_name="non_existent_task")
    print(f"Invalid reset score: {obs.score}")
    assert obs.score == 0.1
    assert obs.done is True

    # 3. Test Step (Crashing Tool - should catch internally)
    # We'll trigger a tool call with garbage that might cause an error
    action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": None, "lon": None})
    obs = env.step(action)
    print(f"Crashing action score: {obs.score}")
    assert obs.score == 0.1

    # 4. Final Submission
    action = SmartFarmAction(action_type="submit_plan", parameters={"plan": "Detailed report..."})
    obs = env.step(action)
    print(f"Final score: {obs.score}")
    assert 0.1 <= obs.score <= 0.9

    print("\nBULLETPROOF SAFETY CHECK PASSED: EVERY PATH RETURNS 0.1-0.9.")

if __name__ == "__main__":
    try:
        test_numeric_safety()
    except Exception as e:
        print(f"\nBULLETPROOF SAFETY CHECK FAILED: {str(e)}")
        sys.exit(1)
