"use client";

import { useState, useEffect } from "react";
import type { Quiz, QuizQuestion } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface QuizDisplayProps {
  quiz: Quiz;
  onFinish: (answers: string[]) => void;
  // optional duration in minutes. When set, a countdown will be shown and
  // the quiz will be auto-submitted when the countdown reaches zero.
  durationMinutes?: number;
}

export default function QuizDisplay({ quiz, onFinish, durationMinutes }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(
    new Array(quiz.length).fill("")
  );

  const currentQuestion: QuizQuestion = quiz[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.length) * 100;

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = value;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    onFinish(selectedAnswers);
  };

  // Timer state & logic
  const [remainingMs, setRemainingMs] = useState<number | null>(
    durationMinutes ? durationMinutes * 60 * 1000 : null
  );

  // When the durationMinutes prop changes (or component mounts), reset remaining time
  useEffect(() => {
    if (durationMinutes) {
      setRemainingMs(durationMinutes * 60 * 1000);
    } else {
      setRemainingMs(null);
    }
  }, [durationMinutes]);

  // Countdown ticking
  useEffect(() => {
    if (remainingMs == null) return; // no timer enabled
    const start = Date.now();
    let last = start;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - last;
      last = now;
      setRemainingMs((prev) => {
        if (prev == null) return null;
        const next = prev - elapsed;
        if (next <= 0) {
          // time's up — submit with current answers
          setTimeout(() => onFinish(selectedAnswers), 0);
          return 0;
        }
        return next;
      });
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [remainingMs, onFinish, selectedAnswers]);

  const formatRemaining = (ms: number | null) => {
    if (ms == null) return null;
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLastQuestion = currentQuestionIndex === quiz.length - 1;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        {remainingMs != null && (
          <div className="mb-2 text-sm text-muted-foreground text-right w-full">Time left: <strong>{formatRemaining(remainingMs)}</strong></div>
        )}
        <Progress value={progress} className="mb-4" />
        <CardTitle className="font-headline text-2xl leading-tight">
          <span className="text-muted-foreground mr-2 font-normal">
            {currentQuestionIndex + 1}.
          </span>
          {currentQuestion.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedAnswers[currentQuestionIndex]}
          onValueChange={handleAnswerChange}
          className="space-y-4"
        >
          {currentQuestion.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`option-${index}`}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:checked]:border-primary"
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <span>{option}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
          Previous
        </Button>
        {isLastQuestion ? (
          <Button onClick={handleSubmit} disabled={!selectedAnswers.every(Boolean)}>
            Finish Quiz
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={!selectedAnswers[currentQuestionIndex]}>
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
