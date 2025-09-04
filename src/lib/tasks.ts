import { query } from './database';
import type { Task, Board, BoardName, ItemType } from '@/types';

// Task management functions
export const getTasks = async (userId: string): Promise<Task[]> => {
  try {
    const result = await query(
        'SELECT id, description as content, board_id as "boardId", task_order as "order", created_at as "createdAt" FROM tasks WHERE user_id = $1 ORDER BY task_order ASC',
        [userId]
      );

    return result.rows.map(row => ({
      ...row,
      id: row.id.toString(),
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getGoals = async (userId: string): Promise<Task[]> => {
  try {
    const result = await query(
        'SELECT id, description as content, board_id as "boardId", goal_order as "order", created_at as "createdAt" FROM goals WHERE user_id = $1 ORDER BY goal_order ASC',
        [userId]
      );

    return result.rows.map(row => ({
      ...row,
      id: row.id.toString(),
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
};

export const createTask = async (userId: string, content: string, boardId: BoardName, type: ItemType): Promise<Task> => {
  try {
    const tableName = type === 'task' ? 'tasks' : 'goals';
    
    // Get the current max order for this board
    const orderColumn = type === 'task' ? 'task_order' : 'goal_order';
    const maxOrderResult = await query(
        `SELECT COALESCE(MAX(${orderColumn}), 0) as max_order FROM ${tableName} WHERE user_id = $1 AND board_id = $2`,
        [userId, boardId]
      );
    
    const newOrder = maxOrderResult.rows[0].max_order + 1;
    
    const result = await query(
      `INSERT INTO ${tableName} (user_id, title, description, board_id, ${orderColumn}) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, description as content, board_id as "boardId", ${orderColumn} as "order", created_at as "createdAt"`,
      [userId, content, content, boardId, newOrder]
    );

    const newTask = result.rows[0];
    return {
      ...newTask,
      id: newTask.id.toString(),
      createdAt: newTask.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Specific functions for goals
export const createGoal = async (userId: string, content: string, boardId: BoardName): Promise<Task> => {
  return createTask(userId, content, boardId, 'goal');
};

export const updateGoal = async (userId: string, goalId: string, content: string): Promise<void> => {
  return updateTask(userId, goalId, content, 'goal');
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
  return deleteTask(userId, goalId, 'goal');
};

export const moveGoal = async (userId: string, goalId: string, newBoardId: BoardName, newOrder: number): Promise<void> => {
  return moveTask(userId, goalId, newBoardId, newOrder, 'goal');
};

export const reorderGoals = async (userId: string, boardId: BoardName, goalIds: string[]): Promise<void> => {
  return reorderTasks(userId, boardId, goalIds, 'goal');
};

export const updateTask = async (userId: string, taskId: string, content: string, type: ItemType): Promise<void> => {
  try {
    const tableName = type === 'task' ? 'tasks' : 'goals';
    
    await query(
      `UPDATE ${tableName} SET description = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`,
      [content, taskId, userId]
    );
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const deleteTask = async (userId: string, taskId: string, type: ItemType): Promise<void> => {
  try {
    const tableName = type === 'task' ? 'tasks' : 'goals';
    
    await query(
      `DELETE FROM ${tableName} WHERE id = $1 AND user_id = $2`,
      [taskId, userId]
    );
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const moveTask = async (userId: string, taskId: string, newBoardId: BoardName, newOrder: number, type: ItemType): Promise<void> => {
  try {
    const tableName = type === 'task' ? 'tasks' : 'goals';
    const orderColumn = type === 'task' ? 'task_order' : 'goal_order';
    
    await query(
      `UPDATE ${tableName} SET board_id = $1, ${orderColumn} = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4`,
      [newBoardId, newOrder, taskId, userId]
    );
  } catch (error) {
    console.error('Error moving task:', error);
    throw error;
  }
};

export const reorderTasks = async (userId: string, boardId: BoardName, taskIds: string[], type: ItemType): Promise<void> => {
  try {
    const tableName = type === 'task' ? 'tasks' : 'goals';
    const orderColumn = type === 'task' ? 'task_order' : 'goal_order';
    
    // Update order for each task
    for (let i = 0; i < taskIds.length; i++) {
      await query(
        `UPDATE ${tableName} SET ${orderColumn} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`,
        [i, taskIds[i], userId]
      );
    }
  } catch (error) {
    console.error('Error reordering tasks:', error);
    throw error;
  }
};

// Helper function to organize tasks into boards
export const organizeTasks = (tasks: Task[], boardIds: string[]): Board[] => {
  const boards: Board[] = boardIds.map(id => ({
    id: id as BoardName,
    title: id,
    tasks: []
  }));

  tasks.forEach(task => {
    const board = boards.find(b => b.id === task.boardId);
    if (board) {
      board.tasks.push(task);
    }
  });

  // Sort tasks within each board by order
  boards.forEach(board => {
    board.tasks.sort((a, b) => a.order - b.order);
  });

  return boards;
};

// Alias for backward compatibility
export const organizeTasksIntoBoards = organizeTasks;