'use server';

/**
 * @fileOverview Generates a multiple-choice quiz based on a user-provided topic.
 *
 * - generateQuiz - A function that generates a quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the quiz.'),
  numberOfQuestions: z
    .number()
    .default(5)
    .describe('The number of questions to generate for the quiz.'),
  // Optional description of the kind/style of question the professor wants
  // e.g. 'numerical', 'theoretical', 'easy', 'tough', or more detailed
  // guidance. This is optional and will be included in the prompt when
  // present.
  questionStyle: z.string().optional().describe('Optional question style or guidance for the generated questions.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('The multiple-choice options for the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('The generated quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const quizQuestionPrompt = ai.definePrompt({
  name: 'quizQuestionPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: QuizQuestionSchema},
    prompt: `You are a quiz generator. Generate a single multiple-choice question about the topic: {{{topic}}}.  The question should have multiple choice options.

      {{#if questionStyle}}
      Guidance for question style: {{{questionStyle}}}
      {{/if}}

      {{zodFormatOutput}}`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const quiz: z.infer<typeof QuizQuestionSchema>[] = [];
    for (let i = 0; i < input.numberOfQuestions; i++) {
      const {output} = await quizQuestionPrompt(input);
      quiz.push(output!);
    }

    return {quiz};
  }
);
