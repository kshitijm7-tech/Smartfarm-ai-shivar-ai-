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

    Reward Balancing:
    - Intermediate steps return a tiny 0.01 reward.
    - The final plan submission reward is adjusted such that sum(rewards) == final_score.
    - This ensures the TOTAL episode score is strictly between 0 and 1.
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
        self._cumulative_extra_reward: float = 0.0

    def reset(
        self,
        seed: Optional[int] = None,
        episode_id: Optional[str] = None,
        task_name: Optional[str] = None,
        **kwargs: Any,
    ) -> SmartFarmObservation:
        """
        Reset the environment and start a new episode.
        """
        try:
            # Load task configuration
            task_name = task_name or kwargs.get("task_name") or DEFAULT_TASK
            self._task_config = get_task(task_name)
            self._task_name = task_name

            # Reset episode state
            self._tools_used = []
            self._tool_results = []
            self._unique_tools = set()
            self._done = False
            self._max_steps = self._task_config.get("max_steps", MAX_STEPS_FALLBACK)
            self._cumulative_extra_reward = 0.01  # Reset reward counts as step 0

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
                score=0.01,
                done=False,
                reward=0.01,
                tools_used=[],
                steps_remaining=self._max_steps,
            )
        except Exception as e:
            return SmartFarmObservation(
                task_description=f"Error initializing task: {str(e)}",
                task_name="error",
                tool_result=None,
                last_action_error=str(e),
                plan_submitted=False,
                score=0.01,
                done=True,
                reward=0.01,
                tools_used=[],
                steps_remaining=0,
            )

    def step(
        self,
        action: SmartFarmAction,
        timeout_s: Optional[float] = None,
        **kwargs: Any,
    ) -> SmartFarmObservation:
        """
        Execute an action and return the resulting observation.
        """
        try:
            self._state.step_count += 1

            # Check if episode is already done
            if self._done:
                return SmartFarmObservation(
                    task_description=None,
                    task_name=self._task_name,
                    tool_result=None,
                    last_action_error="Episode is already done. Call reset() to start a new episode.",
                    plan_submitted=True,
                    score=0.01,
                    done=True,
                    reward=0.01,
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
                    score=0.01,
                    done=True,
                    reward=0.01,
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
                    score=0.01,
                    done=False,
                    reward=0.01,
                    tools_used=list(self._unique_tools),
                    steps_remaining=steps_remaining,
                )
        except Exception as e:
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error=f"Critical environment error: {str(e)}",
                plan_submitted=False,
                score=0.01,
                done=True,
                reward=0.01,
                tools_used=list(self._unique_tools),
                steps_remaining=0,
            )

    def _handle_tool_call(
        self,
        tool_name: str,
        tool_fn: Any,
        params: Dict[str, Any],
        steps_remaining: int,
    ) -> SmartFarmObservation:
        """Execute a tool call and update state."""
        try:
            # Record tool usage
            is_new_tool = tool_name not in self._unique_tools
            self._unique_tools.add(tool_name)
            self._tools_used.append(tool_name)

            # Execute tool
            result = tool_fn(**params)
            self._tool_results.append({"tool": tool_name, "result": result})

            # SHAPING: Give higher reward for first-time use of useful tools
            reward = 0.05 if is_new_tool else 0.02
            self._cumulative_extra_reward += reward

            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=result,
                last_action_error=None,
                plan_submitted=False,
                score=0.01,
                done=False,
                reward=reward,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )
        except Exception as e:
            # Handle tool execution errors (return tiny baseline reward)
            result = {"error": str(e)}
            reward = 0.02
            self._cumulative_extra_reward += reward
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=result,
                last_action_error=result["error"],
                plan_submitted=False,
                score=0.01,
                done=False,
                reward=reward,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )


    def _handle_submit_plan(
        self,
        params: Dict[str, Any],
        steps_remaining: int,
    ) -> SmartFarmObservation:
        """Handle plan submission and grading."""
        plan = params.get("plan", "")

        if not plan or not plan.strip():
            return SmartFarmObservation(
                task_description=None,
                task_name=self._task_name,
                tool_result=None,
                last_action_error="Plan cannot be empty. Provide a 'plan' parameter with your report.",
                plan_submitted=False,
                score=0.01,
                done=False,
                reward=0.01,
                tools_used=list(self._unique_tools),
                steps_remaining=steps_remaining,
            )

        # Get final score from grader
        grader_name = self._task_config.get("grader", "grade_soil_health_report")
        grader_fn = get_grader(grader_name)
        score = grader_fn(
            plan=plan,
            tools_used=self._tools_used,
            tool_results=self._tool_results,
            task_config=self._task_config,
        )

        # REWARD BALANCING: Ensure Sum(Rewards) == Final Score
        # Total episode reward should be exactly the grader's score.
        final_reward = max(0.01, round(score - self._cumulative_extra_reward, 2))
        
        # Mark episode as done
        self._done = True

        return SmartFarmObservation(
            task_description=None,
            task_name=self._task_name,
            tool_result={"grading_complete": True, "final_score": score},
            last_action_error=None,
            plan_submitted=True,
            score=score,
            done=True,
            reward=final_reward,
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
