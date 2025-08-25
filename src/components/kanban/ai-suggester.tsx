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
import type { BoardName } from '@/types';
import { Label } from '../ui/label';

interface AiSuggesterProps {
  onSuggested: (boardId: BoardName, content: string) => void;
}

const formSchema = z.object({
  taskDescription: z.string().min(5, 'Task description must be at least 5 characters long.'),
});

type FormValues = z.infer<typeof formSchema>;

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
      const result = await suggestBoardPlacement({ taskDescription: data.taskDescription });
      setSuggestion(result);
    } catch (error) {
      console.error('Failed to get AI suggestion:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not get AI suggestion. Please try again.',
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
          Suggest Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Task Suggester</DialogTitle>
          <DialogDescription>
            Describe a task, and our AI will suggest which board it belongs on.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(getSuggestion)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskDescription">Task Description</Label>
            <Controller
              name="taskDescription"
              control={control}
              render={({ field }) => (
                <Textarea id="taskDescription" placeholder="e.g., Implement user authentication" {...field} />
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Get Suggestion
          </Button>
        </form>
        {suggestion && (
          <div className="mt-4 space-y-4 rounded-md border bg-secondary/50 p-4">
            <h4 className="font-semibold">Suggestion</h4>
            <p>
              Board: <span className="font-bold text-accent">{suggestion.suggestedBoard}</span>
            </p>
            <p>
              Reasoning: <span className="italic text-muted-foreground">{suggestion.reasoning}</span>
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button onClick={handleAcceptSuggestion}>Accept & Add Task</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
