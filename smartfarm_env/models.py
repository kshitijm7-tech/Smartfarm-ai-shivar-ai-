"""
Data models for the SmartFarm OpenEnv Environment.

Defines typed Action and Observation models using Pydantic,
following the OpenEnv specification.
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import Field

from openenv.core.env_server.types import Action, Observation


class SmartFarmAction(Action):
    """
    Action model for the SmartFarm environment.

    The agent can perform one of 5 action types:
    - analyze_soil: Get soil health data for given coordinates
    - check_disease: Check disease risk for a crop
    - recommend_crop: Get crop recommendations for coordinates
    - assess_risk: Get environmental risk assessment
    - submit_plan: Submit a farm management plan (terminates episode)
    """

    action_type: Literal[
        "analyze_soil",
        "check_disease",
        "recommend_crop",
        "assess_risk",
        "submit_plan",
    ] = Field(..., description="Type of action to perform")

    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Parameters for the action. "
            "analyze_soil: {lat: float, lon: float}. "
            "check_disease: {crop_name: str}. "
            "recommend_crop: {lat: float, lon: float, season?: str, budget?: float}. "
            "assess_risk: {lat: float, lon: float}. "
            "submit_plan: {plan: str}."
        ),
    )


class SmartFarmObservation(Observation):
    """
    Observation model for the SmartFarm environment.

    Returned after every reset() and step() call.
    """

    task_description: Optional[str] = Field(
        default=None,
        description="Description of the current farming task the agent must solve",
    )

    task_name: Optional[str] = Field(
        default=None,
        description="Machine-readable task identifier",
    )

    available_actions: List[str] = Field(
        default_factory=lambda: [
            "analyze_soil",
            "check_disease",
            "recommend_crop",
            "assess_risk",
            "submit_plan",
        ],
        description="List of actions the agent can take",
    )

    tool_result: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Result from the last tool call (None on reset or after submit_plan)",
    )

    last_action_error: Optional[str] = Field(
        default=None,
        description="Error message if the last action failed, or None",
    )

    plan_submitted: bool = Field(
        default=False,
        description="Whether a plan has been submitted for grading",
    )

    score: float = Field(
        default=0.01,
        description="Final grading score (0.0 to 1.0) after plan submission",
    )

    tools_used: List[str] = Field(
        default_factory=list,
        description="List of tools the agent has used so far in this episode",
    )

    steps_remaining: Optional[int] = Field(
        default=None,
        description="Number of steps remaining before episode auto-terminates",
    )
