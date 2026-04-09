"""
SmartFarm Environment — OpenEnv Environment implementation.

This is the core Environment class that implements the OpenEnv interface:
- reset(task_name, seed, episode_id) → initial observation
- step(action) → observation with tool results and rewards
- state → current State
"""

from typing import Any, Dict, List, Optional
from uuid import uuid4

from openenv.core.env_server.interfaces import Environment
from openenv.core.env_server.types import State

try:
    from .models import SmartFarmAction, SmartFarmObservation
    from .tasks import get_task, list_tasks
    from .tools import (
        tool_analyze_soil,
        tool_check_disease,
        tool_recommend_crop,
        tool_assess_risk,
    )
    from .graders import get_grader
except ImportError:
    from models import SmartFarmAction, SmartFarmObservation
    from tasks import get_task, list_tasks
    from tools import (
        tool_analyze_soil,
        tool_check_disease,
        tool_recommend_crop,
        tool_assess_risk,
    )
    from graders import get_grader


DEFAULT_TASK = "soil_health_report"
MAX_STEPS_FALLBACK = 20


class SmartFarmEnvironment(Environment):
    """
    SmartFarm RL Environment for farm management advisory tasks.

    The agent interacts with agricultural tools (soil analysis, disease check,
    crop recommendation, risk assessment) to gather information, then submits
    a farm management plan that is graded programmatically.

    Design:
    - Multi-step episodes: reset() provides task description, step() dispatches
      tool calls or plan submission
    - Incremental rewards: +0.1 per useful tool call, penalty for invalid actions,
      final score from grader on plan submission
    - Three difficulty levels: easy, medium, hard
    - Deterministic: same coordinates always produce same results

    Example:
        >>> env = SmartFarmEnvironment()
        >>> obs = env.reset(task_name='soil_health_report')
        >>> print(obs.task_description)  # "You are an agricultural AI assistant..."
        >>>
        >>> action = SmartFarmAction(action_type="analyze_soil", parameters={"lat": 18.52, "lon": 73.86})
        >>> obs = env.step(action)
        >>> print(obs.tool_result)  # {"nitrogen": 45, ...}
        >>>
        >>> action = SmartFarmAction(action_type="submit_plan", parameters={"plan": "..."})
        >>> obs = env.step(action)
        >>> print(obs.score)  # 0.85
        >>> print(obs.done)  # True
    """

    SUPPORTS_CONCURRENT_SESSIONS: bool = True

    def __init__(self):
        """Initialize the SmartFarm environment."""
        super().__init__()
        self._state = State(episode_id=str(uuid4()), step_count=0)

        # Episode state
        self._task_config: Optional[Dict[str, Any]] = None
        self._task_name: Optional[str] = None
        self._tools_used: List[str] = []
        self._tool_results: List[Dict[str, Any]] = []
        self._unique_tools: set = set()
        self._done: bool = False
        self._max_steps: int = MAX_STEPS_FALLBACK
        self._cumulative_reward: float = 0.0

    def reset(
        self,
        task_name: Optional[str] = None,
        seed: Optional[int] = None,
        episode_id: Optional[str] = None,
        **kwargs: Any,
    ) -> SmartFarmObservation:
        """
        Reset the environment and start a new episode.

        Args:
            task_name: Name of the task to load. One of:
                       'soil_health_report', 'crop_selection', 'full_farm_plan'.
                       Defaults to 'soil_health_report'.
            seed: Random seed (unused — environment is deterministic)
            episode_id: Optional episode identifier

        Returns:
            SmartFarmObservation with task description and available actions
        """
        # Load task configuration
        task_name = task_name or DEFAULT_TASK
        self._task_config = get_task(task_name)
        self._task_name = task_name

        # Reset episode state
        self._tools_used = []
        self._tool_results = []
        self._unique_tools = set()
        self._done = False
        self._max_steps = self._task_config.get("max_steps", MAX_STEPS_FALLBACK)
        self._cumulative_reward = 0.0

        # Reset state
        self._state = State(
            episode_id=episode_id or str(uuid4()),
            step_count=0,
        )

        return SmartFarmObservation(
            task_description=self._task_config["description"],
            task_name=task_name,
            available_actions=[
                "analyze_soil",
                "check_disease",
                "recommend_crop",
                "assess_risk",
                "submit_plan",
            ],
            tool_result=None,
            last_action_error=None,
            plan_submitted=False,
            score=None,
            done=False,
            reward=0.05,
            tools_used=[],
            steps_remaining=self._max_steps,
        )

    def step(
        self,
        action: SmartFarmAction,
        timeout_s: Optional[float] = None,
        **kwargs: Any,
    ) -> SmartFarmObservation:
        """
        Execute an action and return the resulting observation.

        Args:
            action: SmartFarmAction to execute
            timeout_s: Optional timeout (unused)

        Returns:
            SmartFarmObservation with tool results and reward
        """
        self._state.step_count += 1

        # Check if episode is already done
        if self._done:
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error="Episode is already done. Call reset() to start a new episode.",
                plan_submitted=True,
                score=None,
                done=True,
                reward=0.05,
                tools_used=list(self._unique_tools),
                steps_remaining=0,
            )

        # Check max steps
        steps_remaining = self._max_steps - self._state.step_count
        if steps_remaining < 0:
            self._done = True
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error="Maximum steps exceeded. Episode terminated.",
                plan_submitted=False,
                score=0.05,
                done=True,
                reward=0.05,
                tools_used=list(self._unique_tools),
                steps_remaining=0,
            )

        # Dispatch action
        action_type = action.action_type
        params = action.parameters or {}

        if action_type == "submit_plan":
            return self._handle_submit_plan(params, steps_remaining)
        elif action_type == "analyze_soil":
            return self._handle_tool_call(
                "analyze_soil", tool_analyze_soil, params, steps_remaining
            )
        elif action_type == "check_disease":
            return self._handle_tool_call(
                "check_disease", tool_check_disease, params, steps_remaining
            )
        elif action_type == "recommend_crop":
            return self._handle_tool_call(
                "recommend_crop", tool_recommend_crop, params, steps_remaining
            )
        elif action_type == "assess_risk":
            return self._handle_tool_call(
                "assess_risk", tool_assess_risk, params, steps_remaining
            )
        else:
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error=f"Unknown action type: {action_type}",
                plan_submitted=False,
                score=None,
                done=False,
                reward=0.05,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )

    def _handle_tool_call(
        self,
        tool_name: str,
        tool_fn,
        params: Dict[str, Any],
        steps_remaining: int,
    ) -> SmartFarmObservation:
        """Execute a tool and return the observation."""
        try:
            # Dispatch with appropriate parameters
            if tool_name == "analyze_soil":
                lat = params.get("lat", self._task_config["scenario"].get("lat", 0))
                lon = params.get("lon", self._task_config["scenario"].get("lon", 0))
                result = tool_fn(lat, lon)
            elif tool_name == "check_disease":
                crop = params.get("crop_name", "wheat")
                season = params.get(
                    "season", self._task_config["scenario"].get("season", "Kharif")
                )
                result = tool_fn(crop, season)
            elif tool_name == "recommend_crop":
                lat = params.get("lat", self._task_config["scenario"].get("lat", 0))
                lon = params.get("lon", self._task_config["scenario"].get("lon", 0))
                season = params.get(
                    "season", self._task_config["scenario"].get("season", "Kharif")
                )
                budget = params.get(
                    "budget",
                    self._task_config["scenario"].get("budget_per_acre", 40000),
                )
                result = tool_fn(lat, lon, season, budget)
            elif tool_name == "assess_risk":
                lat = params.get("lat", self._task_config["scenario"].get("lat", 0))
                lon = params.get("lon", self._task_config["scenario"].get("lon", 0))
                result = tool_fn(lat, lon)
            else:
                result = {"error": f"Unknown tool: {tool_name}"}

            # Check for errors in result
            if "error" in result:
                return SmartFarmObservation(
                    task_description=None,
                    task_name=self._task_name,
                    tool_result=result,
                    last_action_error=result["error"],
                    plan_submitted=False,
                    score=None,
                    done=False,
                    reward=0.05,
                    tools_used=list(self._unique_tools),
                    steps_remaining=steps_remaining,
                )

            # Track tool usage
            self._tools_used.append(tool_name)
            self._tool_results.append({"tool": tool_name, "result": result})

            # Calculate reward
            is_new_tool = tool_name not in self._unique_tools
            self._unique_tools.add(tool_name)

            if is_new_tool:
                reward = 0.1  # Reward for using a new tool
            else:
                reward = 0.05  # No reward for repeated tool calls

            self._cumulative_reward += reward

            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=result,
                last_action_error=None,
                plan_submitted=False,
                score=None,
                done=False,
                reward=reward,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )

        except Exception as exc:
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error=f"Tool execution error: {str(exc)}",
                plan_submitted=False,
                score=None,
                done=False,
                reward=0.05,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )

    def _handle_submit_plan(
        self,
        params: Dict[str, Any],
        steps_remaining: int,
    ) -> SmartFarmObservation:
        """Handle plan submission and grading."""
        plan_text = params.get("plan", "")

        if not plan_text or not plan_text.strip():
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error="Plan cannot be empty. Provide a 'plan' parameter with your report.",
                plan_submitted=False,
                score=None,
                done=False,
                reward=0.05,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )

        # Grade the plan
        grader_name = self._task_config.get("grader", "grade_soil_health_report")
        grader_fn = get_grader(grader_name)
        score = grader_fn(
            plan=plan_text,
            tools_used=list(self._unique_tools),
            tool_results=self._tool_results,
            task_config=self._task_config,
        )

        self._done = True

        return SmartFarmObservation(
            task_description=None,
            task_name=self._task_name,
            tool_result={"grading_complete": True, "final_score": score},
            last_action_error=None,
            plan_submitted=True,
            score=score,
            done=True,
            reward=score,
            tools_used=list(self._unique_tools),
            steps_remaining=0,
        )

    @property
    def state(self) -> State:
        """Get the current environment state."""
        return self._state

    def close(self) -> None:
        """Clean up resources."""
        self._task_config = None
        self._tools_used = []
        self._tool_results = []
        self._unique_tools = set()
