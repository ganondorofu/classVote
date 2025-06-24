
"use client"

import Link from "next/link";
import type { Vote } from "@/lib/store-types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, BarChart2, Edit3, Eye } from "lucide-react"; // Changed Edit to Edit3, Eye for results

export const getVoteTypeDisplay = (type: Vote['voteType']) => {
  switch (type) {
    case 'free_text': return '自由記述';
    case 'multiple_choice': return '多肢選択';
    case 'yes_no': return 'はい/いいえ';
    default: return '不明';
  }
};

export const getVisibilityDisplay = (setting: Vote['visibilitySetting']) => {
  switch (setting) {
      case 'everyone': return '全員に公開';
      case 'admin_only': return '管理者のみ';
      case 'anonymous': return '匿名';
      default: return '不明';
  }
};


interface VoteCardProps {
  vote: Vote;
}

export function VoteCard({ vote }: VoteCardProps) {
  return (
    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-headline">{vote.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          対象者: {vote.totalExpectedVoters}人
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 flex-grow">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">ステータス:</span>
          <Badge variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
            {vote.status === 'open' ? '受付中' : '終了'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-muted-foreground">形式:</span>
           <Badge variant="outline">{getVoteTypeDisplay(vote.voteType)}</Badge>
        </div>
         <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-muted-foreground">公開設定:</span>
           <Badge variant="outline">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-4">
        <Button asChild variant="outline" className="group w-full sm:w-auto">
          <Link href={`/vote/${vote.id}/admin`}>
            <Edit3 className="mr-2 h-4 w-4 group-hover:animate-pulse" /> 管理
          </Link>
        </Button>
        {vote.status === 'open' ? (
          <Button asChild className="group bg-primary hover:bg-primary/90 w-full sm:w-auto">
            <Link href={`/vote/${vote.id}`}>
              <CheckCircle className="mr-2 h-4 w-4 group-hover:animate-bounce" /> 投票する
            </Link>
          </Button>
        ) : (
           <Button asChild variant="secondary" className="group w-full sm:w-auto">
            <Link href={`/vote/${vote.id}/results`}> {/* Changed link */}
              <Eye className="mr-2 h-4 w-4 group-hover:animate-pulse" /> 結果を見る
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
