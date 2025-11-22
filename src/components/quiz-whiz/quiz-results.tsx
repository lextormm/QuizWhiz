import type { Quiz } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, XCircle, Lightbulb, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizResultsProps {
  quiz: Quiz;
  userAnswers: string[];
  score: number;
  insights: string;
  onRestart: () => void;
}

const InsightsSection = ({ title, items, icon: Icon, iconClass }: { title: string, items: string[], icon: React.ElementType, iconClass: string }) => {
    if (items.length === 0) return null;
  
    return (
      <div>
        <h3 className="flex items-center text-lg font-semibold mb-2">
          <Icon className={cn("h-5 w-5 mr-2", iconClass)} />
          {title}
        </h3>
        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
          {items.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') }} />
          ))}
        </ul>
      </div>
    );
  };

const ParsedInsights = ({ insights }: { insights: string }) => {
    const lines = insights.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let strengths: string[] = [];
    let improvements: string[] = [];
    let currentSection: 'strengths' | 'improvements' | null = null;
  
    lines.forEach(line => {
      if (line.includes('Areas of Strong Understanding')) {
        currentSection = 'strengths';
        return;
      }
      if (line.includes('Areas for Improvement')) {
        currentSection = 'improvements';
        return;
      }
  
      if (line.startsWith('*')) {
        const item = line.substring(1).trim();
        if (currentSection === 'strengths') {
          strengths.push(item);
        } else if (currentSection === 'improvements') {
          improvements.push(item);
        }
      }
    });
  
    return (
      <div className="space-y-6">
        <InsightsSection title="Areas of Strong Understanding" items={strengths} icon={CheckCircle2} iconClass="text-success" />
        <InsightsSection title="Areas for Improvement" items={improvements} icon={XCircle} iconClass="text-destructive" />
      </div>
    );
  }

export default function QuizResults({
  quiz,
  userAnswers,
  score,
  insights,
  onRestart,
}: QuizResultsProps) {
  const scoreColor = score >= 80 ? "text-success" : score >= 50 ? "text-muted-foreground" : "text-destructive";
  const scoreMessage = score >= 80 ? "Excellent Work!" : score >= 50 ? "Good Effort!" : "Keep Practicing!";

  return (
    <div className="w-full space-y-8">
      <Card className="w-full shadow-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">Quiz Complete!</CardTitle>
          <CardDescription>{scoreMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-6xl font-bold">
            <span className={scoreColor}>{Math.round(score)}%</span>
          </p>
          <p className="text-muted-foreground mt-2">
            You answered {userAnswers.filter((ans, i) => ans === quiz[i].correctAnswer).length} out of {quiz.length} questions correctly.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onRestart} className="text-base font-bold" size="lg">
            Take Another Quiz
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center gap-2">
                <Lightbulb className="text-yellow-400"/>
                <CardTitle>Performance Insights</CardTitle>
            </div>
            <CardDescription>Here's an AI-powered breakdown of your performance.</CardDescription>
        </CardHeader>
        <CardContent>
            {insights ? (
                <ParsedInsights insights={insights} />
            ) : (
                <p className="text-muted-foreground">Could not generate insights for this quiz.</p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review Your Answers</CardTitle>
          <CardDescription>Check which questions you got right and wrong.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {quiz.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              return (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-3 text-left">
                      {isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                      )}
                      <span className="flex-1">{question.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pl-8">
                    <p>
                      Your answer:{" "}
                      <span className={cn("font-semibold", isCorrect ? "text-success" : "text-destructive")}>
                        {userAnswer || "Not answered"}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p>
                        Correct answer:{" "}
                        <span className="font-semibold text-success">
                          {question.correctAnswer}
                        </span>
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
