export interface User {
  id: number;
  name: string;
  email: string;
  employee_code: string;
  role: 'manager' | 'employee';
  vacation_days_total: number;
  vacation_days_used: number;
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
  manager_notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  submitted_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
