"use client"

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useVoteStore } from '@/hooks/use-vote-store';
import { AdminAuth } from '@/components/admin/admin-auth';
import { AdminPanelContent } from '@/components/admin/admin-panel-content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VoteAdminPage() {
  const params = useParams();
  const voteId = params.voteId as string;
  const { getVoteById, isLoaded } = useVoteStore();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  if (!isLoaded) {
     return (
      <div className="container mx-auto py-10 px-4 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const vote = getVoteById(voteId);

  if (!vote) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="w-full max-w-lg mx-auto text-center">
          <CardHeader>
            <CardTitle>Vote Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <p>The vote you are looking for does not exist or has been removed.</p>
            <Button asChild variant="link" className="mt-4">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <AdminAuth 
        expectedAdminId={vote.creatorAttendanceNumber}
        onAuthenticated={setIsAdminAuthenticated}
      >
        {isAdminAuthenticated && <AdminPanelContent initialVote={vote} />}
      </AdminAuth>
    </div>
  );
}
