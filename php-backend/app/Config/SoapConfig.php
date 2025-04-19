<?php

namespace App\Config;

class SoapConfig
{
    public string $base_url;
    public array $wsdl_urls;
    public string $account_number;
    public string $username;
    public string $password;
    public string $tls_version;
    public string $cipher_suites;
    public int $timeout;
    public array $namespaces;
    
    public function __construct()
    {
        $this->base_url = env('PPSR_BASE_URL', 'https://www.ppsr.gov.au/b2g/discovery');
        
        $this->wsdl_urls = [
            'register_operations' => env('PPSR_REGISTER_OPERATIONS_WSDL', 
                                        $this->base_url . '/RegisterOperationsService.svc?wsdl'),
            'search_operations' => env('PPSR_SEARCH_OPERATIONS_WSDL', 
                                      $this->base_url . '/SearchOperationsService.svc?wsdl'),
            'notification_operations' => env('PPSR_NOTIFICATION_OPERATIONS_WSDL', 
                                            $this->base_url . '/NotificationOperationsService.svc?wsdl'),
        ];
        
        $this->account_number = env('PPSR_ACCOUNT_NUMBER', '130040219');
        $this->username = env('PPSR_USERNAME', 'pps959');
        $this->password = env('PPSR_PASSWORD', '7V9RDKXHMWCR');
        
        $this->tls_version = 'TLSv1.2';
        $this->cipher_suites = 'AES128-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
        
        $this->timeout = 30;  // seconds
        
        $this->namespaces = [
            'soap' => 'http://schemas.xmlsoap.org/soap/envelope/',
            'ppsr' => 'http://schemas.ppsr.gov.au/2011/04/data',
            'wsse' => 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
            'wsu' => 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
        ];
    }
}
