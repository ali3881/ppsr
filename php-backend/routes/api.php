<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PpsrController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/healthz', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('ppsr')->group(function () {
    Route::post('/change-password', [PpsrController::class, 'changePassword']);
    Route::get('/status', [PpsrController::class, 'getStatus']);
    Route::post('/search/vehicle', [PpsrController::class, 'searchVehicle']);
    Route::post('/payment/create-intent', [PpsrController::class, 'createPaymentIntent']);
    Route::post('/payment/confirm', [PpsrController::class, 'confirmPayment']);
    Route::post('/search/vehicle/pdf', [PpsrController::class, 'generateVehicleSearchPdf']);
});
