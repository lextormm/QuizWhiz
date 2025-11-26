'use server';

import { generateQuiz, GenerateQuizInput } from "@/ai/flows/generate-quiz-from-topic";
import { providePerformanceInsights, ProvidePerformanceInsightsInput } from "@/ai/flows/provide-performance-insights";

export async function handleGenerateQuiz(topic: string, numberOfQuestions: number, questionStyle?: string) {
  try {
    const input: GenerateQuizInput = { topic, numberOfQuestions, ...(questionStyle ? { questionStyle } : {}) };
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
    console.error('providePerformanceInsights failed, falling back to deterministic insights:', error);

    // Fallback deterministic insights generator (useful if AI flow is unavailable)
    try {
      const total = Math.min(userAnswers.length, correctAnswers.length);
      let correct = 0;
      const correctIndices: number[] = [];
      const incorrectIndices: number[] = [];

      for (let i = 0; i < total; i++) {
        if (userAnswers[i] === correctAnswers[i]) {
          correct++;
          correctIndices.push(i + 1);
        } else {
          incorrectIndices.push(i + 1);
        }
      }

      const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

      const strengths = correctIndices.length
        ? correctIndices.slice(0, 3).map(i => `Question ${i}`)
        : ["None in this quiz — take another attempt to identify strengths."];

      const improvements = incorrectIndices.length
        ? incorrectIndices.slice(0, 4).map(i => `Question ${i}`)
        : ["No immediate improvement areas detected."];

      const fallback = `Areas of Strong Understanding\n* Scored ${correct} / ${total} (${percent}%) on this quiz.\n${strengths.map(s => `* ${s}`).join('\n')}\n\nAreas for Improvement\n${improvements.map(i => `* ${i}`).join('\n')}\n\nRecommendations\n* Review the questions listed under 'Areas for Improvement' and revisit the related materials for the topic: ${quizTopic}.\n* Practice similar questions and pay attention to the concepts tested by the ones you missed.\n* Attempt the quiz again after review to measure improvement.`;

      return { success: true, data: fallback };
    } catch (e) {
      console.error('Fallback insights generation also failed', e);
      return { success: false, error: "Failed to generate insights. Please try again." };
    }
  }
}
