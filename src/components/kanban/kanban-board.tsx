'use client';

import type { Board, BoardName, Task } from '@/types';
import { KanbanColumn } from './kanban-column';
import { SortableContext } from '@dnd-kit/sortable';
import { useMemo } from 'react';

interface KanbanBoardProps {
  boards: Board[];
  onAddTask: (boardId: BoardName, content: string) => void;
  onEditTask: (taskId: string, newContent: string) => void;
  onDeleteTask: (taskId: string) => void;
  activeTask: Task | null;
  type: 'task' | 'goal';
}

export function KanbanBoard({ boards, onAddTask, onEditTask, onDeleteTask, activeTask, type }: KanbanBoardProps) {
  const boardsId = useMemo(() => boards.map((board) => board.id), [boards]);

  return (
    <div className="flex gap-6 items-start">
      <SortableContext items={boardsId}>
        {boards.map(board => (
          <KanbanColumn
            key={board.id}
            board={board}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            activeTask={activeTask}
            type={type}
          />
        ))}
      </SortableContext>
    </div>
  );
}
