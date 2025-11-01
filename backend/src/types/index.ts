// User types
export type UserRole = 'manager' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  employee_code: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

// Vacation request types
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface VacationRequest {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: RequestStatus;
  submitted_at: Date;
  updated_at: Date;
}

export interface VacationRequestWithUser extends VacationRequest {
  user_name: string;
  user_email: string;
}

// Auth types
export interface AuthPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// HTTP types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
