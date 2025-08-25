
'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit } from 'lucide-react';

import type { Board, Task, BoardName } from '@/types';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { AiSuggester } from '@/components/kanban/ai-suggester';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { GoogleCalendarView } from '@/components/calendar/google-calendar-view';

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
    // Em um aplicativo real, você buscaria isso de um armazenamento persistente
    const savedBoards = localStorage.getItem('kanbanBoards');
    const savedGoalsBoards = localStorage.getItem('goalsBoards');
    if (savedBoards) {
      setBoards(JSON.parse(savedBoards));
    } else {
      setBoards(initialBoards);
    }
    if (savedGoalsBoards) {
      setGoalsBoards(JSON.parse(savedGoalsBoards));
    } else {
      setGoalsBoards(initialGoalsBoards);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('kanbanBoards', JSON.stringify(boards));
    }
  }, [boards, isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('goalsBoards', JSON.stringify(goalsBoards));
    }
  }, [goalsBoards, isClient]);


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
    const [, setBoardsState] = getBoardSetters(isGoal ? 'goal' : 'task');
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
  
  const handleMoveTaskToNextBoard = (taskId: string) => {
    const taskType = taskId.startsWith('goal') ? 'goal' : 'task';
    const [currentBoards, setBoardsState] = getBoardSetters(taskType);

    let sourceBoardIndex = -1;
    let sourceTaskIndex = -1;

    for (let i = 0; i < currentBoards.length; i++) {
        const taskIndex = currentBoards[i].tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            sourceBoardIndex = i;
            sourceTaskIndex = taskIndex;
            break;
        }
    }

    if (sourceBoardIndex === -1 || sourceBoardIndex === currentBoards.length - 1) {
        return; 
    }

    const destinationBoardIndex = sourceBoardIndex + 1;

    setBoardsState(prevBoards => {
        const newBoards = [...prevBoards.map(b => ({...b, tasks: [...b.tasks]}))];
        const sourceBoard = newBoards[sourceBoardIndex];
        const destinationBoard = newBoards[destinationBoardIndex];
        const [movedTask] = sourceBoard.tasks.splice(sourceTaskIndex, 1);
        destinationBoard.tasks.push(movedTask);
        return newBoards;
    });
  };

  const findBoardForTask = (taskId: string, boardsToSearch: Board[]): [Board | undefined, number] => {
    for (const board of boardsToSearch) {
        const taskIndex = board.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            return [board, taskIndex];
        }
    }
    return [undefined, -1];
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    
    const taskType = (id as string).startsWith('goal') ? 'goal' : 'task';
    const [sourceBoards] = getBoardSetters(taskType);
    
    const [board, taskIndex] = findBoardForTask(id as string, sourceBoards);
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
    const overData = over.data.current;
    
    const overType = overData?.type === 'Board' ? overData.boardType : (overData?.type === 'Task' ? (overId.startsWith('goal') ? 'goal' : 'task') : undefined);
    
    if (!overType || activeTaskType !== overType) {
        return;
    }
    
    const [, setBoardsState] = getBoardSetters(activeTaskType);
  
    setBoardsState(currentBoards => {
      const [sourceBoard, sourceTaskIndex] = findBoardForTask(activeId, currentBoards);
      if (!sourceBoard || sourceTaskIndex === -1) return currentBoards;
      
      let newBoards = JSON.parse(JSON.stringify(currentBoards));
      let sourceBoardInNew = newBoards.find((b: Board) => b.id === sourceBoard.id);
      if (!sourceBoardInNew) return currentBoards;

      const activeTask = sourceBoardInNew.tasks.splice(sourceTaskIndex, 1)[0];
  
      if (overData?.type === 'Board') {
        const destinationBoard = newBoards.find((b: Board) => b.id === over.id);
        if(destinationBoard) {
            destinationBoard.tasks.push(activeTask);
        }
      } else if (overData?.type === 'Task') {
        const [overBoard] = findBoardForTask(overId, newBoards);
        const destinationBoard = newBoards.find((b: Board) => b.id === overBoard?.id);
        
        if (!destinationBoard) {
          return currentBoards;
        }

        const overTaskIndex = destinationBoard.tasks.findIndex(t => t.id === overId);

        if (sourceBoard.id === destinationBoard.id) {
            destinationBoard.tasks.splice(overTaskIndex, 0, activeTask);
            
        } else {
            destinationBoard.tasks.splice(overTaskIndex, 0, activeTask);
        }
      }
      return newBoards;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
  };

  if (!isClient) {
    return null; // ou um esqueleto de carregamento
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
              onMoveTask={handleMoveTaskToNextBoard}
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
              onMoveTask={handleMoveTaskToNextBoard}
              activeTask={activeTask}
              type="goal"
            />
          </div>
          <div className="border-t pt-8">
            <GoogleCalendarView />
          </div>
        </main>
      </div>
    </DndContext>
  );
}
