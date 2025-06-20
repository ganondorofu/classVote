
"use client"

import { useState, useEffect } from 'react';
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
import type { Vote, VoteOption } from "@/lib/store-types";
import { Loader2, CheckCircle, AlertTriangle, Send, Eye, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentVoteFormProps {
  vote: Vote;
}

const attendanceSchema = z.object({
  attendanceNumber: z.coerce.number().int().min(1, { message: "出席番号は1以上の整数で入力してください。" }),
});
type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const USER_OPTION_PREFIX = "USER_OPTION:";

export function StudentVoteForm({ vote }: StudentVoteFormProps) {
  const { addSubmission, hasVoted } = useVoteStore();
  const { toast } = useToast();
  const [currentVoter, setCurrentVoter] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [customOptionInput, setCustomOptionInput] = useState("");

  const attendanceForm = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { attendanceNumber: undefined },
  });

  // Dynamically create submission schema
  const createVoteSubmissionSchema = (vote: Vote) => {
    let submissionValueSchema;

    if (vote.voteType === 'free_text') {
      submissionValueSchema = z.string().max(500, "回答が長すぎます。500文字以内で入力してください。");
      if (vote.allowEmptyVotes) {
        submissionValueSchema = submissionValueSchema.optional().default("");
      } else {
        submissionValueSchema = submissionValueSchema.min(1, "回答を入力してください。");
      }
    } else if (vote.voteType === 'yes_no') {
      submissionValueSchema = z.enum(["yes", "no"]);
      if (vote.allowEmptyVotes) { // Though typically not for yes/no, but to be consistent
        submissionValueSchema = submissionValueSchema.optional();
      } else {
         submissionValueSchema = z.enum(["yes", "no"], {required_error: "「はい」または「いいえ」を選択してください。"});
      }
    } else if (vote.voteType === 'multiple_choice') {
      if (vote.allowMultipleSelections) {
        submissionValueSchema = z.array(z.string());
        if (!vote.allowEmptyVotes) {
          submissionValueSchema = submissionValueSchema.min(1, "少なくとも1つ選択してください。");
        }
      } else { // Single selection multiple choice
        submissionValueSchema = z.string();
        if (vote.allowEmptyVotes) {
          submissionValueSchema = submissionValueSchema.optional();
        } else {
          submissionValueSchema = submissionValueSchema.min(1, "選択肢を選んでください。");
        }
      }
    } else {
      submissionValueSchema = z.any(); // Fallback, should not happen
    }
    
    return z.object({
        submissionValue: submissionValueSchema,
        customOption: z.string().optional(), // For the custom option text input
    });
  };
  
  type VoteSubmissionValues = z.infer<ReturnType<typeof createVoteSubmissionSchema>>;

  const submissionForm = useForm<VoteSubmissionValues>({
    resolver: zodResolver(createVoteSubmissionSchema(vote)),
    defaultValues: {
      submissionValue: vote.allowMultipleSelections ? [] : (vote.allowEmptyVotes ? undefined : (vote.voteType === 'yes_no' ? undefined : "")),
      customOption: "",
    }
  });


  useEffect(() => {
    if (currentVoter !== null) {
      setAlreadyVoted(hasVoted(vote.id, currentVoter.toString()));
      submissionForm.reset({ 
        submissionValue: vote.allowMultipleSelections ? [] : (vote.allowEmptyVotes ? undefined : (vote.voteType === 'yes_no' ? undefined : "")),
        customOption: "",
      });
      setCustomOptionInput("");
    }
  }, [currentVoter, vote.id, hasVoted, submissionForm, vote.allowEmptyVotes, vote.voteType, vote.allowMultipleSelections]);


  const handleAttendanceSubmit = (data: AttendanceFormValues) => {
    setCurrentVoter(data.attendanceNumber);
  };

  const handleVoteSubmit = async (data: VoteSubmissionValues) => {
    if (currentVoter === null) return;
    setIsLoading(true);
    
    let finalSubmissionValue: string | undefined;

    if (vote.voteType === 'multiple_choice') {
        let selectedValues: string[] = [];
        if (vote.allowMultipleSelections) {
            selectedValues = Array.isArray(data.submissionValue) ? data.submissionValue : [];
        } else { // Single selection
            if (typeof data.submissionValue === 'string' && data.submissionValue) {
                selectedValues = [data.submissionValue];
            }
        }
        
        // Handle custom option
        if (vote.allowAddingOptions && data.customOption && data.customOption.trim() !== "") {
            const customValue = `${USER_OPTION_PREFIX}${data.customOption.trim()}`;
            // If custom option checkbox was part of `submissionValue` (e.g. for multiple selections), it might be named `custom_option_checkbox`
            // For now, assume if customOption text field has value, it's a submission.
            // If multiple selections, add it. If single, it might override existing.
             if (vote.allowMultipleSelections) {
                // Check if the "custom option placeholder" was selected, if so, replace/add the actual custom value
                const customPlaceholderIndex = selectedValues.indexOf("___custom_option_checkbox_value___");
                if (customPlaceholderIndex > -1) {
                    selectedValues.splice(customPlaceholderIndex, 1, customValue);
                } else if (!selectedValues.includes(customValue)) {
                     selectedValues.push(customValue);
                }
            } else { // Single selection, custom option overrides if text is present
                 selectedValues = [customValue]; // This might override a selected radio if custom text is also provided
            }
        }
        
        if (selectedValues.length === 0 && !vote.allowEmptyVotes) {
            submissionForm.setError("submissionValue", { type: "manual", message: "少なくとも1つ選択肢を選ぶか、空の投票が許可されている場合はそのまま送信してください。" });
            setIsLoading(false);
            return;
        }
        finalSubmissionValue = selectedValues.length > 0 ? JSON.stringify(selectedValues) : (vote.allowEmptyVotes ? JSON.stringify([]) : undefined);

    } else if (vote.voteType === 'free_text') {
        finalSubmissionValue = typeof data.submissionValue === 'string' ? data.submissionValue : "";
        if (!vote.allowEmptyVotes && finalSubmissionValue.trim() === "") {
             submissionForm.setError("submissionValue", { type: "manual", message: "回答を入力してください。" });
             setIsLoading(false);
             return;
        }
    } else { // yes_no
        finalSubmissionValue = data.submissionValue as string | undefined;
         if (!vote.allowEmptyVotes && finalSubmissionValue === undefined) {
             submissionForm.setError("submissionValue", { type: "manual", message: "「はい」または「いいえ」を選択してください。" });
             setIsLoading(false);
             return;
        }
    }


    if (finalSubmissionValue === undefined && !vote.allowEmptyVotes) {
        // This case should ideally be caught by specific checks above
        toast({ title: "エラー", description: "投票内容が無効です。", variant: "destructive" });
        setIsLoading(false);
        return;
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
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-lg">あなたの投票:</FormLabel>
                  <FormControl>
                    <>
                      {vote.voteType === "free_text" && (
                        <Textarea placeholder="ここに回答を入力してください..." {...field} value={typeof field.value === 'string' ? field.value : ""} autoComplete="off" rows={5} />
                      )}
                      {vote.voteType === "multiple_choice" && vote.options && (
                        vote.allowMultipleSelections ? (
                          // Checkbox group for multiple selections
                          <div className="space-y-2">
                            {vote.options.map((option) => (
                              <FormField
                                key={option.id}
                                control={submissionForm.control}
                                name="submissionValue"
                                render={({ field: checkboxField }) => {
                                  const currentValues = Array.isArray(checkboxField.value) ? checkboxField.value : [];
                                  return (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                      <FormControl>
                                        <Checkbox
                                          checked={currentValues.includes(option.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? checkboxField.onChange([...currentValues, option.id])
                                              : checkboxField.onChange(
                                                  currentValues.filter(
                                                    (value) => value !== option.id
                                                  )
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal text-base cursor-pointer flex-1">
                                        {option.text}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                            {/* Input for custom option if allowed with multiple selections */}
                            {vote.allowAddingOptions && (
                               <FormField
                                control={submissionForm.control}
                                name="customOption" // Name for the custom option text input
                                render={({ field: customTextField }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                    <FormControl>
                                        {/* This checkbox helps to signal intent for the custom option when multiple selections are allowed */}
                                        <Checkbox
                                        checked={Array.isArray(field.value) && field.value.includes("___custom_option_checkbox_value___")}
                                        onCheckedChange={(checked) => {
                                            const currentValues = Array.isArray(field.value) ? field.value : [];
                                            return checked
                                            ? field.onChange([...currentValues, "___custom_option_checkbox_value___"])
                                            : field.onChange(currentValues.filter(v => v !== "___custom_option_checkbox_value___"));
                                        }}
                                        />
                                    </FormControl>
                                    <Input
                                        type="text"
                                        placeholder="その他（ここに記入）"
                                        {...customTextField}
                                        className="flex-1"
                                        onFocus={() => { // Auto-check the related checkbox on focus if not already part of selection
                                            const currentValues = Array.isArray(field.value) ? field.value : [];
                                            if (!currentValues.includes("___custom_option_checkbox_value___")) {
                                                field.onChange([...currentValues, "___custom_option_checkbox_value___"]);
                                            }
                                        }}
                                    />
                                    </FormItem>
                                )}
                                />
                            )}
                          </div>
                        ) : (
                          // Radio group for single selection
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={typeof field.value === 'string' ? field.value : ""} 
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
                            {/* Input for custom option if allowed with single selection */}
                            {vote.allowAddingOptions && (
                               <FormField
                                control={submissionForm.control}
                                name="customOption"
                                render={({ field: customTextField }) => (
                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                                        <FormControl>
                                            {/* This radio is implicitly selected if customTextField has value */}
                                            <RadioGroupItem value={`${USER_OPTION_PREFIX}${customTextField.value || "placeholder"}`} 
                                                checked={!!customTextField.value} // Visually check if there's custom text
                                                onClick={() => { // Clear main selection if custom radio is manually clicked (and text is empty)
                                                    if (!customTextField.value) field.onChange(undefined);
                                                }}
                                            />
                                        </FormControl>
                                        <Input
                                            type="text"
                                            placeholder="その他（ここに記入）"
                                            {...customTextField}
                                            className="flex-1"
                                            onFocus={() => field.onChange(undefined)} // Clear other radio selection on focus
                                            onChange={(e) => { // Handle change for the text field
                                                customTextField.onChange(e);
                                                // if text is entered, make this "custom" option the submissionValue implicitly
                                                if (e.target.value.trim() !== "") {
                                                    // For single choice, the submissionValue becomes the custom text itself (prefixed)
                                                    // No, this direct field.onChange is problematic for Zod.
                                                    // The actual value combination happens in handleVoteSubmit.
                                                } else {
                                                    // If custom text is cleared, and this radio was implicitly selected by text, clear it.
                                                    // This logic is tricky. Let handleVoteSubmit manage the final value.
                                                }
                                            }}
                                        />
                                    </FormItem>
                                )}
                                />
                            )}
                          </RadioGroup>
                        )
                      )}
                      {vote.voteType === "yes_no" && (
                         <RadioGroup
                          onValueChange={field.onChange}
                          value={typeof field.value === 'string' ? field.value : ""} 
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
