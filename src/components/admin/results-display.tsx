
"use client"

import type { Vote, Submission } from "@/lib/store-types";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, MessageSquare, EyeOff, User, List, RotateCcw, BarChartBigIcon } from "lucide-react"; // Changed BarChart to BarChartBigIcon

const USER_OPTION_PREFIX = "USER_OPTION:";
const COLORS = ['#29ABE2', '#FF9933', '#82ca9d', '#ffc658', '#FF6B6B', '#A0E7E5', '#d0ed57', '#ffc0cb', '#8884d8'];

interface ResultsDisplayProps {
  vote: Vote;
  submissions: Submission[];
}

export function ResultsDisplay({ vote, submissions }: ResultsDisplayProps) {
  const { deleteSubmissionById } = useVoteStore(); // Kept for potential future use, but button removed
  const { toast } = useToast();

  const canShowIndividualVotes = vote.visibilitySetting === 'everyone' || (vote.visibilitySetting === 'admin_only');
  const isAnonymous = vote.visibilitySetting === 'anonymous';

  const getOptionText = (value: string): string => {
    if (value.startsWith(USER_OPTION_PREFIX)) {
      return `（自由記述） ${value.substring(USER_OPTION_PREFIX.length)}`;
    }
    return vote.options?.find(opt => opt.id === value)?.text || "不明な選択肢";
  };
  
  const aggregateResults = () => {
    const counts: { [key: string]: number } = {};
    submissions.forEach(sub => {
      if (sub.submissionValue === undefined) return; // Skip empty if not allowed / not meaningful

      try {
        if (vote.voteType === 'multiple_choice' && vote.allowMultipleSelections) {
          const selectedOptions = JSON.parse(sub.submissionValue);
          if (Array.isArray(selectedOptions)) {
            selectedOptions.forEach(optionValue => {
              const text = getOptionText(optionValue);
              counts[text] = (counts[text] || 0) + 1;
            });
          }
        } else if (vote.voteType === 'multiple_choice') { // Single select multiple choice
            const selectedOptions = JSON.parse(sub.submissionValue); // Expects an array, even for single select now
            if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
                 const text = getOptionText(selectedOptions[0]);
                 counts[text] = (counts[text] || 0) + 1;
            }
        } else { // yes_no or free_text (though free_text is handled differently below)
          const value = sub.submissionValue;
          counts[value] = (counts[value] || 0) + 1;
        }
      } catch (e) {
        console.error("Error parsing submission value:", sub.submissionValue, e);
        // Fallback for non-JSON string values if any legacy data exists or for yes/no, free_text
         const value = (vote.voteType === 'multiple_choice' || vote.voteType === 'yes_no') ? getOptionText(sub.submissionValue) : sub.submissionValue;
         counts[value] = (counts[value] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value }));
  };

  const chartData = aggregateResults();

  // Reset functionality is removed from UI as per new requirement
  // const handleResetVote = (submissionId: string, voterAttendanceNumber: string) => { ... }

  const renderContent = () => {
    if (submissions.length === 0) {
      return <p className="text-muted-foreground">まだ提出はありません。</p>;
    }

    if (vote.voteType === "free_text") {
      return (
        <>
          <h4 className="text-md font-semibold mb-2 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary"/>
            提出内容 ({submissions.length}件):
          </h4>
          {isAnonymous || !canShowIndividualVotes ? (
            <p className="text-sm text-muted-foreground flex items-center">
                <EyeOff className="mr-2 h-4 w-4"/>
                公開設定により、個別の自由記述内容は非表示です。集計された件数のみ表示されます。
            </p>
          ) : (
            <ScrollArea className="h-60 w-full rounded-md border p-3 bg-background">
              <ul className="space-y-2">
                {submissions.map(sub => (
                  <li key={sub.id} className="text-sm p-2 border-b flex justify-between items-center">
                    <span>
                        <span className="font-medium">投票者 {sub.voterAttendanceNumber}: </span>{sub.submissionValue}
                    </span>
                    {/* Reset button removed */}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </>
      );
    }
    
    // For multiple_choice and yes_no
    return (
      <>
        <h4 className="text-md font-semibold mb-3 flex items-center">
            <BarChartBigIcon className="mr-2 h-5 w-5 text-primary"/> {/* Changed icon */}
            投票分布
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{fontSize: 12}} interval={0} />
            <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{fontSize: 12}}/>
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="count" name="票数" barSize={Math.min(40, 300 / (chartData.length || 1) - 10 )}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>

        {(canShowIndividualVotes && !isAnonymous) && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2 flex items-center">
                <List className="mr-2 h-5 w-5 text-primary"/>
                個別の投票:
            </h4>
            <ScrollArea className="h-40 w-full rounded-md border p-3 bg-background">
              <ul className="space-y-1">
                {submissions.map(sub => {
                    let displayValue = "";
                    if (sub.submissionValue === undefined) {
                        displayValue = "（空の投票）";
                    } else if (vote.voteType === 'multiple_choice') {
                        try {
                            const parsedValues = JSON.parse(sub.submissionValue);
                            if (Array.isArray(parsedValues)) {
                                displayValue = parsedValues.map(val => getOptionText(val)).join(", ");
                            } else {
                                displayValue = getOptionText(sub.submissionValue); // Fallback
                            }
                        } catch {
                            displayValue = getOptionText(sub.submissionValue); // Fallback for non-JSON
                        }
                    } else { // yes_no
                         displayValue = getOptionText(sub.submissionValue);
                    }
                    if (!displayValue && vote.allowEmptyVotes) displayValue = "（空の投票）";

                   return (
                      <li key={sub.id} className="text-sm flex items-center justify-between p-1.5 rounded hover:bg-secondary/50">
                        <span className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                            投票者 {sub.voterAttendanceNumber}: <span className="font-semibold ml-1">{displayValue}</span>
                        </span>
                        {/* Reset button removed */}
                      </li>
                   );
                })}
              </ul>
            </ScrollArea>
          </div>
        )}
        {isAnonymous && <p className="text-sm text-muted-foreground mt-2 flex items-center"><EyeOff className="mr-2 h-4 w-4"/>個別の投票は匿名です。</p>}
      </>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center">
            <CheckSquare className="mr-2 h-6 w-6 text-primary"/>
            投票結果
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
