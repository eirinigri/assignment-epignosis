import { UserRepository } from '../repositories/userRepository.js';
import { verifyPassword, generateToken } from '../utils/auth.js';
import { loginSchema } from '../utils/validation.js';
import { sendSuccess, sendError, parseBody, type Request, type Response } from '../utils/http.js';

const userRepo = new UserRepository();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const body = await parseBody(req);
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await userRepo.findByEmail(validatedData.email);
    if (!user) {
      sendError(res, 401, 'Invalid email or password');
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password_hash);
    if (!isValidPassword) {
      sendError(res, 401, 'Invalid email or password');
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    sendSuccess(res, {
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      sendError(res, 400, 'Validation error: ' + JSON.stringify(error));
    } else {
      console.error('Login error:', error);
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * GET /api/auth/me
 * Get current user information
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 401, 'Authentication required');
      return;
    }

    const user = await userRepo.findById(req.user.userId);
    if (!user) {
      sendError(res, 404, 'User not found');
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}
