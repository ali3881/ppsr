import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  searchId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const PaymentFormContent: React.FC<PaymentFormProps> = ({ 
  clientSecret, 
  paymentIntentId,
  amount,
  searchId,
  onPaymentSuccess,
  onCancel
}) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setProcessing(false);
      setError('Card element not found');
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      setError(error.message || 'An error occurred while processing your payment');
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      setSucceeded(true);
      setProcessing(false);
      onPaymentSuccess();
    } else {
      setError(`Payment status: ${paymentIntent.status}. Please try again.`);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800">Payment Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-3 border rounded-md">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing || succeeded}
        >
          {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

interface PaymentModalProps {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  searchId: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment for PDF Report</CardTitle>
          <CardDescription>
            Complete payment to download the PDF report for {props.searchId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentFormContent {...props} />
        </CardContent>
      </Card>
    </Elements>
  );
};
