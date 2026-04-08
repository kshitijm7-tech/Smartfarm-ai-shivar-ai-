"""
Task definitions for the SmartFarm OpenEnv Environment.

Three tasks with increasing difficulty:
1. soil_health_report (Easy)
2. crop_selection (Medium)
3. full_farm_plan (Hard)

Each task has a description, scenario parameters, and grading criteria.
"""

from typing import Any, Dict, List

# ──────────────────────────────────────────────────────────────────────
#  Task Registry
# ──────────────────────────────────────────────────────────────────────

TASKS: Dict[str, Dict[str, Any]] = {
    # ── EASY ──────────────────────────────────────────────────────────
    "soil_health_report": {
        "name": "soil_health_report",
        "difficulty": "easy",
        "description": (
            "You are an agricultural AI assistant helping a farmer in Pune, Maharashtra, India. "
            "The farmer has a 5-acre field at coordinates (18.52, 73.86). "
            "Your task is to:\n"
            "1. Analyze the soil health at the given coordinates\n"
            "2. Produce a clear soil health report that includes:\n"
            "   - Nitrogen (N), Phosphorus (P), Potassium (K) levels\n"
            "   - Soil pH value\n"
            "   - Moisture percentage\n"
            "   - Overall health score and status\n"
            "   - One actionable recommendation based on the results\n\n"
            "Use the 'analyze_soil' tool first, then submit your report using 'submit_plan'."
        ),
        "scenario": {
            "lat": 18.52,
            "lon": 73.86,
            "area_acres": 5.0,
            "location": "Pune, Maharashtra",
        },
        "required_tools": ["analyze_soil"],
        "max_steps": 10,
        "grader": "grade_soil_health_report",
    },

    # ── MEDIUM ────────────────────────────────────────────────────────
    "crop_selection": {
        "name": "crop_selection",
        "difficulty": "medium",
        "description": (
            "You are an agricultural AI assistant helping a farmer near Nashik, Maharashtra. "
            "The farmer has 8 acres at coordinates (19.99, 73.78) and wants to plant a new crop. "
            "Constraints:\n"
            "- Season: Kharif (monsoon, June-October)\n"
            "- Budget: ₹40,000 per acre\n"
            "- Water: Medium irrigation availability\n\n"
            "Your task is to:\n"
            "1. Analyze the soil at the given coordinates\n"
            "2. Assess the environmental risks\n"
            "3. Get crop recommendations\n"
            "4. Submit a crop selection report that includes:\n"
            "   - Your recommended crop with justification\n"
            "   - Why it suits the soil conditions\n"
            "   - Risk factors and how to mitigate them\n"
            "   - Expected profit estimate\n\n"
            "Use the available tools, then submit a detailed recommendation using 'submit_plan'."
        ),
        "scenario": {
            "lat": 19.99,
            "lon": 73.78,
            "area_acres": 8.0,
            "location": "Nashik, Maharashtra",
            "season": "Kharif",
            "budget_per_acre": 40000,
        },
        "required_tools": ["analyze_soil", "assess_risk", "recommend_crop"],
        "max_steps": 15,
        "grader": "grade_crop_selection",
    },

    # ── HARD ──────────────────────────────────────────────────────────
    "full_farm_plan": {
        "name": "full_farm_plan",
        "difficulty": "hard",
        "description": (
            "You are an agricultural AI consultant creating a comprehensive farm management plan "
            "for a farmer in Punjab, India. The farmer has 12 acres at coordinates (30.90, 75.85). "
            "This is a Rabi (winter) season plan.\n\n"
            "Your task is to create a COMPLETE farm management plan covering:\n"
            "1. **Soil Preparation**: Analyze soil and recommend amendments\n"
            "2. **Crop Selection**: Recommend the best crop for the conditions\n"
            "3. **Disease Prevention**: Check disease risks and plan prevention\n"
            "4. **Risk Mitigation**: Assess environmental risks and plan responses\n"
            "5. **Financial Projection**: Include budget and profit estimates\n\n"
            "Use ALL available tools (analyze_soil, check_disease, recommend_crop, "
            "assess_risk) to gather data, then submit a comprehensive plan using 'submit_plan'.\n\n"
            "Your plan should be detailed, actionable, and tailored to the specific "
            "soil and climate conditions at the given location."
        ),
        "scenario": {
            "lat": 30.90,
            "lon": 75.85,
            "area_acres": 12.0,
            "location": "Punjab, India",
            "season": "Rabi",
            "budget_per_acre": 35000,
        },
        "required_tools": [
            "analyze_soil",
            "check_disease",
            "recommend_crop",
            "assess_risk",
        ],
        "max_steps": 20,
        "grader": "grade_full_farm_plan",
    },
}


def get_task(task_name: str) -> Dict[str, Any]:
    """Get task configuration by name."""
    if task_name not in TASKS:
        raise ValueError(
            f"Unknown task: {task_name}. Available tasks: {list(TASKS.keys())}"
        )
    return TASKS[task_name]


def list_tasks() -> List[str]:
    """Return list of available task names."""
    return list(TASKS.keys())
