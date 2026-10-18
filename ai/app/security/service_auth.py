from __future__ import annotations

import hmac
import os
from fastapi import Header, HTTPException, status

AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "ros-internal-service-token-dev")


def verify_service_token(x_service_token: str | None = Header(None, alias="X-Service-Token")) -> str:
    """
    Verifies that the incoming request to the AI service contains the shared
    internal service authentication token.
    """
    # In local testing/dev if no secret is set, allow default token
    expected_token = AI_SERVICE_SECRET.strip()
    if not expected_token:
        return "unauthenticated-dev"

    if not x_service_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required X-Service-Token header",
        )

    # Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(x_service_token.strip(), expected_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid service authentication token",
        )

    return x_service_token
