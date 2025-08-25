
'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';

import type { Board, Task, BoardName } from '@/types';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { AiSuggester } from '@/components/kanban/ai-suggester';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

const initialBoards: Board[] = [
  { id: 'Não Iniciado', title: 'Não Iniciado', tasks: [
    { id: 'task-1', content: 'Projetar a interface do usuário principal' },
    { id: 'task-2', content: 'Configurar a estrutura do projeto' },
  ]},
  { id: 'A Fazer', title: 'A Fazer', tasks: [
    { id: 'task-3', content: 'Desenvolver o componente do quadro Kanban' },
    { id: 'task-4', content: 'Implementar a funcionalidade de arrastar e soltar' },
  ] },
  { id: 'Fazendo', title: 'Fazendo', tasks: [
    { id: 'task-5', content: 'Integrar o recurso de sugestão de tarefas de IA' },
  ] },
  { id: 'Feito', title: 'Feito', tasks: [
    { id: 'task-6', content: 'Implantar a aplicação' },
  ] },
];

const initialGoalsBoards: Board[] = [
  { id: 'Semanal', title: 'Semanal', tasks: [
      { id: 'goal-1', content: 'Correr 5km' },
  ]},
  { id: 'Mensal', title: 'Mensal', tasks: [
      { id: 'goal-2', content: 'Ler 2 livros' },
  ] },
  { id: 'Trimestral', title: 'Trimestral', tasks: [
      { id: 'goal-3', content: 'Aprender uma nova habilidade' },
  ] },
  { id: 'Anual', title: 'Anual', tasks: [
      { id: 'goal-4', content: 'Viajar para um novo país' },
  ] },
];

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [goalsBoards, setGoalsBoards] = useState<Board[]>([]);

  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setBoards(initialBoards);
    setGoalsBoards(initialGoalsBoards);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getBoardSetters = (type?: string) => {
    return type === 'goal' ? [goalsBoards, setGoalsBoards] as const : [boards, setBoards] as const;
  }

  const handleAddTask = (boardId: BoardName, content: string) => {
    if (!content) return;
    const isGoal = initialGoalsBoards.some(b => b.id === boardId);
    const [currentBoards, setBoardsState] = getBoardSetters(isGoal ? 'goal' : 'task');
    const newTask: Task = {
      id: `${isGoal ? 'goal' : 'task'}-${Date.now()}`,
      content,
    };
    setBoardsState(currentBoards =>
      currentBoards.map(board =>
        board.id === boardId
          ? { ...board, tasks: [...board.tasks, newTask] }
          : board
      )
    );
  };

  const handleEditTask = (taskId: string, newContent: string) => {
    const [currentBoards, setBoardsState] = getBoardSetters(taskId.startsWith('goal') ? 'goal' : 'task');
    setBoardsState(boards =>
      boards.map(board => ({
        ...board,
        tasks: board.tasks.map(task =>
          task.id === taskId ? { ...task, content: newContent } : task
        ),
      }))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    const [currentBoards, setBoardsState] = getBoardSetters(taskId.startsWith('goal') ? 'goal' : 'task');
    setBoardsState(boards =>
      boards.map(board => ({
        ...board,
        tasks: board.tasks.filter(task => task.id !== taskId),
      }))
    );
  };
  
  const findBoard = (boardId: BoardName | string, type?: string) => {
    const [sourceBoards] = getBoardSetters(type);
    return sourceBoards.find(board => board.id === boardId);
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    const { boardId, type } = active.data.current || {};
    
    const board = findBoard(boardId, type);
    if (!board) return;
    
    const task = board.tasks.find(t => t.id === id);
    if (!task) return;
  
    setActiveBoard(board);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;

    const { type: activeType } = active.data.current || {};
    const { type: overType } = over.data.current || {};

    if (activeType !== overType && overType) {
        return;
    }

    const [currentBoards, setBoardsState] = getBoardSetters(activeType);
  
    const isActiveATask = active.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Board';
  
    if (isActiveATask && isOverAColumn) {
        setBoardsState(boards => {
            const activeBoardId = active.data.current!.boardId;
            const overBoardId = overId;
    
            const activeBoard = boards.find(b => b.id === activeBoardId);
            const overBoard = boards.find(b => b.id === overBoardId);
    
            if (!activeBoard || !overBoard || activeBoard.id === overBoard.id) {
                return boards;
            }
    
            const activeTaskIndex = activeBoard.tasks.findIndex(t => t.id === activeId);
            if (activeTaskIndex === -1) {
                return boards;
            }
    
            const [movedTask] = activeBoard.tasks.splice(activeTaskIndex, 1);
            overBoard.tasks.push(movedTask);
            active.data.current!.boardId = overBoard.id;
    
            return [...boards];
        });
    }
  
    const isOverATask = over.data.current?.type === 'Task';
  
    if (isActiveATask && isOverATask) {
        setBoardsState(boards => {
            const activeBoardId = active.data.current!.boardId;
            const overBoardId = over.data.current!.boardId;
    
            const activeBoard = boards.find(b => b.id === activeBoardId);
            const overBoard = boards.find(b => b.id === overBoardId);
    
            if (!activeBoard || !overBoard) {
                return boards;
            }
    
            if (activeBoard.id === overBoard.id) {
                const activeIndex = activeBoard.tasks.findIndex(t => t.id === activeId);
                const overIndex = overBoard.tasks.findIndex(t => t.id === overId);
                activeBoard.tasks = arrayMove(activeBoard.tasks, activeIndex, overIndex);
            } else {
                const activeTaskIndex = activeBoard.tasks.findIndex(t => t.id === activeId);
                const overTaskIndex = overBoard.tasks.findIndex(t => t.id === overId);
    
                const [movedTask] = activeBoard.tasks.splice(activeTaskIndex, 1);
                overBoard.tasks.splice(overTaskIndex, 0, movedTask);
                active.data.current!.boardId = overBoard.id;
            }
    
            return [...boards];
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
        <main className="flex-1 overflow-x-auto overflow-y-auto p-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Tarefas do Projeto</h2>
            <KanbanBoard
              boards={boards}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              activeTask={activeTask}
              type="task"
            />
          </div>
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Metas</h2>
             <KanbanBoard
              boards={goalsBoards}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              activeTask={activeTask}
              type="goal"
            />
          </div>
        </main>
      </div>
    </DndContext>
  );
}
