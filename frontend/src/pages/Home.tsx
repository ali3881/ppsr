import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Check, ChevronRight, Key, Shield } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div>
      {/* Hero section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">PPSR B2G Channel</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Secure, SOAP-based client interface to connect with the PPSR B2G channel, enabling automated registration, search, and notification functionalities.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="secondary" size="lg">
              <Link to="/change-password">Change Password</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
              <Link to="/status">Check Status</Link>
            </Button>
          </div>
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
                <Shield className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>B2G Operations</CardTitle>
                <CardDescription>
                  Automated registration, search, and notification functionalities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>PPSR registration operations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>PPSR search operations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>PPSR notification operations</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" disabled>
                  <span className="flex items-center justify-center w-full">
                    Coming Soon <ChevronRight className="ml-2 h-4 w-4" />
                  </span>
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
