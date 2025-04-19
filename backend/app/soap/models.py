"""
Data models for the PPSR B2G SOAP client.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class B2GCredentials(BaseModel):
    """B2G credentials model."""
    account_number: str
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    """Request model for changing B2G password."""
    account_number: str
    username: str
    current_password: str
    new_password: str

class ChangePasswordResponse(BaseModel):
    """Response model for change password operation."""
    success: bool
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    error_details: Optional[Dict[str, Any]] = None

class SoapFault(BaseModel):
    """Model for SOAP fault details."""
    fault_code: str
    fault_string: str
    fault_actor: Optional[str] = None
    detail: Optional[Dict[str, Any]] = None

class SoapError(Exception):
    """Exception for SOAP errors."""
    def __init__(self, fault: SoapFault):
        self.fault = fault
        super().__init__(fault.fault_string)

class VehicleSearchType(str, Enum):
    """Types of vehicle searches."""
    VIN = "VIN"
    CHASSIS = "Chassis"
    REGISTRATION = "Registration"

class VehicleSearchRequest(BaseModel):
    """Request model for vehicle search operations."""
    search_type: VehicleSearchType
    identifier: str
    state: Optional[str] = None  # Required for registration searches

class VehicleSearchResponse(BaseModel):
    """Response model for vehicle search operations."""
    success: bool
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    error_details: Optional[Dict[str, Any]] = None
    search_results: Optional[Dict[str, Any]] = None
    written_off: Optional[bool] = None
    stolen: Optional[bool] = None

class PaymentIntentRequest(BaseModel):
    """Request model for creating a payment intent."""
    search_id: str
    search_type: VehicleSearchType
    state: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    """Response model for payment intent creation."""
    client_secret: Optional[str] = None
    payment_intent_id: Optional[str] = None
    amount: Optional[int] = None
    currency: Optional[str] = None
    error: Optional[str] = None

class PaymentConfirmationRequest(BaseModel):
    """Request model for confirming a payment."""
    payment_intent_id: str
    search_id: str

class PaymentConfirmationResponse(BaseModel):
    """Response model for payment confirmation."""
    confirmed: bool
    status: str
    search_id: str
    error: Optional[str] = None
