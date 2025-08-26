
'use client';

import { useMemo } from 'react';
import { GripVertical } from 'lucide-react';

import type { BoardName, ItemType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

const examples = {
  'Não Iniciado': 'Brainstorm de novas funcionalidades...',
  'A Fazer': 'Desenvolver a página de perfil do usuário...',
  'Fazendo': 'Implementar a lógica de autenticação...',
  'Feito': 'Configurar o deploy inicial do projeto.',
  'Semanal': 'Revisar o progresso das metas da semana.',
  'Mensal': 'Planejar o orçamento do próximo mês.',
  'Trimestral': 'Definir OKRs para o próximo trimestre.',
  'Anual': 'Finalizar o relatório anual de desempenho.',
};

interface ExampleCardProps {
  boardId: BoardName;
  type: ItemType;
  onAddTask: (boardId: BoardName, content: string, type: ItemType) => void;
}

export function ExampleCard({ boardId, type, onAddTask }: ExampleCardProps) {
  const exampleContent = useMemo(() => {
    return examples[boardId as keyof typeof examples] || "Exemplo de tarefa...";
  }, [boardId]);

  const handleClick = () => {
    onAddTask(boardId, exampleContent, type);
  };

  return (
    <Card 
      className="group relative bg-card/50 shadow-none border-dashed cursor-pointer hover:bg-secondary/50 transition-colors"
      onClick={handleClick}
    >
       <CardContent className="p-3 flex items-start gap-2">
         <div className="p-1 -ml-1 text-muted-foreground/50">
           <GripVertical className="h-5 w-5" />
         </div>
         <div className="flex-1 pt-0.5">
          <p className="text-sm min-h-[2rem] flex items-center text-muted-foreground/80 italic">
            {exampleContent}
          </p>
         </div>
       </CardContent>
     </Card>
  )
}
