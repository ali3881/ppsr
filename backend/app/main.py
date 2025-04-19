from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import psycopg
import os
import stripe
from datetime import datetime
from typing import Dict, Any

from app.soap.models import (
    ChangePasswordRequest, ChangePasswordResponse, 
    VehicleSearchRequest, VehicleSearchResponse, VehicleSearchType,
    PaymentIntentRequest, PaymentIntentResponse,
    PaymentConfirmationRequest, PaymentConfirmationResponse
)
from app.soap.client import ppsr_client
from app.utils.pdf_generator import generate_vehicle_search_pdf, generate_temp_pdf_path
from app.utils.stripe_utils import create_payment_intent, confirm_payment, verify_payment

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

@app.post("/api/ppsr/payment/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent_endpoint(request: PaymentIntentRequest):
    """
    Create a payment intent for a PDF download.
    
    This endpoint creates a Stripe payment intent for the specified search,
    which can be used to process a payment before downloading the PDF.
    """
    metadata = {
        "search_type": request.search_type,
        "state": request.state
    }
    
    result = create_payment_intent(request.search_id, metadata)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@app.post("/api/ppsr/payment/confirm", response_model=PaymentConfirmationResponse)
async def confirm_payment_endpoint(request: PaymentConfirmationRequest):
    """
    Confirm a payment for a PDF download.
    
    This endpoint verifies that a payment has been completed successfully
    before allowing the PDF to be downloaded.
    """
    result = confirm_payment(request.payment_intent_id, request.search_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@app.post("/api/ppsr/search/vehicle/pdf", response_class=FileResponse)
async def generate_vehicle_search_pdf_endpoint(
    request: VehicleSearchRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate a PDF report for a vehicle search.
    
    Returns a downloadable PDF file with the search results formatted
    similar to the official PPSR search certificates.
    
    Requires a successful payment before the PDF can be downloaded.
    """
    if not verify_payment(request.identifier):
        raise HTTPException(
            status_code=402,  # Payment Required
            detail="Payment is required to download this PDF"
        )
    
    response = ppsr_client.search_vehicle(request)
    
    if not response.success:
        raise HTTPException(status_code=400, detail=response.message)
    
    pdf_path = generate_temp_pdf_path(request.identifier)
    
    search_data = {
        "search_type": request.search_type,
        "identifier": request.identifier,
        "state": request.state if request.search_type == VehicleSearchType.REGISTRATION else None,
        "certificate_number": f"{int(datetime.now().timestamp())}",
        "search_number": f"{int(datetime.now().timestamp()/100)}",
        "search_results": response.search_results,
        "written_off": response.written_off,
        "stolen": response.stolen
    }
    
    pdf_path = generate_vehicle_search_pdf(search_data, pdf_path)
    
    background_tasks.add_task(lambda: os.unlink(pdf_path) if os.path.exists(pdf_path) else None)
    
    return FileResponse(
        path=pdf_path,
        filename=f"ppsr_vehicle_search_{request.identifier}.pdf",
        media_type="application/pdf",
        background=background_tasks
    )
