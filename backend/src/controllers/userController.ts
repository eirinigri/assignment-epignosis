import { UserRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/auth.js';
import { createUserSchema, updateUserSchema } from '../utils/validation.js';
import {
  sendSuccess,
  sendCreated,
  sendError,
  parseBody,
  type Request,
  type Response,
} from '../utils/http.js';

const userRepo = new UserRepository();

/**
 * GET /api/users
 * Get all users (Manager only)
 */
export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await userRepo.findAll();
    sendSuccess(res, users);
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}

/**
 * GET /api/users/:id
 * Get user by ID (Manager only)
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid user ID');
      return;
    }

    const user = await userRepo.findById(id);
    if (!user) {
      sendError(res, 404, 'User not found');
      return;
    }

    sendSuccess(res, user);
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}

/**
 * POST /api/users
 * Create a new user (Manager only)
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const body = await parseBody(req);
    const validatedData = createUserSchema.parse(body);

    // Check if email already exists
    const emailExists = await userRepo.emailExists(validatedData.email);
    if (emailExists) {
      sendError(res, 409, 'Email already exists');
      return;
    }

    // Check if employee code already exists
    const codeExists = await userRepo.employeeCodeExists(validatedData.employee_code);
    if (codeExists) {
      sendError(res, 409, 'Employee code already exists');
      return;
    }

    // Hash password
    const password_hash = await hashPassword(validatedData.password);

    // Create user
    const user = await userRepo.create({
      ...validatedData,
      password_hash,
    });

    sendCreated(res, user, 'User created successfully');
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      sendError(res, 400, 'Validation error: ' + JSON.stringify(error));
    } else {
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * PUT /api/users/:id
 * Update user (Manager only)
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid user ID');
      return;
    }

    const body = await parseBody(req);
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await userRepo.findById(id);
    if (!existingUser) {
      sendError(res, 404, 'User not found');
      return;
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email) {
      const emailExists = await userRepo.emailExists(validatedData.email, id);
      if (emailExists) {
        sendError(res, 409, 'Email already exists');
        return;
      }
    }

    // Hash password if provided
    let password_hash: string | undefined;
    if (validatedData.password) {
      password_hash = await hashPassword(validatedData.password);
    }

    // Update user
    const updatedUser = await userRepo.update(id, {
      name: validatedData.name,
      email: validatedData.email,
      password_hash,
    });

    if (!updatedUser) {
      sendError(res, 404, 'User not found');
      return;
    }

    sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      sendError(res, 400, 'Validation error: ' + JSON.stringify(error));
    } else {
      sendError(res, 500, 'Internal server error');
    }
  }
}

/**
 * DELETE /api/users/:id
 * Delete user and all associated data (Manager only)
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params?.id || '', 10);
    if (isNaN(id)) {
      sendError(res, 400, 'Invalid user ID');
      return;
    }

    // Prevent manager from deleting themselves
    if (req.user && req.user.userId === id) {
      sendError(res, 400, 'Cannot delete your own account');
      return;
    }

    const deleted = await userRepo.delete(id);
    if (!deleted) {
      sendError(res, 404, 'User not found');
      return;
    }

    sendSuccess(res, null, 'User and associated data deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Internal server error');
  }
}
