"""
Mock SOAP service for testing the PPSR B2G client.
"""
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from .models import ChangePasswordResponse

logger = logging.getLogger(__name__)

class MockPPSRService:
    """Mock PPSR B2G service for testing."""
    
    def __init__(self):
        """Initialize the mock service."""
        self.credentials = {
            "130040219_pps959": "7V9RDKXHMWCR"
        }
        self.password_changes = {}
    
    def change_b2g_password(self, account_number: str, username: str, 
                           current_password: str, new_password: str) -> ChangePasswordResponse:
        """
        Mock implementation of the ChangeB2GPassword operation.
        
        Args:
            account_number: B2G account number
            username: B2G username
            current_password: Current B2G password
            new_password: New B2G password
            
        Returns:
            ChangePasswordResponse: Result of the password change operation
        """
        credential_key = f"{account_number}_{username}"
        
        if credential_key not in self.credentials:
            return ChangePasswordResponse(
                success=False,
                message=f"Invalid account number or username",
                error_details={"fault_code": "Client.InvalidCredentials"}
            )
        
        if self.credentials[credential_key] != current_password:
            return ChangePasswordResponse(
                success=False,
                message=f"Invalid password",
                error_details={"fault_code": "Client.InvalidPassword"}
            )
        
        if len(new_password) < 8:
            return ChangePasswordResponse(
                success=False,
                message=f"New password does not meet requirements",
                error_details={"fault_code": "Client.InvalidNewPassword"}
            )
        
        self.credentials[credential_key] = new_password
        self.password_changes[credential_key] = datetime.utcnow()
        
        return ChangePasswordResponse(
            success=True,
            message="Password changed successfully",
            timestamp=datetime.utcnow()
        )

mock_ppsr_service = MockPPSRService()
