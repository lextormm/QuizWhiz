"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutStudent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="mb-6">
          <Link href="/" className="text-sm text-primary hover:underline">← Back</Link>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>About QuizWhiz — Students</CardTitle>
                <CardDescription>How to take excellent quizzes and get strong feedback.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Getting started</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Sign in with your name from the Student tab.</li>
              <li>Browse quizzes created by your professor or take a topic-generated quiz.</li>
              <li>For time-limited quizzes, you will see a countdown — your answers will be auto-submitted when time runs out.</li>
            </ol>

            <h3 className="text-lg font-semibold">During the quiz</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Answer each question and use Next/Previous to navigate.</li>
              <li>All answers are automatically saved locally while you work.</li>
              <li>You will get a score and AI-based (or deterministic) feedback after submission.</li>
            </ul>

            <h3 className="text-lg font-semibold">Tips for best results</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Use a stable internet connection during timed quizzes to avoid any transient issues.</li>
              <li>Review the insights to identify specific topics to improve.</li>
              <li>Retake topic quizzes to track progress over time.</li>
            </ul>

            <div className="flex gap-2">
              <Button asChild>
                <Link href="/">Back to App</Link>
              </Button>
              <Button variant="outline" onClick={() => alert('Tip: Keep your answers selected before time ends — they will be submitted!')}>Quick Tip</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
