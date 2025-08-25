'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit, Plus } from 'lucide-react';

import type { Board, Task, BoardName } from '@/types';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { AiSuggester } from '@/components/kanban/ai-suggester';
import { AddTaskDialog } from '@/components/kanban/add-task-dialog';
import { Button } from '@/components/ui/button';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

const initialBoards: Board[] = [
  { id: 'Not Started', title: 'Not Started', tasks: [
    { id: 'task-1', content: 'Design the main UI' },
    { id: 'task-2', content: 'Setup project structure' },
  ]},
  { id: 'To Do', title: 'To Do', tasks: [
    { id: 'task-3', content: 'Develop the Kanban board component' },
    { id: 'task-4', content: 'Implement drag-and-drop functionality' },
  ] },
  { id: 'Doing', title: 'Doing', tasks: [
    { id: 'task-5', content: 'Integrate AI task suggestion feature' },
  ] },
  { id: 'Done', title: 'Done', tasks: [
    { id: 'task-6', content: 'Deploy the application' },
  ] },
];

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setBoards(initialBoards);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddTask = (boardId: BoardName, content: string) => {
    if (!content) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      content,
    };
    setBoards(boards =>
      boards.map(board =>
        board.id === boardId
          ? { ...board, tasks: [...board.tasks, newTask] }
          : board
      )
    );
  };

  const handleEditTask = (taskId: string, newContent: string) => {
    setBoards(boards =>
      boards.map(board => ({
        ...board,
        tasks: board.tasks.map(task =>
          task.id === taskId ? { ...task, content: newContent } : task
        ),
      }))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setBoards(boards =>
      boards.map(board => ({
        ...board,
        tasks: board.tasks.filter(task => task.id !== taskId),
      }))
    );
  };
  
  const findBoard = (boardId: BoardName | string) => {
    return boards.find(board => board.id === boardId);
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    const { boardId } = active.data.current || {};
    const board = findBoard(boardId);
    if (!board) return;

    setActiveBoard(board);
    setActiveTask(board.tasks.find(task => task.id === id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    const isOverATask = over.data.current?.type === 'Task';
    
    if (isActiveATask) {
      setBoards(boards => {
        const activeBoardId = active.data.current?.boardId;
        const overBoardId = over.data.current?.boardId || over.id;
        
        const activeBoard = findBoard(activeBoardId);
        const overBoard = findBoard(overBoardId);

        if (!activeBoard || !overBoard || activeBoardId === overBoardId) {
          return boards;
        }

        let newBoards = [...boards];
        const activeTaskIndex = activeBoard.tasks.findIndex(t => t.id === activeId);
        
        if (activeTaskIndex === -1) {
            return boards;
        }
        
        const [movedTask] = newBoards.find(b => b.id === activeBoardId)!.tasks.splice(activeTaskIndex, 1);
        
        if (!movedTask) {
            return boards;
        }

        const overTaskIndex = isOverATask ? overBoard.tasks.findIndex(t => t.id === overId) : overBoard.tasks.length;
        newBoards.find(b => b.id === overBoardId)!.tasks.splice(overTaskIndex, 0, movedTask);

        return newBoards;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveBoard(null);
    setActiveTask(null);
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} sensors={sensors}>
      <div className="flex flex-col h-full w-full">
        <header className="p-4 border-b flex justify-between items-center bg-card/50 backdrop-blur-sm">
          <h1 className="text-2xl font-bold font-headline text-primary-foreground/90">NextKanban</h1>
          <AiSuggester onSuggested={handleAddTask} />
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <KanbanBoard
            boards={boards}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            activeTask={activeTask}
          />
        </main>
      </div>
    </DndContext>
  );
}
