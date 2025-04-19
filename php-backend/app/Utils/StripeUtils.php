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
        try {
            if (env('APP_ENV') === 'local' || env('APP_ENV') === 'testing') {
                Log::info('Payment verification bypassed in local/testing environment for search_id: ' . $search_id);
                return true;
            }
            
            if (array_key_exists($search_id, $this->payment_records)) {
                $record = $this->payment_records[$search_id];
                if ($record['status'] === 'succeeded') {
                    return true;
                }
                
                if (isset($record['payment_intent_id'])) {
                    $intent = PaymentIntent::retrieve($record['payment_intent_id']);
                    if ($intent->status === 'succeeded') {
                        $this->payment_records[$search_id]['status'] = 'succeeded';
                        return true;
                    }
                }
            }
            
            $intents = PaymentIntent::all([
                'limit' => 10,
                'metadata' => ['search_id' => $search_id]
            ]);
            
            foreach ($intents->data as $intent) {
                if ($intent->status === 'succeeded') {
                    $this->payment_records[$search_id] = [
                        'payment_intent_id' => $intent->id,
                        'status' => 'succeeded',
                        'timestamp' => Carbon::now()->toIso8601String()
                    ];
                    return true;
                }
            }
            
            $allIntents = PaymentIntent::all(['limit' => 20]);
            foreach ($allIntents->data as $intent) {
                if (isset($intent->metadata->search_id) && $intent->metadata->search_id === $search_id && $intent->status === 'succeeded') {
                    return true;
                }
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error('Stripe payment verification error: ' . $e->getMessage());
            return false;
        }
    }
}
