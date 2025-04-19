"""
Configuration settings for the PPSR B2G SOAP client.
"""
from pydantic import BaseModel
from typing import Dict, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class SoapConfig(BaseModel):
    """Configuration for SOAP client."""
    base_url: str = os.getenv("PPSR_BASE_URL", "https://ppsr-b2g.gov.au/discovery")
    
    wsdl_urls: Dict[str, str] = {
        "register_operations": os.getenv(
            "PPSR_REGISTER_OPERATIONS_WSDL", 
            f"{base_url}/RegisterOperationsService.svc?wsdl"
        ),
        "search_operations": os.getenv(
            "PPSR_SEARCH_OPERATIONS_WSDL", 
            f"{base_url}/SearchOperationsService.svc?wsdl"
        ),
        "notification_operations": os.getenv(
            "PPSR_NOTIFICATION_OPERATIONS_WSDL", 
            f"{base_url}/NotificationOperationsService.svc?wsdl"
        ),
    }
    
    account_number: str = os.getenv("PPSR_ACCOUNT_NUMBER", "130040219")
    username: str = os.getenv("PPSR_USERNAME", "pps959")
    password: str = os.getenv("PPSR_PASSWORD", "7V9RDKXHMWCR")
    
    tls_version: str = "TLSv1.2"
    cipher_suites: str = "AES128-SHA256:ECDHE-RSA-AES128-GCM-SHA256"
    
    timeout: int = 30  # seconds
    
    namespaces: Dict[str, str] = {
        "soap": "http://schemas.xmlsoap.org/soap/envelope/",
        "ppsr": "http://schemas.ppsr.gov.au/2011/04/data",
        "wsse": "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd",
        "wsu": "http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd",
    }

soap_config = SoapConfig()
