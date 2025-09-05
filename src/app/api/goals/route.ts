import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getGoals, createGoal, updateGoal, deleteGoal, moveGoal, reorderGoals } from '@/lib/tasks';
import { z } from 'zod';

// Validation schemas
const createGoalSchema = z.object({
  content: z.string()
    .min(1, 'Goal content is required')
    .max(500, 'Goal content must be less than 500 characters')
    .trim(),
  boardId: z.string()
    .min(1, 'Board ID is required')
});

const updateGoalSchema = z.object({
  goalId: z.string()
    .min(1, 'Goal ID is required'),
  content: z.string()
    .min(1, 'Goal content is required')
    .max(500, 'Goal content must be less than 500 characters')
    .trim()
});

const deleteGoalSchema = z.object({
  goalId: z.string()
    .min(1, 'Goal ID is required')
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await getGoals(user.id);
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    console.log('Goals POST - User from verifyToken:', user);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Goals POST - Request body:', body);
    
    // Validate input with Zod
    const validation = createGoalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { content, boardId } = validation.data;
    console.log('Goals POST - Calling createGoal with userId:', user.id, 'content:', content, 'boardId:', boardId);
    const goal = await createGoal(user.id, content, boardId);
    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input with Zod
    const validation = updateGoalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { goalId, content } = validation.data;
    await updateGoal(user.id, goalId, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('goalId');
    
    // Validate input with Zod
    const validation = deleteGoalSchema.safeParse({ goalId });
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const { goalId: validatedGoalId } = validation.data;
    await deleteGoal(user.id, validatedGoalId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}