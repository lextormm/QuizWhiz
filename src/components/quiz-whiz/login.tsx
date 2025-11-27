'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { signIn } from '@/firebase';
import { Loader2, GraduationCap, UserCircle } from 'lucide-react';

export default function Login() {
  const [studentName, setStudentName] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [professorName, setProfessorName] = useState('');
  const [professorPassword, setProfessorPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('student');
  const { toast } = useToast();
  const [showStudentAbout, setShowStudentAbout] = useState(false);
  const [showProfessorAbout, setShowProfessorAbout] = useState(false);

  const handleLogin = async (role: 'student' | 'professor') => {
    const name = role === 'student' ? studentName : professorName;
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your name.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn(name, role);
      // The onAuthStateChanged listener in FirebaseProvider will handle the redirect.
      toast({
        title: 'Success',
        description: `Welcome, ${name}!`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Could not sign you in. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student">
            <GraduationCap className="mr-2" />
            Student
          </TabsTrigger>
          <TabsTrigger value="professor">
            <UserCircle className="mr-2" />
            Professor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="student">
          {/* Small interactive About / Intro area for students */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Welcome to QuizWhiz — Students</CardTitle>
                  <CardDescription>Quick practice quizzes tailored by professors or generated on-demand to help you learn fast.</CardDescription>
                </div>
                <div>
                  <Button size="sm" variant="ghost" onClick={() => setShowStudentAbout(s => !s)}>
                    {showStudentAbout ? 'Less' : 'Learn more'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showStudentAbout && (
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Take quizzes created by your professor or try AI-generated topic quizzes.</p>
                <p>• Real-time scoring and actionable feedback after submission.</p>
                <p>• Use the optional timer when a professor sets a time limit — quizzes auto-submit when time runs out.</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => toast({ title: 'Tip', description: 'Best used with a stable internet connection for real-time scoring.' })}>Tip</Button>
                  <Button size="sm" onClick={() => setShowStudentAbout(false)}>Got it</Button>
                </div>
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Student Login</CardTitle>
              <CardDescription>Enter your name to start taking quizzes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Name</Label>
                <Input
                  id="student-name"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  disabled={isLoading}
                />
                <div>
                  <Label htmlFor="student-password">Password</Label>
                  <Input
                    id="student-password"
                    placeholder="Enter password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    disabled={isLoading}
                    type="password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleLogin('student')} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login as Student
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="professor">
          {/* Small interactive About / Intro area for professors */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Welcome to QuizWhiz — Professors</CardTitle>
                  <CardDescription>Create classroom quizzes or generate AI-driven quizzes and review them before publishing.</CardDescription>
                </div>
                <div>
                  <Button size="sm" variant="ghost" onClick={() => setShowProfessorAbout(s => !s)}>
                    {showProfessorAbout ? 'Less' : 'Learn more'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showProfessorAbout && (
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>• Generate quizzes from a topic, add a time limit, and choose question style.</p>
                <p>• Review AI-generated questions, edit them inline and publish only after approval.</p>
                <p>• View student attempts and get analytics from the Professor Dashboard.</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => toast({ title: 'Workflow', description: 'Generate → Review → Publish — students can then take the quiz.' })}>Workflow</Button>
                  <Button size="sm" onClick={() => setShowProfessorAbout(false)}>Got it</Button>
                </div>
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Professor Login</CardTitle>
              <CardDescription>Access the dashboard to view student progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="professor-name">Name</Label>
                <Input
                  id="professor-name"
                  placeholder="Enter your name"
                  value={professorName}
                  onChange={(e) => setProfessorName(e.target.value)}
                  disabled={isLoading}
                />
                <div>
                  <Label htmlFor="professor-password">Password</Label>
                  <Input
                    id="professor-password"
                    placeholder="Enter password"
                    value={professorPassword}
                    onChange={(e) => setProfessorPassword(e.target.value)}
                    disabled={isLoading}
                    type="password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleLogin('professor')} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login as Professor
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
