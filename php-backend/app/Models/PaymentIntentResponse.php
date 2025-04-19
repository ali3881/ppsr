<?php

namespace App\Models;

class PaymentIntentResponse
{
    public ?string $client_secret;
    public ?string $payment_intent_id;
    public ?int $amount;
    public ?string $currency;
    public ?string $error;
    
    public function __construct(
        ?string $client_secret = null,
        ?string $payment_intent_id = null,
        ?int $amount = null,
        ?string $currency = null,
        ?string $error = null
    ) {
        $this->client_secret = $client_secret;
        $this->payment_intent_id = $payment_intent_id;
        $this->amount = $amount;
        $this->currency = $currency;
        $this->error = $error;
    }
    
    public function toArray(): array
    {
        return [
            'client_secret' => $this->client_secret,
            'payment_intent_id' => $this->payment_intent_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'error' => $this->error,
        ];
    }
}
