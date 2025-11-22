"use client";

import { Logo } from "@/components/quiz-whiz/logo";
import dynamic from 'next/dynamic';
import { Loader2 } from "lucide-react";

const QuizWhizApp = dynamic(() => import('@/components/quiz-whiz/quiz-whiz-app'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">Loading QuizWhiz...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex justify-center">
          <Logo />
        </header>
        <QuizWhizApp />
      </div>
    </main>
  );
}
