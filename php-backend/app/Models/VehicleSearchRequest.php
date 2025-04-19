<?php

namespace App\Models;

class VehicleSearchRequest
{
    public string $search_type;
    public string $identifier;
    public ?string $state;
    
    public function __construct(
        string $search_type, 
        string $identifier, 
        ?string $state = null
    ) {
        $this->search_type = $search_type;
        $this->identifier = $identifier;
        $this->state = $state;
    }
}
