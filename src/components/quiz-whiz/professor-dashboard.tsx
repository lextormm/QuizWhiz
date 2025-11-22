'use client';

import { useFirebase, useUser, useCollection, useMemoFirebase } from "@/firebase";
import type { QuizAttempt, ProfessorQuiz } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BarChart, Users, TrendingUp, TrendingDown, BookOpen, PlusCircle } from "lucide-react";
import { format } from 'date-fns';
import { useMemo, useState } from "react";
import { collection, query, orderBy, serverTimestamp, addDoc } from "firebase/firestore";
import TopicForm from "./topic-form";
import { useToast } from "@/hooks/use-toast";
import { handleGenerateQuiz } from "@/app/actions";
import { FirestorePermissionError, errorEmitter } from "@/firebase";


function AnalyticsCard({ title, value, icon: Icon, subtext }: { title: string; value: string | number; icon: React.ElementType, subtext?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  );
}

export default function ProfessorDashboard({ professor }: { professor: {id: string, name: string, role: 'professor'}}) {
  const { auth, firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const attemptsQuery = useMemoFirebase(() => {
      if (firestore && professor?.role === 'professor') {
        return query(collection(firestore, "quizAttempts"), orderBy("submittedAt", "desc"));
      }
      return null;
  }, [firestore, professor]);

  const { data: attempts, isLoading, error } = useCollection<QuizAttempt>(attemptsQuery);
  
  const analytics = useMemo(() => {
    if (!attempts || attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        uniqueStudents: 0,
        bestTopic: { name: 'N/A', score: 0 },
        worstTopic: { name: 'N/A', score: 100 },
      };
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const averageScore = totalScore / totalAttempts;
    const uniqueStudents = new Set(attempts.map(a => a.studentId)).size;

    const topicPerformance: { [topic: string]: { scores: number[], count: number } } = {};
    attempts.forEach(attempt => {
      if (!topicPerformance[attempt.quizTopic]) {
        topicPerformance[attempt.quizTopic] = { scores: [], count: 0 };
      }
      topicPerformance[attempt.quizTopic].scores.push(attempt.score);
      topicPerformance[attempt.quizTopic].count++;
    });

    let bestTopic = { name: 'N/A', score: 0 };
    let worstTopic = { name: 'N/A', score: 100 };

    Object.entries(topicPerformance).forEach(([topic, data]) => {
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.count;
      if (avg > bestTopic.score) {
        bestTopic = { name: topic, score: avg };
      }
      if (avg < worstTopic.score) {
        worstTopic = { name: topic, score: avg };
      }
    });

    return { totalAttempts, averageScore, uniqueStudents, bestTopic, worstTopic };
  }, [attempts]);

  const handleStartCreateQuiz = () => {
    setIsCreatingQuiz(true);
  };

  const handleCancelCreateQuiz = () => {
    setIsCreatingQuiz(false);
  }

  const handleCreateQuiz = async (topic: string, numberOfQuestions: number) => {
    if (!firestore || !user) return;
    
    setIsGenerating(true);
    const result = await handleGenerateQuiz(topic, numberOfQuestions);
    setIsGenerating(false);

    if (result.success && result.data) {
      const newQuiz: Omit<ProfessorQuiz, 'id' | 'createdAt'> & { createdAt: any } = {
        topic,
        authorId: user.uid,
        authorName: professor.name,
        questions: result.data,
        createdAt: serverTimestamp(),
      };
      
      const quizzesCollection = collection(firestore, 'quizzes');
      await addDoc(quizzesCollection, newQuiz).catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: quizzesCollection.path,
            operation: 'create',
            requestResourceData: newQuiz,
          });
          errorEmitter.emit('permission-error', permissionError);
      });
      
      toast({
        title: "Quiz Created!",
        description: `Your quiz on "${topic}" is now available for students.`,
      });
      setIsCreatingQuiz(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to generate quiz.",
      });
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
  
    if (error) {
      return <div className="text-center text-destructive p-4">Error loading data. You may not have permission to view this.</div>;
    }

    if (isGenerating) {
        return (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Generating your new quiz...</p>
          </div>
        );
    }

    if (isCreatingQuiz) {
        return (
            <div>
                <TopicForm onStartQuiz={handleCreateQuiz} />
                <Button variant="ghost" onClick={handleCancelCreateQuiz} className="mt-4 w-full">Cancel</Button>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts && attempts.length > 0 ? (
                attempts.map(attempt => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.studentName}</TableCell>
                    <TableCell>{attempt.quizTopic}</TableCell>
                    <TableCell>
                      <Badge variant={attempt.score >= 80 ? 'success' : attempt.score > 50 ? 'secondary' : 'destructive'}>
                        {attempt.score.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {attempt.submittedAt ? format(new Date((attempt.submittedAt as any).seconds * 1000), 'PPp') : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No quiz attempts yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Professor Dashboard</h1>
            <Button variant="outline" onClick={() => auth.signOut()}>Sign Out</Button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AnalyticsCard title="Total Attempts" value={analytics.totalAttempts} icon={BookOpen} />
        <AnalyticsCard title="Class Average" value={`${analytics.averageScore.toFixed(1)}%`} icon={BarChart} />
        <AnalyticsCard title="Unique Students" value={analytics.uniqueStudents} icon={Users} />
        <AnalyticsCard title="Best Topic" value={analytics.bestTopic.name} icon={TrendingUp} subtext={`Avg: ${analytics.bestTopic.score.toFixed(1)}%`} />
        <AnalyticsCard title="Weakest Topic" value={analytics.worstTopic.name} icon={TrendingDown} subtext={`Avg: ${analytics.worstTopic.score.toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Student Results</CardTitle>
                    <CardDescription>A real-time log of all quiz attempts and scores.</CardDescription>
                </div>
                {!isCreatingQuiz && (
                    <Button onClick={handleStartCreateQuiz}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Create New Quiz
                    </Button>
                )}
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
