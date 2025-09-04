
'use client';

import { useState } from 'react';
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
import type { BoardName, ItemType } from '@/types';
import { Label } from '../ui/label';

interface AiSuggesterProps {
  onSuggested: (boardId: BoardName, content: string, type: ItemType) => void;
}

const formSchema = z.object({
  taskDescription: z.string().min(5, 'A descrição deve ter pelo menos 5 caracteres.'),
});

type FormValues = z.infer<typeof formSchema>;

const allBoardOptions = [
  // Quadros de Tarefas
  'Não Iniciado', 'A Fazer', 'Fazendo', 'Feito',
  // Quadros de Metas/Compromissos
  'Semanal', 'Mensal', 'Trimestral', 'Anual'
];

export function AiSuggester({ onSuggested }: AiSuggesterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestBoardPlacementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { control, handleSubmit, reset, getValues } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { taskDescription: '' },
  });

  const getSuggestion = async (data: FormValues) => {
    setIsLoading(true);
    setSuggestion(null);

    try {
      const result = await suggestBoardPlacement({ 
        taskDescription: data.taskDescription,
        boardNames: allBoardOptions,
       });
      setSuggestion(result);
    } catch (error) {
      console.error('Falha ao obter sugestão da IA:', error);
      
      // Verificar se é um erro de API key
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401');
      
      toast({
        variant: 'destructive',
        title: isApiKeyError ? 'Configuração Necessária' : 'Erro Temporário',
        description: isApiKeyError 
          ? 'Configure a chave GEMINI_API_KEY para usar a funcionalidade de IA.'
          : 'Não foi possível obter a sugestão da IA. Tente novamente em alguns instantes.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      const formValues = getValues();
      // Determinar o tipo baseado no quadro sugerido
      const taskBoards = ['Não Iniciado', 'A Fazer', 'Fazendo', 'Feito'];
      const itemType: ItemType = taskBoards.includes(suggestion.suggestedBoard) ? 'task' : 'goal';
      
      onSuggested(suggestion.suggestedBoard as BoardName, formValues.taskDescription, itemType);
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
            Descreva uma tarefa, meta ou compromisso e nossa IA irá sugerir automaticamente o melhor quadro para organizá-la.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(getSuggestion)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Descrição</Label>
            <Controller
              name="taskDescription"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="taskDescription" 
                  placeholder="ex.: Implementar autenticação de usuário, Reunião com cliente, Exercitar 3x por semana" 
                  {...field} 
                />
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-200">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <BrainCircuit className="mr-2 h-4 w-4" />
                ✨ Obter Sugestão da IA
              </>
            )}
          </Button>
        </form>
        {isLoading && (
          <div className="mt-4 space-y-4 rounded-md border bg-secondary/20 p-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Analisando sua descrição...</span>
            </div>
          </div>
        )}
        {suggestion && !isLoading && (
          <div className="mt-4 space-y-4 rounded-md border bg-secondary/50 p-4 animate-in fade-in-50 duration-300">
            <h4 className="font-semibold text-primary">✨ Sugestão da IA</h4>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Quadro recomendado:</span>
                <br />
                <span className="font-bold text-lg text-primary">{suggestion.suggestedBoard}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Justificativa:</span>
                <br />
                <span className="italic text-foreground">{suggestion.reasoning}</span>
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={resetAndClose} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAcceptSuggestion} className="flex-1">
                ✓ Aceitar e Adicionar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}