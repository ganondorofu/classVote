"use client"

import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, ArrowRight, Loader2 } from "lucide-react";
import type { VoteType, VisibilitySetting } from "@/lib/store-types";

const voteFormSchema = z.object({
  title: z.string().min(3, { message: "タイトルは3文字以上で入力してください。" }).max(100),
  adminPassword: z.string().length(4, { message: "管理用パスワードは4桁の数字で入力してください。" }).regex(/^\d{4}$/, { message: "管理用パスワードは4桁の数字で入力してください。" }),
  totalExpectedVoters: z.coerce.number().int().min(1, { message: "最低1人の投票者が必要です。" }),
  voteType: z.enum(["free_text", "multiple_choice", "yes_no"]),
  minCharacters: z.coerce.number().int().min(0, { message: "0以上の数値を入力してください。" }).optional(),
  options: z.array(z.object({ text: z.string() })).optional(), // Relaxed validation here
  visibilitySetting: z.enum(["everyone", "admin_only", "anonymous"]),
  allowEmptyVotes: z.boolean().optional(),
  allowMultipleSelections: z.boolean().optional(),
  allowAddingOptions: z.boolean().optional(),
}).refine(data => {
  if (data.voteType !== "multiple_choice") {
    return true; // Skip validation if not multiple choice
  }
  const validOptions = data.options?.filter(opt => opt.text.trim() !== '') ?? [];
  return validOptions.length > 0;
}, {
  message: "多肢選択式の投票には最低1つの有効な選択肢が必要です。",
  path: ["options"],
}).refine(data => {
  if (data.voteType !== "multiple_choice" || data.allowAddingOptions) {
    return true; // Skip if not mc or if adding options is allowed
  }
  const validOptions = data.options?.filter(opt => opt.text.trim() !== '') ?? [];
  return validOptions.length >= 2;
}, {
  message: "投票者による選択肢追加を許可しない場合、有効な選択肢が最低2つ必要です。",
  path: ["options"]
});


type VoteFormValues = z.infer<typeof voteFormSchema>;

export function CreateVoteForm() {
  const router = useRouter();
  const { addVote } = useVoteStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VoteFormValues>({
    resolver: zodResolver(voteFormSchema),
    defaultValues: {
      title: "",
      adminPassword: "",
      totalExpectedVoters: 38,
      voteType: "yes_no",
      minCharacters: 0,
      options: [{ text: "" }, { text: "" }],
      visibilitySetting: "admin_only",
      allowEmptyVotes: false,
      allowMultipleSelections: false,
      allowAddingOptions: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const voteType = form.watch("voteType");

  async function onSubmit(data: VoteFormValues) {
    setIsSubmitting(true);
    try {
      const voteDataForStore = {
        title: data.title,
        adminPassword: data.adminPassword,
        totalExpectedVoters: data.totalExpectedVoters,
        voteType: data.voteType as VoteType,
        visibilitySetting: data.visibilitySetting as VisibilitySetting,
        allowEmptyVotes: data.allowEmptyVotes,
        ...(data.voteType === "multiple_choice" && { 
            options: data.options?.map(opt => opt.text).filter(text => text.trim() !== ''),
            allowMultipleSelections: data.allowMultipleSelections,
            allowAddingOptions: data.allowAddingOptions,
        }),
        ...(data.voteType === "free_text" && {
            minCharacters: data.minCharacters,
        }),
      };
      
      const newVote = await addVote(voteDataForStore);
      toast({
        title: "投票が作成されました！",
        description: `「${newVote.title}」が開始されました。`,
      });
      router.push(`/`);
    } catch (error) {
      toast({
        title: "エラー",
        description: "投票を作成できませんでした。もう一度お試しください。",
        variant: "destructive",
      });
      console.error("投票の作成に失敗しました:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-primary">新しい投票を作成</CardTitle>
        <CardDescription>新しいクラス投票を開始するには、以下の詳細を入力してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>投票タイトル</FormLabel>
                  <FormControl>
                    <Input placeholder="例：好きなプロジェクトのトピック" {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>管理用パスワード (4桁の数字)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="例: 1234"
                        {...field}
                        autoComplete="new-password"
                        readOnly
                        onFocus={(e) => (e.target.readOnly = false)}
                      />
                    </FormControl>
                    <FormDescription>この投票を管理するための4桁の数字のパスワードです。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalExpectedVoters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>予想される総投票者数</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min="1" autoComplete="off" />
                    </FormControl>
                    <FormDescription>クラスの総生徒数。</FormDescription>
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
                  <FormLabel>投票タイプ</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== 'multiple_choice') {
                      form.setValue('allowMultipleSelections', false);
                      form.setValue('allowAddingOptions', false);
                    }
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="投票タイプを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes_no">はい/いいえ または 賛成/反対</SelectItem>
                      <SelectItem value="multiple_choice">多肢選択式</SelectItem>
                      <SelectItem value="free_text">自由記述式</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {voteType === "free_text" && (
                <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                    <FormField
                        control={form.control}
                        name="minCharacters"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>最小文字数</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} min="0" autoComplete="off" />
                            </FormControl>
                            <FormDescription>
                            自由記述で要求する最小文字数を設定します。0の場合は制限しません。
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            )}

            {voteType === "multiple_choice" && (
              <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
                <FormLabel className="text-base">多肢選択式の選択肢</FormLabel>
                {fields.map((field, index) => (
                  <FormField
                    control={form.control}
                    key={field.id}
                    name={`options.${index}.text`}
                    render={({ field: optionField }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Input {...optionField} placeholder={`選択肢 ${index + 1}`} autoComplete="off" />
                        </FormControl>
                        {fields.length > (form.getValues("allowAddingOptions") ? 1 : 2) && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="選択肢を削除">
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
                  <PlusCircle className="mr-2 h-4 w-4" /> 選択肢を追加
                </Button>
                 {form.formState.errors.options && <FormMessage>{form.formState.errors.options.message || form.formState.errors.options.root?.message}</FormMessage>}
                
                <FormField
                  control={form.control}
                  name="allowMultipleSelections"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                      <div className="space-y-0.5">
                        <FormLabel>複数選択を許可</FormLabel>
                        <FormDescription>
                          投票者が複数の選択肢を選べるようにします。
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allowAddingOptions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background">
                      <div className="space-y-0.5">
                        <FormLabel>投票者による選択肢の追加を許可</FormLabel>
                        <FormDescription>
                          投票者が新しい選択肢を提案できるようにします。
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="visibilitySetting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>投票の可視性</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="誰が個別の投票を見られるか選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="everyone">全員が個別の投票を見られる</SelectItem>
                      <SelectItem value="admin_only">投票管理者のみが個別の投票を見られる</SelectItem>
                      <SelectItem value="anonymous">個別の投票は匿名（集計結果のみ）</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>詳細な提出内容を誰が見られるかを制御します。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowEmptyVotes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">空の投票を許可する</FormLabel>
                    <FormDescription>
                      チェックすると、自由記述で何も入力しない、または選択式で何も選択しない投票を許可します。
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />


            <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 作成中...
                </>
              ) : (
                <>
                  投票を作成 <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
