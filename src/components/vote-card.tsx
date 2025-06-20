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
      case 'free_text': return 'Free Text';
      case 'multiple_choice': return 'Multiple Choice';
      case 'yes_no': return 'Yes/No';
      default: return 'Unknown';
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-xl font-headline">{vote.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {vote.totalExpectedVoters} expected voters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={vote.status === 'open' ? 'secondary' : 'destructive'}>
            {vote.status === 'open' ? 'Open' : 'Closed'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium">Type:</span>
           <Badge variant="outline">{getVoteTypeDisplay(vote.voteType)}</Badge>
        </div>
         <div className="flex items-center gap-2">
           <span className="text-sm font-medium">Visibility:</span>
           <Badge variant="outline">{vote.visibilitySetting.replace('_', ' ')}</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline" className="group">
          <Link href={`/vote/${vote.id}/admin`}>
            <Edit className="mr-2 h-4 w-4 group-hover:animate-pulse" /> Admin
          </Link>
        </Button>
        {vote.status === 'open' ? (
          <Button asChild className="group bg-primary hover:bg-primary/90">
            <Link href={`/vote/${vote.id}`}>
              <CheckCircle className="mr-2 h-4 w-4 group-hover:animate-bounce" /> Vote Now
            </Link>
          </Button>
        ) : (
           <Button asChild variant="secondary" className="group">
            <Link href={`/vote/${vote.id}/admin`}> {/* Or a dedicated results page */}
              <BarChart2 className="mr-2 h-4 w-4 group-hover:animate-pulse" /> View Results
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
