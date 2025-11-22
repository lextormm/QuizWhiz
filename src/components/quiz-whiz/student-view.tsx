'use client';

import { useFirebase } from "@/firebase";
import { Button } from "../ui/button";
import QuizWhizApp from "./quiz-whiz-app";

export default function StudentView() {
    const { auth, user } = useFirebase();
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Welcome, {user?.displayName}!</h2>
                <Button variant="outline" onClick={() => auth.signOut()}>Sign Out</Button>
            </div>
            <QuizWhizApp />
        </div>
    );
}
