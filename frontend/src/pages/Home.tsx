import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Check, ChevronRight, Key, Shield, Search, Car } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const searchFormSchema = z.object({
  search_type: z.enum(['VIN', 'Chassis', 'Registration']),
  identifier: z.string().min(1, 'Identifier is required'),
  state: z.string().optional().refine(() => {
    return true;
  }, {
    message: "State is required for registration searches",
  }),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      search_type: 'VIN',
      identifier: 'WBAAL31090FW12345', // Default to a valid test VIN
      state: '',
    },
  });

  const searchType = form.watch('search_type');
  
  const onSubmit = (values: SearchFormValues) => {
    setIsLoading(true);
    navigate(`/vehicle-search?search_type=${values.search_type}&identifier=${values.identifier}&state=${values.state || ''}`);
  };
  
  return (
    <div>
      {/* Hero section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">PPSR B2G Channel</h1>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Secure, SOAP-based client interface to connect with the PPSR B2G channel, enabling automated registration, search, and notification functionalities.
          </p>
        </div>
      </section>
      
      {/* Vehicle Search Form */}
      <section className="py-8 bg-white shadow-md -mt-6 rounded-t-lg relative z-10">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-2xl">
                <Car className="mr-2 h-6 w-6 text-blue-600" />
                Vehicle Search
              </CardTitle>
              <CardDescription>
                Search for vehicle details in the PPSR database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="search_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Search Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="VIN" />
                                </FormControl>
                                <FormLabel className="font-normal">VIN</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Chassis" />
                                </FormControl>
                                <FormLabel className="font-normal">Chassis</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="Registration" />
                                </FormControl>
                                <FormLabel className="font-normal">Registration</FormLabel>
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
                    
                    {searchType === 'Registration' ? (
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
                                <SelectItem value="ACT">ACT</SelectItem>
                                <SelectItem value="NSW">NSW</SelectItem>
                                <SelectItem value="NT">NT</SelectItem>
                                <SelectItem value="QLD">QLD</SelectItem>
                                <SelectItem value="SA">SA</SelectItem>
                                <SelectItem value="TAS">TAS</SelectItem>
                                <SelectItem value="VIC">VIC</SelectItem>
                                <SelectItem value="WA">WA</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="flex items-end">
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isLoading}
                        >
                          <Search className="mr-2 h-4 w-4" />
                          {isLoading ? 'Searching...' : 'Search Vehicle'}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {searchType === 'Registration' && (
                    <div className="flex justify-end mt-2">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={isLoading}
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {isLoading ? 'Searching...' : 'Search Vehicle'}
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Test VINs: WBAAL31090FW12345 (BMW), JN1TANT31U0123456 (Nissan), WAUZZZ8K9DA123456 (Audi)</p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Secure Communication</CardTitle>
                <CardDescription>
                  TLS 1.2 encryption with strong cipher suites for secure data transfer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>WS-Security standards with UserNameToken</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>SOAP 1.1/1.2 protocols with HTTP binding</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Compliant with AFSA security guidelines</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Link to="/status" className="flex items-center justify-center w-full">
                    Check Security Status <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Key className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Password Management</CardTitle>
                <CardDescription>
                  Secure password management with 90-day change policy enforcement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Change B2G passwords securely</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Password expiry tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Secure credential storage</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Link to="/change-password" className="flex items-center justify-center w-full">
                    Change Password <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <Car className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Vehicle Search</CardTitle>
                <CardDescription>
                  Search for vehicle details in the PPSR database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Search by VIN number</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Search by Chassis number</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Search by Registration number</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Link to="/vehicle-search" className="flex items-center justify-center w-full">
                    Advanced Search <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gray-300"></div>
              <div className="space-y-12">
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                  </div>
                  <div className="ml-12">
                    <h3 className="text-xl font-bold mb-2">Initial Password Change</h3>
                    <p className="text-gray-600">
                      Before accessing any B2G operations, you must change your initial password 
                      using the ChangeB2GPassword operation. This is a security requirement from AFSA.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                  </div>
                  <div className="ml-12">
                    <h3 className="text-xl font-bold mb-2">Access B2G Operations</h3>
                    <p className="text-gray-600">
                      Once your password is set, you can access the full range of B2G operations for 
                      registration, search, and notification functionalities.
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 -top-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
                  </div>
                  <div className="ml-12">
                    <h3 className="text-xl font-bold mb-2">Maintain Secure Access</h3>
                    <p className="text-gray-600">
                      Regularly change your password to comply with the 90-day password policy. 
                      The system will notify you when your password is about to expire.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
