import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz-from-topic";

export type QuizQuestion = GenerateQuizOutput['quiz'][0];
export type Quiz = GenerateQuizOutput['quiz'];
