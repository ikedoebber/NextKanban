import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './database';

// JWT token verification for API requests
export async function verifyToken(request: Request): Promise<{ id: string; username: string } | null> {
  try {
    let token: string | null = null;
    
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // If no token in header, try to get from cookie (for Next.js requests)
    if (!token && 'cookies' in request) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies.token;
      }
    }
    
    if (!token) {
      console.log('verifyToken: No token found');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };
    console.log('verifyToken: Decoded token:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Simple token verification for string tokens
export function verifyTokenString(token: string): { id: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Generate JWT token
export const generateToken = (user: { id: string; username: string }) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '60m' }
  );
};

// Authenticate user with username and password
export const authenticateUser = async (username: string, password: string) => {
  try {
    // Find user in database
    const result = query(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    ) as any[];

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordValid) {
      return null;
    }

    return {
      id: user.id.toString(),
      username: user.username,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
};

// Helper functions for user management
export const createUser = async (username: string, email: string, password: string) => {
  try {
    // Check if user already exists
    const existingUser = query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    ) as any[];

    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    ) as any;

    // Get the created user by email since id is auto-generated TEXT
    const createdUser = query(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    return createdUser[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserById = async (id: string) => {
  try {
    const result = query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [id]
    ) as any[];

    return result[0] || null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};