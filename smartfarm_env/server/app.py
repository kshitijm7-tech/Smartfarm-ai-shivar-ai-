"""
FastAPI application for the SmartFarm OpenEnv Environment.

Exposes the SmartFarmEnvironment over HTTP endpoints compatible
with OpenEnv's EnvClient:
    - POST /reset: Reset the environment with a task
    - POST /step: Execute an action (tool call or plan submission)
    - GET /state: Get current environment state
    - GET /schema: Get action/observation schemas
    - GET /health: Health check
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure the smartfarm_env package is importable
SERVER_DIR = Path(__file__).resolve().parent
ENV_DIR = SERVER_DIR.parent
if str(ENV_DIR) not in sys.path:
    sys.path.insert(0, str(ENV_DIR))

try:
    from openenv.core.env_server.http_server import create_app
    from fastapi.responses import JSONResponse
    from pydantic import ValidationError
    from fastapi import Request
except ImportError as e:
    raise ImportError(
        "openenv is required. Install with: pip install openenv"
    ) from e

try:
    from smartfarm_env.models import SmartFarmAction, SmartFarmObservation
    from smartfarm_env.environment import SmartFarmEnvironment
except ImportError:
    from models import SmartFarmAction, SmartFarmObservation
    from environment import SmartFarmEnvironment


# Create the FastAPI app using OpenEnv's create_app factory
app = create_app(
    SmartFarmEnvironment,
    SmartFarmAction,
    SmartFarmObservation,
    env_name="smartfarm_env",
    max_concurrent_envs=1,
)


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Catch pydantic validation errors and return a safe numeric observation."""
    return JSONResponse(
        status_code=200,
        content={
            "observation": {
                "task_description": "Input validation error",
                "task_name": "error",
                "available_actions": [],
                "tool_result": None,
                "last_action_error": str(exc),
                "plan_submitted": False,
                "score": 0.01,
                "tools_used": [],
                "steps_remaining": 0,
            },
            "reward": 0.01,
            "done": True,
            "info": {"error": "validation_failure"}
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch any other errors and return a safe numeric observation."""
    return JSONResponse(
        status_code=200,
        content={
            "observation": {
                "task_description": "Global server error",
                "task_name": "error",
                "available_actions": [],
                "tool_result": None,
                "last_action_error": str(exc),
                "plan_submitted": False,
                "score": 0.01,
                "tools_used": [],
                "steps_remaining": 0,
            },
            "reward": 0.01,
            "done": True,
            "info": {"error": "internal_failure"}
        },
    )



def main(host: str = "0.0.0.0", port: int | None = None):
    """Run the SmartFarm environment server with uvicorn."""
    import uvicorn

    if port is None:
        port = int(os.getenv("API_PORT", "7860"))

    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
