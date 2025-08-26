
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddTask: (content: string) => void;
  boardName: string;
}

export function AddTaskDialog({ isOpen, onOpenChange, onAddTask, boardName }: AddTaskDialogProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAddTask(content.trim());
      setContent('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar uma nova tarefa a {boardName}</DialogTitle>
            <DialogDescription>Insira os detalhes da sua nova tarefa abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-content" className="text-right">
                Tarefa
              </Label>
              <Input
                id="task-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="col-span-3"
                placeholder="ex.: Finalizar relatório do projeto"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Adicionar Tarefa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    