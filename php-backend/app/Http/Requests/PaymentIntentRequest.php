<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentIntentRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }
    
    public function rules()
    {
        $rules = [
            'search_id' => 'required|string',
            'search_type' => 'required|string|in:VIN,Chassis,Registration',
        ];
        
        if ($this->input('search_type') === 'Registration') {
            $rules['state'] = 'required|string';
        }
        
        return $rules;
    }
}
