import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51RELMnFjuaRQIb2ZvNSjHjmT1WiRudPCjsXzonPNbETjW8fCu4Ge3nwajCBdMp4AG1cJHaS4be6Kt7LTpFsR4eWh00OujzBQNC');

interface PaymentFormProps {
  searchId: string;
  searchType: string;
  state?: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const PaymentFormWrapper: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  searchId, 
  searchType, 
  state, 
  onPaymentSuccess, 
  onCancel 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/ppsr/payment/intent`,
          { 
            search_id: searchId,
            search_type: searchType,
            state: state
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa('user:59ae75b8695daab37e4a75543176b593')
            },
            withCredentials: true
          }
        );
        
        setClientSecret(response.data.client_secret);
        setPaymentIntentId(response.data.payment_intent_id);
        setAmount(response.data.amount);
      } catch (err: any) {
        setError('Failed to initialize payment: ' + (err.message || 'Unknown error'));
      }
    };

    createPaymentIntent();
  }, [searchId, searchType, state]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'PPSR User',
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/ppsr/payment/confirm`,
          { 
            payment_intent_id: paymentIntentId,
            search_id: searchId
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ' + btoa('user:59ae75b8695daab37e4a75543176b593')
            },
            withCredentials: true
          }
        );
        
        setSucceeded(true);
        setProcessing(false);
        
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      } catch (err: any) {
        setError('Payment confirmed with Stripe but failed to confirm with our server: ' + (err.message || 'Unknown error'));
        setProcessing(false);
      }
    } else {
      setError('Payment failed with an unknown error');
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Payment Required
        </CardTitle>
        <CardDescription>
          Complete payment to download the PDF report
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">Payment Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {succeeded ? (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Payment Successful</AlertTitle>
            <AlertDescription className="text-green-700">
              Your payment has been processed successfully. Your PDF report will download shortly.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Amount: ${(amount / 100).toFixed(2)} AUD</p>
              <div className="p-3 border rounded-md">
                <CardElement options={cardElementOptions} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Test card: 4242 4242 4242 4242 | Any future date | Any 3 digits
              </p>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={processing || succeeded}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          onClick={handleSubmit}
          disabled={!stripe || processing || succeeded}
        >
          {processing ? 'Processing...' : 'Pay Now'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentFormWrapper;
