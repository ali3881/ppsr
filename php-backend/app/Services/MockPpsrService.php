<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MockPpsrService
{
    private $credentials = [];
    private $password_changes = [];
    private $test_data = [];
    
    public function __construct()
    {
        $this->credentials = [
            "130040219_pps959" => "7V9RDKXHMWCR"
        ];
        
        $this->initializeTestData();
    }
    
    private function initializeTestData()
    {
        $this->test_data['vin'] = [
            'WBAAL31090FW12345' => [
                'make' => 'BMW',
                'model' => '318i',
                'year' => '2010',
                'color' => 'Black',
                'engine_number' => 'A12345',
                'registration' => 'ABC123',
                'state' => 'NSW',
                'written_off' => false,
                'stolen' => false,
                'encumbered' => true,
                'encumbrance_details' => [
                    [
                        'registration_number' => '202001010001',
                        'registration_date' => '2020-01-01',
                        'secured_party' => 'EXAMPLE BANK LTD',
                        'address' => '123 EXAMPLE ST, SYDNEY NSW 2000'
                    ]
                ]
            ],
            'JN1TANT31U0123456' => [
                'make' => 'Nissan',
                'model' => 'X-Trail',
                'year' => '2018',
                'color' => 'Silver',
                'engine_number' => 'B54321',
                'registration' => 'XYZ789',
                'state' => 'VIC',
                'written_off' => true,
                'stolen' => false,
                'encumbered' => false,
                'encumbrance_details' => []
            ],
            'WAUZZZ8K9DA123456' => [
                'make' => 'Audi',
                'model' => 'A4',
                'year' => '2013',
                'color' => 'White',
                'engine_number' => 'C98765',
                'registration' => 'DEF456',
                'state' => 'QLD',
                'written_off' => false,
                'stolen' => true,
                'encumbered' => true,
                'encumbrance_details' => [
                    [
                        'registration_number' => '201905150002',
                        'registration_date' => '2019-05-15',
                        'secured_party' => 'EXAMPLE FINANCE PTY LTD',
                        'address' => '456 EXAMPLE AVE, BRISBANE QLD 4000'
                    ]
                ]
            ]
        ];
        
        $this->test_data['registration'] = [
            'NSW_ABC123' => $this->test_data['vin']['WBAAL31090FW12345'],
            'VIC_XYZ789' => $this->test_data['vin']['JN1TANT31U0123456'],
            'QLD_DEF456' => $this->test_data['vin']['WAUZZZ8K9DA123456']
        ];
        
        $this->test_data['chassis'] = $this->test_data['vin'];
    }
    
    public function changeB2gPassword(string $account_number, string $username, 
                                    string $current_password, string $new_password)
    {
        $credential_key = "{$account_number}_{$username}";
        
        if (!array_key_exists($credential_key, $this->credentials)) {
            return [
                'success' => false,
                'message' => 'Invalid account number or username',
                'timestamp' => Carbon::now()->toIso8601String(),
                'error_details' => ['fault_code' => 'Client.InvalidCredentials']
            ];
        }
        
        if ($this->credentials[$credential_key] !== $current_password) {
            return [
                'success' => false,
                'message' => 'Invalid password',
                'timestamp' => Carbon::now()->toIso8601String(),
                'error_details' => ['fault_code' => 'Client.InvalidPassword']
            ];
        }
        
        if (strlen($new_password) < 8) {
            return [
                'success' => false,
                'message' => 'New password does not meet requirements',
                'timestamp' => Carbon::now()->toIso8601String(),
                'error_details' => ['fault_code' => 'Client.InvalidNewPassword']
            ];
        }
        
        $this->credentials[$credential_key] = $new_password;
        $this->password_changes[$credential_key] = Carbon::now();
        
        return [
            'success' => true,
            'message' => 'Password changed successfully',
            'timestamp' => Carbon::now()->toIso8601String()
        ];
    }
    
    public function searchVehicle(string $search_type, string $identifier, ?string $state = null)
    {
        $search_type_lower = strtolower($search_type);
        
        if (!in_array($search_type_lower, ['vin', 'chassis', 'registration'])) {
            return [
                'success' => false,
                'message' => 'Invalid search type',
                'timestamp' => Carbon::now()->toIso8601String(),
                'error_details' => ['fault_code' => 'Client.InvalidSearchType']
            ];
        }
        
        if ($search_type_lower === 'registration' && !$state) {
            return [
                'success' => false,
                'message' => 'State is required for registration searches',
                'timestamp' => Carbon::now()->toIso8601String(),
                'error_details' => ['fault_code' => 'Client.MissingState']
            ];
        }
        
        $search_key = $identifier;
        if ($search_type_lower === 'registration') {
            $search_key = "{$state}_{$identifier}";
        }
        
        if (!array_key_exists($search_key, $this->test_data[$search_type_lower])) {
            return [
                'success' => false,
                'message' => 'No records found',
                'timestamp' => Carbon::now()->toIso8601String(),
                'error_details' => ['fault_code' => 'Client.NoRecordsFound']
            ];
        }
        
        $vehicle_data = $this->test_data[$search_type_lower][$search_key];
        
        return [
            'success' => true,
            'message' => 'Vehicle search completed successfully',
            'timestamp' => Carbon::now()->toIso8601String(),
            'search_results' => $vehicle_data,
            'written_off' => $vehicle_data['written_off'],
            'stolen' => $vehicle_data['stolen']
        ];
    }
}
