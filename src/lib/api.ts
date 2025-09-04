import { Task, BoardName } from './types';

// API utility functions for client-side operations

export const apiGetTasks = async (): Promise<Task[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
};

export const apiGetGoals = async (): Promise<Task[]> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/goals', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch goals');
  }
  return response.json();
};

export const apiCreateTask = async (content: string, boardId: BoardName, type: 'task' | 'goal'): Promise<Task> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, boardId, type }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  return response.json();
};

export const apiCreateGoal = async (content: string, boardId: BoardName): Promise<Task> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/goals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ content, boardId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create goal');
  }
  return response.json();
};

export const apiUpdateTask = async (taskId: string, content: string, type: 'task' | 'goal'): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ taskId, content, type }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update task');
  }
};

export const apiUpdateGoal = async (goalId: string, content: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/goals', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ goalId, content }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update goal');
  }
};

export const apiDeleteTask = async (taskId: string, type: 'task' | 'goal'): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/tasks?taskId=${taskId}&type=${type}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
};

export const apiDeleteGoal = async (goalId: string): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/goals?goalId=${goalId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete goal');
  }
};

export const apiMoveTask = async (taskId: string, newBoardId: BoardName, newOrder: number, type: 'task' | 'goal'): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks/move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ taskId, newBoardId, newOrder, type }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to move task');
  }
};

export const apiReorderTasks = async (boardId: BoardName, itemIds: string[], type: 'task' | 'goal'): Promise<void> => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/tasks/reorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ boardId, itemIds, type }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to reorder tasks');
  }
};

// Helper function to organize tasks into boards (client-side only)
export const organizeTasksIntoBoards = (tasks: Task[], initialBoards: { id: BoardName; title: string; tasks: Task[] }[]) => {
  const boards = initialBoards.map(board => ({
    id: board.id,
    title: board.title,
    tasks: [] as Task[]
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