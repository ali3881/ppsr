<?php

namespace App\Models;

use DateTime;

class VehicleSearchResponse
{
    public bool $success;
    public string $message;
    public string $timestamp;
    public ?array $error_details;
    public ?array $search_results;
    public ?bool $written_off;
    public ?bool $stolen;
    
    public function __construct(
        bool $success, 
        string $message, 
        ?array $search_results = null,
        ?bool $written_off = null,
        ?bool $stolen = null,
        ?array $error_details = null
    ) {
        $this->success = $success;
        $this->message = $message;
        $this->timestamp = (new DateTime())->format('Y-m-d\TH:i:s\Z');
        $this->search_results = $search_results;
        $this->written_off = $written_off;
        $this->stolen = $stolen;
        $this->error_details = $error_details;
    }
    
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'timestamp' => $this->timestamp,
            'search_results' => $this->search_results,
            'written_off' => $this->written_off,
            'stolen' => $this->stolen,
            'error_details' => $this->error_details,
        ];
    }
}
