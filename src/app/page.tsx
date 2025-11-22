"use client";

import { useUser, FirebaseClientProvider, useDoc, useFirebase, useMemoFirebase, useCollection } from "@/firebase";
import { collection, doc, query, where, orderBy } from "firebase/firestore";
import { Logo } from "@/components/quiz-whiz/logo";
import { Loader2 } from "lucide-react";
import Login from "@/components/quiz-whiz/login";
import ProfessorDashboard from "@/components/quiz-whiz/professor-dashboard";
import StudentView from "@/components/quiz-whiz/student-view";
import type { QuizAttempt } from "@/app/types";

const AppContent = () => {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirebase();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role: 'student' | 'professor' }>(userProfileRef);

  // Define the query based on the user's role
  const attemptsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile) return null; // Wait for profile

    if (userProfile.role === 'professor') {
      // Professor gets all attempts
      return query(collection(firestore, "quizAttempts"), orderBy("submittedAt", "desc"));
    }
    if (userProfile.role === 'student' && user) {
      // Student only gets their own attempts
      return query(
        collection(firestore, "quizAttempts"),
        where("studentId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
    }
    return null; // Return null if role is not determined yet
  }, [firestore, user, userProfile]);

  const { data: attempts, isLoading: isAttemptsLoading, error } = useCollection<QuizAttempt>(attemptsQuery);
  
  const isLoading = isAuthLoading || (user && isProfileLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Loading your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Once profile is loaded, decide which view to render
  if (userProfile?.role === 'professor') {
    return <ProfessorDashboard attempts={attempts} isLoading={isAttemptsLoading} error={error} />;
  }

  if (userProfile?.role === 'student') {
    return <StudentView attempts={attempts} isLoading={isAttemptsLoading} error={error} />;
  }

  // Fallback while profile is loading after auth is confirmed
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg font-medium">Verifying user role...</p>
    </div>
  );
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex justify-center">
          <Logo />
        </header>
        <FirebaseClientProvider>
          <AppContent />
        </FirebaseClientProvider>
      </div>
    </main>
  );
}
