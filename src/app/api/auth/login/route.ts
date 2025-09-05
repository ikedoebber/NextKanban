import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { username, password } = validation.data;
    
    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    const user = await authenticateUser(username, password);
    
    if (!user) {
      // Log failed login attempt
      console.warn(`Failed login attempt for username: ${username} from IP: ${clientIP}`);
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Log successful login
    console.info(`Successful login for user: ${username} (ID: ${user.id}) from IP: ${clientIP}`);

    const token = generateToken(user);
    
    const response = NextResponse.json(
      { 
        message: 'Login successful', 
        token,
        user: {
          id: user.id,
          username: user.username
        }
      },
      { status: 200 }
    );
    
    // Set secure cookie with token
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}