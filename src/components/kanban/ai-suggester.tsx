'use client';

import { useState, useMemo } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { suggestBoardPlacement, SuggestBoardPlacementOutput } from '@/ai/flows/suggest-board-placement';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BoardName } from '@/types';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AiSuggesterProps {
  onSuggested: (boardId: BoardName, content: string) => void;
}

const formSchema = z.object({
  taskDescription: z.string().min(5, 'A descrição da tarefa deve ter pelo menos 5 caracteres.'),
  context: z.enum(['task', 'goal']).default('task'),
});

type FormValues = z.infer<typeof formSchema>;

const boardOptions = {
    task: ['Não Iniciado', 'A Fazer', 'Fazendo', 'Feito'],
    goal: ['Semanal', 'Mensal', 'Trimestral', 'Anual'],
}

export function AiSuggester({ onSuggested }: AiSuggesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestBoardPlacementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { control, handleSubmit, reset, getValues, watch } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { taskDescription: '', context: 'task' },
  });

  const selectedContext = watch('context');

  const getSuggestion = async (data: FormValues) => {
    setIsLoading(true);
    setSuggestion(null);

    const boardNames = boardOptions[data.context];

    try {
      const result = await suggestBoardPlacement({ 
        taskDescription: data.taskDescription,
        boardNames,
       });
      setSuggestion(result);
    } catch (error) {
      console.error('Falha ao obter sugestão da IA:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível obter a sugestão da IA. Por favor, tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onSuggested(suggestion.suggestedBoard as BoardName, getValues('taskDescription'));
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setSuggestion(null);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <BrainCircuit className="mr-2 h-4 w-4" />
          Sugerir Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sugestão de Tarefas por IA</DialogTitle>
          <DialogDescription>
            Descreva uma tarefa ou meta e nossa IA irá sugerir em qual quadro ela pertence.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(getSuggestion)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context">Contexto</Label>
            <Controller
              name="context"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o contexto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Tarefa do Projeto</SelectItem>
                    <SelectItem value="goal">Meta</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Descrição</Label>
            <Controller
              name="taskDescription"
              control={control}
              render={({ field }) => (
                <Textarea id="taskDescription" placeholder="ex.: Implementar autenticação de usuário" {...field} />
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Obter Sugestão
          </Button>
        </form>
        {suggestion && (
          <div className="mt-4 space-y-4 rounded-md border bg-secondary/50 p-4">
            <h4 className="font-semibold">Sugestão</h4>
            <p>
              Quadro: <span className="font-bold text-accent">{suggestion.suggestedBoard}</span>
            </p>
            <p>
              Justificativa: <span className="italic text-muted-foreground">{suggestion.reasoning}</span>
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button onClick={handleAcceptSuggestion}>Aceitar e Adicionar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
