"use client"

import type { Vote } from "@/lib/store-types";
import { useVoteStore } from "@/hooks/use-vote-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnvotedList } from "./unvoted-list";
import { ResultsDisplay } from "./results-display";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, Users, Info, BarChartBig } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";

interface AdminPanelContentProps {
  vote: Vote;
}

export function AdminPanelContent({ initialVote }: AdminPanelContentProps) {
  const { 
    updateVoteStatus, 
    getSubmissionsByVoteId, 
    getUnvotedAttendanceNumbers,
    getVoteById // Use this to get the latest vote state
  } = useVoteStore();
  const { toast } = useToast();

  // Get the potentially updated vote from the store
  const vote = getVoteById(initialVote.id) || initialVote;
  
  const submissions = getSubmissionsByVoteId(vote.id);
  const unvotedAttendanceNumbers = getUnvotedAttendanceNumbers(vote.id);

  const handleToggleVoteStatus = () => {
    const newStatus = vote.status === "open" ? "closed" : "open";
    updateVoteStatus(vote.id, newStatus);
    toast({
      title: `Vote ${newStatus === "open" ? "Reopened" : "Closed"}`,
      description: `"${vote.title}" is now ${newStatus}.`,
    });
  };
  
  const getVoteTypeDisplay = (type: Vote['voteType']) => {
    switch (type) {
      case 'free_text': return 'Free Text';
      case 'multiple_choice': return 'Multiple Choice';
      case 'yes_no': return 'Yes/No';
      default: return 'Unknown';
    }
  };


  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-primary">{vote.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
            <span className="flex items-center"><Info className="mr-1.5 h-4 w-4 text-muted-foreground" /> ID: <Badge variant="secondary" className="ml-1">{vote.id}</Badge></span>
            <span className="flex items-center"><Users className="mr-1.5 h-4 w-4 text-muted-foreground" /> Expected: <Badge variant="secondary" className="ml-1">{vote.totalExpectedVoters}</Badge></span>
            <span className="flex items-center"><BarChartBig className="mr-1.5 h-4 w-4 text-muted-foreground" /> Type: <Badge variant="secondary" className="ml-1">{getVoteTypeDisplay(vote.voteType)}</Badge></span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Administered by: <Badge variant="outline">{vote.creatorAttendanceNumber}</Badge>
          </p>
          <p className="text-sm mt-1">
            Visibility: <Badge variant="outline">{vote.visibilitySetting.replace('_', ' ')}</Badge>
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleToggleVoteStatus} variant={vote.status === 'open' ? 'destructive' : 'default'} className="min-w-[150px] group">
            {vote.status === "open" ? (
              <><Lock className="mr-2 h-4 w-4 group-hover:animate-ping" /> Close Vote</>
            ) : (
              <><Unlock className="mr-2 h-4 w-4 group-hover:animate-ping" /> Reopen Vote</>
            )}
          </Button>
           <Badge className="ml-4" variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
            Status: {vote.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
        </CardFooter>
      </Card>

      <Separator />

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Participant Overview</CardTitle>
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
