'use client';

import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { Button } from "../ui/button";
import QuizWhizApp from "./quiz-whiz-app";
import { collection, query, orderBy } from "firebase/firestore";
import type { ProfessorQuiz } from "@/app/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, BookCopy } from "lucide-react";
import { useState } from "react";

const ProfessorQuizList = ({ onTakeQuiz }: { onTakeQuiz: (quiz: ProfessorQuiz) => void }) => {
    const { firestore } = useFirebase();

    const quizzesQuery = useMemoFirebase(() => 
        firestore 
            ? query(collection(firestore, "quizzes"), orderBy("createdAt", "desc"))
            : null
    , [firestore]);

    const { data: quizzes, isLoading, error } = useCollection<ProfessorQuiz>(quizzesQuery);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return <p className="text-destructive text-center">Could not load professor quizzes.</p>;
    }

    if (!quizzes || quizzes.length === 0) {
        return <p className="text-muted-foreground text-center">No quizzes from professors are available right now.</p>;
    }

    return (
        <div className="space-y-4">
            {quizzes.map(quiz => (
                <Card key={quiz.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                    <div className="flex-grow">
                        <h3 className="font-semibold">{quiz.topic}</h3>
                        <p className="text-sm text-muted-foreground">Quiz by {quiz.authorName}</p>
                    </div>
                    <Button onClick={() => onTakeQuiz(quiz)} className="w-full sm:w-auto">Start Quiz</Button>
                </Card>
            ))}
        </div>
    );
};


export default function StudentView() {
    const { auth, user } = useFirebase();
    const [selectedQuiz, setSelectedQuiz] = useState<ProfessorQuiz | null>(null);

    const handleTakeProfessorQuiz = (quiz: ProfessorQuiz) => {
        setSelectedQuiz(quiz);
    };

    const handleBackToList = () => {
        setSelectedQuiz(null);
    }

    const renderContent = () => {
        if (selectedQuiz) {
            return <QuizWhizApp professorQuiz={selectedQuiz} onRestart={handleBackToList} />
        }

        return (
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                       <BookCopy className="h-5 w-5 text-primary"/>
                        <CardTitle>Quizzes by Professors</CardTitle>
                    </div>
                    <CardDescription>Take a quiz prepared by your professor to test your knowledge.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProfessorQuizList onTakeQuiz={handleTakeProfessorQuiz} />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Welcome, {user?.displayName}!</h2>
                <Button variant="outline" onClick={() => auth.signOut()}>Sign Out</Button>
            </div>
            {renderContent()}
        </div>
    );
}
