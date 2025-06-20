
"use client"

import { useParams } from 'next/navigation';
import { useVoteStore } from '@/hooks/use-vote-store';
import { ResultsDisplay } from '@/components/admin/results-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Info, Users, BarChartBig, Eye, CheckCircle, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Vote } from '@/lib/store-types';

// Helper functions (can be moved to a util file if shared more widely)
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

export default function VoteResultsPage() {
  const params = useParams();
  const voteId = params.voteId as string;
  const { getVoteById, getSubmissionsByVoteId, isLoaded } = useVoteStore();
  
  if (!isLoaded) {
    return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const vote = getVoteById(voteId);
  const submissions = getSubmissionsByVoteId(voteId);

  if (!vote) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="w-full max-w-lg mx-auto text-center">
          <CardHeader>
            <CardTitle>投票が見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p>お探しの投票は存在しないか、削除された可能性があります。</p>
            <Button asChild variant="link" className="mt-4">
              <Link href="/">トップページへ戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary flex items-center">
            <Eye className="mr-3 h-8 w-8" />
            「{vote.title}」の投票結果
          </CardTitle>
          <CardDescription className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-x-6 gap-y-2 pt-3 text-sm">
            <span className="flex items-center"><Info className="mr-1.5 h-4 w-4 text-muted-foreground" /> ID: <Badge variant="secondary" className="ml-1">{vote.id}</Badge></span>
            <span className="flex items-center"><Users className="mr-1.5 h-4 w-4 text-muted-foreground" /> 対象者数: <Badge variant="secondary" className="ml-1">{vote.totalExpectedVoters}</Badge></span>
            <span className="flex items-center"><BarChartBig className="mr-1.5 h-4 w-4 text-muted-foreground" /> 形式: <Badge variant="secondary" className="ml-1">{getVoteTypeDisplay(vote.voteType)}</Badge></span>
          </CardDescription>
          <div className="pt-2 text-sm space-y-1">
            <div className="flex items-center">
                 <CheckCircle className="mr-1.5 h-4 w-4 text-muted-foreground" /> ステータス: 
                <Badge className="ml-1.5" variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
                    {vote.status === 'open' ? '受付中' : '終了'}
                </Badge>
            </div>
            <div className="flex items-center">
                <Eye className="mr-1.5 h-4 w-4 text-muted-foreground" /> 公開設定: <Badge variant="outline" className="ml-1.5">{getVisibilityDisplay(vote.visibilitySetting)}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <ResultsDisplay vote={vote} submissions={submissions} />
      
      <div className="text-center mt-8">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            ダッシュボードへ戻る
          </Link>
        </Button>
      </div>
    </div>
  );
}
