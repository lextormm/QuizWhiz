"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutProfessor() {
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
                <CardTitle>About QuizWhiz — Professors</CardTitle>
                <CardDescription>How to create effective quizzes and manage student progress.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Quiz Creation Workflow</h3>
            <ol className="list-decimal pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Open the Professor Dashboard and click Create New Quiz.</li>
              <li>Provide a topic, choose the number of questions and optionally add a timer.</li>
              <li>Optionally provide a question style to influence AI-generated questions (e.g., numerical, theoretical, easy, tough).</li>
              <li>After generating, review the AI-generated questions in the preview panel. You can edit any question or option inline.</li>
              <li>Approve & Publish when satisfied — only published quizzes are visible to students.</li>
            </ol>

            <h3 className="text-lg font-semibold">Managing quizzes and analytics</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Published quizzes appear for students and student attempts are logged in real-time.</li>
              <li>Use the analytics panel to see class averages, strengths, and weaknesses by topic.</li>
            </ul>

            <h3 className="text-lg font-semibold">Best practices</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>Review and edit AI-generated questions for clarity and alignment with your learning objectives.</li>
              <li>Use time limits sparingly and give clear instructions when using timers.</li>
              <li>Encourage students to use insights to improve — consider sharing topic-specific follow-up resources after quizzes.</li>
            </ul>

            <div className="flex gap-2">
              <Button asChild>
                <Link href="/">Back to App</Link>
              </Button>
              <Button variant="outline" onClick={() => alert('Tip: Publishing immediately makes the quiz available to all students.')}>Quick Tip</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
