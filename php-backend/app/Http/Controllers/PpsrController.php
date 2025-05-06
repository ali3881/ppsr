<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
        try {
            Log::info('Getting PPSR connection status');
            $auto_change_result = $this->ppsr_client->autoChangePassword();
            
            $password_expiring = $this->ppsr_client->checkPasswordExpiry();
            
            $message = 'Connection is healthy';
            if ($auto_change_result['success'] && isset($auto_change_result['password_changed']) && $auto_change_result['password_changed']) {
                $message = 'Password automatically changed for seamless access';
                Log::info('PPSR password automatically changed', ['result' => $auto_change_result]);
            } elseif ($password_expiring) {
                $message = 'Password needs to be changed soon';
                Log::warning('PPSR password expiring soon');
            }
            
            Log::info('PPSR connection status', [
                'status' => 'connected',
                'password_expiring' => $password_expiring
            ]);
            
            return response()->json([
                'status' => 'connected',
                'password_expiring' => $password_expiring,
                'message' => $message,
                'password_auto_changed' => $auto_change_result['success'] && isset($auto_change_result['password_changed']) && $auto_change_result['password_changed']
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting PPSR connection status', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Connection Error',
                'error_details' => $e->getMessage()
            ], 500);
        }
    }
    
    public function searchVehicle(VehicleSearchRequest $request)
    {
        try {
            Log::info('Searching vehicle', [
                'search_type' => $request->search_type,
                'identifier' => $request->identifier,
                'state' => $request->state ?? null
            ]);
            
            $response = $this->ppsr_client->searchVehicle($request);
            
            if (!$response['success']) {
                Log::warning('Vehicle search failed', [
                    'response' => $response
                ]);
                return response()->json($response, 400);
            }
            
            Log::info('Vehicle search successful', [
                'search_type' => $request->search_type,
                'identifier' => $request->identifier
            ]);
            
            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error searching vehicle', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'search_type' => $request->search_type,
                'identifier' => $request->identifier
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error searching vehicle: ' . $e->getMessage(),
                'error_details' => ['exception' => $e->getMessage()]
            ], 500);
        }
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
        try {
            Log::info('Generating vehicle search PDF', [
                'search_type' => $request->search_type,
                'identifier' => $request->identifier
            ]);
            
            if (!$this->stripe_utils->verifyPayment($request->identifier)) {
                Log::warning('Payment required for PDF download', [
                    'identifier' => $request->identifier
                ]);
                return response()->json([
                    'message' => 'Payment required: You need to complete payment to download this PDF report. Click the "Download PDF Report" button to initiate payment'
                ], 402);
            }
            
            $response = $this->ppsr_client->searchVehicle($request);
            
            if (!$response['success']) {
                Log::warning('Vehicle search failed during PDF generation', [
                    'response' => $response
                ]);
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
            
            Log::info('Generating PDF with search data', [
                'identifier' => $request->identifier,
                'search_type' => $request->search_type
            ]);
            
            $pdf_path = $this->pdf_generator->generateVehicleSearchPdf($search_data, $pdf_path);
            
            Log::info('PDF generated successfully', [
                'identifier' => $request->identifier,
                'pdf_path' => $pdf_path
            ]);
            
            return response()->download($pdf_path, "ppsr_vehicle_search_{$request->identifier}.pdf", [
                'Content-Type' => 'application/pdf',
            ])->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Error generating PDF', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'identifier' => $request->identifier
            ]);
            
            return response()->json([
                'message' => 'Failed to generate PDF report after payment: ' . $e->getMessage(),
                'error_details' => ['exception' => $e->getMessage()]
            ], 500);
        }
    }
}
