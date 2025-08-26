
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const daysOfWeek = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};
const timeSlots = generateTimeSlots();


interface GoogleCalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
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
  const [newEvent, setNewEvent] = useState({ title: '', date: '', startTime: '', endTime: '' });

  const handleAddEventSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newEvent.title && newEvent.date && newEvent.startTime && newEvent.endTime) {
      onAddEvent({
        title: newEvent.title,
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime
      });
      setNewEvent({ title: '', date: '', startTime: '', endTime: '' });
      setIsAddDialogOpen(false);
    }
  };

  const handleNewEventChange = (field: keyof typeof newEvent, value: string) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
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
            <form onSubmit={handleAddEventSubmit}>
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
                  <Input
                    id="title"
                    name="title"
                    className="col-span-3"
                    required
                    value={newEvent.title}
                    onChange={e => handleNewEventChange('title', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Dia
                  </Label>
                  <Select
                    name="date"
                    required
                    value={newEvent.date}
                    onValueChange={value => handleNewEventChange('date', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map(day => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Início</Label>
                  <Select
                    name="startTime"
                    required
                    value={newEvent.startTime}
                    onValueChange={value => handleNewEventChange('startTime', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={`start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Fim</Label>
                   <Select
                    name="endTime"
                    required
                    value={newEvent.endTime}
                    onValueChange={value => handleNewEventChange('endTime', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
    if (editedEvent.startTime && editedEvent.endTime) {
      onEdit(event.id, { 
        title: editedEvent.title, 
        date: editedEvent.date, 
        startTime: editedEvent.startTime, 
        endTime: editedEvent.endTime,
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Omit<CalendarEvent, 'id'>, value: string) => {
    setEditedEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setEditedEvent(prev => ({...prev, [field]: value}));
  };
  
  const handleSelectChange = (value: string) => {
    handleInputChange('date', value);
    // We can save immediately on change
    onEdit(event.id, { ...editedEvent, date: value });
  };

  return (
    <div className="group flex items-start gap-4 p-3 rounded-lg bg-secondary/70 hover:bg-secondary transition-colors">
      <div className="flex flex-col items-center justify-center h-full p-2 bg-primary/20 rounded-md w-28 shrink-0">
        {isEditing ? (
            <Select value={editedEvent.date} onValueChange={handleSelectChange}>
            <SelectTrigger className="h-8 text-center">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map(day => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
            <div className='flex items-center gap-2 w-full'>
              <Select value={editedEvent.startTime} onValueChange={value => handleTimeChange('startTime', value)}>
                  <SelectTrigger className="h-8">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      {timeSlots.map(time => <SelectItem key={`start-edit-${time}`} value={time}>{time}</SelectItem>)}
                  </SelectContent>
              </Select>
              <span>-</span>
              <Select value={editedEvent.endTime} onValueChange={value => handleTimeChange('endTime', value)}>
                  <SelectTrigger className="h-8">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      {timeSlots.map(time => <SelectItem key={`end-edit-${time}`} value={time}>{time}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Button size="sm" onClick={handleSave} className='h-8'>Salvar</Button>
            </div>
          ) : (
            <span onClick={() => setIsEditing(true)}>{event.startTime} - {event.endTime}</span>
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

    