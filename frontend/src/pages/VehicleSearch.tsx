import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ppsr, 
  VehicleSearchRequest, 
  VehicleSearchResponse,
  PaymentIntentRequest,
  PaymentConfirmationRequest
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, CheckCircle, AlertTriangle, Car, FileDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { PaymentModal } from '../components/payment/PaymentForm';

const formSchema = z.object({
  search_type: z.enum(['VIN', 'Chassis', 'Registration']),
  identifier: z.string().min(1, 'Identifier is required'),
  state: z.string().optional().refine(() => {
    return true;
  }, {
    message: "State is required for registration searches",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const VehicleSearchPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<VehicleSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search_type: 'VIN',
      identifier: '',
      state: '',
    },
  });

  const searchType = form.watch('search_type');

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setSearchResult(null);
    setError(null);

    try {
      const request: VehicleSearchRequest = {
        search_type: values.search_type as 'VIN' | 'Chassis' | 'Registration',
        identifier: values.identifier,
        state: values.state,
      };

      const response = await ppsr.searchVehicle(request);
      setSearchResult(response);
      
      if (!response.success) {
        setError(response.message || 'An error occurred during the search');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadPdf = async () => {
    if (!searchResult || !form.getValues()) return;
    
    setIsPdfLoading(true);
    setError(null);
    
    try {
      const request: PaymentIntentRequest = {
        search_id: form.getValues().identifier,
        search_type: form.getValues().search_type as 'VIN' | 'Chassis' | 'Registration',
        state: form.getValues().state,
      };
      
      const paymentResponse = await ppsr.createPaymentIntent(request);
      
      if (paymentResponse.error || !paymentResponse.client_secret || !paymentResponse.payment_intent_id) {
        throw new Error(paymentResponse.error || 'Failed to create payment intent');
      }
      
      setPaymentIntent({
        clientSecret: paymentResponse.client_secret,
        paymentIntentId: paymentResponse.payment_intent_id,
        amount: paymentResponse.amount || 1000, // Default to $10.00
      });
      
      setShowPaymentModal(true);
    } catch (err: any) {
      setError('Failed to initiate payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPdfLoading(false);
    }
  };
  
  const handlePaymentSuccess = async () => {
    if (!paymentIntent || !form.getValues()) return;
    
    try {
      const confirmRequest: PaymentConfirmationRequest = {
        payment_intent_id: paymentIntent.paymentIntentId,
        search_id: form.getValues().identifier,
      };
      
      const confirmResponse = await ppsr.confirmPayment(confirmRequest);
      
      if (!confirmResponse.confirmed) {
        throw new Error(`Payment confirmation failed: ${confirmResponse.status}`);
      }
      
      downloadPdf();
    } catch (err: any) {
      setError('Payment confirmation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setShowPaymentModal(false);
    }
  };
  
  const downloadPdf = async () => {
    if (!form.getValues()) return;
    
    setIsPdfLoading(true);
    setError(null);
    
    try {
      const request: VehicleSearchRequest = {
        search_type: form.getValues().search_type as 'VIN' | 'Chassis' | 'Registration',
        identifier: form.getValues().identifier,
        state: form.getValues().state,
      };
      
      const blob = await ppsr.downloadVehiclePdf(request);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ppsr_vehicle_search_${request.identifier}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      if (err.response && err.response.status === 402) {
        setError('Payment is required to download this PDF.');
        handleDownloadPdf(); // Try again to create a payment intent
      } else {
        setError('Failed to download PDF report: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsPdfLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Vehicle Search</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Search Parameters</CardTitle>
              <CardDescription>
                Search for vehicle details in the PPSR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="search_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Search Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="VIN" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                VIN (Vehicle Identification Number)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Chassis" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Chassis Number
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="Registration" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Registration Number
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Identifier</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={`Enter ${searchType.toLowerCase()} number`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {searchType === 'Registration' && (
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACT">Australian Capital Territory</SelectItem>
                              <SelectItem value="NSW">New South Wales</SelectItem>
                              <SelectItem value="NT">Northern Territory</SelectItem>
                              <SelectItem value="QLD">Queensland</SelectItem>
                              <SelectItem value="SA">South Australia</SelectItem>
                              <SelectItem value="TAS">Tasmania</SelectItem>
                              <SelectItem value="VIC">Victoria</SelectItem>
                              <SelectItem value="WA">Western Australia</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {searchResult && searchResult.success && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Car className="mr-2 h-5 w-5" />
                    Search Results
                  </CardTitle>
                  <Button 
                    onClick={handleDownloadPdf}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    disabled={isPdfLoading}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {isPdfLoading ? 'Generating PDF...' : 'Download PDF Report'}
                  </Button>
                </div>
                <CardDescription>
                  Results for {searchType}: {form.getValues().identifier}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!searchResult.search_results ? (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">No Records Found</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      No matching records were found for this vehicle identifier.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-md">
                        <h3 className="font-medium text-gray-900 mb-2">Written-off Status</h3>
                        <div className="flex items-center">
                          {searchResult.written_off ? (
                            <Alert className="bg-red-50 border-red-200">
                              <AlertCircle className="h-5 w-5 text-red-600" />
                              <AlertTitle className="text-red-800">Vehicle Written Off</AlertTitle>
                              <AlertDescription className="text-red-700">
                                This vehicle has been recorded as written off.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="bg-green-50 border-green-200">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <AlertTitle className="text-green-800">No Written-off Record</AlertTitle>
                              <AlertDescription className="text-green-700">
                                No written-off record found for this vehicle.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-md">
                        <h3 className="font-medium text-gray-900 mb-2">Stolen Status</h3>
                        <div className="flex items-center">
                          {searchResult.stolen ? (
                            <Alert className="bg-red-50 border-red-200">
                              <AlertCircle className="h-5 w-5 text-red-600" />
                              <AlertTitle className="text-red-800">Vehicle Reported Stolen</AlertTitle>
                              <AlertDescription className="text-red-700">
                                This vehicle has been reported as stolen.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="bg-green-50 border-green-200">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <AlertTitle className="text-green-800">No Stolen Record</AlertTitle>
                              <AlertDescription className="text-green-700">
                                No stolen record found for this vehicle.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional details section */}
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-2">Additional Details</h3>
                      <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
                        {JSON.stringify(searchResult.search_results, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && paymentIntent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PaymentModal
            clientSecret={paymentIntent.clientSecret}
            paymentIntentId={paymentIntent.paymentIntentId}
            amount={paymentIntent.amount}
            searchId={form.getValues().identifier}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setShowPaymentModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default VehicleSearchPage;
