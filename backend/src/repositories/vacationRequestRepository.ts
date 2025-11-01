import { pool } from '../config/database.js';
import type { VacationRequest, VacationRequestWithUser, RequestStatus } from '../types/index.js';
import type { CreateVacationRequestInput } from '../utils/validation.js';

export class VacationRequestRepository {
  /**
   * Find all vacation requests with user information
   */
  async findAll(): Promise<VacationRequestWithUser[]> {
    const query = `
      SELECT 
        vr.id, vr.user_id, vr.start_date, vr.end_date, vr.reason, 
        vr.status, vr.submitted_at, vr.updated_at,
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
      SELECT id, user_id, start_date, end_date, reason, status, submitted_at, updated_at
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
      SELECT id, user_id, start_date, end_date, reason, status, submitted_at, updated_at
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
      RETURNING id, user_id, start_date, end_date, reason, status, submitted_at, updated_at
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
  async updateStatus(id: number, status: RequestStatus): Promise<VacationRequest | null> {
    const query = `
      UPDATE vacation_requests
      SET status = $1
      WHERE id = $2
      RETURNING id, user_id, start_date, end_date, reason, status, submitted_at, updated_at
    `;
    const result = await pool.query<VacationRequest>(query, [status, id]);
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
}
