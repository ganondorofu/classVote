"use client"

import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import type { Vote, Submission } from "@/lib/store-types";
import { Loader2, CheckCircle, AlertTriangle, Send } from "lucide-react";

interface StudentVoteFormProps {
  vote: Vote;
}

const attendanceSchema = z.object({
  attendanceNumber: z.string().min(1, "Attendance number is required."),
});
type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export function StudentVoteForm({ vote }: StudentVoteFormProps) {
  const { addSubmission, hasVoted, getSubmissionsByVoteId } = useVoteStore();
  const { toast } = useToast();
  const [currentVoter, setCurrentVoter] = useState<string | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  // Separate form for attendance number
  const attendanceForm = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { attendanceNumber: "" },
  });

  // Form for actual vote submission, type depends on vote.voteType
  const voteSubmissionSchema = z.object({
    submissionValue: vote.voteType === 'multiple_choice' 
      ? z.string().min(1, "Please select an option.")
      : vote.voteType === 'yes_no'
      ? z.enum(["yes", "no"], { required_error: "Please select Yes or No."})
      : z.string().min(1, "Your response cannot be empty.").max(500, "Response too long."),
  });
  type VoteSubmissionValues = z.infer<typeof voteSubmissionSchema>;

  const submissionForm = useForm<VoteSubmissionValues>({
    resolver: zodResolver(voteSubmissionSchema),
  });


  useEffect(() => {
    if (currentVoter) {
      setAlreadyVoted(hasVoted(vote.id, currentVoter));
      // Reset submission form when voter changes
      submissionForm.reset(); 
    }
  }, [currentVoter, vote.id, hasVoted, submissionForm]);


  const handleAttendanceSubmit = (data: AttendanceFormValues) => {
    setCurrentVoter(data.attendanceNumber);
  };

  const handleVoteSubmit = async (data: VoteSubmissionValues) => {
    if (!currentVoter) return;
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      addSubmission({
        voteId: vote.id,
        voterAttendanceNumber: currentVoter,
        submissionValue: data.submissionValue,
      });
      toast({
        title: "Vote Submitted!",
        description: "Thank you for participating.",
        className: "bg-green-500 text-white",
      });
      setAlreadyVoted(true); // Mark as voted for current session
      setShowThankYou(true); // Show thank you message
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (vote.status === "closed") {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{vote.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <p className="text-xl">This vote is now closed.</p>
          <p className="text-muted-foreground">Thank you for your interest.</p>
        </CardContent>
      </Card>
    );
  }

  if (showThankYou) {
     return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{vote.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <p className="text-2xl font-semibold">Thank You!</p>
          <p className="text-muted-foreground">Your vote has been recorded.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button onClick={() => { setCurrentVoter(null); setShowThankYou(false); attendanceForm.reset(); }} variant="outline">
                Vote for another student
            </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!currentVoter) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{vote.title}</CardTitle>
          <CardDescription>Enter your attendance number to cast your vote.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...attendanceForm}>
            <form onSubmit={attendanceForm.handleSubmit(handleAttendanceSubmit)} className="space-y-6">
              <FormField
                control={attendanceForm.control}
                name="attendanceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., S101" {...field} autoComplete="off" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                Proceed to Vote
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  if (alreadyVoted) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{vote.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="text-xl">You have already voted in this poll ({currentVoter}).</p>
          <p className="text-muted-foreground">Thank you for your participation!</p>
        </CardContent>
         <CardFooter className="flex justify-center">
            <Button onClick={() => { setCurrentVoter(null); attendanceForm.reset(); }} variant="outline">
                Vote for another student
            </Button>
        </CardFooter>
      </Card>
    );
  }
  

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary">{vote.title}</CardTitle>
        <CardDescription>Casting vote as: <span className="font-semibold">{currentVoter}</span>. Please make your selection below.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...submissionForm}>
          <form onSubmit={submissionForm.handleSubmit(handleVoteSubmit)} className="space-y-8">
            <FormField
              control={submissionForm.control}
              name="submissionValue"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg">Your Vote:</FormLabel>
                  <FormControl>
                    <>
                      {vote.voteType === "free_text" && (
                        <Textarea placeholder="Type your response here..." {...field} autoComplete="off" rows={5} />
                      )}
                      {vote.voteType === "multiple_choice" && vote.options && (
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          {vote.options.map((option) => (
                            <FormItem key={option.id} className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                              <FormControl>
                                <RadioGroupItem value={option.id} />
                              </FormControl>
                              <FormLabel className="font-normal text-base cursor-pointer flex-1">{option.text}</FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      )}
                      {vote.voteType === "yes_no" && (
                         <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                <FormControl><RadioGroupItem value="yes" /></FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer flex-1">Yes / Agree</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                <FormControl><RadioGroupItem value="no" /></FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer flex-1">No / Disagree</FormLabel>
                            </FormItem>
                        </RadioGroup>
                      )}
                    </>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => { setCurrentVoter(null); attendanceForm.reset(); }}>
                Change Voter
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[120px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Vote
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
