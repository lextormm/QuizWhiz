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
  const [professorName, setProfessorName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('student');
  const { toast } = useToast();

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
