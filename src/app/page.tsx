
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

  const getBoardSetters = (type?: string): [Board[], React.Dispatch<React.SetStateAction<Board[]>>] => {
    return type === 'goal' ? [goalsBoards, setGoalsBoards] : [boards, setBoards];
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
    const [, setBoardsState] = getBoardSetters(taskId.startsWith('goal') ? 'goal' : 'task');
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
    const [, setBoardsState] = getBoardSetters(taskId.startsWith('goal') ? 'goal' : 'task');
    setBoardsState(boards =>
      boards.map(board => ({
        ...board,
        tasks: board.tasks.filter(task => task.id !== taskId),
      }))
    );
  };
  
  const findBoardForTask = (taskId: string): [Board[] | undefined, Board | undefined, number] => {
    const taskType = taskId.startsWith('goal') ? 'goal' : 'task';
    const [sourceBoards] = getBoardSetters(taskType);
    for (const board of sourceBoards) {
        const taskIndex = board.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            return [sourceBoards, board, taskIndex];
        }
    }
    return [undefined, undefined, -1];
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    
    const [, board, taskIndex] = findBoardForTask(id as string);
    if(board && taskIndex > -1) {
      setActiveTask(board.tasks[taskIndex]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;

    const activeTaskType = activeId.startsWith('goal') ? 'goal' : 'task';
    const overTaskType = over.data.current?.type === 'Task' ? (overId.startsWith('goal') ? 'goal' : 'task') : over.data.current?.boardType;

    if (!overTaskType || activeTaskType !== overTaskType) {
        return;
    }

    const [currentBoards, setBoardsState] = getBoardSetters(activeTaskType);
  
    const isActiveATask = active.data.current?.type === 'Task';
    const isOverAColumn = over.data.current?.type === 'Board';

    // Dragging a task over a column
    if (isActiveATask && isOverAColumn) {
        const [, activeBoard] = findBoardForTask(activeId);
        const overBoard = currentBoards.find(b => b.id === overId);

        if (activeBoard && overBoard && activeBoard.id !== overBoard.id) {
            setBoardsState(boards => {
                const newBoards = [...boards];
                const sourceBoard = newBoards.find(b => b.id === activeBoard.id);
                const destinationBoard = newBoards.find(b => b.id === overBoard.id);
                if(!sourceBoard || !destinationBoard) return boards;

                const taskIndex = sourceBoard.tasks.findIndex(t => t.id === activeId);
                if(taskIndex > -1) {
                    const [movedTask] = sourceBoard.tasks.splice(taskIndex, 1);
                    destinationBoard.tasks.push(movedTask);
                }
                return newBoards;
            });
        }
    }
  
    const isOverATask = over.data.current?.type === 'Task';
  
    // Dragging a task over another task
    if (isActiveATask && isOverATask) {
        const [, activeBoard] = findBoardForTask(activeId);
        const [, overBoard] = findBoardForTask(overId);

        if(activeBoard && overBoard) {
            setBoardsState(boards => {
                const newBoards = [...boards];
                const sourceBoard = newBoards.find(b => b.id === activeBoard.id);
                const destinationBoard = newBoards.find(b => b.id === overBoard.id);
                if(!sourceBoard || !destinationBoard) return boards;

                const activeIndex = sourceBoard.tasks.findIndex(t => t.id === activeId);
                const overIndex = destinationBoard.tasks.findIndex(t => t.id === overId);
                
                if (sourceBoard.id === destinationBoard.id) {
                    sourceBoard.tasks = arrayMove(sourceBoard.tasks, activeIndex, overIndex);
                } else {
                    const [movedTask] = sourceBoard.tasks.splice(activeIndex, 1);
                    destinationBoard.tasks.splice(overIndex, 0, movedTask);
                }
        
                return newBoards;
            });
        }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
