"""
Stripe utility functions for payment processing.
"""
import os
import stripe
from typing import Dict, Any, Optional
from datetime import datetime

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PDF_PRICE = int(os.getenv("STRIPE_PDF_PRICE", "1000"))  # Default to $10.00 (1000 cents)

payment_records = {}

def create_payment_intent(search_id: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create a payment intent for a PDF download.
    
    Args:
        search_id: Unique identifier for the search (e.g., VIN number)
        metadata: Additional information about the payment
        
    Returns:
        Dictionary containing payment intent details
    """
    try:
        meta_dict = {
            "search_id": search_id,
            "search_type": "Vehicle Search",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if metadata:
            meta_dict["search_type"] = metadata.get("search_type", "Vehicle Search")
            
        intent = stripe.PaymentIntent.create(
            amount=PDF_PRICE,
            currency="aud",
            metadata=meta_dict
        )
        
        payment_records[search_id] = {
            "payment_intent_id": intent.id,
            "status": "created",
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata
        }
        
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": PDF_PRICE,
            "currency": "aud"
        }
    except Exception as e:
        return {
            "error": str(e)
        }

def confirm_payment(payment_intent_id: str, search_id: str) -> Dict[str, Any]:
    """
    Confirm a payment for a PDF download.
    
    Args:
        payment_intent_id: Stripe payment intent ID
        search_id: Unique identifier for the search
        
    Returns:
        Dictionary containing confirmation details
    """
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if search_id in payment_records:
            payment_records[search_id]["status"] = intent.status
        
        return {
            "confirmed": intent.status == "succeeded",
            "status": intent.status,
            "search_id": search_id
        }
    except Exception as e:
        return {
            "error": str(e)
        }

def verify_payment(search_id: str) -> bool:
    """
    Verify if a payment has been made for a search.
    
    Args:
        search_id: Unique identifier for the search
        
    Returns:
        True if payment is confirmed, False otherwise
    """
    if search_id not in payment_records:
        return False
    
    record = payment_records[search_id]
    
    if record.get("status") != "succeeded":
        try:
            intent = stripe.PaymentIntent.retrieve(record.get("payment_intent_id"))
            record["status"] = intent.status
            return intent.status == "succeeded"
        except:
            return False
    
    return True
