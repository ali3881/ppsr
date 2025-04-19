import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ppsr, VehicleSearchRequest, VehicleSearchResponse } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, CheckCircle, AlertTriangle, Car, FileDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import PaymentFormWrapper from '../components/payment/PaymentForm';

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
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search_type: 'VIN',
      identifier: 'WBAAL31090FW12345', // Default to a valid test VIN
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
      if (err.response?.status === 402) {
        setShowPaymentForm(true);
        setError('Payment required: You need to complete payment to download this PDF report. Click the "Download PDF Report" button to initiate payment.');
      } else {
        setError('Failed to generate PDF report: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsPdfLoading(false);
    }
  };
  
  const handlePaymentSuccess = async () => {
    setShowPaymentForm(false);
    setIsPdfLoading(true);
    
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
      setError('Failed to generate PDF report after payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPdfLoading(false);
    }
  };
  
  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Vehicle Search</h1>
      
      {showPaymentForm ? (
        <div className="max-w-md mx-auto">
          <PaymentFormWrapper 
            searchId={form.getValues().identifier}
            searchType={form.getValues().search_type}
            state={form.getValues().state}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      ) : (
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
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800">Test Data Available</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Use these test VINs for mock service:
                  <ul className="list-disc pl-5 mt-2">
                    <li>WBAAL31090FW12345 (BMW 318i, encumbered)</li>
                    <li>JN1TANT31U0123456 (Nissan X-Trail, written-off)</li>
                    <li>WAUZZZ8K9DA123456 (Audi A4, stolen)</li>
                  </ul>
                  For Registration searches, use format: STATE_NUMBER (e.g., NSW_ABC123)
                </AlertDescription>
              </Alert>
              
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
                            className="font-mono"
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
                      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Make:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.make}</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Model:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.model}</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Year:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.year}</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Color:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.color}</span>
                            </div>
                          </div>
                          <div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Engine Number:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.engine_number}</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Registration:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.registration}</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">State:</span>
                              <span className="ml-2 text-gray-800 font-semibold">{searchResult.search_results?.state}</span>
                            </div>
                            <div className="mb-4">
                              <span className="text-sm font-medium text-blue-700">Encumbered:</span>
                              <span className="ml-2 text-gray-800 font-semibold">
                                {searchResult.search_results?.encumbered ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {searchResult.search_results?.encumbered && searchResult.search_results?.encumbrance_details && (
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <h4 className="font-medium text-blue-800 mb-3">Encumbrance Details</h4>
                            {searchResult.search_results.encumbrance_details.map((detail: any, index: number) => (
                              <div key={index} className="bg-white p-4 rounded-md mb-2 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="mb-2">
                                      <span className="text-xs font-medium text-blue-700">Registration Number:</span>
                                      <span className="ml-2 text-gray-800">{detail.registration_number}</span>
                                    </div>
                                    <div className="mb-2">
                                      <span className="text-xs font-medium text-blue-700">Registration Date:</span>
                                      <span className="ml-2 text-gray-800">{detail.registration_date}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="mb-2">
                                      <span className="text-xs font-medium text-blue-700">Secured Party:</span>
                                      <span className="ml-2 text-gray-800">{detail.secured_party}</span>
                                    </div>
                                    <div className="mb-2">
                                      <span className="text-xs font-medium text-blue-700">Address:</span>
                                      <span className="ml-2 text-gray-800">{detail.address}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default VehicleSearchPage;
