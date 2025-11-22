'use server';

import { generateQuiz, GenerateQuizInput } from "@/ai/flows/generate-quiz-from-topic";
import { providePerformanceInsights, ProvidePerformanceInsightsInput } from "@/ai/flows/provide-performance-insights";

export async function handleGenerateQuiz(topic: string, numberOfQuestions: number) {
  try {
    const input: GenerateQuizInput = { topic, numberOfQuestions };
    const result = await generateQuiz(input);
    return { success: true, data: result.quiz };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to generate quiz. Please try again." };
  }
}

export async function handleProvidePerformanceInsights(
  userAnswers: string[],
  correctAnswers: string[],
  quizTopic: string
) {
  try {
    const input: ProvidePerformanceInsightsInput = { userAnswers, correctAnswers, quizTopic };
    const result = await providePerformanceInsights(input);
    return { success: true, data: result.insights };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to generate insights. Please try again." };
  }
}
