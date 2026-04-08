import os

# 1. Missing Defaults Check
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini")
print("=== DEFAULTS CHECK ===")
print(f"API_BASE_URL: {API_BASE_URL}")
print(f"MODEL_NAME: {MODEL_NAME}")

# 2. Format / Decimal / Lowercase Boolean Check
print("\n=== FORMAT CHECK ===")
task_name = "soil_health_report"
print(f"[START] task={task_name} env=smartfarm_env model={MODEL_NAME}")

# Mock Step 1
step = 1
action_str = "analyze_soil(lat=18.52,lon=73.86)"
reward = 0.5  # Tricky float
done = False
error = None
print(f"[STEP] step={step} action={action_str} reward={reward:.2f} done={str(done).lower()} error={error if error else 'null'}")

# Mock Step 2 (End)
step = 2
action_str = "submit_plan"
reward = 1     # Tricky integer
done = True
error = None
print(f"[STEP] step={step} action={action_str} reward={reward:.2f} done={str(done).lower()} error={error if error else 'null'}")

success = True
rewards = [0.5, 1.0]
rewards_str = ",".join(f"{r:.2f}" for r in rewards)
print(f"[END] success={str(success).lower()} steps={step} rewards={rewards_str}")
