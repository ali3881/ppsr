import React, { useEffect, useState } from 'react';
import { ppsr, StatusResponse } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatusPage: React.FC = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ppsr.getStatus();
      setStatus(response);
    } catch (err: any) {
      console.error('Status fetch error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">PPSR B2G Connection Status</h1>
      
      <div className="max-w-md mx-auto">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">Connection Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Current status of your PPSR B2G connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
              </div>
            ) : status ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {status.status === "connected" ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <h3 className="text-lg font-medium">
                      {status.status === "connected" ? "Connected" : "Disconnected"}
                    </h3>
                    <p className="text-gray-500">{status.message}</p>
                  </div>
                </div>
                
                {status.password_expiring && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Password Expiring Soon</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Your password will expire soon. Please change it to maintain access.
                      <div className="mt-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to="/change-password">Change Password</Link>
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="pt-4">
                  <Button 
                    onClick={fetchStatus} 
                    variant="outline" 
                    className="w-full flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatusPage;
