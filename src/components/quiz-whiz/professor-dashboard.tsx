'use client';

import { useFirebase, useUser, useCollection, useMemoFirebase } from "@/firebase";
import type { QuizAttempt, ProfessorQuiz, QuizQuestion } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewQuiz, setPreviewQuiz] = useState<{
    topic: string;
    questions: QuizQuestion[];
    durationMinutes?: number;
    questionStyle?: string;
  } | null>(null);
  
  const attemptsQuery = useMemoFirebase(() => {
      // Stricter guard: only create the query if we are certain the user is a professor.
      // Only attach the class-wide attempts query when we know the caller is
      // genuinely authenticated and the profile indicates a professor role.
      // This avoids a short race condition where the client auth/context is
      // partially available but the backend rejects the initial listener.
      if (firestore && professor?.role === 'professor' && user && !isUserLoading) {
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

  const handleCreateQuiz = async (
    topic: string,
    numberOfQuestions: number,
    durationMinutes?: number,
    questionStyle?: string
  ) => {
    if (!firestore || !user) return;
    
    setIsGenerating(true);
    const result = await handleGenerateQuiz(topic, numberOfQuestions, questionStyle);
    setIsGenerating(false);

    if (result.success && result.data) {
      // Store the generated questions for professor review. The professor
      // must approve before we persist the quiz so they can inspect/edit.
      setPreviewQuiz({ topic, questions: result.data, durationMinutes, questionStyle });
      toast({
        title: "Preview ready",
        description: `Review the generated questions below, then approve to publish.`,
      });
      // leave isCreatingQuiz true so the form/preview remain visible
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to generate quiz.",
      });
    }
  };

  const handleApproveAndPublish = async () => {
    if (!firestore || !user || !previewQuiz) return;
    const { topic, questions, durationMinutes, questionStyle } = previewQuiz;
    const newQuiz: Omit<ProfessorQuiz, 'id' | 'createdAt'> & { createdAt: any, durationMinutes?: number, questionStyle?: string } = {
      topic,
      authorId: user.uid,
      authorName: professor.name,
      questions,
      createdAt: serverTimestamp(),
      ...(durationMinutes ? { durationMinutes } : {}),
      ...(questionStyle ? { questionStyle } : {}),
    };

    const quizzesCollection = collection(firestore, 'quizzes');
    addDoc(quizzesCollection, newQuiz).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: quizzesCollection.path,
        operation: 'create',
        requestResourceData: newQuiz,
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    toast({
      title: 'Quiz Published',
      description: `Your quiz on "${topic}" is now available for students.`,
    });
    setPreviewQuiz(null);
    setIsCreatingQuiz(false);
  };

  const handleRejectPreview = () => {
    // Simply clear preview so professor can edit/regenerate
    setPreviewQuiz(null);
  };

  const handleRegeneratePreview = async () => {
    if (!previewQuiz) return;
    setIsGenerating(true);
    const result = await handleGenerateQuiz(previewQuiz.topic, previewQuiz.questions.length, previewQuiz.questionStyle);
    setIsGenerating(false);
    if (result.success && result.data) {
      setPreviewQuiz({ ...previewQuiz, questions: result.data });
      toast({ title: 'Regenerated preview', description: 'The questions were regenerated for your review.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to regenerate questions.' });
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
      // The useCollection hook now throws the error which is caught by the boundary
      // We can render a fallback UI here, or let the error boundary handle it.
      // For a better user experience, a component-level message is good.
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
        // If we have a generated preview, show it for review/approval.
        if (previewQuiz) {
          return (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Review Generated Questions</CardTitle>
                      <CardDescription>Inspect each generated question and approve to publish the quiz for students.</CardDescription>
                    </div>
                    <div className="space-x-2">
                      <Button onClick={handleRegeneratePreview} variant="ghost">Regenerate</Button>
                      <Button onClick={handleRejectPreview} variant="outline">Back to Edit</Button>
                      <Button onClick={handleApproveAndPublish} variant="default">Approve & Publish</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">Topic: <strong>{previewQuiz.topic}</strong></div>
                  {previewQuiz.durationMinutes && (
                    <div className="text-sm text-muted-foreground">Duration: <strong>{previewQuiz.durationMinutes} minutes</strong></div>
                  )}
                  {previewQuiz.questionStyle && (
                    <div className="text-sm text-muted-foreground">Style: <strong>{previewQuiz.questionStyle}</strong></div>
                  )}

                  <div className="space-y-4">
                    {previewQuiz.questions.map((q, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="mb-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="font-semibold">{idx + 1}.</div>
                            <div className="flex-1">
                              <Textarea
                                value={q.question}
                                onChange={(e) => {
                                  const newQuestions = previewQuiz.questions.slice();
                                  newQuestions[idx] = { ...newQuestions[idx], question: e.target.value };
                                  setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
                                }}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 rounded flex items-center gap-3 ${opt === q.correctAnswer ? 'bg-green-50 border border-green-200' : 'border bg-white'}`}>
                              <div className="w-6 text-sm font-medium">{String.fromCharCode(65 + oIdx)}.</div>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const newQuestions = previewQuiz.questions.slice();
                                  const newOpts = newQuestions[idx].options.slice();
                                  newOpts[oIdx] = e.target.value;
                                  newQuestions[idx] = { ...newQuestions[idx], options: newOpts };
                                  setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
                                }}
                                className="flex-1"
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={opt === q.correctAnswer ? 'default' : 'outline'}
                                  onClick={() => {
                                    const newQuestions = previewQuiz.questions.slice();
                                    newQuestions[idx] = { ...newQuestions[idx], correctAnswer: opt };
                                    setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
                                  }}
                                >
                                  {opt === q.correctAnswer ? 'Correct' : 'Mark Correct'}
                                </Button>
                                {q.options.length > 2 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newQuestions = previewQuiz.questions.slice();
                                      const newOpts = newQuestions[idx].options.slice();
                                      newOpts.splice(oIdx, 1);
                                      // ensure correctAnswer still valid
                                      let newCorrect = newQuestions[idx].correctAnswer;
                                      if (!newOpts.includes(newCorrect)) newCorrect = newOpts[0];
                                      newQuestions[idx] = { ...newQuestions[idx], options: newOpts, correctAnswer: newCorrect };
                                      setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
                                    }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}

                          <div className="flex gap-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => {
                                const newQuestions = previewQuiz.questions.slice();
                                const opts = newQuestions[idx].options.slice();
                                opts.push('New option');
                                newQuestions[idx] = { ...newQuestions[idx], options: opts };
                                setPreviewQuiz({ ...previewQuiz, questions: newQuestions });
                              }}
                            >
                              Add Option
                            </Button>
                            <div className="text-sm text-muted-foreground">Mark the correct option for each question.</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleApproveAndPublish} className="flex-1">Approve & Publish</Button>
                <Button variant="outline" onClick={handleRegeneratePreview}>Regenerate</Button>
                <Button variant="ghost" onClick={handleCancelCreateQuiz}>Cancel</Button>
              </div>
            </div>
          )
        }

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
