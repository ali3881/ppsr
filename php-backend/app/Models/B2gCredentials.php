<?php

namespace App\Models;

class B2gCredentials
{
    public string $account_number;
    public string $username;
    public string $password;
    
    public function __construct(string $account_number, string $username, string $password)
    {
        $this->account_number = $account_number;
        $this->username = $username;
        $this->password = $password;
    }
}
