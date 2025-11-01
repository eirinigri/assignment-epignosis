import { z } from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  employee_code: z
    .string()
    .length(7, 'Employee code must be exactly 7 digits')
    .regex(/^\d{7}$/, 'Employee code must contain only digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['manager', 'employee']).optional().default('employee'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Vacation request validation schemas
export const createVacationRequestSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  reason: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

export const updateRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateVacationRequestInput = z.infer<typeof createVacationRequestSchema>;
export type UpdateRequestStatusInput = z.infer<typeof updateRequestStatusSchema>;
