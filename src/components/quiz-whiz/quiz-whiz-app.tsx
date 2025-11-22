"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { handleGenerateQuiz, handleProvidePerformanceInsights } from "@/app/actions";
import TopicForm from "@/components/quiz-whiz/topic-form";
import QuizDisplay from "@/components/quiz-whiz/quiz-display";
import QuizResults from "@/components/quiz-whiz/quiz-results";
import type { Quiz, QuizAttempt, Answer, ProfessorQuiz } from "@/app/types";
import { Loader2 } from "lucide-react";
import { useFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";


type QuizState = "idle" | "generating" | "taking" | "submitting" | "finished";

export default function QuizWhizApp({ onTakeProfessorQuiz }: { onTakeProfessorQuiz: (quiz: ProfessorQuiz) => void }) {
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizId, setQuizId] = useState<string | undefined>(undefined);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [insights, setInsights] = useState("");
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  const startGeneratedQuiz = async (topic: string, numberOfQuestions: number) => {
    setQuizState("generating");
    setTopic(topic);
    setQuizId(undefined); // This is a student-generated quiz
    const result = await handleGenerateQuiz(topic, numberOfQuestions);

    if (result.success && result.data) {
      if (result.data.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not generate a quiz for this topic. Please try another one.",
        });
        setQuizState("idle");
        return;
      }
      setQuiz(result.data);
      setUserAnswers(new Array(result.data.length).fill(""));
      setQuizState("taking");
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
      setQuizState("idle");
    }
  };

  const startProfessorQuiz = (profQuiz: ProfessorQuiz) => {
    setTopic(profQuiz.topic);
    setQuiz(profQuiz.questions);
    setQuizId(profQuiz.id);
    setUserAnswers(new Array(profQuiz.questions.length).fill(""));
    setQuizState("taking");
  };

  // This effect will be triggered from the parent component
  const handleTakeProfessorQuiz = (quiz: ProfessorQuiz) => {
    startProfessorQuiz(quiz);
  };
  
  // Expose the function to the parent
  onTakeProfessorQuiz.prototype.start = handleTakeProfessorQuiz;


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

    addDocumentNonBlocking(collection(firestore, 'quizAttempts'), attempt);

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

  const restartQuiz = () => {
    setQuizState("idle");
    setTopic("");
    setQuiz(null);
    setUserAnswers([]);
    setScore(0);
    setInsights("");
  };

  const renderContent = () => {
    switch (quizState) {
      case "generating":
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Generating your quiz on "{topic}"...</p>
            <p className="text-muted-foreground">This may take a moment. Please wait.</p>
          </div>
        );
      case "taking":
        return quiz && <QuizDisplay quiz={quiz} onFinish={finishQuiz} />;
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
              onRestart={restartQuiz}
            />
          )
        );
      case "idle":
      default:
        return <TopicForm onStartQuiz={startGeneratedQuiz} />;
    }
  };

  return renderContent();
}
