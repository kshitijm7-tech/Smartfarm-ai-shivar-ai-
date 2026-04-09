"""
Programmatic graders for SmartFarm OpenEnv tasks.

Each grader scores an agent's submitted plan on a 0.0–1.0 scale
using deterministic, reproducible rubric criteria.
"""

from typing import Any, Dict, List


def _check_keywords(text: str, keywords: List[str]) -> float:
    """
    Check what fraction of expected keywords appear in the text.
    Case-insensitive matching.
    Returns a float between 0.0 and 1.0.
    """
    if not text or not keywords:
        return 0.0
    text_lower = text.lower()
    found = sum(1 for kw in keywords if kw.lower() in text_lower)
    return found / len(keywords)


def _check_tools_used(
    tools_used: List[str],
    required_tools: List[str],
) -> float:
    """
    Check what fraction of required tools were used.
    Returns a float between 0.0 and 1.0.
    """
    if not required_tools:
        return 1.0
    used_set = set(tools_used)
    found = sum(1 for t in required_tools if t in used_set)
    return found / len(required_tools)


def _plan_length_score(plan: str, min_words: int = 30, target_words: int = 100) -> float:
    """
    Score plan based on length.  Very short plans score low.
    Returns 0.0–1.0.
    """
    word_count = len(plan.split())
    if word_count < min_words:
        return max(0.0, word_count / min_words * 0.5)
    return min(1.0, word_count / target_words)


# ══════════════════════════════════════════════════════════════════════
#  Grader 1: Soil Health Report (Easy)
# ══════════════════════════════════════════════════════════════════════

def grade_soil_health_report(
    plan: str,
    tools_used: List[str],
    tool_results: List[Dict[str, Any]],
    task_config: Dict[str, Any],
) -> float:
    """
    Grade a soil health report submission.

    Rubric (total = 1.0):
    - Tool usage: 0.30 (used analyze_soil)
    - Key metrics mentioned: 0.40 (N, P, K, pH, moisture, health score)
    - Report quality: 0.30 (length, structure, recommendation)
    """
    # 1. Tool usage (0.30)
    tool_score = _check_tools_used(tools_used, ["analyze_soil"]) * 0.30

    # 2. Key metrics (0.40)
    soil_keywords = [
        "nitrogen", "phosphorus", "potassium",
        "ph", "moisture", "health",
    ]
    # Also accept abbreviations
    alt_keywords = ["npk", "n ", "p ", "k "]
    keyword_score_main = _check_keywords(plan, soil_keywords)
    keyword_score_alt = _check_keywords(plan, alt_keywords)
    keyword_score = max(keyword_score_main, keyword_score_alt) * 0.40

    # 3. Report quality (0.30)
    length_score = _plan_length_score(plan, min_words=20, target_words=80)
    recommendation_keywords = [
        "recommend", "suggest", "should", "action", "apply",
        "fertilizer", "improvement", "amendment",
    ]
    has_recommendation = _check_keywords(plan, recommendation_keywords) > 0.0
    quality_score = (length_score * 0.6 + (0.4 if has_recommendation else 0.0)) * 0.30

    total = round(min(tool_score + keyword_score + quality_score, 1.0), 2)
    return max(0.01, min(total, 0.99))


# ══════════════════════════════════════════════════════════════════════
#  Grader 2: Crop Selection (Medium)
# ══════════════════════════════════════════════════════════════════════

def grade_crop_selection(
    plan: str,
    tools_used: List[str],
    tool_results: List[Dict[str, Any]],
    task_config: Dict[str, Any],
) -> float:
    """
    Grade a crop selection submission.

    Rubric (total = 1.0):
    - Tool usage: 0.20 (analyze_soil, assess_risk, recommend_crop)
    - Soil analysis mentioned: 0.20
    - Risk awareness: 0.20
    - Crop recommendation with justification: 0.25
    - Financial/profit mention: 0.15
    """
    required = task_config.get("required_tools", ["analyze_soil", "assess_risk", "recommend_crop"])

    # 1. Tool usage (0.20)
    tool_score = _check_tools_used(tools_used, required) * 0.20

    # 2. Soil analysis (0.20)
    soil_keywords = ["soil", "nitrogen", "phosphorus", "potassium", "ph", "moisture", "npk"]
    soil_score = _check_keywords(plan, soil_keywords) * 0.20

    # 3. Risk awareness (0.20)
    risk_keywords = ["risk", "weather", "temperature", "rain", "humidity", "frost", "drought", "fungal"]
    risk_score = _check_keywords(plan, risk_keywords) * 0.20

    # 4. Crop recommendation (0.25)
    crop_keywords = [
        "recommend", "crop", "select", "suit", "match",
        "because", "reason", "justification", "confidence",
    ]
    crop_score = _check_keywords(plan, crop_keywords) * 0.15
    length_bonus = _plan_length_score(plan, min_words=50, target_words=150) * 0.10
    crop_total = crop_score + length_bonus

    # 5. Financial (0.15)
    finance_keywords = ["profit", "budget", "cost", "revenue", "income", "expense", "₹", "rupee"]
    finance_score = _check_keywords(plan, finance_keywords) * 0.15

    total = round(min(tool_score + soil_score + risk_score + crop_total + finance_score, 1.0), 2)
    return max(0.01, min(total, 0.99))


# ══════════════════════════════════════════════════════════════════════
#  Grader 3: Full Farm Plan (Hard)
# ══════════════════════════════════════════════════════════════════════

def grade_full_farm_plan(
    plan: str,
    tools_used: List[str],
    tool_results: List[Dict[str, Any]],
    task_config: Dict[str, Any],
) -> float:
    """
    Grade a comprehensive farm management plan.

    Rubric (total = 1.0):
    - All tools used: 0.20
    - Plan completeness (5 sections): 0.30
    - Risk awareness: 0.15
    - Financial viability: 0.15
    - Actionability & detail: 0.20
    """
    required = task_config.get(
        "required_tools",
        ["analyze_soil", "check_disease", "recommend_crop", "assess_risk"],
    )

    # 1. Tool usage (0.20)
    tool_score = _check_tools_used(tools_used, required) * 0.20

    # 2. Plan completeness — 5 sections (0.30)
    section_keywords_map = {
        "soil": ["soil", "nitrogen", "phosphorus", "potassium", "ph", "amendment", "preparation"],
        "crop": ["crop", "recommend", "select", "variety", "sow", "plant"],
        "disease": ["disease", "pest", "prevention", "spray", "fungicide", "treatment"],
        "risk": ["risk", "weather", "drought", "frost", "flood", "mitigation", "contingency"],
        "finance": ["profit", "budget", "cost", "revenue", "financial", "₹", "rupee", "income"],
    }
    section_scores = []
    for section_kws in section_keywords_map.values():
        section_scores.append(min(_check_keywords(plan, section_kws) * 2, 1.0))
    completeness = (sum(section_scores) / len(section_scores)) * 0.30

    # 3. Risk awareness (0.15)
    risk_detail_keywords = [
        "risk", "mitigat", "contingency", "prevent", "protect",
        "insurance", "alternative", "backup",
    ]
    risk_score = _check_keywords(plan, risk_detail_keywords) * 0.15

    # 4. Financial viability (0.15)
    finance_detail_keywords = [
        "profit", "cost", "budget", "revenue", "return",
        "investment", "expense", "estimate", "projection",
    ]
    finance_score = _check_keywords(plan, finance_detail_keywords) * 0.15

    # 5. Actionability & detail (0.20)
    action_keywords = [
        "apply", "use", "spray", "irrigate", "sow", "harvest",
        "schedule", "timeline", "step", "action", "implement",
        "per acre", "kg", "ml", "days",
    ]
    action_score = _check_keywords(plan, action_keywords) * 0.10
    length_score = _plan_length_score(plan, min_words=100, target_words=300) * 0.10
    detail_total = action_score + length_score

    total = round(min(tool_score + completeness + risk_score + finance_score + detail_total, 1.0), 2)
    return max(0.01, min(total, 0.99))


# ══════════════════════════════════════════════════════════════════════
#  Grader Dispatcher
# ══════════════════════════════════════════════════════════════════════

GRADER_REGISTRY = {
    "grade_soil_health_report": grade_soil_health_report,
    "grade_crop_selection": grade_crop_selection,
    "grade_full_farm_plan": grade_full_farm_plan,
}


def get_grader(grader_name: str):
    """Get a grader function by name."""
    if grader_name not in GRADER_REGISTRY:
        raise ValueError(
            f"Unknown grader: {grader_name}. "
            f"Available: {list(GRADER_REGISTRY.keys())}"
        )
    return GRADER_REGISTRY[grader_name]
