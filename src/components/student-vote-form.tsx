
"use client"

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import type { Vote } from "@/lib/store-types";
import { Loader2, CheckCircle, AlertTriangle, Send, Eye, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from '@/components/ui/label';

interface StudentVoteFormProps {
  vote: Vote;
}

const attendanceSchema = z.object({
  attendanceNumber: z.coerce.number().int().min(1, { message: "出席番号は1以上の整数で入力してください。" }),
});
type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const USER_OPTION_PREFIX = "USER_OPTION:";
const INTERNAL_CUSTOM_OPTION_VALUE = "__INTERNAL_CUSTOM_OPTION__";

export function StudentVoteForm({ vote }: StudentVoteFormProps) {
  const { addSubmission, hasVoted, requestVoteReset, hasPendingResetRequest } = useVoteStore();
  const { toast } = useToast();
  const [currentVoter, setCurrentVoter] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For vote submission
  const [isCheckingAttendance, setIsCheckingAttendance] = useState(false); // For attendance check
  const [showThankYou, setShowThankYou] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  const attendanceForm = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      attendanceNumber: '' as any,
    },
  });

  const createVoteSubmissionSchema = useCallback((currentVote: Vote) => {
    let submissionValueSchema: z.ZodTypeAny;

    if (currentVote.voteType === 'free_text') {
      let schema: z.ZodType<string> = z.string({
        required_error: "回答を入力してください。",
      }).max(500, "回答が長すぎます。500文字以内で入力してください。");
      const minChars = currentVote.minCharacters ?? 0;

      if (!currentVote.allowEmptyVotes) {
        const effectiveMin = Math.max(1, minChars);
        schema = schema.min(effectiveMin, `最低${effectiveMin}文字で入力してください。`);
      } else if (minChars > 0) {
        // Allow empty string OR string with min length
        schema = schema.refine(val => (val ?? '').length === 0 || (val ?? '').length >= minChars, {
          message: `回答は空、または${minChars}文字以上で入力してください。`
        });
      }
      submissionValueSchema = schema;
    } else if (currentVote.voteType === 'yes_no') {
        if (currentVote.allowEmptyVotes) {
            submissionValueSchema = z.string().optional();
        } else {
            submissionValueSchema = z.string({
                required_error: "「はい」または「いいえ」を選択してください。",
            }).min(1, "「はい」または「いいえ」を選択してください。");
        }
    } else if (currentVote.voteType === 'multiple_choice') {
      if (currentVote.allowMultipleSelections) {
        submissionValueSchema = z.array(z.string());
        if (!currentVote.allowEmptyVotes) {
          submissionValueSchema = submissionValueSchema.min(1, { message: "少なくとも1つの選択肢を選んでください。" });
        }
      } else { // single selection
        if (currentVote.allowEmptyVotes) {
            submissionValueSchema = z.string().optional();
        } else {
            submissionValueSchema = z.string({
                required_error: "選択肢を選んでください。",
            }).min(1, "選択肢を選んでください。");
        }
      }
    } else {
      submissionValueSchema = z.any();
    }

    return z.object({
        submissionValue: submissionValueSchema,
        singleCustomOptionText: z.string().max(100, "カスタム選択肢は100文字以内で入力してください。").optional(),
        customOptions: z.array(z.object({ text: z.string().max(100, "カスタム選択肢は100文字以内で入力してください。").optional() })).optional(),
    }).refine(data => {
        if (currentVote.voteType === 'multiple_choice' &&
            !currentVote.allowMultipleSelections &&
            currentVote.allowAddingOptions &&
            data.submissionValue === INTERNAL_CUSTOM_OPTION_VALUE &&
            !currentVote.allowEmptyVotes) {
            return data.singleCustomOptionText && data.singleCustomOptionText.trim() !== "";
        }
        return true;
    }, {
        message: "「その他」を選択した場合は、内容を記入してください。",
        path: ["singleCustomOptionText"],
    }).refine(data => {
        if (currentVote.voteType === 'multiple_choice' &&
            currentVote.allowMultipleSelections &&
            currentVote.allowAddingOptions &&
            !currentVote.allowEmptyVotes) {
            
            const hasPredefinedSelection = Array.isArray(data.submissionValue) && data.submissionValue.some(val => val !== undefined && val.trim() !== "");
            const hasValidCustomSelection = data.customOptions?.some(opt => opt.text && opt.text.trim() !== "");

            return hasPredefinedSelection || hasValidCustomSelection;
        }
        return true;
    }, {
        message: "少なくとも1つの選択肢を選ぶか、カスタム選択肢を記入してください。",
        path: ["submissionValue"], 
    });
  }, []);

  type VoteSubmissionValues = z.infer<ReturnType<typeof createVoteSubmissionSchema>>;

  const submissionForm = useForm<VoteSubmissionValues>({
    resolver: zodResolver(createVoteSubmissionSchema(vote)),
    defaultValues: {
      submissionValue: vote.allowMultipleSelections ? [] : '',
      singleCustomOptionText: "",
      customOptions: [{ text: "" }],
    }
  });


  useEffect(() => {
    // Only reset the form when the voter changes.
    if (currentVoter !== null) {
      submissionForm.reset({
        submissionValue: vote.allowMultipleSelections ? [] : '',
        singleCustomOptionText: "",
        customOptions: [{ text: "" }],
      });
    }
  }, [currentVoter, vote.id, vote.allowMultipleSelections, submissionForm]);

  useEffect(() => {
    if (currentVoter !== null) {
      setAlreadyVoted(hasVoted(vote.id, currentVoter.toString()));
    }
  }, [currentVoter, vote.id, hasVoted]);


  const handleAttendanceSubmit = async (data: AttendanceFormValues) => {
    setIsCheckingAttendance(true);
    setCurrentVoter(data.attendanceNumber);
    setIsCheckingAttendance(false);
  };

  const handleVoteSubmit = async (data: VoteSubmissionValues) => {
    if (currentVoter === null) return;
    setIsLoading(true);

    let finalSubmissionValue: string | undefined;

    if (vote.voteType === 'multiple_choice') {
        let selectedValues: string[] = [];

        if (vote.allowMultipleSelections) {
            selectedValues = Array.isArray(data.submissionValue) ? data.submissionValue.filter(v => v && v.trim() !== "") : [];
            if (vote.allowAddingOptions && data.customOptions) {
                data.customOptions.forEach(opt => {
                    if (opt.text && opt.text.trim() !== "") {
                        selectedValues.push(`${USER_OPTION_PREFIX}${opt.text.trim()}`);
                    }
                });
            }
        } else { // Single selection
            if (data.submissionValue === INTERNAL_CUSTOM_OPTION_VALUE) {
                if (vote.allowAddingOptions && data.singleCustomOptionText && data.singleCustomOptionText.trim() !== "") {
                    selectedValues = [`${USER_OPTION_PREFIX}${data.singleCustomOptionText.trim()}`];
                }
            } else if (typeof data.submissionValue === 'string' && data.submissionValue) {
                selectedValues = [data.submissionValue];
            }
        }
        
        finalSubmissionValue = JSON.stringify(selectedValues);

    } else if (vote.voteType === 'free_text') {
        finalSubmissionValue = typeof data.submissionValue === 'string' ? data.submissionValue.trim() : "";
    } else { // yes_no
        const selectedValue = data.submissionValue;
        if(typeof selectedValue === 'string' && selectedValue) {
             finalSubmissionValue = JSON.stringify([selectedValue]);
        } else {
             finalSubmissionValue = JSON.stringify([]);
        }
    }

    await new Promise(resolve => setTimeout(resolve, 500)); 

    try {
      addSubmission({
        voteId: vote.id,
        voterAttendanceNumber: currentVoter.toString(),
        submissionValue: finalSubmissionValue,
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
  
  const handleResetRequest = async () => {
    if (currentVoter === null) return;
    setIsRequestingReset(true);
    try {
      await requestVoteReset(vote.id, currentVoter.toString());
    } finally {
       setIsRequestingReset(false);
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
            <Button onClick={() => { setCurrentVoter(null); setShowThankYou(false); attendanceForm.reset({ attendanceNumber: '' as any }); }} variant="outline">
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
             <span className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-2 gap-y-1">
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              公開設定: <Badge variant="outline">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
              {vote.allowEmptyVotes && <Badge variant="outline">空の投票可</Badge>}
              {vote.voteType === 'multiple_choice' && vote.allowMultipleSelections && <Badge variant="outline">複数選択可</Badge>}
              {vote.voteType === 'multiple_choice' && vote.allowAddingOptions && <Badge variant="outline">選択肢追加可</Badge>}
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
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isCheckingAttendance}>
                {isCheckingAttendance ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                投票に進む
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  if (alreadyVoted) {
    const isResetPending = hasPendingResetRequest(vote.id, currentVoter.toString());

    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{vote.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <p className="text-xl">出席番号 {currentVoter} は、この投票に既に投票済みです。</p>
          <p className="text-muted-foreground mt-2">ご協力ありがとうございました！</p>
          
          {vote.visibilitySetting !== 'anonymous' && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-2">投票をやり直しますか？</h3>
              <p className="text-sm text-muted-foreground mb-4">投票内容を変更したい場合は、管理者にリセットを申請できます。</p>
              {isResetPending ? (
                 <Badge variant="secondary">リセット申請が承認待ちです</Badge>
              ) : (
                <Button onClick={handleResetRequest} disabled={isRequestingReset} variant="secondary">
                  {isRequestingReset ? (
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                     <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  投票のリセットを申請する
                </Button>
              )}
            </div>
           )}
        </CardContent>
         <CardFooter className="flex justify-center">
            <Button onClick={() => { setCurrentVoter(null); attendanceForm.reset({ attendanceNumber: '' as any }); }} variant="outline">
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
             <span className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-2 gap-y-1">
                 <Eye className="mr-1.5 h-3.5 w-3.5" />
                公開設定: <Badge variant="outline">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
                 {vote.allowEmptyVotes && <Badge variant="outline">空の投票可</Badge>}
                 {vote.voteType === 'multiple_choice' && vote.allowMultipleSelections && <Badge variant="outline">複数選択可</Badge>}
                 {vote.voteType === 'multiple_choice' && vote.allowAddingOptions && <Badge variant="outline">選択肢追加可</Badge>}
            </span>
            <span>以下から選択または入力してください。</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...submissionForm}>
          <form onSubmit={submissionForm.handleSubmit(handleVoteSubmit)} className="space-y-8">
              <FormField
                control={submissionForm.control}
                name="submissionValue"
                render={({ field, fieldState }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-lg">あなたの投票:</FormLabel>
                    <FormControl>
                      <div>
                        {vote.voteType === "free_text" && (
                          <Textarea
                            placeholder="ここに回答を入力してください..."
                            rows={5}
                            autoComplete="off"
                            {...field}
                           />
                        )}

                        {vote.voteType === "multiple_choice" && vote.options && !vote.allowMultipleSelections && (
                          <Controller
                            control={submissionForm.control}
                            name="submissionValue"
                            render={({ field: radioField }) => (
                              <RadioGroup
                                onValueChange={(value) => {
                                  radioField.onChange(value);
                                  if (value !== INTERNAL_CUSTOM_OPTION_VALUE) {
                                    submissionForm.setValue("singleCustomOptionText", "");
                                  }
                                }}
                                value={radioField.value || ''}
                                className="flex flex-col space-y-2"
                              >
                                {vote.options?.map((option) => (
                                  <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                    <RadioGroupItem value={option.id} id={`radio-${option.id}`} />
                                    <Label htmlFor={`radio-${option.id}`} className="font-normal text-base flex-1 cursor-pointer">
                                      {option.text}
                                    </Label>
                                  </div>
                                ))}
                                {vote.allowAddingOptions && (
                                  <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                    <RadioGroupItem value={INTERNAL_CUSTOM_OPTION_VALUE} id="custom-option-radio" />
                                    <Label htmlFor="custom-option-radio" className="font-normal text-base flex-1 cursor-pointer">
                                      <FormField
                                        control={submissionForm.control}
                                        name="singleCustomOptionText"
                                        render={({ field: customTextField }) => (
                                          <Input
                                            type="text"
                                            placeholder="その他（ここに記入）"
                                            className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                                            {...customTextField}
                                            autoComplete="off"
                                            onFocus={() => {
                                              if (submissionForm.getValues("submissionValue") !== INTERNAL_CUSTOM_OPTION_VALUE) {
                                                submissionForm.setValue("submissionValue", INTERNAL_CUSTOM_OPTION_VALUE, { shouldValidate: true });
                                              }
                                            }}
                                          />
                                        )}
                                      />
                                    </Label>
                                  </div>
                                )}
                              </RadioGroup>
                            )}
                          />
                        )}

                        {vote.voteType === "yes_no" && (
                          <Controller
                            control={submissionForm.control}
                            name="submissionValue"
                            render={({ field: radioField }) => (
                              <RadioGroup
                                onValueChange={radioField.onChange}
                                value={radioField.value || ''}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                  <RadioGroupItem value="yes" id="radio-yes" />
                                  <Label htmlFor="radio-yes" className="font-normal text-base flex-1 cursor-pointer">
                                    はい / 賛成
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-3 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                  <RadioGroupItem value="no" id="radio-no" />
                                  <Label htmlFor="radio-no" className="font-normal text-base flex-1 cursor-pointer">
                                    いいえ / 反対
                                  </Label>
                                </div>
                              </RadioGroup>
                            )}
                          />
                        )}
                      </div>
                    </FormControl>
                    {(vote.minCharacters ?? 0) > 0 && vote.voteType === 'free_text' && (
                        <FormDescription>
                            最低 {vote.minCharacters} 文字で入力してください。
                        </FormDescription>
                    )}
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                     {submissionForm.formState.errors.singleCustomOptionText && <FormMessage>{submissionForm.formState.errors.singleCustomOptionText.message}</FormMessage>}
                  </FormItem>
                )}
              />

              {vote.voteType === "multiple_choice" && vote.options && vote.allowMultipleSelections && (
                <FormItem>
                  <FormLabel className="text-lg">あなたの投票 (複数選択可):</FormLabel>
                   <div className="space-y-2">
                      {vote.options.map((option) => (
                        <FormField
                          key={option.id}
                          control={submissionForm.control}
                          name="submissionValue"
                          render={({ field }) => {
                            const currentValues = Array.isArray(field.value) ? field.value : [];
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                <FormControl>
                                  <Checkbox
                                    checked={currentValues.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...currentValues, option.id])
                                        : field.onChange(
                                            currentValues.filter(
                                              (value) => value !== option.id
                                            )
                                          );
                                    }}
                                    id={`checkbox-${option.id}`}
                                  />
                                </FormControl>
                                <Label htmlFor={`checkbox-${option.id}`} className="font-normal text-base cursor-pointer flex-1">
                                  {option.text}
                                </Label>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                   </div>
                   {submissionForm.formState.errors.submissionValue && <FormMessage>{submissionForm.formState.errors.submissionValue.message}</FormMessage>}
                </FormItem>
              )}
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => { setCurrentVoter(null); attendanceForm.reset({ attendanceNumber: '' as any }); }}>
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

    
