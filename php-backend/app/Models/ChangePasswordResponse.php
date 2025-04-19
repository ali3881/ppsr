<?php

namespace App\Models;

use DateTime;

class ChangePasswordResponse
{
    public bool $success;
    public string $message;
    public string $timestamp;
    public ?array $error_details;
    
    public function __construct(
        bool $success, 
        string $message, 
        ?array $error_details = null
    ) {
        $this->success = $success;
        $this->message = $message;
        $this->timestamp = (new DateTime())->format('Y-m-d\TH:i:s\Z');
        $this->error_details = $error_details;
    }
    
    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'timestamp' => $this->timestamp,
            'error_details' => $this->error_details,
        ];
    }
}
