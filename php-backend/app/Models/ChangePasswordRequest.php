<?php

namespace App\Models;

class ChangePasswordRequest
{
    public string $account_number;
    public string $username;
    public string $current_password;
    public string $new_password;
    
    public function __construct(
        string $account_number, 
        string $username, 
        string $current_password, 
        string $new_password
    ) {
        $this->account_number = $account_number;
        $this->username = $username;
        $this->current_password = $current_password;
        $this->new_password = $new_password;
    }
}
