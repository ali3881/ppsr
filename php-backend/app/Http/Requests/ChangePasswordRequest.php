<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }
    
    public function rules()
    {
        return [
            'account_number' => 'required|string',
            'username' => 'required|string',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ];
    }
}
