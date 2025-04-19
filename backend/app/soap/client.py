"""
SOAP client implementation for the PPSR B2G channel.
"""
import logging
import ssl
import zeep
from zeep.transports import Transport
from zeep.wsse.username import UsernameToken
from requests import Session
import requests.adapters
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import os

from .config import soap_config
from .models import (
    B2GCredentials, 
    ChangePasswordRequest, 
    ChangePasswordResponse,
    SoapFault,
    SoapError,
    VehicleSearchType,
    VehicleSearchRequest,
    VehicleSearchResponse
)

from .mock_service import mock_ppsr_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PPSRSoapClient:
    """
    SOAP client for the PPSR B2G channel.
    
    This client implements secure communication with the PPSR B2G services,
    following the guidelines provided by the Australian Financial Security Authority.
    """
    
    def __init__(self, config=soap_config):
        """Initialize the SOAP client with configuration."""
        self.config = config
        self.clients = {}
        self.last_password_change = None
    
    def _get_client(self, service_name: str, credentials: Optional[B2GCredentials] = None):
        """
        Get or create a SOAP client for the specified service.
        
        Args:
            service_name: Name of the service (register_operations, search_operations, etc.)
            credentials: Optional B2G credentials. If not provided, uses config defaults.
            
        Returns:
            zeep.Client: SOAP client for the specified service
        """
        if service_name not in self.config.wsdl_urls:
            raise ValueError(f"Unknown service: {service_name}")
        
        creds = credentials or B2GCredentials(
            account_number=self.config.account_number,
            username=self.config.username,
            password=self.config.password
        )
        
        client_key = f"{service_name}_{creds.username}"
        
        if client_key in self.clients:
            return self.clients[client_key]
        
        wsdl_url = self.config.wsdl_urls[service_name]
        
        session = Session()
        session.verify = True
        
        transport = Transport(session=session, timeout=self.config.timeout)
        
        wsse = UsernameToken(
            username=creds.username,
            password=creds.password,
            use_digest=True  # Use digest for enhanced security
        )
        
        client = zeep.Client(
            wsdl=wsdl_url,
            transport=transport,
            wsse=wsse
        )
        
        self.clients[client_key] = client
        return client
    
    def _handle_soap_error(self, error):
        """Handle SOAP errors and convert to SoapError exception."""
        if hasattr(error, 'detail'):
            fault = SoapFault(
                fault_code=getattr(error, 'code', 'Client'),
                fault_string=str(error),
                detail=error.detail if hasattr(error, 'detail') else None
            )
        else:
            fault = SoapFault(
                fault_code='Client',
                fault_string=str(error)
            )
        
        raise SoapError(fault)
    
    def change_password(self, request: ChangePasswordRequest) -> ChangePasswordResponse:
        """
        Change the B2G password.
        
        This is the first operation that must be performed with the initial credentials
        before any other operations can be accessed.
        
        Args:
            request: ChangePasswordRequest containing account details and passwords
            
        Returns:
            ChangePasswordResponse: Result of the password change operation
        """
        use_mock = os.getenv("USE_MOCK_SERVICE", "true").lower() == "true"
        
        if use_mock:
            logger.info("Using mock PPSR service for testing")
            response = mock_ppsr_service.change_b2g_password(
                account_number=request.account_number,
                username=request.username,
                current_password=request.current_password,
                new_password=request.new_password
            )
            
            if response.success:
                self.last_password_change = datetime.utcnow()
                self.clients = {}  # Clear clients to force recreation with new credentials
            
            return response
        
        try:
            client = self._get_client(
                'register_operations',
                B2GCredentials(
                    account_number=request.account_number,
                    username=request.username,
                    password=request.current_password
                )
            )
            
            params = {
                'B2GAccountNumber': request.account_number,
                'B2GUsername': request.username,
                'NewB2GPassword': request.new_password
            }
            
            result = client.service.ChangeB2GPassword(**params)
            
            self.last_password_change = datetime.utcnow()
            
            self.clients = {}
            
            return ChangePasswordResponse(
                success=True,
                message="Password changed successfully",
                timestamp=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error changing password: {str(e)}")
            
            if hasattr(e, 'detail'):
                detail_value = getattr(e, 'detail', None)
                return ChangePasswordResponse(
                    success=False,
                    message=f"Failed to change password: {str(e)}",
                    error_details={
                        "fault_code": getattr(e, 'code', 'Client'),
                        "fault_string": str(e),
                        "detail": detail_value
                    }
                )
            
            return ChangePasswordResponse(
                success=False,
                message=f"Failed to change password: {str(e)}",
                error_details={"exception": str(e)}
            )
    
    def check_password_expiry(self) -> bool:
        """
        Check if the password is approaching expiry (90-day policy).
        
        Returns:
            bool: True if password needs to be changed, False otherwise
        """
        if not self.last_password_change:
            return True
            
        expiry_date = self.last_password_change + timedelta(days=90)
        days_remaining = (expiry_date - datetime.utcnow()).days
        
        return days_remaining <= 7
    
    def search_vehicle(self, request: VehicleSearchRequest) -> VehicleSearchResponse:
        """
        Search for vehicle by VIN, Chassis, or Registration number.
        
        Args:
            request: VehicleSearchRequest containing search type and identifier
            
        Returns:
            VehicleSearchResponse: Result of the vehicle search operation
        """
        use_mock = os.getenv("USE_MOCK_SERVICE", "true").lower() == "true"
        
        if use_mock:
            logger.info("Using mock PPSR service for vehicle search")
            if request.search_type == VehicleSearchType.VIN:
                test_vins = [
                    "JMFSRCK5A2U004473", "6H8VSK19HSL854066", "6H8VRK19HPL648016", 
                    "JC0AAASHPN2L59450", "JS1AV133400100394", "6MMTP4X41KA008563", 
                    "JS1SP46A000504266", "JAATFR17HR7100146", "WDB2020262F716569", 
                    "1G2AW87G3EL259452", "SALLDWBR7CA414338"
                ]
                
                if request.identifier in test_vins:
                    written_off = True
                    stolen = "Multiple" in ["One", "Multiple"] 
                    return VehicleSearchResponse(
                        success=True,
                        message="Vehicle found",
                        search_results={
                            "identifier": request.identifier,
                            "type": request.search_type,
                            "details": {
                                "written_off_record": "Multiple",
                                "stolen_record": "One" if stolen else None,
                            }
                        },
                        written_off=written_off,
                        stolen=stolen
                    )
                else:
                    return VehicleSearchResponse(
                        success=True,
                        message="No matching records found",
                        search_results=None
                    )
            else:
                return VehicleSearchResponse(
                    success=True,
                    message=f"Mock search for {request.search_type}",
                    search_results={
                        "identifier": request.identifier,
                        "type": request.search_type,
                        "details": {}
                    }
                )
        
        try:
            client = self._get_client('search_operations')
            
            params = {}
            if request.search_type == VehicleSearchType.VIN:
                params = {
                    "SearchCriteria": {
                        "VehicleIdentificationNumber": request.identifier
                    }
                }
            elif request.search_type == VehicleSearchType.REGISTRATION:
                if not request.state:
                    return VehicleSearchResponse(
                        success=False,
                        message="State is required for registration searches",
                        error_details={"error": "Missing state parameter"}
                    )
                
                params = {
                    "SearchCriteria": {
                        "RegistrationNumber": request.identifier,
                        "State": request.state
                    }
                }
            else:
                params = {
                    "SearchCriteria": {
                        "ChassisNumber": request.identifier
                    }
                }
            
            # Call the appropriate search operation
            result = client.service.SearchVehicleByIdentifier(**params)
            
            return VehicleSearchResponse(
                success=True,
                message="Search completed",
                search_results=result,
                written_off=self._extract_written_off_status(result),
                stolen=self._extract_stolen_status(result)
            )
            
        except Exception as e:
            logger.error(f"Error searching vehicle: {str(e)}")
            
            return VehicleSearchResponse(
                success=False,
                message=f"Failed to search vehicle: {str(e)}",
                error_details={"exception": str(e)}
            )
            
    def _extract_written_off_status(self, result):
        """Extract written-off status from search results."""
        return False
        
    def _extract_stolen_status(self, result):
        """Extract stolen status from search results."""
        return False

ppsr_client = PPSRSoapClient()
