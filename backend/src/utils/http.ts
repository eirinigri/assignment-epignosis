import type { IncomingMessage, ServerResponse } from 'http';
import { config } from '../config/env.js';
import { verifyToken, extractToken } from './auth.js';
import type { AuthPayload, ApiResponse } from '../types/index.js';

export interface Request extends IncomingMessage {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: AuthPayload;
}

export type Response = ServerResponse;

export type Handler = (req: Request, res: Response) => Promise<void> | void;

export type Route = {
  method: string;
  pattern: RegExp;
  handler: Handler;
  paramNames: string[];
};

/**
 * Parse JSON body from request
 */
export async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
export function sendJson(res: Response, statusCode: number, data: ApiResponse): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.cors.origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  });
  res.end(JSON.stringify(data));
}

/**
 * Send success response
 */
export function sendSuccess<T>(res: Response, data: T, message?: string): void {
  sendJson(res, 200, { success: true, data, message });
}

/**
 * Send created response
 */
export function sendCreated<T>(res: Response, data: T, message?: string): void {
  sendJson(res, 201, { success: true, data, message });
}

/**
 * Send error response
 */
export function sendError(res: Response, statusCode: number, error: string): void {
  sendJson(res, statusCode, { success: false, error });
}

/**
 * Authentication middleware
 */
export function authenticate(handler: Handler): Handler {
  return async (req: Request, res: Response) => {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      const payload = verifyToken(token);
      req.user = payload;
      
      await handler(req, res);
    } catch (error) {
      sendError(res, 401, 'Invalid or expired token');
    }
  };
}

/**
 * Authorization middleware - check if user has required role
 */
export function authorize(...roles: string[]): (handler: Handler) => Handler {
  return (handler: Handler) => {
    return async (req: Request, res: Response) => {
      if (!req.user) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      if (!roles.includes(req.user.role)) {
        sendError(res, 403, 'Insufficient permissions');
        return;
      }

      await handler(req, res);
    };
  };
}

/**
 * Convert path pattern to regex and extract parameter names
 */
export function pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const pattern = path.replace(/:([^/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });
  return {
    pattern: new RegExp(`^${pattern}$`),
    paramNames,
  };
}

/**
 * Extract parameters from URL based on route pattern
 */
export function extractParams(url: string, route: Route): Record<string, string> {
  const match = url.match(route.pattern);
  if (!match) return {};

  const params: Record<string, string> = {};
  route.paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });
  return params;
}

/**
 * Parse query string
 */
export function parseQuery(url: string): Record<string, string> {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};

  const queryString = url.substring(queryIndex + 1);
  const params: Record<string, string> = {};

  queryString.split('&').forEach((param) => {
    const [key, value] = param.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });

  return params;
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: IncomingMessage, res: Response): boolean {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': config.cors.origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return true;
  }
  return false;
}
