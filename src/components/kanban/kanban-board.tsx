
'use client';

import type { Board, BoardName, Task, ItemType } from '@/types';
import { KanbanColumn } from './kanban-column';
import { SortableContext } from '@dnd-kit/sortable';
import { useMemo } from 'react';

interface KanbanBoardProps {
  boards: Board[];
  onAddTask: (boardId: BoardName, content: string, type: ItemType) => void;
  onEditTask: (taskId: string, newContent: string, type: ItemType) => void;
  onDeleteTask: (taskId: string, type: ItemType) => void;
  onMoveTask: (taskId: string, type: ItemType) => void;
  activeTask: Task | null;
  type: ItemType;
}

export function KanbanBoard({ boards, onAddTask, onEditTask, onDeleteTask, onMoveTask, activeTask, type }: KanbanBoardProps) {
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
            onMoveTask={onMoveTask}
            activeTask={activeTask}
            type={type}
          />
        ))}
      </SortableContext>
    </div>
  );
}

    