
'use client';

import { CalendarDays, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data simulating Google Calendar events
const calendarEvents = [
  { id: 'evt1', title: 'Reunião de planejamento de sprint', time: '10:00 - 11:00', date: 'Segunda-feira' },
  { id: 'evt2', title: 'Entrevista com candidato', time: '14:00 - 15:00', date: 'Terça-feira' },
  { id: 'evt3', title: 'Revisão de design com a equipe', time: '11:00 - 12:30', date: 'Quarta-feira' },
  { id: 'evt4', title: 'Foco no desenvolvimento', time: '09:00 - 17:00', date: 'Quinta-feira' },
  { id: 'evt5', title: 'Demonstração do produto', time: '15:00 - 16:00', date: 'Sexta-feira' },
];

export function GoogleCalendarView() {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary-foreground/90">
          <CalendarDays className="h-6 w-6" />
          <span>Compromissos da Semana</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calendarEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/70 hover:bg-secondary transition-colors">
              <div className="flex flex-col items-center justify-center h-full p-2 bg-primary/20 rounded-md w-28">
                <p className="font-semibold text-sm text-primary-foreground">{event.date}</p>
              </div>
              <div className="flex-1 py-2">
                <p className="font-semibold text-primary-foreground/90">{event.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
