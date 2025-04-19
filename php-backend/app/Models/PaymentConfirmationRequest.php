<?php

namespace App\Models;

class PaymentConfirmationRequest
{
    public string $payment_intent_id;
    public string $search_id;
    
    public function __construct(
        string $payment_intent_id, 
        string $search_id
    ) {
        $this->payment_intent_id = $payment_intent_id;
        $this->search_id = $search_id;
    }
}
