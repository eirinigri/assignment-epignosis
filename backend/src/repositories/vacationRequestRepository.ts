import { pool } from '../config/database.js';
import type { VacationRequest, VacationRequestWithUser, RequestStatus } from '../types/index.js';
import type { CreateVacationRequestInput, UpdateVacationRequestInput } from '../utils/validation.js';

export class VacationRequestRepository {
  /**
   * Find all vacation requests with user information
   */
  async findAll(): Promise<VacationRequestWithUser[]> {
    const query = `
      SELECT 
        vr.id, vr.user_id, vr.start_date, vr.end_date, vr.reason, 
        vr.status, vr.manager_notes, vr.approved_by, vr.approved_at,
        vr.submitted_at, vr.updated_at,
        u.name as user_name, u.email as user_email
      FROM vacation_requests vr
      JOIN users u ON vr.user_id = u.id
      ORDER BY vr.submitted_at DESC
    `;
    const result = await pool.query<VacationRequestWithUser>(query);
    return result.rows;
  }

  /**
   * Find vacation requests by user ID
   */
  async findByUserId(userId: number): Promise<VacationRequest[]> {
    const query = `
      SELECT id, user_id, start_date, end_date, reason, status, 
             manager_notes, approved_by, approved_at, submitted_at, updated_at
      FROM vacation_requests
      WHERE user_id = $1
      ORDER BY submitted_at DESC
    `;
    const result = await pool.query<VacationRequest>(query, [userId]);
    return result.rows;
  }

  /**
   * Find vacation request by ID
   */
  async findById(id: number): Promise<VacationRequest | null> {
    const query = `
      SELECT id, user_id, start_date, end_date, reason, status,
             manager_notes, approved_by, approved_at, submitted_at, updated_at
      FROM vacation_requests
      WHERE id = $1
    `;
    const result = await pool.query<VacationRequest>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new vacation request
   */
  async create(userId: number, data: CreateVacationRequestInput): Promise<VacationRequest> {
    const query = `
      INSERT INTO vacation_requests (user_id, start_date, end_date, reason, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id, user_id, start_date, end_date, reason, status,
                manager_notes, approved_by, approved_at, submitted_at, updated_at
    `;
    const result = await pool.query<VacationRequest>(query, [
      userId,
      data.start_date,
      data.end_date,
      data.reason || null,
    ]);
    return result.rows[0];
  }

  /**
   * Update vacation request status
   */
  async updateStatus(
    id: number, 
    status: RequestStatus, 
    managerId: number,
    managerNotes?: string
  ): Promise<VacationRequest | null> {
    const query = `
      UPDATE vacation_requests
      SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, manager_notes = $3
      WHERE id = $4
      RETURNING id, user_id, start_date, end_date, reason, status,
                manager_notes, approved_by, approved_at, submitted_at, updated_at
    `;
    const result = await pool.query<VacationRequest>(query, [
      status, 
      managerId, 
      managerNotes || null, 
      id
    ]);
    return result.rows[0] || null;
  }

  /**
   * Delete a vacation request (only if pending)
   */
  async delete(id: number, userId?: number): Promise<boolean> {
    let query = 'DELETE FROM vacation_requests WHERE id = $1 AND status = $2';
    const params: unknown[] = [id, 'pending'];
    
    if (userId !== undefined) {
      query += ' AND user_id = $3';
      params.push(userId);
    }
    
    const result = await pool.query(query, params);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if request belongs to user
   */
  async belongsToUser(id: number, userId: number): Promise<boolean> {
    const query = 'SELECT 1 FROM vacation_requests WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [id, userId]);
    return result.rows.length > 0;
  }

  /**
   * Check for overlapping vacation requests for the same user
   */
  async hasOverlappingRequests(
    userId: number, 
    startDate: string, 
    endDate: string,
    excludeRequestId?: number
  ): Promise<boolean> {
    let query = `
      SELECT 1 FROM vacation_requests
      WHERE user_id = $1
        AND status IN ('pending', 'approved')
        AND (
          (start_date <= $2 AND end_date >= $2) OR
          (start_date <= $3 AND end_date >= $3) OR
          (start_date >= $2 AND end_date <= $3)
        )
    `;
    const params: unknown[] = [userId, startDate, endDate];
    
    if (excludeRequestId !== undefined) {
      query += ' AND id != $4';
      params.push(excludeRequestId);
    }
    
    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Calculate total vacation days for a date range
   */
  calculateVacationDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }

  /**
   * Update a pending vacation request
   */
  async update(id: number, data: UpdateVacationRequestInput): Promise<VacationRequest | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.start_date !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(data.start_date);
    }
    if (data.end_date !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(data.end_date);
    }
    if (data.reason !== undefined) {
      updates.push(`reason = $${paramCount++}`);
      values.push(data.reason);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE vacation_requests
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND status = 'pending'
      RETURNING id, user_id, start_date, end_date, reason, status,
                manager_notes, approved_by, approved_at, submitted_at, updated_at
    `;
    
    const result = await pool.query<VacationRequest>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find requests with filters
   */
  async findWithFilters(filters: {
    userId?: number;
    status?: RequestStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<VacationRequestWithUser[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (filters.userId !== undefined) {
      conditions.push(`vr.user_id = $${paramCount++}`);
      values.push(filters.userId);
    }
    if (filters.status) {
      conditions.push(`vr.status = $${paramCount++}`);
      values.push(filters.status);
    }
    if (filters.startDate) {
      conditions.push(`vr.start_date >= $${paramCount++}`);
      values.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`vr.end_date <= $${paramCount++}`);
      values.push(filters.endDate);
    }
    if (filters.search) {
      conditions.push(`(u.name ILIKE $${paramCount} OR vr.reason ILIKE $${paramCount})`);
      values.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        vr.id, vr.user_id, vr.start_date, vr.end_date, vr.reason, 
        vr.status, vr.manager_notes, vr.approved_by, vr.approved_at,
        vr.submitted_at, vr.updated_at,
        u.name as user_name, u.email as user_email
      FROM vacation_requests vr
      JOIN users u ON vr.user_id = u.id
      ${whereClause}
      ORDER BY vr.submitted_at DESC
    `;

    const result = await pool.query<VacationRequestWithUser>(query, values);
    return result.rows;
  }
}
