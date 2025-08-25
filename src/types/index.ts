export interface Task {
  id: string;
  content: string;
}

export type BoardName = 'Not Started' | 'To Do' | 'Doing' | 'Done';

export interface Board {
  id: BoardName;
  title: string;
  tasks: Task[];
}
