
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext as SortableListContext } from '@dnd-kit/sortable';

import type { Board, BoardName, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KanbanCard } from './kanban-card';
import { AddTaskDialog } from './add-task-dialog';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface KanbanColumnProps {
  board: Board;
  onAddTask: (boardId: BoardName, content: string) => void;
  onEditTask: (taskId: string, newContent: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string) => void;
  activeTask: Task | null;
  type: 'task' | 'goal';
}

export function KanbanColumn({ board, onAddTask, onEditTask, onDeleteTask, onMoveTask, activeTask, type }: KanbanColumnProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: board.id,
    data: {
      type: 'Board',
      boardType: type,
    },
  });

  const tasksIds = useMemo(() => board.tasks.map((task) => task.id), [board.tasks]);
  const isLastColumn = useMemo(() => {
    if (type === 'task') {
      return board.id === 'Feito';
    }
    if (type === 'goal') {
      return board.id === 'Anual';
    }
    return false;
  }, [board.id, type]);

  const handleAddTask = (content: string) => {
    onAddTask(board.id, content);
    setIsAddDialogOpen(false);
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        className={cn(
          'w-80 shrink-0 h-fit flex flex-col transition-colors duration-300',
          isOver ? 'bg-primary/10 border-primary' : 'bg-card'
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
          <CardTitle className="text-lg font-semibold">{board.title}</CardTitle>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-2 flex-1">
          <ScrollArea className="max-h-[calc(100vh-26rem)]">
            <div className="flex flex-col gap-2 p-2 min-h-[6rem]">
              <SortableListContext items={tasksIds}>
                {board.tasks.length > 0 ? (
                  board.tasks.map(task => (
                    <KanbanCard
                      key={task.id}
                      task={task}
                      boardId={board.id}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onMove={onMoveTask}
                      isLastColumn={isLastColumn}
                      isDragging={activeTask?.id === task.id}
                      type={type}
                    />
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-4">Nenhuma tarefa ainda.</div>
                )}
              </SortableListContext>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTask={handleAddTask}
        boardName={board.title}
      />
    </>
  );
}
