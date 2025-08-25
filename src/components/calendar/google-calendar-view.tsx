
'use client';

import { useState } from 'react';
import { CalendarDays, Clock, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CalendarEvent } from '@/types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface GoogleCalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (eventData: Omit<CalendarEvent, 'id'>) => void;
  onEditEvent: (eventId: string, updatedData: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function GoogleCalendarView({
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: GoogleCalendarViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    if (title && date && time) {
      onAddEvent({ title, date, time });
      setIsAddDialogOpen(false);
    }
  };

  return (
    <Card className="bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-primary-foreground/90">
          <CalendarDays className="h-6 w-6" />
          <span>Compromissos da Semana</span>
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddEvent}>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Compromisso</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes do seu novo compromisso.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Título
                  </Label>
                  <Input id="title" name="title" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Dia
                  </Label>
                  <Input id="date" name="date" placeholder="ex: Segunda-feira" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Horário
                  </Label>
                  <Input id="time" name="time" placeholder="ex: 10:00 - 11:00" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Adicionar Compromisso</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length > 0 ? (
            events.map(event => (
              <CalendarEventItem
                key={event.id}
                event={event}
                onEdit={onEditEvent}
                onDelete={onDeleteEvent}
              />
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              Nenhum compromisso agendado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CalendarEventItemProps {
  event: CalendarEvent;
  onEdit: (eventId: string, updatedData: Partial<Omit<CalendarEvent, 'id'>>) => void;
  onDelete: (eventId: string) => void;
}

function CalendarEventItem({ event, onEdit, onDelete }: CalendarEventItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);

  const handleSave = () => {
    onEdit(event.id, { title: editedEvent.title, date: editedEvent.date, time: editedEvent.time });
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Omit<CalendarEvent, 'id'>, value: string) => {
    setEditedEvent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="group flex items-start gap-4 p-3 rounded-lg bg-secondary/70 hover:bg-secondary transition-colors">
      <div className="flex flex-col items-center justify-center h-full p-2 bg-primary/20 rounded-md w-28">
        {isEditing ? (
          <Input
            value={editedEvent.date}
            onChange={e => handleInputChange('date', e.target.value)}
            onBlur={handleSave}
            className="h-8 text-center"
          />
        ) : (
          <p className="font-semibold text-sm text-primary-foreground" onClick={() => setIsEditing(true)}>
            {event.date}
          </p>
        )}
      </div>
      <div className="flex-1 py-2">
        {isEditing ? (
          <Input
            value={editedEvent.title}
            onChange={e => handleInputChange('title', e.target.value)}
            onBlur={handleSave}
            className="h-8 mb-2"
          />
        ) : (
          <p className="font-semibold text-primary-foreground/90" onClick={() => setIsEditing(true)}>
            {event.title}
          </p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {isEditing ? (
            <Input
              value={editedEvent.time}
              onChange={e => handleInputChange('time', e.target.value)}
              onBlur={handleSave}
              className="h-8"
            />
          ) : (
            <span onClick={() => setIsEditing(true)}>{event.time}</span>
          )}
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente este compromisso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(event.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    