
"use client"

import type { Vote } from "@/lib/store-types";
import { useVoteStore } from "@/hooks/use-vote-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnvotedList } from "./unvoted-list";
import { ResultsDisplay } from "./results-display";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, Users, Info, BarChartBig, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

interface AdminPanelContentProps {
  initialVote: Vote; // Changed from vote to initialVote for clarity
}

export function AdminPanelContent({ initialVote }: AdminPanelContentProps) {
  const { 
    updateVoteStatus, 
    getSubmissionsByVoteId, 
    getUnvotedAttendanceNumbers,
    getVoteById 
  } = useVoteStore();
  const { toast } = useToast();

  const vote = getVoteById(initialVote.id) || initialVote;
  
  const submissions = getSubmissionsByVoteId(vote.id);
  const unvotedAttendanceNumbers = getUnvotedAttendanceNumbers(vote.id);

  const handleToggleVoteStatus = () => {
    const newStatus = vote.status === "open" ? "closed" : "open";
    updateVoteStatus(vote.id, newStatus);
    toast({
      title: `投票が${newStatus === "open" ? "再開" : "終了"}されました`,
      description: `「${vote.title}」は現在${newStatus === "open" ? "受付中" : "終了"}です。`,
    });
  };
  
  const getVoteTypeDisplay = (type: Vote['voteType']) => {
    switch (type) {
      case 'free_text': return '自由記述';
      case 'multiple_choice': return '多肢選択';
      case 'yes_no': return 'はい/いいえ';
      default: return '不明';
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


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">{vote.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
            <span className="flex items-center"><Info className="mr-1.5 h-4 w-4 text-muted-foreground" /> ID: <Badge variant="secondary" className="ml-1">{vote.id}</Badge></span>
            <span className="flex items-center"><Users className="mr-1.5 h-4 w-4 text-muted-foreground" /> 対象者数: <Badge variant="secondary" className="ml-1">{vote.totalExpectedVoters}</Badge></span>
            <span className="flex items-center"><BarChartBig className="mr-1.5 h-4 w-4 text-muted-foreground" /> 形式: <Badge variant="secondary" className="ml-1">{getVoteTypeDisplay(vote.voteType)}</Badge></span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm flex items-center">
            <KeyRound className="mr-1.5 h-4 w-4 text-muted-foreground" /> 管理ステータス: <Badge variant="outline" className="ml-1">パスワード保護済み</Badge>
          </div>
          <div className="text-sm mt-1">
            公開設定: <Badge variant="outline">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleToggleVoteStatus} variant={vote.status === 'open' ? 'destructive' : 'default'} className="min-w-[150px] group">
            {vote.status === "open" ? (
              <><Lock className="mr-2 h-4 w-4 group-hover:animate-ping" /> 投票を終了</>
            ) : (
              <><Unlock className="mr-2 h-4 w-4 group-hover:animate-ping" /> 投票を再開</>
            )}
          </Button>
           <Badge className="ml-4" variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
            ステータス: {vote.status === 'open' ? '受付中' : '終了'}
          </Badge>
        </CardFooter>
      </Card>

      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-headline">参加状況</CardTitle>
            </CardHeader>
            <CardContent>
                <UnvotedList unvotedAttendanceNumbers={unvotedAttendanceNumbers} totalExpectedVoters={vote.totalExpectedVoters}/>
            </CardContent>
        </Card>
        
        <ResultsDisplay vote={vote} submissions={submissions} />
      </div>
    </div>
  );
}
