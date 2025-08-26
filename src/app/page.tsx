
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
      
      const boardsData: { [key: string]: Board } = {};
      initialData.forEach(b => {
        boardsData[b.id] = { ...b, tasks: [] };
      });
      
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
      const [, , , initialData] = getBoardInfo(type);
      fetchData(collectionName, setBoardsState, initialData);
    }
  };

  const handleDeleteTask = async (taskId: string, type: ItemType) => {
    if (!user) return;
    const [, setBoardsState, collectionName] = getBoardInfo(type);
    
    // Optimistic update
    setBoardsState(currentBoards =>
      currentBoards.map(board => ({
        ...board,
        tasks: board.tasks.filter(task => task.id !== taskId),
      }))
    );

    try {
      await deleteDoc(doc(db, 'users', user.uid, collectionName, taskId));
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir tarefa.'});
       // Revert on error
       const [, , , initialData] = getBoardInfo(type);
       fetchData(collectionName, setBoardsState, initialData);
    }
  };
  
  const handleMoveTaskToNextBoard = async (taskId: string, type: ItemType) => {
    if (!user) return;
    const [currentBoards, setBoardsState, collectionName, initialData] = getBoardInfo(type);

    let sourceBoard: Board | undefined;
    let taskToMove: Task | undefined;
    let sourceBoardIndex = -1;

    currentBoards.forEach((board, index) => {
        const task = board.tasks.find(t => t.id === taskId);
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
    setBoardsState(prevBoards => {
        const newBoards = [...prevBoards];
        const newSourceBoard = newBoards[sourceBoardIndex];
        const newDestBoard = newBoards[sourceBoardIndex + 1];

        newSourceBoard.tasks = newSourceBoard.tasks.filter(t => t.id !== taskId);
        newDestBoard.tasks = [...newDestBoard.tasks, { ...taskToMove!, boardId: newDestBoard.id }];

        return newBoards;
    });

    try {
      const taskRef = doc(db, 'users', user.uid, collectionName, taskId);
      await updateDoc(taskRef, { boardId: destinationBoard.id });
    } catch(e) {
      console.error("Error moving task: ", e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao mover tarefa.'});
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

    const overData = over.data.current;
    const overIsBoard = overData?.type === 'Board';
    const overItemType = overIsBoard ? overData.boardType : overData?.itemType;
    
    if (!overItemType || activeItemType !== overItemType) {
        return;
    }
    
    const [, setBoardsState] = getBoardInfo(activeItemType);
  
    setBoardsState(currentBoards => {
        const sourceBoard = findBoardForTask(activeId, currentBoards);
        const taskToMove = sourceBoard?.tasks.find(t => t.id === activeId);
        
        if (!sourceBoard || !taskToMove) return currentBoards;

        // Deep copy to ensure re-render
        let newBoards = currentBoards.map(b => ({...b, tasks: [...b.tasks]}));

        const newSourceBoard = newBoards.find(b => b.id === sourceBoard.id);
        if(!newSourceBoard) return currentBoards;

        // Remove from source
        newSourceBoard.tasks = newSourceBoard.tasks.filter(t => t.id !== activeId);

        let destinationBoard, overTaskIndex;

        if (overIsBoard) {
            destinationBoard = newBoards.find(b => b.id === over.id);
            // Add to the end
            overTaskIndex = destinationBoard ? destinationBoard.tasks.length : -1;
        } else { // over a task
            const overBoard = findBoardForTask(overId, newBoards);
            destinationBoard = newBoards.find(b => b.id === overBoard?.id);
            overTaskIndex = destinationBoard ? destinationBoard.tasks.findIndex(t => t.id === overId) : -1;
        }

        if (destinationBoard && overTaskIndex !== -1) {
             destinationBoard.tasks.splice(overTaskIndex, 0, taskToMove);
        } else {
            // Failsafe: if something goes wrong, add back to source board
            newSourceBoard.tasks.push(taskToMove);
        }
      
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
    
    // Find the state of boards after the optimistic dragOver update
    const finalBoard = findBoardForTask(active.id as string, currentBoards);
    
    if (!finalBoard) {
        // Task not found, something went wrong. Revert.
        fetchData(collectionName, setBoardsState, initialData);
        return;
    }

    const batch = writeBatch(db);
    
    // Update all tasks in the final board to save new order and boardId
    finalBoard.tasks.forEach((task, index) => {
      const taskRef = doc(db, 'users', user.uid, collectionName, task.id);
      batch.update(taskRef, { boardId: finalBoard.id, order: index });
    });
    
    // Also need to update order in the source board if it's different
    const sourceBoardFromStart = findBoardForTask(active.id as string, boards); // Using original state
    if (sourceBoardFromStart && sourceBoardFromStart.id !== finalBoard.id) {
        const sourceBoardAfterDrag = currentBoards.find(b => b.id === sourceBoardFromStart.id);
        sourceBoardAfterDrag?.tasks.forEach((task, index) => {
            const taskRef = doc(db, 'users', user.uid, collectionName, task.id);
            batch.update(taskRef, { order: index });
        });
    }

    try {
      await batch.commit();
      // Data is now consistent, but a refetch can ensure everything is perfectly aligned.
      fetchData(collectionName, setBoardsState, initialData);
    } catch (error) {
      console.error("Error updating tasks order: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar a ordem das tarefas.' });
      // Revert optimistic update on error
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
