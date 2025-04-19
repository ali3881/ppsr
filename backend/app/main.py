from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import psycopg
from typing import Dict, Any

from app.soap.models import (
    ChangePasswordRequest, ChangePasswordResponse, 
    VehicleSearchRequest, VehicleSearchResponse, VehicleSearchType
)
from app.soap.client import ppsr_client

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/ppsr/change-password", response_model=ChangePasswordResponse)
async def change_password(request: ChangePasswordRequest):
    """
    Change the B2G password for PPSR.
    
    This is the first operation that must be performed with the initial credentials
    before any other operations can be accessed.
    """
    response = ppsr_client.change_password(request)
    
    if not response.success:
        raise HTTPException(status_code=400, detail=response.message)
    
    return response

@app.get("/api/ppsr/status")
async def ppsr_status():
    """Get the status of the PPSR B2G connection."""
    password_expiring = ppsr_client.check_password_expiry()
    
    return {
        "status": "connected",
        "password_expiring": password_expiring,
        "message": "Password needs to be changed soon" if password_expiring else "Connection is healthy"
    }

@app.post("/api/ppsr/search/vehicle", response_model=VehicleSearchResponse)
async def search_vehicle(request: VehicleSearchRequest):
    """
    Search for vehicle by VIN, Chassis, or Registration number.
    
    Returns vehicle details including written-off status, stolen status, and other 
    information available in the PPSR.
    """
    response = ppsr_client.search_vehicle(request)
    
    if not response.success:
        raise HTTPException(status_code=400, detail=response.message)
    
    return response
