import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getTasks, createTask, updateTask, deleteTask, moveTask, reorderTasks } from '@/lib/tasks';
import { z } from 'zod';

// Validation schemas
const createTaskSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Content too long'),
  boardId: z.string().min(1, 'Board ID is required'),
  type: z.enum(['task', 'goal'], { required_error: 'Type must be task or goal' })
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  content: z.string().min(1, 'Content is required').max(500, 'Content too long'),
  type: z.enum(['task', 'goal'], { required_error: 'Type must be task or goal' })
});

const deleteTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  type: z.enum(['task', 'goal'], { required_error: 'Type must be task or goal' })
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tasks = await getTasks(user.id);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate input with Zod
    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { content, boardId, type } = validation.data;
    const task = await createTask(user.id, content, boardId, type);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
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
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { taskId, content, type } = validation.data;
    await updateTask(user.id, taskId, content, type);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
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
    const params = {
      taskId: searchParams.get('taskId'),
      type: searchParams.get('type')
    };
    
    // Validate query parameters with Zod
    const validation = deleteTaskSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const { taskId, type } = validation.data;
    await deleteTask(user.id, taskId, type);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}