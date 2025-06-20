"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, ArrowRight } from "lucide-react";
import type { VoteType, VisibilitySetting } from "@/lib/store-types";

const voteFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }).max(100),
  creatorAttendanceNumber: z.string().min(1, { message: "Your attendance number is required." }),
  totalExpectedVoters: z.coerce.number().int().min(1, { message: "Must be at least 1 voter." }),
  voteType: z.enum(["free_text", "multiple_choice", "yes_no"]),
  options: z.array(z.object({ text: z.string().min(1, "Option text cannot be empty.") })).optional(),
  visibilitySetting: z.enum(["everyone", "admin_only", "anonymous"]),
}).refine(data => {
  if (data.voteType === "multiple_choice") {
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: "Multiple choice votes require at least 2 options.",
  path: ["options"],
});

type VoteFormValues = z.infer<typeof voteFormSchema>;

export function CreateVoteForm() {
  const router = useRouter();
  const { addVote } = useVoteStore();
  const { toast } = useToast();

  const form = useForm<VoteFormValues>({
    resolver: zodResolver(voteFormSchema),
    defaultValues: {
      title: "",
      creatorAttendanceNumber: "",
      totalExpectedVoters: 10,
      voteType: "yes_no",
      options: [{ text: "" }, { text: "" }],
      visibilitySetting: "admin_only",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const voteType = form.watch("voteType");

  function onSubmit(data: VoteFormValues) {
    try {
      const voteDataForStore = {
        title: data.title,
        creatorAttendanceNumber: data.creatorAttendanceNumber,
        totalExpectedVoters: data.totalExpectedVoters,
        voteType: data.voteType as VoteType,
        visibilitySetting: data.visibilitySetting as VisibilitySetting,
        ...(data.voteType === "multiple_choice" && { options: data.options?.map(opt => opt.text) }),
      };
      
      const newVote = addVote(voteDataForStore);
      toast({
        title: "Vote Created!",
        description: `"${newVote.title}" is now open.`,
      });
      router.push(`/vote/${newVote.id}/admin`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create vote. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create vote:", error);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary">Create a New Vote</CardTitle>
        <CardDescription>Fill in the details below to start a new class vote.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vote Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Preferred Project Topic" {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="creatorAttendanceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Attendance Number (Admin)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., S123" {...field} autoComplete="off" />
                    </FormControl>
                    <FormDescription>This number identifies you as the vote admin.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalExpectedVoters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Expected Voters</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="1" autoComplete="off" />
                    </FormControl>
                    <FormDescription>Total number of students in the class.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="voteType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vote Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vote type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes_no">Yes/No or Agree/Disagree</SelectItem>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="free_text">Free Text Submission</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {voteType === "multiple_choice" && (
              <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                <FormLabel className="text-base">Multiple Choice Options</FormLabel>
                {fields.map((field, index) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`options.${index}.text`}
                    render={({ field: optionField }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Input {...optionField} placeholder={`Option ${index + 1}`} autoComplete="off" />
                        </FormControl>
                        {fields.length > 2 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove option">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ text: "" })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                </Button>
                 {form.formState.errors.options && <FormMessage>{form.formState.errors.options.message}</FormMessage>}
              </div>
            )}

            <FormField
              control={form.control}
              name="visibilitySetting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vote Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who can see individual votes" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone can see individual votes</SelectItem>
                      <SelectItem value="admin_only">Only vote admin can see individual votes</SelectItem>
                      <SelectItem value="anonymous">Individual votes are anonymous (only aggregated results)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Controls who can view detailed submissions.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Create Vote <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

