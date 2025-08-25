
export interface Task {
  id: string;
  content: string;
}

export type BoardName = 'Não Iniciado' | 'A Fazer' | 'Fazendo' | 'Feito' | 'Semanal' | 'Mensal' | 'Trimestral' | 'Anual';

export interface Board {
  id: BoardName;
  title: string;
  tasks: Task[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  date: string;
}

    