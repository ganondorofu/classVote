
"use client"

import { useState } from "react";
import type { Vote } from "@/lib/store-types";
import { useVoteStore } from "@/hooks/use-vote-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnvotedList } from "./unvoted-list";
import { ResultsDisplay } from "./results-display";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, Users, Info, BarChartBig, KeyRound, Eye, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { getVoteTypeDisplay, getVisibilityDisplay } from "@/components/vote-card"; // Import helpers
import Link from "next/link";
import { ResetRequestsList } from "./reset-requests-list";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface AdminPanelContentProps {
  initialVote: Vote; 
}

export function AdminPanelContent({ initialVote }: AdminPanelContentProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { 
    updateVoteStatus, 
    getSubmissionsByVoteId, 
    getUnvotedAttendanceNumbers,
    getVoteById,
    getResetRequestsByVoteId,
    approveVoteReset,
    deleteVote
  } = useVoteStore();
  const { toast } = useToast();

  const vote = getVoteById(initialVote.id) || initialVote;
  
  const submissions = getSubmissionsByVoteId(vote.id);
  const unvotedAttendanceNumbers = getUnvotedAttendanceNumbers(vote.id);
  const resetRequests = getResetRequestsByVoteId(vote.id);

  const handleToggleVoteStatus = () => {
    const newStatus = vote.status === "open" ? "closed" : "open";
    updateVoteStatus(vote.id, newStatus);
    toast({
      title: `投票が${newStatus === "open" ? "再開" : "終了"}されました`,
      description: `「${vote.title}」は現在${newStatus === "open" ? "受付中" : "終了"}です。`,
    });
  };

  const handleDeleteVote = async () => {
    setIsDeleting(true);
    try {
      await deleteVote(vote.id);
      toast({
        title: "削除しました",
        description: "投票が正常に削除されました。",
      });
      router.push('/');
    } catch (error) {
      // Toast is handled in the hook
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (!vote) return null;

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
        <CardFooter className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
                <Button onClick={handleToggleVoteStatus} variant={vote.status === 'open' ? 'destructive' : 'default'} className="min-w-[150px] group">
                    {vote.status === "open" ? (
                    <><Lock className="mr-2 h-4 w-4 group-hover:animate-ping" /> 投票を終了</>
                    ) : (
                    <><Unlock className="mr-2 h-4 w-4 group-hover:animate-ping" /> 投票を再開</>
                    )}
                </Button>
                <Badge className="ml-0 sm:ml-4" variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
                    ステータス: {vote.status === 'open' ? '受付中' : '終了'}
                </Badge>
                {vote.status === 'closed' && (
                    <Button asChild variant="link" className="text-primary">
                    <Link href={`/vote/${vote.id}/results`}>
                        <Eye className="mr-1.5 h-4 w-4"/> 公開結果ページを見る
                    </Link>
                    </Button>
                )}
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="group">
                   <Trash2 className="mr-2 h-4 w-4" /> 投票を削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>本当にこの投票を削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は元に戻せません。「{vote.title}」に関するすべての投票、提出、リセット申請が完全に削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteVote} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
      </Card>

      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-headline">参加者管理</CardTitle>
            </CardHeader>
            <CardContent>
                <UnvotedList unvotedAttendanceNumbers={unvotedAttendanceNumbers} totalExpectedVoters={vote.totalExpectedVoters}/>
                <Separator className="my-6" />
                <ResetRequestsList requests={resetRequests} onApprove={approveVoteReset} />
            </CardContent>
        </Card>
        
        <ResultsDisplay vote={vote} submissions={submissions} />
      </div>
    </div>
  );
}
