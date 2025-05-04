from fastapi import APIRouter
from app.api.routes import stp_routes
from app.api.routes import stp_operation
app_router = APIRouter()

app_router.include_router(
    stp_routes.router,
    prefix="/stp",
    tags=["STP"]
)
app_router.include_router(
    stp_operation.router,
    prefix="/stp_operation",
    tags=["STP OPERATIONS"]
)