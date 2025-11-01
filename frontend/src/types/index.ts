export interface User {
  id: number;
  name: string;
  email: string;
  employee_code: string;
  role: 'manager' | 'employee';
  created_at: string;
  updated_at: string;
}

export interface VacationRequest {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
