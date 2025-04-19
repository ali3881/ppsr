<?php

namespace App\Utils;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StripeUtils
{
    private $payment_records = [];
    
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
    }
    
    public function createPaymentIntent($search_id, $metadata = null)
    {
        try {
            $meta_dict = [
                'search_id' => $search_id,
                'search_type' => 'Vehicle Search',
                'timestamp' => Carbon::now()->toIso8601String()
            ];
            
            if ($metadata) {
                $meta_dict['search_type'] = $metadata['search_type'] ?? 'Vehicle Search';
            }
            
            $intent = PaymentIntent::create([
                'amount' => (int)env('STRIPE_PDF_PRICE', 1000),
                'currency' => 'aud',
                'metadata' => $meta_dict
            ]);
            
            $this->payment_records[$search_id] = [
                'payment_intent_id' => $intent->id,
                'status' => 'created',
                'timestamp' => Carbon::now()->toIso8601String(),
                'metadata' => $metadata
            ];
            
            return [
                'client_secret' => $intent->client_secret,
                'payment_intent_id' => $intent->id,
                'amount' => (int)env('STRIPE_PDF_PRICE', 1000),
                'currency' => 'aud'
            ];
        } catch (\Exception $e) {
            Log::error('Stripe payment intent creation error: ' . $e->getMessage());
            return [
                'error' => $e->getMessage()
            ];
        }
    }
    
    public function confirmPayment($payment_intent_id, $search_id)
    {
        try {
            $intent = PaymentIntent::retrieve($payment_intent_id);
            
            if (array_key_exists($search_id, $this->payment_records)) {
                $this->payment_records[$search_id]['status'] = $intent->status;
            }
            
            return [
                'confirmed' => $intent->status === 'succeeded',
                'status' => $intent->status,
                'search_id' => $search_id
            ];
        } catch (\Exception $e) {
            Log::error('Stripe payment confirmation error: ' . $e->getMessage());
            return [
                'error' => $e->getMessage()
            ];
        }
    }
    
    public function verifyPayment($search_id)
    {
        if (!array_key_exists($search_id, $this->payment_records)) {
            return false;
        }
        
        $record = $this->payment_records[$search_id];
        
        if ($record['status'] !== 'succeeded') {
            try {
                $intent = PaymentIntent::retrieve($record['payment_intent_id']);
                $record['status'] = $intent->status;
                return $intent->status === 'succeeded';
            } catch (\Exception $e) {
                return false;
            }
        }
        
        return true;
    }
}
