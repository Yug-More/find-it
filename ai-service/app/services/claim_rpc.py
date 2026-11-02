from fastapi import HTTPException
from postgrest.exceptions import APIError

# Only these application messages are safe to return. Unknown database failures
# are not exposed as SQL, URLs, or service credentials.
RPC_ERRORS = {
    "PT400": (400, "You cannot claim your own item, or the ownership explanation is invalid."),
    "PT403": (403, "Only the item owner can update this claim"),
    "PT404": (404, "The claim or report could not be found."),
    "PT409": (409, "The report is resolved, an active claim already exists, or this claim is no longer pending."),
    "23505": (409, "An active claim already exists."),
}


SAFE_DETAILS = {
    "Item not found", "Claim not found", "You cannot claim your own item",
    "This report is no longer open for claims.",
    "Enter an ownership explanation of 1 to 1000 characters.",
    "You already have an active claim on this report.",
    "Only the item owner can update this claim",
    "Only pending claims can be approved or rejected.",
    "This report is already resolved.",
}


def call_claim_rpc(supabase, name: str, params: dict) -> list[dict]:
    try:
        return supabase.rpc(name, params).execute().data
    except APIError as error:
        status, detail = RPC_ERRORS.get(error.code, (503, "The claim could not be saved. Try again."))
        if error.code in RPC_ERRORS and error.message in SAFE_DETAILS:
            detail = error.message
        raise HTTPException(status_code=status, detail=detail) from None
