import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { reorderTasks, reorderGoals } from '@/lib/tasks';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId, itemIds, type } = await request.json();
    
    if (!boardId || !itemIds || !Array.isArray(itemIds) || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'task') {
      await reorderTasks(user.id, boardId, itemIds, 'task');
    } else if (type === 'goal') {
      await reorderGoals(user.id, boardId, itemIds);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks/goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}