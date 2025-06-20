
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
import type { Vote } from "@/lib/store-types";
import { Loader2, CheckCircle, AlertTriangle, Send, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentVoteFormProps {
  vote: Vote;
}

const attendanceSchema = z.object({
  attendanceNumber: z.coerce.number().int().min(1, { message: "出席番号は1以上の整数で入力してください。" }),
});
type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export function StudentVoteForm({ vote }: StudentVoteFormProps) {
  const { addSubmission, hasVoted } = useVoteStore();
  const { toast } = useToast();
  const [currentVoter, setCurrentVoter] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const attendanceForm = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { attendanceNumber: undefined },
  });

  const voteSubmissionSchema = z.object({
    submissionValue: vote.allowEmptyVotes
      ? vote.voteType === 'free_text'
        ? z.string().max(500, "回答が長すぎます。500文字以内で入力してください。").optional().default("")
        : z.string().optional()
      : vote.voteType === 'multiple_choice'
        ? z.string({required_error: "選択肢を選んでください。"}).min(1, "選択肢を選んでください。")
        : vote.voteType === 'yes_no'
          ? z.enum(["yes", "no"], { required_error: "「はい」または「いいえ」を選択してください。" })
          : z.string().min(1, "回答を入力してください。").max(500, "回答が長すぎます。500文字以内で入力してください。"),
  });
  type VoteSubmissionValues = z.infer<typeof voteSubmissionSchema>;

  const submissionForm = useForm<VoteSubmissionValues>({
    resolver: zodResolver(voteSubmissionSchema),
    defaultValues: {
      submissionValue: vote.allowEmptyVotes ? undefined : (vote.voteType === 'yes_no' ? undefined : "")
    }
  });


  useEffect(() => {
    if (currentVoter !== null) {
      setAlreadyVoted(hasVoted(vote.id, currentVoter.toString()));
      submissionForm.reset({ 
        submissionValue: vote.allowEmptyVotes ? undefined : (vote.voteType === 'yes_no' ? undefined : "")
      });
    }
  }, [currentVoter, vote.id, hasVoted, submissionForm, vote.allowEmptyVotes, vote.voteType]);


  const handleAttendanceSubmit = (data: AttendanceFormValues) => {
    setCurrentVoter(data.attendanceNumber);
  };

  const handleVoteSubmit = async (data: VoteSubmissionValues) => {
    if (currentVoter === null) return;
    setIsLoading(true);
    
    let submissionFinalValue = data.submissionValue;
    if (vote.allowEmptyVotes) {
        if (vote.voteType === 'free_text' && submissionFinalValue === undefined) {
            submissionFinalValue = ""; 
        }
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      addSubmission({
        voteId: vote.id,
        voterAttendanceNumber: currentVoter.toString(),
        submissionValue: submissionFinalValue,
      });
      toast({
        title: "投票完了！",
        description: "ご協力ありがとうございました。",
        className: "bg-green-500 text-white",
      });
      setAlreadyVoted(true);
      setShowThankYou(true);
    } catch (error) {
      toast({
        title: "エラー",
        description: "投票を送信できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getVisibilityDisplay = (setting: Vote['visibilitySetting']) => {
    switch (setting) {
        case 'everyone': return '全員に公開';
        case 'admin_only': return '管理者のみ';
        case 'anonymous': return '匿名';
        default: return '不明';
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
          <p className="text-xl">この投票は終了しました。</p>
          <p className="text-muted-foreground">ご関心をお寄せいただき、ありがとうございました。</p>
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
          <p className="text-2xl font-semibold">ありがとうございました！</p>
          <p className="text-muted-foreground">あなたの投票は記録されました。</p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Button onClick={() => { setCurrentVoter(null); setShowThankYou(false); attendanceForm.reset({ attendanceNumber: undefined }); }} variant="outline">
                別の出席番号で投票する
            </Button>
        </CardFooter>
      </Card>
    );
  }

  if (currentVoter === null) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{vote.title}</CardTitle>
          <CardDescription className="flex flex-col gap-2">
            <span>投票するには出席番号（半角数字）を入力してください。</span>
            <span className="flex items-center text-xs text-muted-foreground">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              この投票の公開設定: <Badge variant="outline" className="ml-1">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
              {vote.allowEmptyVotes && <Badge variant="outline" className="ml-1">空の投票可</Badge>}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...attendanceForm}>
            <form onSubmit={attendanceForm.handleSubmit(handleAttendanceSubmit)} className="space-y-6">
              <FormField
                control={attendanceForm.control}
                name="attendanceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>出席番号 (例: 1～{vote.totalExpectedVoters})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={`例: 10`} {...field} autoComplete="off" min="1" max={vote.totalExpectedVoters.toString()} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                投票に進む
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
          <p className="text-xl">出席番号 {currentVoter} は、この投票に既に投票済みです。</p>
          {vote.visibilitySetting !== 'anonymous' ? (
             <p className="text-muted-foreground mt-2">投票内容を変更したい場合は、管理者に連絡して投票のリセットを依頼してください。</p>
          ) : null}
          <p className="text-muted-foreground mt-2">ご協力ありがとうございました！</p>
        </CardContent>
         <CardFooter className="flex justify-center">
            <Button onClick={() => { setCurrentVoter(null); attendanceForm.reset({ attendanceNumber: undefined }); }} variant="outline">
                別の出席番号で投票する
            </Button>
        </CardFooter>
      </Card>
    );
  }
  

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary">{vote.title}</CardTitle>
        <CardDescription className="flex flex-col gap-1">
            <span>出席番号: <span className="font-semibold">{currentVoter}</span> として投票します。</span>
            <span className="text-xs text-muted-foreground flex items-center">
                 <Eye className="mr-1.5 h-3.5 w-3.5" />
                公開設定: <Badge variant="outline" className="ml-1">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
                 {vote.allowEmptyVotes && <Badge variant="outline" className="ml-1">空の投票可</Badge>}
            </span>
            <span>以下から選択してください。</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...submissionForm}>
          <form onSubmit={submissionForm.handleSubmit(handleVoteSubmit)} className="space-y-8">
            <FormField
              control={submissionForm.control}
              name="submissionValue"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg">あなたの投票:</FormLabel>
                  <FormControl>
                    <>
                      {vote.voteType === "free_text" && (
                        <Textarea placeholder="ここに回答を入力してください..." {...field} value={field.value ?? ""} autoComplete="off" rows={5} />
                      )}
                      {vote.voteType === "multiple_choice" && vote.options && (
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value ?? ""} 
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
                          value={field.value ?? ""} 
                          className="flex flex-col space-y-2"
                        >
                            <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                <FormControl><RadioGroupItem value="yes" /></FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer flex-1">はい / 賛成</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                <FormControl><RadioGroupItem value="no" /></FormControl>
                                <FormLabel className="font-normal text-base cursor-pointer flex-1">いいえ / 反対</FormLabel>
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
              <Button type="button" variant="outline" onClick={() => { setCurrentVoter(null); attendanceForm.reset({ attendanceNumber: undefined }); }}>
                出席番号を変更
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground min-w-[120px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                投票を送信
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
