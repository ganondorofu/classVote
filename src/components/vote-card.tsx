
"use client"

import Link from "next/link";
import type { Vote } from "@/lib/store-types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, BarChart2, Edit } from "lucide-react";

interface VoteCardProps {
  vote: Vote;
}

export function VoteCard({ vote }: VoteCardProps) {
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
    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-headline">{vote.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {vote.totalExpectedVoters} 人対象
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">ステータス:</span>
          <Badge variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
            {vote.status === 'open' ? '受付中' : '終了'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium">形式:</span>
           <Badge variant="outline">{getVoteTypeDisplay(vote.voteType)}</Badge>
        </div>
         <div className="flex items-center gap-2">
           <span className="text-sm font-medium">公開設定:</span>
           <Badge variant="outline">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline" className="group">
          <Link href={`/vote/${vote.id}/admin`}>
            <Edit className="mr-2 h-4 w-4 group-hover:animate-pulse" /> 管理
          </Link>
        </Button>
        {vote.status === 'open' ? (
          <Button asChild className="group bg-primary hover:bg-primary/90">
            <Link href={`/vote/${vote.id}`}>
              <CheckCircle className="mr-2 h-4 w-4 group-hover:animate-bounce" /> 投票する
            </Link>
          </Button>
        ) : (
           <Button asChild variant="secondary" className="group">
            <Link href={`/vote/${vote.id}/admin`}>
              <BarChart2 className="mr-2 h-4 w-4 group-hover:animate-pulse" /> 結果を見る
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
