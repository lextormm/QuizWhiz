'use client';

import { useFirebase, useUser } from "@/firebase";
import { Button } from "../ui/button";
import QuizWhizApp from "./quiz-whiz-app";
import type { QuizAttempt } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import type { FirestoreError } from "firebase/firestore";

interface PastQuizzesProps {
    attempts: QuizAttempt[] | null;
    isLoading: boolean;
    error: FirestoreError | Error | null;
}

function PastQuizzes({ attempts, isLoading, error }: PastQuizzesProps) {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
  
    if (error) {
      return <div className="text-center text-destructive">Error loading past quizzes. {error.message}</div>;
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Past Quizzes</CardTitle>
          <CardDescription>Review your previous quiz attempts and scores.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts && attempts.length > 0 ? (
                attempts.map(attempt => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.quizTopic}</TableCell>
                    <TableCell>
                      <Badge variant={attempt.score >= 80 ? 'success' : attempt.score > 50 ? 'secondary' : 'destructive'}>
                        {attempt.score.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {attempt.submittedAt ? format(new Date((attempt.submittedAt as any).seconds * 1000), 'PP') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">You haven't taken any quizzes yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
}

interface StudentViewProps {
    attempts: QuizAttempt[] | null;
    isLoading: boolean;
    error: FirestoreError | Error | null;
}

export default function StudentView({ attempts, isLoading, error }: StudentViewProps) {
    const { auth, user } = useFirebase();
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Welcome, {user?.displayName}!</h2>
                <Button variant="outline" onClick={() => auth.signOut()}>Sign Out</Button>
            </div>
            <QuizWhizApp />
            <PastQuizzes attempts={attempts} isLoading={isLoading} error={error} />
        </div>
    );
}
