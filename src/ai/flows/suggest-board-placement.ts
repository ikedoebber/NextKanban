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
  taskDescription: z.string().describe('The description of the task.'),
});
export type SuggestBoardPlacementInput = z.infer<typeof SuggestBoardPlacementInputSchema>;

const SuggestBoardPlacementOutputSchema = z.object({
  suggestedBoard: z
    .enum(['To Do', 'Doing', 'Done', 'Not Started'])
    .describe('The suggested board for the task.'),
  reasoning: z.string().describe('The reasoning behind the board suggestion.'),
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
  prompt: `You are an AI assistant helping users organize their tasks on a Kanban board.

The Kanban board has four columns: To Do, Doing, Done, and Not Started.

Given the following task description, suggest which board the task should be placed on and explain your reasoning.

Task Description: {{{taskDescription}}}`,
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
