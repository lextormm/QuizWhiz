"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";

interface TopicFormProps {
  onStartQuiz: (
    topic: string,
    numberOfQuestions: number,
    durationMinutes?: number,
    questionStyle?: string
  ) => void;
}

export default function TopicForm({ onStartQuiz }: TopicFormProps) {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [durationMinutes, setDurationMinutes] = useState("0");
  const [questionStyle, setQuestionStyle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      const d = parseInt(durationMinutes);
      onStartQuiz(
        topic,
        parseInt(numQuestions),
        isNaN(d) || d <= 0 ? undefined : d,
        questionStyle.trim() || undefined
      );
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <BookOpen className="h-8 w-8 text-accent-foreground" />
        </div>
        <CardTitle className="font-headline text-3xl">Create a Quiz</CardTitle>
        <CardDescription>Enter any topic and we'll generate a quiz for you!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., The Roman Empire, React.js Hooks, Photosynthesis"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="num-questions">Number of Questions</Label>
            <Select value={numQuestions} onValueChange={setNumQuestions}>
              <SelectTrigger id="num-questions" className="w-full">
                <SelectValue placeholder="Select number of questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Questions</SelectItem>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration-minutes">Optional Timer</Label>
            <Select value={durationMinutes} onValueChange={setDurationMinutes}>
              <SelectTrigger id="duration-minutes" className="w-full">
                <SelectValue placeholder="No timer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No timer</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="question-style">Question style / guidance</Label>
            <Input
              id="question-style"
              placeholder="e.g., numerical, theoretical, easy, tough, application-focused"
              value={questionStyle}
              onChange={(e) => setQuestionStyle(e.target.value)}
              className="text-base"
            />
          </div>
          <Button type="submit" className="w-full text-base font-bold" size="lg" disabled={!topic.trim()}>
            Generate Quiz
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
