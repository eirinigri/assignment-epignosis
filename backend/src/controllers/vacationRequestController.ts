import { VacationRequestRepository } from '../repositories/vacationRequestRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { createVacationRequestSchema, updateRequestStatusSchema, updateVacationRequestSchema } from '../utils/validation.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  parseBody,
  type Request,
  type Response,
} from '../utils/http.js';

const requestRepo = new VacationRequestRepository();
const userRepo = new UserRepository();

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

    // Parse query parameters for filtering
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const status = url.searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const search = url.searchParams.get('search');

    let requests;
    if (req.user.role === 'manager') {
      // Manager can see all requests with filters
      if (status || startDate || endDate || search) {
        requests = await requestRepo.findWithFilters({
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined
        });
      } else {
        requests = await requestRepo.findAll();
      }
    } else {
      // Employee can only see their own requests with filters
      requests = await requestRepo.findWithFilters({
        userId: req.user.userId,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search || undefined
      });
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

    // Calculate vacation days needed
    const daysNeeded = requestRepo.calculateVacationDays(
      validatedData.start_date,
      validatedData.end_date
    );

    // Check if user has enough vacation days
    const remainingDays = await userRepo.getRemainingVacationDays(req.user.userId);
    if (daysNeeded > remainingDays) {
      sendError(
        res,
        400,
        `Insufficient vacation days. You need ${daysNeeded} days but only have ${remainingDays} remaining.`
      );
      return;
    }

    // Check for overlapping requests
    const hasOverlap = await requestRepo.hasOverlappingRequests(
      req.user.userId,
      validatedData.start_date,
      validatedData.end_date
    );
    if (hasOverlap) {
      sendError(
        res,
        400,
        'You already have a pending or approved vacation request that overlaps with these dates.'
      );
      return;
    }

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

    if (request.status !== 'pending') {
      sendError(res, 400, 'Only pending requests can be approved');
      return;
    }

    // Parse optional manager notes from request body
    let managerNotes: string | undefined;
    try {
      const body = await parseBody(req);
      if (body && typeof body === 'object') {
        const validated = updateRequestStatusSchema.parse({ ...body, status: 'approved' });
        managerNotes = validated.manager_notes;
      }
    } catch {
      // No body or invalid body - that's okay, notes are optional
    }

    // Calculate vacation days and update user's balance
    const daysUsed = requestRepo.calculateVacationDays(request.start_date, request.end_date);
    await userRepo.updateVacationDaysUsed(request.user_id, daysUsed);

    const updatedRequest = await requestRepo.updateStatus(
      id,
      'approved',
      req.user.userId,
      managerNotes
    );
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

    if (request.status !== 'pending') {
      sendError(res, 400, 'Only pending requests can be rejected');
      return;
    }

    // Parse optional manager notes from request body
    let managerNotes: string | undefined;
    try {
      const body = await parseBody(req);
      if (body && typeof body === 'object') {
        const validated = updateRequestStatusSchema.parse({ ...body, status: 'rejected' });
        managerNotes = validated.manager_notes;
      }
    } catch {
      // No body or invalid body - that's okay, notes are optional
    }

    const updatedRequest = await requestRepo.updateStatus(
      id,
      'rejected',
      req.user.userId,
      managerNotes
    );
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

/**
 * PUT /api/requests/:id
 * Update a pending vacation request (Employee only)
 */
export async function updateRequest(req: Request, res: Response): Promise<void> {
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

    // Only the owner can update their request
    if (request.user_id !== req.user.userId) {
      sendError(res, 403, 'Access denied');
      return;
    }

    // Only pending requests can be updated
    if (request.status !== 'pending') {
      sendError(res, 400, 'Only pending requests can be updated');
      return;
    }

    const body = await parseBody(req);
    const validatedData = updateVacationRequestSchema.parse(body);

    // Get the final dates (use existing if not provided)
    const finalStartDate = validatedData.start_date || request.start_date;
    const finalEndDate = validatedData.end_date || request.end_date;

    // Calculate vacation days needed for new dates
    const daysNeeded = requestRepo.calculateVacationDays(finalStartDate, finalEndDate);

    // Check if user has enough vacation days
    const remainingDays = await userRepo.getRemainingVacationDays(req.user.userId);
    if (daysNeeded > remainingDays) {
      sendError(
        res,
        400,
        `Insufficient vacation days. You need ${daysNeeded} days but only have ${remainingDays} remaining.`
      );
      return;
    }

    // Check for overlapping requests (excluding this request)
    const hasOverlap = await requestRepo.hasOverlappingRequests(
      req.user.userId,
      finalStartDate,
      finalEndDate,
      id
    );
    if (hasOverlap) {
      sendError(
        res,
        400,
        'You already have a pending or approved vacation request that overlaps with these dates.'
      );
      return;
    }

    const updatedRequest = await requestRepo.update(id, validatedData);
    if (!updatedRequest) {
      sendError(res, 400, 'Unable to update request');
      return;
    }

    sendSuccess(res, updatedRequest, 'Request updated successfully');
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      sendError(res, 400, 'Validation error: ' + JSON.stringify(error));
    } else {
      sendError(res, 500, 'Internal server error');
    }
  }
}
