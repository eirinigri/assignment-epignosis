import type { IncomingMessage, ServerResponse } from 'http';
import { authenticate, authorize, pathToRegex, extractParams, parseQuery, handleCors, sendError, type Request, type Response, type Route } from './utils/http.js';
import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as vacationRequestController from './controllers/vacationRequestController.js';
import * as analyticsController from './controllers/analyticsController.js';

// Define routes
const routes: Route[] = [];

function addRoute(method: string, path: string, handler: (req: Request, res: Response) => Promise<void> | void) {
  const { pattern, paramNames } = pathToRegex(path);
  routes.push({ method, pattern, handler, paramNames });
}

// Auth routes
addRoute('POST', '/api/auth/login', authController.login);
addRoute('GET', '/api/auth/me', authenticate(authController.getCurrentUser));

// User routes (Manager only)
addRoute('GET', '/api/users', authenticate(authorize('manager')(userController.getAllUsers)));
addRoute('GET', '/api/users/:id', authenticate(authorize('manager')(userController.getUserById)));
addRoute('POST', '/api/users', authenticate(authorize('manager')(userController.createUser)));
addRoute('PUT', '/api/users/:id', authenticate(authorize('manager')(userController.updateUser)));
addRoute('DELETE', '/api/users/:id', authenticate(authorize('manager')(userController.deleteUser)));

// Vacation request routes
addRoute('GET', '/api/requests', authenticate(vacationRequestController.getAllRequests));
addRoute('GET', '/api/requests/:id', authenticate(vacationRequestController.getRequestById));
addRoute('POST', '/api/requests', authenticate(authorize('employee')(vacationRequestController.createRequest)));
addRoute('PUT', '/api/requests/:id', authenticate(vacationRequestController.updateRequest));
addRoute('PUT', '/api/requests/:id/approve', authenticate(authorize('manager')(vacationRequestController.approveRequest)));
addRoute('PUT', '/api/requests/:id/reject', authenticate(authorize('manager')(vacationRequestController.rejectRequest)));
addRoute('DELETE', '/api/requests/:id', authenticate(vacationRequestController.deleteRequest));

// Analytics routes (Manager only)
addRoute('GET', '/api/analytics', authenticate(authorize('manager')(analyticsController.getAnalytics)));

/**
 * Main request handler
 */
export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Handle CORS preflight
  if (handleCors(req, res)) {
    return;
  }

  const url = req.url || '/';
  const method = req.method || 'GET';
  
  // Extract path without query string
  const pathOnly = url.split('?')[0];

  // Find matching route
  const route = routes.find((r) => r.method === method && r.pattern.test(pathOnly));

  if (!route) {
    sendError(res, 404, 'Route not found');
    return;
  }

  try {
    // Extend request object with params and query
    const extendedReq = req as Request;
    extendedReq.params = extractParams(pathOnly, route);
    extendedReq.query = parseQuery(url);

    // Execute handler
    await route.handler(extendedReq, res);
  } catch (error) {
    console.error('Request handler error:', error);
    sendError(res, 500, 'Internal server error');
  }
}
