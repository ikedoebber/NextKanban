
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, doc, writeBatch, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';


import type { Board, Task, BoardName, CalendarEvent, ItemType } from '@/types';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { AiSuggester } from '@/components/kanban/ai-suggester';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { GoogleCalendarView } from '@/components/calendar/google-calendar-view';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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
  const [user, setUser] = useState<User | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/welcome');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchData('tasks', setBoards, initialBoards);
      fetchData('goals', setGoalsBoards, initialGoalsBoards);
      fetchCalendarEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async (collectionName: string, setState: React.Dispatch<React.SetStateAction<Board[]>>, initialData: Board[]) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, collectionName), orderBy('order'));
      const querySnapshot = await getDocs(q);
      
      const boardsData = initialData.reduce((acc, b) => {
        acc[b.id] = { ...b, tasks: [] };
        return acc;
      }, {} as { [key: string]: Board });
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const task = { id: doc.id, ...data } as Task;
        const boardId = data.boardId as BoardName;
        if (boardsData[boardId]) {
          boardsData[boardId].tasks.push(task);
        } else {
            console.warn(`Board ID "${boardId}" from task ${task.id} not found in initial boards for ${collectionName}.`);
        }
      });
      setState(Object.values(boardsData).map(b => ({...b, tasks: b.tasks.sort((a,b) => a.order - b.order)})));
    } catch (error) {
      console.error(`Error fetching ${collectionName}: `, error);
      toast({ variant: 'destructive', title: 'Erro', description: `Falha ao buscar ${collectionName}.`});
    }
  };

  const fetchCalendarEvents = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'calendarEvents'), orderBy('startTime'));
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
      setCalendarEvents(events);
    } catch (error)
 {
      console.error("Error fetching calendar events: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao buscar compromissos.'});
    }
  };


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getBoardInfo = (type: ItemType): [Board[], React.Dispatch<React.SetStateAction<Board[]>>, string, Board[]] => {
    return type === 'goal' 
      ? [goalsBoards, setGoalsBoards, 'goals', initialGoalsBoards] 
      : [boards, setBoards, 'tasks', initialBoards];
  }

  const handleAddTask = async (boardId: BoardName, content: string, type: ItemType) => {
    if (!content.trim() || !user) return;
    
    const [currentBoards, setBoardsState, collectionName, initialData] = getBoardInfo(type);
    const board = currentBoards.find(b => b.id === boardId);
    if (!board) return;

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newTask: Task = {
      id: tempId,
      content,
      boardId,
      order: board.tasks.length,
      createdAt: new Date().toISOString(),
    };

    setBoardsState(prev =>
      prev.map(b =>
        b.id === boardId
          ? { ...b, tasks: [...b.tasks, newTask] }
          : b
      )
    );

    try {
      const newTaskData = {
        content,
        boardId,
        order: board.tasks.length,
        createdAt: newTask.createdAt,
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, collectionName), newTaskData);
      
      // Replace temporary task with real one from Firestore
      setBoardsState(prev => prev.map(b => ({
          ...b,
          tasks: b.tasks.map(t => t.id === tempId ? { ...t, id: docRef.id } : t)
      })));

    } catch (error) {
       console.error("Error adding document: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao adicionar tarefa.'});
       // Revert on error
       fetchData(collectionName, setBoardsState, initialData);
    }
  };

  const handleEditTask = async (taskId: string, newContent: string, type: ItemType) => {
    if (!user) return;
    const [, setBoardsState, collectionName, initialData] = getBoardInfo(type);
    
    const originalBoards = type === 'task' ? boards : goalsBoards;

    // Optimistic update
    setBoardsState(currentBoards =>
      currentBoards.map(board => ({
        ...board,
        tasks: board.tasks.map(task =>
          task.id === taskId ? { ...task, content: newContent } : task
        ),
      }))
    );

    try {
      const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
      await updateDoc(taskRef, { content: newContent });
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao editar tarefa.'});
      // Revert on error
      setBoardsState(originalBoards);
    }
  };

  const handleDeleteTask = async (taskId: string, type: ItemType) => {
    if (!user) return;
    const [currentBoards, setBoardsState, collectionName] = getBoardInfo(type);
    
    const originalBoards = [...currentBoards];
    // Optimistic update
    setBoardsState(prevBoards =>
        prevBoards.map(board => ({
            ...board,
            tasks: board.tasks.filter(task => task.id !== taskId),
        }))
    );

    try {
      await deleteDoc(doc(db, 'users', user.uid, collectionName, taskId));
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir tarefa.'});
      setBoardsState(originalBoards);
    }
  };
  
  const handleMoveTaskToNextBoard = async (taskId: string, type: ItemType) => {
    if (!user) return;
    const [currentBoards, setBoardsState, collectionName, initialData] = getBoardInfo(type);
  
    let sourceBoard: Board | undefined;
    let taskToMove: Task | undefined;
    let sourceBoardIndex = -1;
  
    currentBoards.forEach((board, index) => {
      const task = board.tasks.find((t) => t.id === taskId);
      if (task) {
        sourceBoard = board;
        taskToMove = task;
        sourceBoardIndex = index;
      }
    });
  
    if (!taskToMove || !sourceBoard || sourceBoardIndex === -1 || sourceBoardIndex >= currentBoards.length - 1) {
      return;
    }
  
    const destinationBoard = currentBoards[sourceBoardIndex + 1];
  
    // Optimistic update
    setBoardsState((prevBoards) => {
      const newBoards = [...prevBoards];
      const sourceBoardTasks = newBoards[sourceBoardIndex].tasks.filter((t) => t.id !== taskId);
      const destBoardTasks = [
          ...newBoards[sourceBoardIndex + 1].tasks,
          { ...taskToMove!, boardId: destinationBoard.id }
      ];

      newBoards[sourceBoardIndex] = { ...newBoards[sourceBoardIndex], tasks: sourceBoardTasks };
      newBoards[sourceBoardIndex + 1] = { ...newBoards[sourceBoardIndex + 1], tasks: destBoardTasks };
      
      return newBoards;
    });
  
    try {
      const batch = writeBatch(db);
      const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
      batch.update(taskRef, { boardId: destinationBoard.id });
      // Re-order tasks in destination board
      destinationBoard.tasks.forEach((task, index) => {
        const tRef = doc(db, 'users', user.uid, collectionName, task.id);
        batch.update(tRef, { order: index });
      });

      await batch.commit();
      fetchData(collectionName, setBoardsState, initialData);
    } catch (e) {
      console.error('Error moving task: ', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao mover tarefa.' });
      // Revert on error
      fetchData(collectionName, setBoardsState, initialData);
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
  
    const [currentBoards, setBoardsState] = getBoardInfo(activeItemType);
  
    const sourceBoard = findBoardForTask(activeId, currentBoards);
    
    const overIsBoard = over.data.current?.type === 'Board';
    const overData = over.data.current;
    
    const overItemType = overIsBoard ? overData?.boardType : overData?.itemType;
    if (!overItemType || activeItemType !== overItemType) {
        return;
    }

    const destinationBoard = overIsBoard
      ? currentBoards.find(b => b.id === overId)
      : findBoardForTask(overId, currentBoards);
  
    if (!sourceBoard || !destinationBoard || sourceBoard.id === destinationBoard.id) {
      return;
    }
  
    setBoardsState(prev => {
      const taskToMove = sourceBoard.tasks.find(task => task.id === activeId);
      if (!taskToMove) return prev;

      const newBoards = [...prev];
      const sourceBoardIndex = newBoards.findIndex(b => b.id === sourceBoard.id);
      const destBoardIndex = newBoards.findIndex(b => b.id === destinationBoard.id);
      
      // Remove from source
      newBoards[sourceBoardIndex] = {
        ...newBoards[sourceBoardIndex],
        tasks: newBoards[sourceBoardIndex].tasks.filter(task => task.id !== activeId)
      };

      // Add to destination
      const overTaskIndex = overIsBoard ? -1 : destinationBoard.tasks.findIndex(t => t.id === overId);
      const newDestTasks = [...newBoards[destBoardIndex].tasks];

      if(overTaskIndex !== -1) {
          newDestTasks.splice(overTaskIndex, 0, {...taskToMove, boardId: destinationBoard.id});
      } else {
          newDestTasks.push({...taskToMove, boardId: destinationBoard.id});
      }

      newBoards[destBoardIndex] = {
          ...newBoards[destBoardIndex],
          tasks: newDestTasks
      };

      return newBoards;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !user || !active.data.current) return;

    const itemType = active.data.current.itemType as ItemType | undefined;
    if (!itemType) return;
    
    const [currentBoards, setBoardsState, collectionName, initialData] = getBoardInfo(itemType);
    
    const sourceBoardOnDragStart = findBoardForTask(active.id as string, itemType === 'task' ? boards : goalsBoards);
    const destinationBoardOnDragEnd = findBoardForTask(active.id as string, currentBoards);
    
    if (!destinationBoardOnDragEnd) {
        fetchData(collectionName, setBoardsState, initialData);
        return;
    }
    
    if (sourceBoardOnDragStart?.id === destinationBoardOnDragEnd.id && destinationBoardOnDragEnd.tasks.length === sourceBoardOnDragStart.tasks.length) {
      // Only order changed within the same board
    }

    try {
      const batch = writeBatch(db);
      
      // Update tasks in the destination board
      destinationBoardOnDragEnd.tasks.forEach((task, index) => {
        const taskRef = doc(db, 'users', user.uid, collectionName, task.id);
        batch.update(taskRef, { boardId: destinationBoardOnDragEnd.id, order: index });
      });
      
      // If task moved boards, update tasks in source board as well
      if (sourceBoardOnDragStart && sourceBoardOnDragStart.id !== destinationBoardOnDragEnd.id) {
          const sourceBoardNow = currentBoards.find(b => b.id === sourceBoardOnDragStart.id);
          sourceBoardNow?.tasks.forEach((task, index) => {
              const taskRef = doc(db, 'users', user.uid, collectionName, task.id);
              batch.update(taskRef, { order: index });
          });
      }

      await batch.commit();
      fetchData(collectionName, setBoardsState, initialData); // Refetch for final consistency
    } catch (error) {
      console.error("Error updating tasks order: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar a ordem das tarefas.' });
      fetchData(collectionName, setBoardsState, initialData);
    }
  };
  
  const handleAddEvent = async (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    if (!user) return;
    const newEventData = {
      ...eventData,
      createdAt: new Date().toISOString()
    };
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'calendarEvents'), newEventData);
      const newEvent: CalendarEvent = { id: docRef.id, ...newEventData };
      setCalendarEvents(prev => [...prev, newEvent].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    } catch (error) {
      console.error("Error adding event: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao adicionar compromisso.'});
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
       await updateDoc(doc(db, 'users', user.uid, 'calendarEvents', eventId), updatedData);
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
      await deleteDoc(doc(db, 'users', user.uid, 'calendarEvents', eventId));
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir compromisso.'});
      setCalendarEvents(originalEvents);
    }
  };
  
  const handleLogout = () => {
    auth.signOut();
    router.push('/welcome');
  };


  if (!isClient || !user) {
    return null; // ou um esqueleto de carregamento
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
