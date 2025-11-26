"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { handleProvidePerformanceInsights } from "@/app/actions";
import QuizDisplay from "@/components/quiz-whiz/quiz-display";
import QuizResults from "@/components/quiz-whiz/quiz-results";
import type { Quiz, QuizAttempt, Answer, ProfessorQuiz } from "@/app/types";
import { Loader2 } from "lucide-react";
import { useFirebase, addDocumentNonBlocking } from "@/firebase";
import { serverTimestamp } from "firebase/firestore";


type QuizState = "loading" | "taking" | "submitting" | "finished";

interface QuizWhizAppProps {
  professorQuiz: ProfessorQuiz;
  onRestart: () => void;
}

export default function QuizWhizApp({ professorQuiz, onRestart }: QuizWhizAppProps) {
  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizId, setQuizId] = useState<string | undefined>(undefined);
  const [durationMinutes, setDurationMinutes] = useState<number | undefined>(undefined);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [insights, setInsights] = useState("");
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  useEffect(() => {
    if (professorQuiz) {
      startProfessorQuiz(professorQuiz);
    }
  }, [professorQuiz]);

  const startProfessorQuiz = (profQuiz: ProfessorQuiz) => {
    setTopic(profQuiz.topic);
    setQuiz(profQuiz.questions);
    setQuizId(profQuiz.id);
    setDurationMinutes(profQuiz.durationMinutes);
    setUserAnswers(new Array(profQuiz.questions.length).fill(""));
    setQuizState("taking");
  };


  const finishQuiz = async (answers: string[]) => {
    setQuizState("submitting");
    setUserAnswers(answers);

    if (!quiz || !topic || !user || !firestore) return;

    let correctCount = 0;
    const answeredQuestions: Answer[] = quiz.map((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      if (isCorrect) {
        correctCount++;
      }
      return {
        question: question.question,
        selectedAnswer: answers[index],
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
      };
    });

    const finalScore = (correctCount / quiz.length) * 100;
    setScore(finalScore);

    const attempt: Omit<QuizAttempt, 'id'> = {
      studentId: user.uid,
      studentName: user.displayName || 'Anonymous',
      quizTopic: topic,
      quizId: quizId,
      quiz: quiz,
      answers: answeredQuestions,
      score: finalScore,
      submittedAt: serverTimestamp() as any,
    };

    addDocumentNonBlocking(firestore, 'quizAttempts', attempt);

    const correctAnswers = quiz.map((q) => q.correctAnswer);
    const insightsResult = await handleProvidePerformanceInsights(
      answers,
      correctAnswers,
      topic
    );

    if (insightsResult.success && insightsResult.data) {
      setInsights(insightsResult.data);
    } else {
      setInsights("Could not generate performance insights at this time.");
      toast({
        variant: "destructive",
        title: "Insight Error",
        description: insightsResult.error,
      });
    }
    setQuizState("finished");
  };

  const renderContent = () => {
    switch (quizState) {
      case "taking":
        return (
          quiz && <QuizDisplay quiz={quiz} onFinish={finishQuiz} durationMinutes={durationMinutes} />
        );
      case "submitting":
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Calculating your results...</p>
          </div>
        );
      case "finished":
        return (
          quiz && (
            <QuizResults
              quiz={quiz}
              userAnswers={userAnswers}
              score={score}
              insights={insights}
              onRestart={onRestart}
            />
          )
        );
      case "loading":
      default:
         return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Loading quiz...</p>
          </div>
         );
    }
  };

  return renderContent();
}
