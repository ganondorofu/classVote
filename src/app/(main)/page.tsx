
"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VoteCard } from "@/components/vote-card";
import { useVoteStore } from "@/hooks/use-vote-store";
import { PlusCircle, ListChecks, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { Vote } from "@/lib/store-types";

export default function HomePage() {
  const { votes, isLoaded } = useVoteStore();
  const [filterStatus, setFilterStatus] = useState<Vote['status'] | 'all'>('open');

  const filteredVotes = votes
    .filter(vote => {
      if (filterStatus === 'all') return true;
      return vote.status === filterStatus;
    })
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getEmptyStateMessage = () => {
    if (filterStatus === 'open') return "No open votes right now.";
    if (filterStatus === 'closed') return "No closed votes.";
    return "There are no active votes.";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-4xl font-bold font-headline text-primary">ClassVote Dashboard</h1>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/create-vote">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Vote
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as Vote['status'] | 'all')}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
            <TabsTrigger value="open" className="text-sm">
              <Filter className="mr-2 h-4 w-4" /> Open
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-sm">
              <Filter className="mr-2 h-4 w-4" /> Closed
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm">
              <Filter className="mr-2 h-4 w-4" /> All
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!isLoaded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoaded && filteredVotes.length === 0 && (
        <div className="text-center py-10">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">{getEmptyStateMessage()}</p>
          {filterStatus !== 'closed' && <p className="text-muted-foreground">Why not create one?</p>}
        </div>
      )}

      {isLoaded && filteredVotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVotes.map((vote) => (
            <VoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      )}
    </div>
  );
}
