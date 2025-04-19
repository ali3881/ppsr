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

from .config import soap_config
from .models import (
    B2GCredentials, 
    ChangePasswordRequest, 
    ChangePasswordResponse,
    SoapFault,
    SoapError
)

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
        
        self._configure_tls()
        
    def _configure_tls(self):
        """Configure TLS settings for secure communication."""
        self.session = Session()
        
        self.session.verify = True
        
        adapter = requests.adapters.HTTPAdapter()
        self.session.mount('https://', adapter)
        
        self.transport = Transport(
            session=self.session,
            operation_timeout=self.config.timeout
        )
    
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
        
        wsse = UsernameToken(
            username=creds.username,
            password=creds.password,
            use_digest=True  # Use digest for enhanced security
        )
        
        client = zeep.Client(
            wsdl=wsdl_url,
            transport=self.session,
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

ppsr_client = PPSRSoapClient()
