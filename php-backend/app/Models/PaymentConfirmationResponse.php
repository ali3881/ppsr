<?php

namespace App\Models;

class PaymentConfirmationResponse
{
    public bool $confirmed;
    public string $status;
    public string $search_id;
    public ?string $error;
    
    public function __construct(
        bool $confirmed, 
        string $status, 
        string $search_id, 
        ?string $error = null
    ) {
        $this->confirmed = $confirmed;
        $this->status = $status;
        $this->search_id = $search_id;
        $this->error = $error;
    }
    
    public function toArray(): array
    {
        return [
            'confirmed' => $this->confirmed,
            'status' => $this->status,
            'search_id' => $this->search_id,
            'error' => $this->error,
        ];
    }
}
