import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { moveTask, moveGoal } from '@/lib/tasks';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, newBoardId, newOrder, type } = await request.json();
    
    if (!taskId || !newBoardId || newOrder === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'task') {
      await moveTask(user.id, taskId, newBoardId, newOrder, 'task');
    } else if (type === 'goal') {
      await moveGoal(user.id, taskId, newBoardId, newOrder);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving task/goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}