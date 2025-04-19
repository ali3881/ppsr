<?php

namespace App\Models;

class PaymentIntentRequest
{
    public string $search_id;
    public string $search_type;
    public ?string $state;
    
    public function __construct(
        string $search_id, 
        string $search_type, 
        ?string $state = null
    ) {
        $this->search_id = $search_id;
        $this->search_type = $search_type;
        $this->state = $state;
    }
}
