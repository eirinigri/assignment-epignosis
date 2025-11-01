import { pool } from '../config/database.js';

export interface AnalyticsData {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageApprovalTime: number; // in hours
  requestsByMonth: Array<{ month: string; count: number }>;
  topRequesters: Array<{ user_name: string; request_count: number }>;
  vacationUtilization: Array<{ user_name: string; days_used: number; days_total: number; utilization_percent: number }>;
}

export class AnalyticsRepository {
  /**
   * Get comprehensive analytics data for managers
   */
  async getAnalytics(): Promise<AnalyticsData> {
    // Get request counts by status
    const statusQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests
      FROM vacation_requests
    `;
    const statusResult = await pool.query(statusQuery);
    const statusData = statusResult.rows[0];

    // Get average approval time (for approved/rejected requests)
    const approvalTimeQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (approved_at - submitted_at)) / 3600) as avg_hours
      FROM vacation_requests
      WHERE approved_at IS NOT NULL
    `;
    const approvalTimeResult = await pool.query(approvalTimeQuery);
    const avgApprovalTime = approvalTimeResult.rows[0]?.avg_hours || 0;

    // Get requests by month (last 12 months)
    const monthlyQuery = `
      SELECT 
        TO_CHAR(submitted_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM vacation_requests
      WHERE submitted_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(submitted_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `;
    const monthlyResult = await pool.query<{ month: string; count: string }>(monthlyQuery);
    const requestsByMonth = monthlyResult.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count, 10)
    }));

    // Get top requesters
    const topRequestersQuery = `
      SELECT 
        u.name as user_name,
        COUNT(vr.id) as request_count
      FROM users u
      LEFT JOIN vacation_requests vr ON u.id = vr.user_id
      WHERE u.role = 'employee'
      GROUP BY u.id, u.name
      ORDER BY request_count DESC
      LIMIT 10
    `;
    const topRequestersResult = await pool.query<{ user_name: string; request_count: string }>(topRequestersQuery);
    const topRequesters = topRequestersResult.rows.map(row => ({
      user_name: row.user_name,
      request_count: parseInt(row.request_count, 10)
    }));

    // Get vacation utilization
    const utilizationQuery = `
      SELECT 
        u.name as user_name,
        u.vacation_days_used as days_used,
        u.vacation_days_total as days_total,
        ROUND((u.vacation_days_used::numeric / u.vacation_days_total::numeric) * 100, 2) as utilization_percent
      FROM users u
      WHERE u.role = 'employee'
      ORDER BY utilization_percent DESC
    `;
    const utilizationResult = await pool.query<{
      user_name: string;
      days_used: number;
      days_total: number;
      utilization_percent: string;
    }>(utilizationQuery);
    const vacationUtilization = utilizationResult.rows.map(row => ({
      user_name: row.user_name,
      days_used: row.days_used,
      days_total: row.days_total,
      utilization_percent: parseFloat(row.utilization_percent)
    }));

    return {
      totalRequests: parseInt(statusData.total_requests, 10),
      pendingRequests: parseInt(statusData.pending_requests, 10),
      approvedRequests: parseInt(statusData.approved_requests, 10),
      rejectedRequests: parseInt(statusData.rejected_requests, 10),
      averageApprovalTime: Math.round(avgApprovalTime * 10) / 10,
      requestsByMonth,
      topRequesters,
      vacationUtilization
    };
  }
}
