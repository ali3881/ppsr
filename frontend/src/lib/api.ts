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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  }
};
