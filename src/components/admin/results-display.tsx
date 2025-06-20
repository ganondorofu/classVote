"use client"

import type { Vote, Submission, VoteOption } from "@/lib/store-types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckSquare, MessageSquare, EyeOff, User, List } from "lucide-react";

interface ResultsDisplayProps {
  vote: Vote;
  submissions: Submission[];
}

// Helper to generate distinct colors for chart bars
const COLORS = ['#29ABE2', '#FF9933', '#82ca9d', '#ffc658', '#FF6B6B', '#A0E7E5'];

export function ResultsDisplay({ vote, submissions }: ResultsDisplayProps) {
  const canShowIndividualVotes = vote.visibilitySetting === 'everyone' || (vote.visibilitySetting === 'admin_only'); // For admin view, admin_only means show
  const isAnonymous = vote.visibilitySetting === 'anonymous';

  const getOptionTextById = (optionId: string): string => {
    return vote.options?.find(opt => opt.id === optionId)?.text || "Unknown Option";
  };

  const aggregateResults = () => {
    const counts: { [key: string]: number } = {};
    submissions.forEach(sub => {
      const value = vote.voteType === 'multiple_choice' ? getOptionTextById(sub.submissionValue) : sub.submissionValue;
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value }));
  };

  const chartData = aggregateResults();

  const renderContent = () => {
    if (submissions.length === 0) {
      return <p className="text-muted-foreground">No submissions yet.</p>;
    }

    if (vote.voteType === "free_text") {
      return (
        <>
          <h4 className="text-md font-semibold mb-2 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary"/>
            Submissions ({submissions.length}):
            </h4>
          {isAnonymous || !canShowIndividualVotes ? (
            <p className="text-sm text-muted-foreground flex items-center">
                <EyeOff className="mr-2 h-4 w-4"/>
                Individual free text submissions are hidden due to visibility settings. Only aggregated count is available.
            </p>
          ) : (
            <ScrollArea className="h-60 w-full rounded-md border p-3 bg-background">
              <ul className="space-y-2">
                {submissions.map(sub => (
                  <li key={sub.id} className="text-sm p-2 border-b">
                    <span className="font-medium">Voter {sub.voterAttendanceNumber}: </span>{sub.submissionValue}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </>
      );
    }
    
    // For Yes/No and Multiple Choice, show a chart
    return (
      <>
        <h4 className="text-md font-semibold mb-3 flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-primary"/>
            Vote Distribution
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} />
            <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{fontSize: 12}}/>
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="count" name="Votes" barSize={40}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {(canShowIndividualVotes && !isAnonymous && (vote.voteType === "multiple_choice" || vote.voteType === "yes_no")) && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2 flex items-center">
                <List className="mr-2 h-5 w-5 text-primary"/>
                Individual Votes:
            </h4>
            <ScrollArea className="h-40 w-full rounded-md border p-3 bg-background">
              <ul className="space-y-1">
                {submissions.map(sub => (
                  <li key={sub.id} className="text-sm flex items-center p-1.5 rounded hover:bg-secondary/50">
                    <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                    Voter {sub.voterAttendanceNumber}: <span className="font-semibold ml-1">{vote.voteType === 'multiple_choice' ? getOptionTextById(sub.submissionValue) : sub.submissionValue}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
        {isAnonymous && <p className="text-sm text-muted-foreground mt-2 flex items-center"><EyeOff className="mr-2 h-4 w-4"/>Individual votes are anonymous.</p>}
      </>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
            <CheckSquare className="mr-2 h-6 w-6 text-primary"/>
            Vote Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
