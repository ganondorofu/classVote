
"use client"

import type { Vote, Submission } from "@/lib/store-types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, MessageSquare, EyeOff, User, List, RotateCcw } from "lucide-react";

interface ResultsDisplayProps {
  vote: Vote;
  submissions: Submission[];
}

const COLORS = ['#29ABE2', '#FF9933', '#82ca9d', '#ffc658', '#FF6B6B', '#A0E7E5'];

export function ResultsDisplay({ vote, submissions }: ResultsDisplayProps) {
  const { deleteSubmissionById } = useVoteStore();
  const { toast } = useToast();

  const canShowIndividualVotes = vote.visibilitySetting === 'everyone' || (vote.visibilitySetting === 'admin_only');
  const isAnonymous = vote.visibilitySetting === 'anonymous';

  const getOptionTextById = (optionId: string): string => {
    return vote.options?.find(opt => opt.id === optionId)?.text || "不明な選択肢";
  };

  const aggregateResults = () => {
    const counts: { [key: string]: number } = {};
    submissions.forEach(sub => {
      const value = vote.voteType === 'multiple_choice' ? getOptionTextById(sub.submissionValue) : sub.submissionValue;
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value }));
  };

  const chartData = aggregateResults();

  const handleResetVote = (submissionId: string, voterAttendanceNumber: string) => {
    if (vote.visibilitySetting === 'anonymous') {
        toast({
            title: "リセット不可",
            description: "匿名投票の投票はリセットできません。",
            variant: "destructive",
        });
        return;
    }
    // Simple confirmation for now, can be replaced with a dialog
    if (window.confirm(`出席番号 ${voterAttendanceNumber} の投票をリセットしますか？この操作により、再度投票が可能になります。`)) {
      deleteSubmissionById(submissionId);
      toast({
        title: "投票をリセットしました",
        description: `出席番号 ${voterAttendanceNumber} の投票データが削除されました。再投票が可能です。`,
      });
    }
  };

  const renderContent = () => {
    if (submissions.length === 0) {
      return <p className="text-muted-foreground">まだ提出はありません。</p>;
    }

    if (vote.voteType === "free_text") {
      return (
        <>
          <h4 className="text-md font-semibold mb-2 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary"/>
            提出内容 ({submissions.length}件):
            </h4>
          {isAnonymous || !canShowIndividualVotes ? (
            <p className="text-sm text-muted-foreground flex items-center">
                <EyeOff className="mr-2 h-4 w-4"/>
                公開設定により、個別の自由記述内容は非表示です。集計された件数のみ表示されます。
            </p>
          ) : (
            <ScrollArea className="h-60 w-full rounded-md border p-3 bg-background">
              <ul className="space-y-2">
                {submissions.map(sub => (
                  <li key={sub.id} className="text-sm p-2 border-b flex justify-between items-center">
                    <span>
                        <span className="font-medium">投票者 {sub.voterAttendanceNumber}: </span>{sub.submissionValue}
                    </span>
                    {vote.visibilitySetting !== 'anonymous' && (
                        <Button variant="outline" size="sm" onClick={() => handleResetVote(sub.id, sub.voterAttendanceNumber)} className="ml-2 group">
                           <RotateCcw className="mr-1.5 h-3.5 w-3.5 group-hover:animate-spin"/> リセット
                        </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </>
      );
    }
    
    return (
      <>
        <h4 className="text-md font-semibold mb-3 flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-primary"/>
            投票分布
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
            <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{fontSize: 12}}/>
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="count" name="票数" barSize={40}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {(canShowIndividualVotes && !isAnonymous && (vote.voteType === "multiple_choice" || vote.voteType === "yes_no")) && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2 flex items-center">
                <List className="mr-2 h-5 w-5 text-primary"/>
                個別の投票:
            </h4>
            <ScrollArea className="h-40 w-full rounded-md border p-3 bg-background">
              <ul className="space-y-1">
                {submissions.map(sub => (
                  <li key={sub.id} className="text-sm flex items-center justify-between p-1.5 rounded hover:bg-secondary/50">
                    <span className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                        投票者 {sub.voterAttendanceNumber}: <span className="font-semibold ml-1">{vote.voteType === 'multiple_choice' ? getOptionTextById(sub.submissionValue) : sub.submissionValue}</span>
                    </span>
                    {vote.visibilitySetting !== 'anonymous' && (
                         <Button variant="outline" size="sm" onClick={() => handleResetVote(sub.id, sub.voterAttendanceNumber)} className="ml-2 group">
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5 group-hover:animate-spin"/> リセット
                        </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
        {isAnonymous && <p className="text-sm text-muted-foreground mt-2 flex items-center"><EyeOff className="mr-2 h-4 w-4"/>個別の投票は匿名です。</p>}
      </>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
            <CheckSquare className="mr-2 h-6 w-6 text-primary"/>
            投票結果
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
