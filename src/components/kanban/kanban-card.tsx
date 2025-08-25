
'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { BoardName, Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KanbanCardProps {
  task: Task;
  boardId: BoardName;
  onEdit: (taskId: string, newContent: string) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string) => void;
  isLastColumn: boolean;
  isDragging: boolean;
  type: 'task' | 'goal';
}

export function KanbanCard({ task, boardId, onEdit, onDelete, onMove, isLastColumn, isDragging, type }: KanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(task.content);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      boardId,
    },
  });

  const style = {
    transition: transition,
    transform: CSS.Transform.toString(transform),
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);
  
  const handleSave = () => {
    if (content.trim() && content.trim() !== task.content) {
      onEdit(task.id, content.trim());
    } else {
      setContent(task.content);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setContent(task.content);
      setIsEditing(false);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative touch-none bg-card hover:shadow-lg transition-all duration-200 ease-in-out hover:-translate-y-1",
        isDragging ? "opacity-75 shadow-2xl z-50 transform-none" : "shadow-md",
        isOver && !isDragging && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3 flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="Alça de arrastar"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        {!isLastColumn && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="pt-1">
                  <Checkbox id={`check-${task.id}`} onCheckedChange={() => onMove(task.id)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mover para o próximo quadro</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <div className="flex-1 pt-0.5">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
            />
          ) : (
            <p
              className={cn("text-sm min-h-[2rem] flex items-center", isLastColumn && 'pl-2')}
              onClick={() => setIsEditing(true)}
            >
              {task.content}
            </p>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente esta tarefa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(task.id)}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
