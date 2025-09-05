import { query } from './database';
import type { Task, Board, BoardName, ItemType } from '@/types';

// Task management functions
export const getTasks = async (userId: string): Promise<Task[]> => {
  try {
    const result = query(
        'SELECT id, content, board_id as "boardId", task_order as "order", created_at as "createdAt" FROM tasks WHERE user_id = ? ORDER BY task_order ASC',
        [userId]
      ) as any[];

    return result.map(row => ({
      ...row,
      id: row.id.toString(),
      createdAt: new Date(row.createdAt).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const getGoals = async (userId: string): Promise<Task[]> => {
  try {
    const result = query(
        'SELECT id, content, board_id as "boardId", goal_order as "order", created_at as "createdAt" FROM goals WHERE user_id = ? ORDER BY goal_order ASC',
        [userId]
      ) as any[];

    return result.map(row => ({
      ...row,
      id: row.id.toString(),
      createdAt: new Date(row.createdAt).toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
};

export const createTask = async (userId: string, content: string, boardId: BoardName, type: ItemType): Promise<Task> => {
  try {
    console.log(`Creating ${type} for user:`, userId, 'content:', content, 'boardId:', boardId);
    
    // Verify user exists
    const userExists = query('SELECT id FROM users WHERE id = ?', [userId]) as any[];
    console.log('User exists check:', userExists.length > 0, 'userId:', userId);
    
    if (userExists.length === 0) {
      throw new Error(`User with id ${userId} does not exist`);
    }
    
    const tableName = type === 'task' ? 'tasks' : 'goals';
    
    // Get the current max order for this board
    const orderColumn = type === 'task' ? 'task_order' : 'goal_order';
    const maxOrderResult = query(
        `SELECT COALESCE(MAX(${orderColumn}), 0) as max_order FROM ${tableName} WHERE user_id = ? AND board_id = ?`,
        [userId, boardId]
      ) as any[];
    
    const newOrder = maxOrderResult[0].max_order + 1;
    
    console.log(`Inserting into ${tableName}:`, { userId, content, boardId, newOrder });
    const result = query(
      `INSERT INTO ${tableName} (user_id, content, board_id, ${orderColumn}) VALUES (?, ?, ?, ?)`,
      [userId, content, boardId, newOrder]
    ) as any;

    // Get the created task
    const createdTask = query(
      `SELECT id, content, board_id as "boardId", ${orderColumn} as "order", created_at as "createdAt" FROM ${tableName} WHERE id = ?`,
      [result.lastInsertRowid]
    ) as any[];

    const newTask = createdTask[0];
    return {
      ...newTask,
      id: newTask.id.toString(),
      createdAt: new Date(newTask.createdAt).toISOString(),
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
    
    query(
      `UPDATE ${tableName} SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
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
    
    query(
      `DELETE FROM ${tableName} WHERE id = ? AND user_id = ?`,
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
    
    query(
      `UPDATE ${tableName} SET board_id = ?, ${orderColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
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
      query(
        `UPDATE ${tableName} SET ${orderColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
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