// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview AI flow that suggests which Kanban board a new task should be placed on.
 *
 * - suggestBoardPlacement - A function that suggests which board a given task belongs on.
 * - SuggestBoardPlacementInput - The input type for the suggestBoardPlacement function.
 * - SuggestBoardPlacementOutput - The return type for the suggestBoardPlacement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBoardPlacementInputSchema = z.object({
  taskDescription: z.string().describe('A descrição da tarefa.'),
  boardNames: z.array(z.string()).describe('A lista de quadros disponíveis para colocar a tarefa.'),
});
export type SuggestBoardPlacementInput = z.infer<typeof SuggestBoardPlacementInputSchema>;

const SuggestBoardPlacementOutputSchema = z.object({
  suggestedBoard: z
    .string()
    .describe('O quadro sugerido para a tarefa.'),
  reasoning: z.string().describe('A justificativa para a sugestão de quadro.'),
});
export type SuggestBoardPlacementOutput = z.infer<typeof SuggestBoardPlacementOutputSchema>;

export async function suggestBoardPlacement(
  input: SuggestBoardPlacementInput
): Promise<SuggestBoardPlacementOutput> {
  return suggestBoardPlacementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestBoardPlacementPrompt',
  input: {schema: SuggestBoardPlacementInputSchema},
  output: {schema: SuggestBoardPlacementOutputSchema},
  prompt: `Você é um assistente de IA que ajuda os usuários a organizar suas tarefas em um quadro Kanban.

Os quadros Kanban disponíveis são: {{#each boardNames}}'{{this}}'{{#if @last}}{{else}}, {{/if}}{{/each}}.

Dada a seguinte descrição da tarefa, sugira em qual quadro a tarefa deve ser colocada e explique seu raciocínio.

Descrição da Tarefa: {{{taskDescription}}}`,
});

const suggestBoardPlacementFlow = ai.defineFlow(
  {
    name: 'suggestBoardPlacementFlow',
    inputSchema: SuggestBoardPlacementInputSchema,
    outputSchema: SuggestBoardPlacementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
