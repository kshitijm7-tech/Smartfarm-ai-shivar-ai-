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


def main(host: str = "0.0.0.0", port: int | None = None):
    """Run the SmartFarm environment server with uvicorn."""
    import uvicorn

    if port is None:
        port = int(os.getenv("API_PORT", "7860"))

    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
