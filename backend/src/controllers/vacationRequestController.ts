import { VacationRequestRepository } from '../repositories/vacationRequestRepository.js';
import { createVacationRequestSchema } from '../utils/validation.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  parseBody,
  type Request,
  type Response,
} from '../utils/http.js';

const requestRepo = new VacationRequestRepository();

/**
 * GET /api/requests
 * Get all vacation requests (Manager) or user's own requests (Employee)
 */
export async function getAllRequests(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    let requests;
    if (req.user.role === 'manager') {
      // Manager can see all requests
      requests = await requestRepo.findAll();
    } else {
      // Employee can only see their own requests
      requests = await requestRepo.findByUserId(req.user.userId);
    }

    sendSuccess(res, requests);
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}

/**
 * GET /api/requests/:id
 * Get vacation request by ID
 */
export async function getRequestById(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid request ID');
      return;
    }

    const request = await requestRepo.findById(id);
    if (!request) {
      sendError(res, 404, 'Request not found');
      return;
    }

    // Employees can only view their own requests
    if (req.user.role === 'employee' && request.user_id !== req.user.userId) {
      sendError(res, 403, 'Access denied');
      return;
    }

    sendSuccess(res, request);
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}

/**
 * POST /api/requests
 * Create a new vacation request (Employee only)
 */
export async function createRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    const body = await parseBody(req);
    const validatedData = createVacationRequestSchema.parse(body);

    // Create request for the authenticated user
    const request = await requestRepo.create(req.user.userId, validatedData);

    sendCreated(res, request, 'Vacation request created successfully');
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      sendError(res, 400, 'Validation error: ' + JSON.stringify(error));
    } else {
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * PUT /api/requests/:id/approve
 * Approve a vacation request (Manager only)
 */
export async function approveRequest(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid request ID');
      return;
    }

    const request = await requestRepo.findById(id);
    if (!request) {
      sendError(res, 404, 'Request not found');
      return;
    }

    if (request.status !== 'pending') {
      sendError(res, 400, 'Only pending requests can be approved');
      return;
    }

    const updatedRequest = await requestRepo.updateStatus(id, 'approved');
    sendSuccess(res, updatedRequest, 'Request approved successfully');
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}

/**
 * PUT /api/requests/:id/reject
 * Reject a vacation request (Manager only)
 */
export async function rejectRequest(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid request ID');
      return;
    }

    const request = await requestRepo.findById(id);
    if (!request) {
      sendError(res, 404, 'Request not found');
      return;
    }

    if (request.status !== 'pending') {
      sendError(res, 400, 'Only pending requests can be rejected');
      return;
    }

    const updatedRequest = await requestRepo.updateStatus(id, 'rejected');
    sendSuccess(res, updatedRequest, 'Request rejected successfully');
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}

/**
 * DELETE /api/requests/:id
 * Delete a pending vacation request (Employee can delete their own)
 */
export async function deleteRequest(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid request ID');
      return;
    }

    const request = await requestRepo.findById(id);
    if (!request) {
      sendError(res, 404, 'Request not found');
      return;
    }

    // Employees can only delete their own pending requests
    if (req.user.role === 'employee' && request.user_id !== req.user.userId) {
      sendError(res, 403, 'Access denied');
      return;
    }

    if (request.status !== 'pending') {
      sendError(res, 400, 'Only pending requests can be deleted');
      return;
    }

    const deleted = await requestRepo.delete(id, req.user.role === 'employee' ? req.user.userId : undefined);
    if (!deleted) {
      sendError(res, 400, 'Unable to delete request');
      return;
    }

    sendSuccess(res, null, 'Request deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}
