
"use client"

import type { ResetRequest } from "@/lib/store-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCcw, User, Clock, Loader2, ListChecks } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ResetRequestsListProps {
  requests: ResetRequest[];
  onApprove: (requestId: string) => Promise<void>;
}

export function ResetRequestsList({ requests, onApprove }: ResetRequestsListProps) {
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = async (requestId: string, attendanceNumber: string) => {
    setApprovingId(requestId);
    try {
      await onApprove(requestId);
      toast({
        title: "申請を承認しました",
        description: `出席番号 ${attendanceNumber} の投票がリセットされました。`,
      });
    } catch (error) {
      // Toast is also handled in the hook, but a local one can be more specific
      console.error("Failed to approve reset:", error);
      toast({
        title: "エラー",
        description: "リセットの承認に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center">
        <RefreshCcw className="mr-2 h-5 w-5 text-primary" />
        投票リセット申請 ({requests.length})
      </h3>
      
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-4">
          <ListChecks className="h-8 w-8 mb-2" />
          <p className="text-sm">現在、リセット申請はありません。</p>
        </div>
      ) : (
        <ScrollArea className="h-40 w-full rounded-md border p-2">
          <ul className="space-y-2">
            {requests.map((req) => (
              <li key={req.id} className="text-sm p-2.5 bg-card border rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex-grow">
                  <p className="flex items-center font-medium">
                    <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                    出席番号: {req.voterAttendanceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Clock className="mr-2 h-3 w-3" />
                    申請日時: {new Date(req.requestedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleApprove(req.id, req.voterAttendanceNumber)}
                  disabled={approvingId === req.id}
                  className="w-full sm:w-auto"
                  variant="secondary"
                >
                  {approvingId === req.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  リセットを承認
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}
