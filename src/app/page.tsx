
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import type { Board, Task, BoardName, CalendarEvent, ItemType } from '@/types';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { AiSuggester } from '@/components/kanban/ai-suggester';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { GoogleCalendarView } from '@/components/calendar/google-calendar-view';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from '@dnd-kit/sortable';
import { apiGetTasks, apiCreateTask, apiUpdateTask, apiDeleteTask, apiMoveTask, apiReorderTasks, apiGetGoals, apiCreateGoal, apiUpdateGoal, apiDeleteGoal, organizeTasksIntoBoards } from '@/lib/api';

const initialBoards: Board[] = [
  { id: 'Não Iniciado', title: 'Não Iniciado', tasks: []},
  { id: 'A Fazer', title: 'A Fazer', tasks: [] },
  { id: 'Fazendo', title: 'Fazendo', tasks: [] },
  { id: 'Feito', title: 'Feito', tasks: [] },
];

const initialGoalsBoards: Board[] = [
  { id: 'Semanal', title: 'Semanal', tasks: []},
  { id: 'Mensal', title: 'Mensal', tasks: [] },
  { id: 'Trimestral', title: 'Trimestral', tasks: [] },
  { id: 'Anual', title: 'Anual', tasks: [] },
];

export default function KanbanPage() {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [goalsBoards, setGoalsBoards] = useState<Board[]>(initialGoalsBoards);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user && !loading) {
      loadTasks();
      loadGoals();
      fetchCalendarEvents();
    }
  }, [user, loading]);

  const loadTasks = async () => {
    if (!user?.id) return;
    try {
      const tasks = await apiGetTasks();
      const organizedBoards = organizeTasksIntoBoards(tasks, initialBoards);
      setBoards(organizedBoards);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar tarefas.' });
    }
  };

  const loadGoals = async () => {
    if (!user?.id) return;
    try {
      const goals = await apiGetGoals();
      const organizedBoards = organizeTasksIntoBoards(goals, initialGoalsBoards);
      setGoalsBoards(organizedBoards);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar metas.' });
    }
  };

  const fetchCalendarEvents = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      const events = await response.json();
      setCalendarEvents(events.sort((a: CalendarEvent, b: CalendarEvent) => a.startTime.localeCompare(b.startTime)));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar compromissos.' });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getBoardInfo = (type: ItemType): [Board[], React.Dispatch<React.SetStateAction<Board[]>>] => {
    return type === 'goal' 
      ? [goalsBoards, setGoalsBoards] 
      : [boards, setBoards];
  }

  const handleAddTask = async (boardId: BoardName, content: string, type: ItemType) => {
    if (!content.trim() || !user?.id) return;
    
    const [currentBoards, setBoardsState] = getBoardInfo(type);
    const board = currentBoards.find(b => b.id === boardId);
    if (!board) return;
    
    try {
      const newTask = type === 'goal' 
        ? await apiCreateGoal(content, boardId)
        : await apiCreateTask(content, boardId, 'task');
      
      // Update local state
      setBoardsState(prevBoards => 
        prevBoards.map(b => 
          b.id === boardId 
            ? { ...b, tasks: [...b.tasks, newTask] }
            : b
        )
      );
      
      toast({
        title: 'Sucesso',
        description: `${type === 'goal' ? 'Meta' : 'Tarefa'} adicionada com sucesso!`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Falha ao adicionar ${type === 'goal' ? 'meta' : 'tarefa'}.`,
      });
    }
  };

  const handleEditTask = async (taskId: string, newContent: string, type: ItemType) => {
    if (!user?.id) return;
    
    try {
      if (type === 'goal') {
        await apiUpdateGoal(taskId, newContent);
      } else {
        await apiUpdateTask(taskId, newContent, 'task');
      }
      
      const [, setBoardsState] = getBoardInfo(type);
      setBoardsState(prevBoards => 
        prevBoards.map(board => ({
          ...board,
          tasks: board.tasks.map(task => 
            task.id === taskId ? { ...task, content: newContent } : task
          )
        }))
      );
      
      toast({
        title: 'Sucesso',
        description: `${type === 'goal' ? 'Meta' : 'Tarefa'} atualizada com sucesso!`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Falha ao atualizar ${type === 'goal' ? 'meta' : 'tarefa'}.`,
      });
    }
  };
  const handleDeleteTask = async (taskId: string, type: ItemType) => {
    if (!user?.id) return;
    
    try {
      if (type === 'goal') {
        await apiDeleteGoal(taskId);
      } else {
        await apiDeleteTask(taskId, 'task');
      }
      
      const [, setBoardsState] = getBoardInfo(type);
      setBoardsState(prevBoards => 
        prevBoards.map(board => ({
          ...board,
          tasks: board.tasks.filter(task => task.id !== taskId)
        }))
      );
      
      toast({
        title: 'Sucesso',
        description: `${type === 'goal' ? 'Meta' : 'Tarefa'} excluída com sucesso!`,
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Falha ao excluir ${type === 'goal' ? 'meta' : 'tarefa'}.`,
      });
    }
  };
  
  const handleMoveTaskToNextBoard = async (taskId: string, type: ItemType) => {
    if (!user?.id) return;
    const [currentBoards, setBoardsState] = getBoardInfo(type);
  
    let sourceBoard: Board | undefined;
    let taskToMove: Task | undefined;
    let sourceBoardIndex = -1;
  
    // Find the task and its board
    for (let i = 0; i < currentBoards.length; i++) {
      const board = currentBoards[i];
      const task = board.tasks.find((t) => t.id === taskId);
      if (task) {
        sourceBoard = board;
        taskToMove = task;
        sourceBoardIndex = i;
        break;
      }
    }
    
    if (!taskToMove || !sourceBoard || sourceBoardIndex === -1 || sourceBoardIndex >= currentBoards.length - 1) {
      return; // Can't move from the last board or if not found
    }
  
    const destinationBoard = currentBoards[sourceBoardIndex + 1];
  
    try {
      if (type === 'goal') {
        await apiMoveTask(taskId, destinationBoard.id as any, destinationBoard.tasks.length, 'goal');
      } else {
        await apiMoveTask(taskId, destinationBoard.id as any, destinationBoard.tasks.length, 'task');
      }
      
      // Update UI after successful database operation
      setBoardsState((prevBoards) => {
        const newBoards = [...prevBoards];
        
        // Remove from source board
        const sourceTasks = newBoards[sourceBoardIndex].tasks.filter((t) => t.id !== taskId);
        newBoards[sourceBoardIndex] = { ...newBoards[sourceBoardIndex], tasks: sourceTasks };
        
        // Add to destination board
        const movedTask = { ...taskToMove!, boardId: destinationBoard.id, order: destinationBoard.tasks.length };
        const destTasks = [...newBoards[sourceBoardIndex + 1].tasks, movedTask];
        newBoards[sourceBoardIndex + 1] = { ...newBoards[sourceBoardIndex + 1], tasks: destTasks };
        
        return newBoards;
      });
      
      toast({
        title: 'Sucesso',
        description: `${type === 'goal' ? 'Meta' : 'Tarefa'} movida com sucesso!`,
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: `Falha ao mover ${type === 'goal' ? 'meta' : 'tarefa'}.`,
      });
    }
  };

  const findBoardForTask = (taskId: string, boardsToSearch: Board[]): Board | undefined => {
    return boardsToSearch.find(board => board.tasks.some(t => t.id === taskId));
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { id } = active;
    const itemType = active.data.current?.itemType as ItemType | undefined;

    if (!itemType) return;
    
    const [sourceBoards] = getBoardInfo(itemType);
    
    const board = findBoardForTask(id as string, sourceBoards);
    const task = board?.tasks.find(t => t.id === id);

    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !active) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeItemType = active.data.current?.itemType as ItemType | undefined;
    if (!activeItemType) return;

    const [, setBoardsState] = getBoardInfo(activeItemType);

    setBoardsState((prevBoards) => {
        const sourceBoard = findBoardForTask(activeId, prevBoards);
        const overIsBoard = over.data.current?.type === 'Board';
        const destinationBoard = overIsBoard
            ? prevBoards.find(b => b.id === overId)
            : findBoardForTask(overId, prevBoards);

        if (!sourceBoard || !destinationBoard || sourceBoard.id === destinationBoard.id) {
            return prevBoards;
        }

        const taskToMove = sourceBoard.tasks.find(t => t.id === activeId);
        if (!taskToMove) return prevBoards;

        const newBoards = [...prevBoards];

        // Remove from source
        const sourceBoardIndex = newBoards.findIndex(b => b.id === sourceBoard.id);
        const sourceTasks = newBoards[sourceBoardIndex].tasks.filter(task => task.id !== activeId);
        newBoards[sourceBoardIndex] = { ...newBoards[sourceBoardIndex], tasks: sourceTasks };

        // Add to destination
        const destBoardIndex = newBoards.findIndex(b => b.id === destinationBoard.id);
        let destTasks = [...newBoards[destBoardIndex].tasks];

        const overIsTask = over.data.current?.type === 'Task';
        if (overIsTask) {
            const overTaskIndex = destTasks.findIndex(t => t.id === overId);
            destTasks.splice(overTaskIndex, 0, { ...taskToMove, boardId: destinationBoard.id });
        } else {
            destTasks.push({ ...taskToMove, boardId: destinationBoard.id });
        }
        newBoards[destBoardIndex] = { ...newBoards[destBoardIndex], tasks: destTasks };

        return newBoards;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !user?.id || !active.data.current) return;

    const itemType = active.data.current.itemType as ItemType | undefined;
    if (!itemType) return;
    
    const [currentBoards, setBoardsState] = getBoardInfo(itemType);
    const originalBoards = itemType === 'task' ? boards : goalsBoards;
    
    const sourceBoardOnDragStart = findBoardForTask(active.id as string, originalBoards);
    const destinationBoardOnDragEnd = findBoardForTask(active.id as string, currentBoards);
    
    if (!destinationBoardOnDragEnd) {
        setBoardsState(originalBoards);
        return;
    }
    
    // The state is already updated optimistically by onDragOver.
    // Now, persist the changes to SQLite.
    try {
      // Prepare task updates for reordering
      const taskUpdates = destinationBoardOnDragEnd.tasks.map((task, index) => ({
        id: task.id,
        boardId: destinationBoardOnDragEnd.id,
        order: index
      }));
      
      const taskIds = destinationBoardOnDragEnd.tasks.map(task => task.id);
      
      if (itemType === 'goal') {
        await apiReorderTasks(destinationBoardOnDragEnd.id, taskIds, 'goal');
      } else {
        await apiReorderTasks(destinationBoardOnDragEnd.id, taskIds, 'task');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Ordem das tarefas atualizada com sucesso!',
      });
    } catch (error) {
      console.error('Error updating tasks order:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao salvar a ordem das tarefas.',
      });
      setBoardsState(originalBoards); // Revert on failure
    }
  };
  
  const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const newEventData = {
      id: tempId,
      ...eventData,
      createdAt: new Date().toISOString()
    };
    
    const originalEvents = [...calendarEvents];
    
    // Optimistic Update
    setCalendarEvents(prev => [...prev, newEventData].sort((a,b) => a.startTime.localeCompare(b.startTime)));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newEventData.title,
          date: newEventData.date,
          startTime: newEventData.startTime,
          endTime: newEventData.endTime,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      const createdEvent = await response.json();
      // Replace temp id with real one
      setCalendarEvents(prev => prev.map(e => e.id === tempId ? {...e, id: createdEvent.id} : e));
    } catch (error) {
      console.error("Error adding event: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao adicionar compromisso.'});
      setCalendarEvents(originalEvents);
    }
  };

  const handleEditEvent = async (eventId: string, updatedData: Partial<Omit<CalendarEvent, 'id'>>) => {
     if (!user) return;
     const originalEvents = [...calendarEvents];
     
     // Optimistic update
     setCalendarEvents(prev =>
        prev.map(event =>
          event.id === eventId ? { ...event, ...updatedData } : event
        ).sort((a,b) => a.startTime.localeCompare(b.startTime))
      );

     try {
       const response = await fetch(`/api/calendar/${eventId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(updatedData),
       });
       
       if (!response.ok) {
         throw new Error('Failed to update event');
       }
     } catch (error) {
       console.error("Error updating event: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao editar compromisso.'});
       setCalendarEvents(originalEvents);
     }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    const originalEvents = [...calendarEvents];
    // Optimistic update
    setCalendarEvents(prev => prev.filter(event => event.id !== eventId));
    try {
      const response = await fetch(`/api/calendar/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir compromisso.'});
      setCalendarEvents(originalEvents);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!isClient || loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver} sensors={sensors}>
      <div className="flex flex-col h-full w-full">
        <header className="p-4 border-b flex justify-between items-center bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-2xl font-bold font-headline text-primary-foreground/90">DfD Kanban</h1>
          <div className="flex items-center gap-4">
            <AiSuggester onSuggested={handleAddTask} />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-auto p-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Tarefas a fazer</h2>
            <div className="flex gap-6 pb-4 overflow-x-auto">
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
          </div>
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">Metas</h2>
             <div className="flex gap-6 pb-4 overflow-x-auto">
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
          </div>
          <div className="border-t pt-8">
            <GoogleCalendarView 
              events={calendarEvents}
              onAddEvent={handleAddEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        </main>
      </div>
    </DndContext>
  );
}
