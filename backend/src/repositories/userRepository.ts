import { pool } from '../config/database.js';
import type { User, UserWithPassword } from '../types/index.js';
import type { CreateUserInput, UpdateUserInput } from '../utils/validation.js';

export class UserRepository {
  /**
   * Find all users (without password hashes)
   */
  async findAll(): Promise<User[]> {
    const query = `
      SELECT id, name, email, employee_code, role, vacation_days_total, 
             vacation_days_used, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    const result = await pool.query<User>(query);
    return result.rows;
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, name, email, employee_code, role, vacation_days_total,
             vacation_days_used, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email (with password hash for authentication)
   */
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const query = `
      SELECT id, name, email, employee_code, password_hash, role, 
             vacation_days_total, vacation_days_used, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    const result = await pool.query<UserWithPassword>(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by employee code
   */
  async findByEmployeeCode(employeeCode: string): Promise<User | null> {
    const query = `
      SELECT id, name, email, employee_code, role, vacation_days_total,
             vacation_days_used, created_at, updated_at
      FROM users
      WHERE employee_code = $1
    `;
    const result = await pool.query<User>(query, [employeeCode]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserInput & { password_hash: string }): Promise<User> {
    const query = `
      INSERT INTO users (name, email, employee_code, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, employee_code, role, vacation_days_total,
                vacation_days_used, created_at, updated_at
    `;
    const result = await pool.query<User>(query, [
      data.name,
      data.email,
      data.employee_code,
      data.password_hash,
      data.role || 'employee',
    ]);
    return result.rows[0];
  }

  /**
   * Update a user
   */
  async update(id: number, data: UpdateUserInput & { password_hash?: string }): Promise<User | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.password_hash !== undefined) {
      updates.push(`password_hash = $${paramCount++}`);
      values.push(data.password_hash);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, employee_code, role, vacation_days_total,
                vacation_days_used, created_at, updated_at
    `;
    
    const result = await pool.query<User>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a user (cascade deletes vacation requests)
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT 1 FROM users WHERE email = $1';
    const params: unknown[] = [email];
    
    if (excludeId !== undefined) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Check if employee code exists
   */
  async employeeCodeExists(employeeCode: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT 1 FROM users WHERE employee_code = $1';
    const params: unknown[] = [employeeCode];
    
    if (excludeId !== undefined) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    
    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Update user's vacation days used
   */
  async updateVacationDaysUsed(userId: number, daysToAdd: number): Promise<void> {
    const query = `
      UPDATE users
      SET vacation_days_used = vacation_days_used + $1
      WHERE id = $2
    `;
    await pool.query(query, [daysToAdd, userId]);
  }

  /**
   * Get user's remaining vacation days
   */
  async getRemainingVacationDays(userId: number): Promise<number> {
    const query = `
      SELECT (vacation_days_total - vacation_days_used) as remaining
      FROM users
      WHERE id = $1
    `;
    const result = await pool.query<{ remaining: number }>(query, [userId]);
    return result.rows[0]?.remaining ?? 0;
  }
}
