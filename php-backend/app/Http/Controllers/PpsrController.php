<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\VehicleSearchRequest;
use App\Http\Requests\PaymentIntentRequest;
use App\Http\Requests\PaymentConfirmationRequest;
use App\Services\PpsrSoapClient;
use App\Utils\PdfGenerator;
use App\Utils\StripeUtils;
use Carbon\Carbon;

class PpsrController extends Controller
{
    private $ppsr_client;
    private $pdf_generator;
    private $stripe_utils;
    
    public function __construct(PpsrSoapClient $ppsr_client, PdfGenerator $pdf_generator, StripeUtils $stripe_utils)
    {
        $this->ppsr_client = $ppsr_client;
        $this->pdf_generator = $pdf_generator;
        $this->stripe_utils = $stripe_utils;
    }
    
    public function changePassword(ChangePasswordRequest $request)
    {
        $response = $this->ppsr_client->changePassword($request);
        
        if (!$response['success']) {
            return response()->json($response, 400);
        }
        
        return response()->json($response);
    }
    
    public function getStatus()
    {
        $password_expiring = $this->ppsr_client->checkPasswordExpiry();
        
        return response()->json([
            'status' => 'connected',
            'password_expiring' => $password_expiring,
            'message' => $password_expiring ? 'Password needs to be changed soon' : 'Connection is healthy'
        ]);
    }
    
    public function searchVehicle(VehicleSearchRequest $request)
    {
        $response = $this->ppsr_client->searchVehicle($request);
        
        if (!$response['success']) {
            return response()->json($response, 400);
        }
        
        return response()->json($response);
    }
    
    public function createPaymentIntent(PaymentIntentRequest $request)
    {
        $metadata = [
            'search_type' => $request->search_type,
            'state' => $request->state
        ];
        
        $result = $this->stripe_utils->createPaymentIntent($request->search_id, $metadata);
        
        if (array_key_exists('error', $result)) {
            return response()->json($result, 400);
        }
        
        return response()->json($result);
    }
    
    public function confirmPayment(PaymentConfirmationRequest $request)
    {
        $result = $this->stripe_utils->confirmPayment($request->payment_intent_id, $request->search_id);
        
        if (array_key_exists('error', $result)) {
            return response()->json($result, 400);
        }
        
        return response()->json($result);
    }
    
    public function generateVehicleSearchPdf(VehicleSearchRequest $request)
    {
        if (!$this->stripe_utils->verifyPayment($request->identifier)) {
            return response()->json([
                'message' => 'Payment is required to download this PDF'
            ], 402);
        }
        
        $response = $this->ppsr_client->searchVehicle($request);
        
        if (!$response['success']) {
            return response()->json($response, 400);
        }
        
        $pdf_path = $this->pdf_generator->generateTempPdfPath($request->identifier);
        
        $search_data = [
            'search_type' => $request->search_type,
            'identifier' => $request->identifier,
            'state' => $request->search_type === 'Registration' ? $request->state : null,
            'certificate_number' => (string)time(),
            'search_number' => (string)(time()/100),
            'search_results' => $response['search_results'],
            'written_off' => $response['written_off'] ?? false,
            'stolen' => $response['stolen'] ?? false
        ];
        
        $pdf_path = $this->pdf_generator->generateVehicleSearchPdf($search_data, $pdf_path);
        
        return response()->download($pdf_path, "ppsr_vehicle_search_{$request->identifier}.pdf", [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }
}
