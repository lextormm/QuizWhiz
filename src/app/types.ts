import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz-from-topic";
import type { Timestamp } from "firebase/firestore";

export type QuizQuestion = GenerateQuizOutput['quiz'][0];
export type Quiz = GenerateQuizOutput['quiz'];

// Represents a quiz created by a professor and stored in Firestore
export type ProfessorQuiz = {
  id: string;
  topic: string;
  authorId: string;
  authorName: string;
  questions: QuizQuestion[];
  createdAt: Timestamp;
};

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
  quizId?: string; // Optional: ID of the professor-created quiz
  quizTopic: string;
  quiz: Quiz;
  answers: Answer[];
  score: number;
  submittedAt: Timestamp | Date;
};
