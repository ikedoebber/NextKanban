
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, LogOut } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, doc, writeBatch, addDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';


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
      fetchData('tasks', setBoards);
      fetchData('goals', setGoalsBoards);
      fetchCalendarEvents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async (collectionName: string, setState: React.Dispatch<React.SetStateAction<Board[]>>) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, collectionName), orderBy('order'));
      const querySnapshot = await getDocs(q);
      
      const boardsData: { [key: string]: Board } = {};
      (collectionName === 'tasks' ? initialBoards : initialGoalsBoards).forEach(b => {
        boardsData[b.id] = { ...b, tasks: [] };
      });
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const task = { id: doc.id, ...data } as Task;
        const boardId = data.boardId as BoardName;
        if (boardsData[boardId]) {
          boardsData[boardId].tasks.push(task);
        }
      });
      setState(Object.values(boardsData));
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao buscar dados.'});
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

  const getBoardInfo = (type: ItemType): [Board[], React.Dispatch<React.SetStateAction<Board[]>>, string] => {
    return type === 'goal' ? [goalsBoards, setGoalsBoards, 'goals'] : [boards, setBoards, 'tasks'];
  }

  const handleAddTask = async (boardId: BoardName, content: string, type: ItemType) => {
    if (!content.trim() || !user) return;
    
    const [currentBoards, setBoardsState, collectionName] = getBoardInfo(type);
    const board = currentBoards.find(b => b.id === boardId);
    if (!board) return;

    const newTaskData = {
      content,
      boardId,
      order: board.tasks.length,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, collectionName), newTaskData);
      const newTask: Task = { id: docRef.id, ...newTaskData };
      
      setBoardsState(prev =>
        prev.map(b =>
          b.id === boardId
            ? { ...b, tasks: [...b.tasks, newTask] }
            : b
        )
      );
    } catch (error) {
       console.error("Error adding document: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao adicionar tarefa.'});
    }
  };

  const handleEditTask = async (taskId: string, newContent: string, type: ItemType) => {
    if (!user) return;
    const [, setBoardsState, collectionName] = getBoardInfo(type);
    
    const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
    try {
      await updateDoc(taskRef, { content: newContent });
      setBoardsState(boards =>
        boards.map(board => ({
          ...board,
          tasks: board.tasks.map(task =>
            task.id === taskId ? { ...task, content: newContent } : task
          ),
        }))
      );
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao editar tarefa.'});
    }
  };

  const handleDeleteTask = async (taskId: string, type: ItemType) => {
    if (!user) return;
    const [, setBoardsState, collectionName] = getBoardInfo(type);

    try {
      await deleteDoc(doc(db, 'users', user.uid, collectionName, taskId));
      setBoardsState(boards =>
        boards.map(board => ({
          ...board,
          tasks: board.tasks.filter(task => task.id !== taskId),
        }))
      );
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir tarefa.'});
    }
  };
  
  const handleMoveTaskToNextBoard = async (taskId: string, type: ItemType) => {
    const [currentBoards, setBoardsState, collectionName] = getBoardInfo(type);

    let sourceBoardIndex = -1;
    let sourceTaskIndex = -1;
    let taskToMove: Task | null = null;

    for (let i = 0; i < currentBoards.length; i++) {
        const taskIndex = currentBoards[i].tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            sourceBoardIndex = i;
            sourceTaskIndex = taskIndex;
            taskToMove = currentBoards[i].tasks[taskIndex];
            break;
        }
    }

    if (!taskToMove || sourceBoardIndex === -1 || sourceBoardIndex === currentBoards.length - 1) {
        return; 
    }

    const destinationBoard = currentBoards[sourceBoardIndex + 1];
    if(!user) return;

    try {
      const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
      await updateDoc(taskRef, { boardId: destinationBoard.id });

      setBoardsState(prevBoards => {
          const newBoards = [...prevBoards.map(b => ({...b, tasks: [...b.tasks]}))];
          const sourceBoard = newBoards[sourceBoardIndex];
          const destBoard = newBoards[sourceBoardIndex + 1];
          const [movedTask] = sourceBoard.tasks.splice(sourceTaskIndex, 1);
          destBoard.tasks.push({ ...movedTask, boardId: destBoard.id });
          return newBoards;
      });
    } catch(e) {
      console.error("Error moving task: ", e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao mover tarefa.'});
    }
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
    const itemType = active.data.current?.itemType;

    if (!itemType) return;
    
    const [sourceBoards] = getBoardInfo(itemType);
    
    const [board, taskIndex] = findBoardForTask(id as string, sourceBoards);
    if(board && taskIndex > -1) {
      setActiveTask(board.tasks[taskIndex]);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !active) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    if (activeId === overId) return;

    const activeItemType = active.data.current?.itemType as ItemType;
    if (!activeItemType) return;
    
    const overData = over.data.current;
    let overItemType = overData?.itemType;
    
    if (overData?.type === 'Board') {
      overItemType = overData.boardType;
    }

    if (!overItemType || activeItemType !== overItemType) {
        return;
    }
    
    const [, setBoardsState] = getBoardInfo(activeItemType);
  
    setBoardsState(currentBoards => {
      const [sourceBoard, sourceTaskIndex] = findBoardForTask(activeId, currentBoards);
      if (!sourceBoard || sourceTaskIndex === -1) return currentBoards;
      
      let newBoards = JSON.parse(JSON.stringify(currentBoards));
      let sourceBoardInNew = newBoards.find((b: Board) => b.id === sourceBoard.id);
      if (!sourceBoardInNew) return currentBoards;

      const [taskToMove] = sourceBoardInNew.tasks.splice(sourceTaskIndex, 1);
  
      if (overData?.type === 'Board') {
        const destinationBoard = newBoards.find((b: Board) => b.id === over.id);
        if(destinationBoard) {
          destinationBoard.tasks.push(taskToMove);
        }
      } else if (overData?.type === 'Task') {
        const [overBoard] = findBoardForTask(overId, newBoards);
        const destinationBoard = newBoards.find((b: Board) => b.id === overBoard?.id);
        
        if (!destinationBoard) return currentBoards;
        const overTaskIndex = destinationBoard.tasks.findIndex(t => t.id === overId);
        destinationBoard.tasks.splice(overTaskIndex, 0, taskToMove);
      }
      return newBoards;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !user || !active.data.current) return;

    const activeId = active.id as string;
    const itemType = active.data.current.itemType as ItemType;

    if (!itemType) {
      setActiveTask(null);
      return;
    }

    const [currentBoards, setBoardsState, collectionName] = getBoardInfo(itemType);
    const [destBoardAfterDrag] = findBoardForTask(activeId, currentBoards);

    if (!destBoardAfterDrag) {
      setActiveTask(null);
      return;
    }
    
    const batch = writeBatch(db);
    
    destBoardAfterDrag.tasks.forEach((task, index) => {
      const taskRef = doc(db, 'users', user.uid, collectionName, task.id);
      batch.update(taskRef, { boardId: destBoardAfterDrag.id, order: index });
    });
    
    try {
      await batch.commit();
      fetchData(collectionName, setBoardsState);
    } catch (error) {
      console.error("Error updating tasks order: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar a ordem das tarefas.' });
      // Revert optimistic update on error
      fetchData('tasks', setBoards);
      fetchData('goals', setGoalsBoards);
    } finally {
      setActiveTask(null);
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
     try {
       await updateDoc(doc(db, 'users', user.uid, 'calendarEvents', eventId), updatedData);
       setCalendarEvents(prev =>
        prev.map(event =>
          event.id === eventId ? { ...event, ...updatedData } : event
        ).sort((a,b) => a.startTime.localeCompare(b.startTime))
      );
     } catch (error) {
       console.error("Error updating event: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao editar compromisso.'});
     }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'calendarEvents', eventId));
      setCalendarEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error("Error deleting event: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir compromisso.'});
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
        <header className="p-4 border-b flex justify-between items-center bg-card/50 backdrop-blur-sm">
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
