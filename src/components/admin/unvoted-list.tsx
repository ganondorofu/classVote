"use client"

import { ScrollArea } from "@/components/ui/scroll-area";
import { UserX, Users } from "lucide-react";

interface UnvotedListProps {
  unvotedAttendanceNumbers: string[];
  totalExpectedVoters: number;
}

export function UnvotedList({ unvotedAttendanceNumbers, totalExpectedVoters }: UnvotedListProps) {
  const votedCount = totalExpectedVoters - unvotedAttendanceNumbers.length;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center">
        <Users className="mr-2 h-5 w-5 text-primary"/>
        Voting Status ({votedCount}/{totalExpectedVoters} Voted)
      </h3>
      {unvotedAttendanceNumbers.length === 0 ? (
        <p className="text-green-600 dark:text-green-400">All expected students have voted!</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Students who have not yet voted:</p>
          <ScrollArea className="h-40 w-full rounded-md border p-3 bg-card">
            <ul className="space-y-1">
              {unvotedAttendanceNumbers.map((num) => (
                <li key={num} className="flex items-center text-sm p-1.5 rounded hover:bg-secondary/50">
                  <UserX className="mr-2 h-4 w-4 text-destructive"/>
                  Attendance #: {num}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
