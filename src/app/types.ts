import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz-from-topic";
import type { Timestamp } from "firebase/firestore";

export type QuizQuestion = GenerateQuizOutput['quiz'][0];
export type Quiz = GenerateQuizOutput['quiz'];

export type Answer = {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

export type QuizAttempt = {
  id?: string;
  studentId: string;
  studentName: string;
  quizTopic: string;
  quiz: Quiz;
  answers: Answer[];
  score: number;
  submittedAt: Timestamp | Date;
};
