<?php

namespace App\Services;

use SoapClient;
use SoapHeader;
use App\Models\B2gCredentials;
use App\Config\SoapConfig;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PpsrSoapClient
{
    private $config;
    private $clients = [];
    private $last_password_change = null;
    
    public function __construct(SoapConfig $config = null)
    {
        $this->config = $config ?? new SoapConfig();
    }
    
    private function getClient(string $service_name, B2gCredentials $credentials = null)
    {
        if (!array_key_exists($service_name, $this->config->wsdl_urls)) {
            throw new \InvalidArgumentException("Unknown service: {$service_name}");
        }
        
        $creds = $credentials ?? new B2gCredentials(
            $this->config->account_number,
            $this->config->username,
            $this->config->password
        );
        
        $client_key = "{$service_name}_{$creds->username}";
        
        if (array_key_exists($client_key, $this->clients)) {
            return $this->clients[$client_key];
        }
        
        $wsdl_url = $this->config->wsdl_urls[$service_name];
        
        $options = [
            'trace' => true,
            'exceptions' => true,
            'connection_timeout' => $this->config->timeout,
            'cache_wsdl' => WSDL_CACHE_NONE,
            'stream_context' => stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'crypto_method' => STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT
                ]
            ])
        ];
        
        $client = new SoapClient($wsdl_url, $options);
        
        $wsseNS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
        $wsuNS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
        
        $username_token = new \stdClass();
        $username_token->Username = new \SoapVar($creds->username, XSD_STRING, null, $wsseNS, null, $wsseNS);
        $username_token->Password = new \SoapVar($creds->password, XSD_STRING, 'PasswordDigest', $wsseNS, null, $wsseNS);
        
        $security = new \stdClass();
        $security->UsernameToken = new \SoapVar($username_token, SOAP_ENC_OBJECT, null, $wsseNS, 'UsernameToken', $wsseNS);
        
        $header = new \SoapHeader($wsseNS, 'Security', $security, true);
        $client->__setSoapHeaders($header);
        
        $this->clients[$client_key] = $client;
        return $client;
    }
    
    public function changePassword($request)
    {
        if (env('USE_MOCK_SERVICE', true)) {
            Log::info("Using mock PPSR service for testing");
            $mock_service = new MockPpsrService();
            $response = $mock_service->changeB2gPassword(
                $request->account_number,
                $request->username, 
                $request->current_password,
                $request->new_password
            );
            
            if ($response['success']) {
                $this->last_password_change = Carbon::now();
                $this->clients = []; // Clear clients to force recreation with new credentials
            }
            
            return $response;
        }
        
        try {
            $client = $this->getClient(
                'register_operations',
                new B2gCredentials(
                    $request->account_number,
                    $request->username,
                    $request->current_password
                )
            );
            
            $params = [
                'B2GAccountNumber' => $request->account_number,
                'B2GUsername' => $request->username,
                'NewB2GPassword' => $request->new_password
            ];
            
            $result = $client->ChangeB2GPassword($params);
            
            $this->last_password_change = Carbon::now();
            $this->clients = [];
            
            return [
                'success' => true,
                'message' => 'Password changed successfully',
                'timestamp' => Carbon::now()->toIso8601String()
            ];
        } catch (\Exception $e) {
            Log::error("Error changing password: " . $e->getMessage());
            
            return [
                'success' => false,
                'message' => "Failed to change password: " . $e->getMessage(),
                'error_details' => ['exception' => $e->getMessage()]
            ];
        }
    }
    
    public function checkPasswordExpiry()
    {
        if (!$this->last_password_change) {
            return true; // If we don't know when the password was last changed, assume it's expiring
        }
        
        $expiry_date = $this->last_password_change->addDays(90);
        $days_until_expiry = Carbon::now()->diffInDays($expiry_date, false);
        
        return $days_until_expiry < 7;
    }
    
    /**
     * Automatically changes the password if it's an initial password
     * 
     * @return array Result of the password change operation
     */
    public function autoChangePassword()
    {
        $is_initial_password = preg_match('/^[A-Z0-9]{12}$/', $this->config->password);
        
        if (!$is_initial_password) {
            return [
                'success' => true,
                'message' => 'Password already changed',
                'timestamp' => Carbon::now()->toIso8601String(),
                'password_changed' => false
            ];
        }
        
        $new_password = 'Ppsr' . bin2hex(random_bytes(8)) . '!';
        
        $request = new \stdClass();
        $request->account_number = $this->config->account_number;
        $request->username = $this->config->username;
        $request->current_password = $this->config->password;
        $request->new_password = $new_password;
        
        $result = $this->changePassword($request);
        
        if ($result['success']) {
            $this->config->password = $new_password;
            $this->updateEnvFile('PPSR_PASSWORD', $new_password);
            $result['password_changed'] = true;
        }
        
        return $result;
    }
    
    private function updateEnvFile($key, $value)
    {
        $path = base_path('.env');
        
        if (file_exists($path)) {
            $escaped_value = str_replace('"', '\"', $value);
            file_put_contents(
                $path, 
                preg_replace(
                    "/^{$key}=.*/m",
                    "{$key}=\"{$escaped_value}\"",
                    file_get_contents($path)
                )
            );
        }
    }
    
    public function searchVehicle($request)
    {
        if (env('USE_MOCK_SERVICE', true)) {
            Log::info("Using mock PPSR service for testing");
            $mock_service = new MockPpsrService();
            return $mock_service->searchVehicle(
                $request->search_type,
                $request->identifier,
                $request->state
            );
        }
        
        try {
            $client = $this->getClient('search_operations');
            
            $params = [
                'SearchType' => $request->search_type,
                'Identifier' => $request->identifier,
            ];
            
            if ($request->search_type === 'Registration' && $request->state) {
                $params['State'] = $request->state;
            }
            
            $result = $client->SearchVehicle($params);
            
            return [
                'success' => true,
                'message' => 'Vehicle search completed successfully',
                'timestamp' => Carbon::now()->toIso8601String(),
                'search_results' => json_decode(json_encode($result), true),
                'written_off' => $this->extractWrittenOffStatus($result),
                'stolen' => $this->extractStolenStatus($result)
            ];
        } catch (\Exception $e) {
            Log::error("Error searching vehicle: " . $e->getMessage());
            
            return [
                'success' => false,
                'message' => "Failed to search vehicle: " . $e->getMessage(),
                'error_details' => ['exception' => $e->getMessage()]
            ];
        }
    }
    
    private function extractWrittenOffStatus($result)
    {
        return false;
    }
    
    private function extractStolenStatus($result)
    {
        return false;
    }
}
