import { AnalyticsRepository } from '../repositories/analyticsRepository.js';
import { sendSuccess, sendError, type Request, type Response } from '../utils/http.js';

const analyticsRepo = new AnalyticsRepository();

/**
 * GET /api/analytics
 * Get analytics dashboard data (Manager only)
 */
export async function getAnalytics(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    if (req.user.role !== 'manager') {
      sendError(res, 403, 'Access denied - Manager only');
      return;
    }

    const analytics = await analyticsRepo.getAnalytics();
    sendSuccess(res, analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    sendError(res, 500, 'Internal server error');
  }
}
