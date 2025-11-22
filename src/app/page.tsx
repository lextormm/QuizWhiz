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

  // Only render the ProfessorDashboard if the profile is loaded and the role is 'professor'.
  // In all other cases (loading profile, student role), default to the student view or a safe loading state.
  if (userProfile?.role === 'professor') {
    return <ProfessorDashboard professor={userProfile} />;
  }
  
  // Render StudentView if role is student, or as a safe default while profile might be loading after auth is resolved.
  if (userProfile?.role === 'student') {
    return <StudentView />;
  }

  // Fallback for the brief moment after auth is ready but profile is not yet loaded.
  // We avoid rendering the professor dashboard here to prevent the permission error.
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
