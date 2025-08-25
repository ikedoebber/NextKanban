export interface Task {
  id: string;
  content: string;
}

export type BoardName = 'Não Iniciado' | 'A Fazer' | 'Fazendo' | 'Feito';

export interface Board {
  id: BoardName;
  title: string;
  tasks: Task[];
}
