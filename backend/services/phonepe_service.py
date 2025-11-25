"""
PhonePe Payment Gateway Service
Handles payment creation, verification, and refunds using PhonePe SDK
"""
from uuid import uuid4
from phonepe.sdk.pg.payments.v2.standard_checkout_client import StandardCheckoutClient
from phonepe.sdk.pg.payments.v2.models.request.standard_checkout_pay_request import StandardCheckoutPayRequest
from phonepe.sdk.pg.common.models.request.meta_info import MetaInfo
from phonepe.sdk.pg.env import Env
import os
from dotenv import load_dotenv

load_dotenv()

# PhonePe credentials
PHONEPE_CLIENT_ID = os.getenv("PHONEPE_CLIENT_ID", "M23P7LTLASNZZ_2511241620")
PHONEPE_CLIENT_SECRET = os.getenv("PHONEPE_CLIENT_SECRET", "MDVmZjgwNTgtZDYwZS00ZTY5LWE2NjItZjZlYWMzNzQ3Nzdl")
PHONEPE_CLIENT_VERSION = int(os.getenv("PHONEPE_CLIENT_VERSION", "1"))
PHONEPE_ENV = os.getenv("PHONEPE_ENV", "SANDBOX")  # SANDBOX or PRODUCTION

# Initialize PhonePe client
def get_phonepe_client():
    """Get or create PhonePe client instance"""
    env = Env.SANDBOX if PHONEPE_ENV == "SANDBOX" else Env.PRODUCTION
    
    client = StandardCheckoutClient.get_instance(
        client_id=PHONEPE_CLIENT_ID,
        client_secret=PHONEPE_CLIENT_SECRET,
        client_version=PHONEPE_CLIENT_VERSION,
        env=env,
        should_publish_events=False
    )
    
    return client


def create_payment_order(amount: float, redirect_url: str, merchant_order_id: str = None, metadata: dict = None):
    """
    Create a PhonePe payment order
    
    Args:
        amount: Amount in rupees (will be converted to paisa)
        redirect_url: URL to redirect after payment
        merchant_order_id: Optional custom order ID
        metadata: Optional metadata (udf1-5)
    
    Returns:
        dict with payment_url, order_id, and other details
    """
    try:
        client = get_phonepe_client()
        
        # Generate unique order ID if not provided
        if not merchant_order_id:
            merchant_order_id = f"ORDER_{uuid4().hex[:16].upper()}"
        
        # Convert amount to paisa (PhonePe requires amount in paisa)
        amount_in_paisa = int(amount * 100)
        
        # Create meta info if metadata provided
        meta_info = None
        if metadata:
            meta_info = MetaInfo(
                udf1=metadata.get("udf1", ""),
                udf2=metadata.get("udf2", ""),
                udf3=metadata.get("udf3", ""),
                udf4=metadata.get("udf4", ""),
                udf5=metadata.get("udf5", "")
            )
        
        # Build payment request
        pay_request = StandardCheckoutPayRequest.build_request(
            merchant_order_id=merchant_order_id,
            amount=amount_in_paisa,
            redirect_url=redirect_url,
            meta_info=meta_info
        )
        
        # Initiate payment
        pay_response = client.pay(pay_request)
        
        return {
            "success": True,
            "payment_url": pay_response.redirect_url,
            "order_id": pay_response.order_id,
            "merchant_order_id": merchant_order_id,
            "state": pay_response.state,
            "expire_at": pay_response.expire_at
        }
        
    except Exception as e:
        print(f"PhonePe payment creation error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


def check_payment_status(merchant_order_id: str):
    """
    Check payment status for an order
    
    Args:
        merchant_order_id: The merchant order ID
    
    Returns:
        dict with payment status details
    """
    try:
        client = get_phonepe_client()
        
        # Check order status - use the correct method name
        status_response = client.get_order_status(merchant_order_id)
        
        # Log all attributes of the response
        print(f"PhonePe status_response type: {type(status_response)}")
        print(f"PhonePe status_response dict: {status_response.__dict__ if hasattr(status_response, '__dict__') else 'N/A'}")
        
        # Extract state from response
        state = None
        transaction_id = None
        payment_mode = None
        
        if hasattr(status_response, 'state'):
            state = status_response.state
            print(f"Order state: {state}")
        
        # Check if there are payment details (for transaction info)
        if hasattr(status_response, 'payment_details') and status_response.payment_details:
            latest_payment = status_response.payment_details[-1] if isinstance(status_response.payment_details, list) else status_response.payment_details
            if hasattr(latest_payment, 'transaction_id'):
                transaction_id = latest_payment.transaction_id
            if hasattr(latest_payment, 'payment_mode'):
                payment_mode = latest_payment.payment_mode
            print(f"Latest payment details - transaction_id: {transaction_id}, payment_mode: {payment_mode}")
        
        return {
            "success": True,
            "state": state,
            "payment_method": payment_mode,
            "transaction_id": transaction_id,
            "amount": status_response.amount if hasattr(status_response, 'amount') else None,
            "response": status_response
        }
        
    except Exception as e:
        print(f"PhonePe status check error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


def initiate_refund(merchant_order_id: str, refund_amount: float, merchant_refund_id: str = None):
    """
    Initiate a refund for a payment
    
    Args:
        merchant_order_id: Original order ID
        refund_amount: Amount to refund in rupees
        merchant_refund_id: Optional custom refund ID
    
    Returns:
        dict with refund details
    """
    try:
        client = get_phonepe_client()
        
        # Generate unique refund ID if not provided
        if not merchant_refund_id:
            merchant_refund_id = f"REFUND_{uuid4().hex[:16].upper()}"
        
        # Convert amount to paisa
        refund_amount_in_paisa = int(refund_amount * 100)
        
        # Initiate refund
        refund_response = client.refund(
            merchant_order_id=merchant_order_id,
            merchant_refund_id=merchant_refund_id,
            amount=refund_amount_in_paisa
        )
        
        return {
            "success": True,
            "refund_id": merchant_refund_id,
            "state": refund_response.state if hasattr(refund_response, 'state') else None,
            "response": refund_response
        }
        
    except Exception as e:
        print(f"PhonePe refund error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
