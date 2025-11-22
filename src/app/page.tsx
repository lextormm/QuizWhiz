"use client";

import { useUser, FirebaseClientProvider, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Logo } from "@/components/quiz-whiz/logo";
import { Loader2 } from "lucide-react";
import Login from "@/components/quiz-whiz/login";
import ProfessorDashboard from "@/components/quiz-whiz/professor-dashboard";
import StudentView from "@/components/quiz-whiz/student-view";

const AppContent = () => {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirebase();

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(firestore, "users", user.uid) : null
  , [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ id: string; name: string; role: 'student' | 'professor' }>(userProfileRef);
  
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
  
  // This is the critical change: Only render ProfessorDashboard if we are certain the user is a professor.
  // In all other cases (student role, or while profile is loading after auth is ready)
  // default to the StudentView. This prevents the ProfessorDashboard and its
  // data-fetching hooks from ever being mounted for a non-professor user.
  if (userProfile?.role === 'professor') {
    return <ProfessorDashboard professor={userProfile} />;
  }

  return <StudentView />;
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
