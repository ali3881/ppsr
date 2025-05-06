import axios from 'axios';

export interface ChangePasswordRequest {
  account_number: string;
  username: string;
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  timestamp: string;
  error_details?: Record<string, any> | null;
}

export interface StatusResponse {
  status: string;
  password_expiring: boolean;
  message: string;
}

export interface VehicleSearchRequest {
  search_type: 'VIN' | 'Chassis' | 'Registration';
  identifier: string;
  state?: string;
}

export interface VehicleSearchResponse {
  success: boolean;
  message: string;
  timestamp: string;
  error_details?: Record<string, any> | null;
  search_results?: Record<string, any> | null;
  written_off?: boolean;
  stolen?: boolean;
}

export interface PaymentIntentRequest {
  search_id: string;
  search_type: string;
  state?: string;
}

export interface PaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface PaymentConfirmationRequest {
  payment_intent_id: string;
  search_id: string;
}

export interface PaymentConfirmationResponse {
  confirmed: boolean;
  status: string;
  search_id: string;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa('user:59ae75b8695daab37e4a75543176b593')
  },
  withCredentials: true,
  timeout: 15000 // Increase timeout to accommodate network latency
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.message === 'Network Error') {
      console.error('Network error detected. API might be unavailable or CORS issues.');
    } else if (error.response && error.response.status === 400) {
      console.error('400 Bad Request error:', error.response.data);
      console.debug('Request URL:', error.config.url);
      console.debug('Request method:', error.config.method);
      console.debug('Request data:', error.config.data);
    }
    return Promise.reject(error);
  }
);

export const ppsr = {
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await api.post<ChangePasswordResponse>('/api/ppsr/change-password', data);
    return response.data;
  },
  
  getStatus: async (): Promise<StatusResponse> => {
    const response = await api.get<StatusResponse>('/api/ppsr/status');
    return response.data;
  },
  
  searchVehicle: async (data: VehicleSearchRequest): Promise<VehicleSearchResponse> => {
    const response = await api.post<VehicleSearchResponse>('/api/ppsr/search/vehicle', data);
    return response.data;
  },
  
  downloadVehiclePdf: async (data: VehicleSearchRequest): Promise<Blob> => {
    const response = await api.post('/api/ppsr/search/vehicle/pdf', data, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  createPaymentIntent: async (data: PaymentIntentRequest): Promise<PaymentIntentResponse> => {
    const response = await api.post<PaymentIntentResponse>('/api/ppsr/payment/create-intent', data);
    return response.data;
  },
  
  confirmPayment: async (data: PaymentConfirmationRequest): Promise<PaymentConfirmationResponse> => {
    const response = await api.post<PaymentConfirmationResponse>('/api/ppsr/payment/confirm', data);
    return response.data;
  }
};
