'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing performance insights after a quiz.
 *
 * The flow takes the user's answers and the correct answers as input, and returns AI-powered insights
 * highlighting areas of improvement and strengths.
 *
 * @exported {
 *   providePerformanceInsights: (input: ProvidePerformanceInsightsInput) => Promise<ProvidePerformanceInsightsOutput>;
 *   ProvidePerformanceInsightsInput: z.infer<typeof ProvidePerformanceInsightsInputSchema>;
 *   ProvidePerformanceInsightsOutput: z.infer<typeof ProvidePerformanceInsightsOutputSchema>;
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const ProvidePerformanceInsightsInputSchema = z.object({
  userAnswers: z.array(z.string()).describe('The answers provided by the user.'),
  correctAnswers: z.array(z.string()).describe('The correct answers to the quiz questions.'),
  quizTopic: z.string().describe('The topic of the quiz.'),
});
export type ProvidePerformanceInsightsInput = z.infer<typeof ProvidePerformanceInsightsInputSchema>;

// Define the output schema
const ProvidePerformanceInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights into the user\'s performance.'),
});
export type ProvidePerformanceInsightsOutput = z.infer<typeof ProvidePerformanceInsightsOutputSchema>;

// Define the prompt
const performanceInsightsPrompt = ai.definePrompt({
  name: 'performanceInsightsPrompt',
  input: {schema: ProvidePerformanceInsightsInputSchema},
  output: {schema: ProvidePerformanceInsightsOutputSchema},
  prompt: `You are an AI quiz performance analyst. Analyze the user's quiz performance based on the following information and provide personalized insights.

Quiz Topic: {{{quizTopic}}}
User Answers: {{#each userAnswers}}{{{this}}}, {{/each}}
Correct Answers: {{#each correctAnswers}}{{{this}}}, {{/each}}

Focus on identifying areas where the user needs improvement and areas where they demonstrated strong understanding. Provide actionable recommendations for improvement and highlight the user's strengths to encourage continued learning.
`,
});

// Define the flow
const providePerformanceInsightsFlow = ai.defineFlow(
  {
    name: 'providePerformanceInsightsFlow',
    inputSchema: ProvidePerformanceInsightsInputSchema,
    outputSchema: ProvidePerformanceInsightsOutputSchema,
  },
  async input => {
    const {output} = await performanceInsightsPrompt(input);
    return output!;
  }
);

/**
 * Provides AI-powered performance insights based on user's quiz answers.
 * @param input - The input containing user answers, correct answers, and quiz topic.
 * @returns A promise that resolves to an object containing the performance insights.
 */
export async function providePerformanceInsights(input: ProvidePerformanceInsightsInput): Promise<ProvidePerformanceInsightsOutput> {
  return providePerformanceInsightsFlow(input);
}
