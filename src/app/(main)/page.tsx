"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VoteCard } from "@/components/vote-card";
import { useVoteStore } from "@/hooks/use-vote-store";
import { PlusCircle, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { votes, isLoaded } = useVoteStore();

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

      {!isLoaded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoaded && votes.length === 0 && (
        <div className="text-center py-10">
          <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">No active votes yet.</p>
          <p className="text-muted-foreground">Why not create one?</p>
        </div>
      )}

      {isLoaded && votes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {votes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((vote) => (
            <VoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      )}
    </div>
  );
}
