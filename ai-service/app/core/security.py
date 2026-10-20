import jwt
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.algorithms import ECAlgorithm, RSAAlgorithm

from app.core.config import get_settings

_bearer_scheme = HTTPBearer(auto_error=False)

# Supabase publishes its JWT signing keys (JWKS) at this path.
# The legacy /auth/v1/jwks path was replaced by
# /auth/v1/.well-known/jwks.json as part of Supabase's API key changes.
# See: https://github.com/orgs/supabase/discussions/29260
JWKS_PATH = "/auth/v1/.well-known/jwks.json"


def _fetch_jwks(settings) -> dict | None:
    """Fetch the Supabase JWKS (public signing keys). Returns None on failure."""
    jwk_url = f"{settings.supabase_url}{JWKS_PATH}"
    try:
        resp = requests.get(
            jwk_url,
            headers={"apikey": settings.supabase_service_role_key},
        )
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return None


def _build_signing_key(jwk: dict):
    """Construct a PyJWT-compatible public key from a JWK.

    Supabase now issues asymmetric JWTs. Depending on the project the keys may be
    EC (ES256) or RSA (RS256); handle both.
    """
    kty = jwk.get("kty")
    if kty == "EC":
        return ECAlgorithm.from_jwk(jwk)
    if kty == "RSA":
        return RSAAlgorithm.from_jwk(jwk)
    return None


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """Validate the Supabase-issued access token and return the user's id (`sub` claim).

    Supports two signing schemes:

    1. Modern Supabase (asymmetric): tokens are signed with ES256/RS256 keys
       published via JWKS. The token header carries a `kid` that matches a JWK.
    2. Legacy Supabase (symmetric): tokens are signed with HS256 using
       ``SUPABASE_JWT_SECRET``. These tokens have no `kid` and fall through to
       the legacy path below.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    settings = get_settings()
    token = credentials.credentials

    # Decode the token header to get the key ID (kid) and algorithm
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token header",
        )

    kid = header.get("kid")

    # Modern Supabase: verify with the JWK matching the token's `kid`.
    if kid:
        jwks_data = _fetch_jwks(settings)
        if jwks_data:
            signing_key = None
            jwk_alg = None
            for key in jwks_data.get("keys", []):
                if key.get("kid") == kid:
                    signing_key = _build_signing_key(key)
                    jwk_alg = key.get("alg")
                    break

            if signing_key and jwk_alg:
                try:
                    payload = jwt.decode(
                        token,
                        signing_key,
                        algorithms=[jwk_alg],
                        audience="authenticated",
                    )
                    user_id = payload.get("sub")
                    if user_id:
                        return user_id
                except Exception:
                    # Fall through to the legacy HS256 path below.
                    pass

    # Legacy Supabase: verify with the shared JWT secret (HS256).
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if user_id:
            return user_id
    except Exception:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )
