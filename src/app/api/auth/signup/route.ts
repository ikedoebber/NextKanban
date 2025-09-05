import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const signupSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input with Zod
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { username, email, password } = validation.data;
    
    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Sanitize inputs (trim whitespace)
    const sanitizedUsername = username.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    const user = await createUser(sanitizedUsername, sanitizedEmail, password);
    
    // Log successful signup
    console.info(`New user registered: ${sanitizedUsername} (${sanitizedEmail}) from IP: ${clientIP}`);
    
    return NextResponse.json(
      { 
        message: 'User created successfully', 
        userId: user.id,
        username: user.username
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle specific database constraint errors
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    if (error.message?.includes('UNIQUE constraint failed: users.username')) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }
    
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}