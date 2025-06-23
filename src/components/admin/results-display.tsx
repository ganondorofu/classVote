
"use client"

import type { Vote, Submission } from "@/lib/store-types";
import { useState, useMemo } from "react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useVoteStore } from "@/hooks/use-vote-store";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, MessageSquare, EyeOff, User, List, RotateCcw, BarChartBigIcon, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

const USER_OPTION_PREFIX = "USER_OPTION:";
const COLORS = ['#29ABE2', '#FF9933', '#82ca9d', '#ffc658', '#FF6B6B', '#A0E7E5', '#d0ed57', '#ffc0cb', '#8884d8'];

interface ResultsDisplayProps {
  vote: Vote;
  submissions: Submission[];
}

export function ResultsDisplay({ vote, submissions }: ResultsDisplayProps) {
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{ key: 'number' | 'text' | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  const canShowIndividualVotes = vote.visibilitySetting === 'everyone' || (vote.visibilitySetting === 'admin_only');
  const isAnonymous = vote.visibilitySetting === 'anonymous';

  const sortedFreeTextSubmissions = useMemo(() => {
    if (vote.voteType !== 'free_text') return submissions;

    const sortableItems = [...submissions];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'number') {
          valA = parseInt(a.voterAttendanceNumber, 10);
          valB = parseInt(b.voterAttendanceNumber, 10);
        } else { // 'text'
          valA = (a.submissionValue || '').toLowerCase();
          valB = (b.submissionValue || '').toLowerCase();
        }
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    // Default sort by attendance number (ascending)
    else {
       sortableItems.sort((a, b) => parseInt(a.voterAttendanceNumber, 10) - parseInt(b.voterAttendanceNumber, 10));
    }
    return sortableItems;
  }, [submissions, sortConfig, vote.voteType]);

  const handleSort = (key: 'number' | 'text') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const getOptionText = (value: string): string => {
    if (value.startsWith(USER_OPTION_PREFIX)) {
      return `（自由記述） ${value.substring(USER_OPTION_PREFIX.length)}`;
    }
    if (value === 'yes') return 'はい / 賛成';
    if (value === 'no') return 'いいえ / 反対';
    return vote.options?.find(opt => opt.id === value)?.text || "不明な選択肢";
  };
  
  const aggregateResults = () => {
    const counts: { [key: string]: number } = {};
    submissions.forEach(sub => {
      if (sub.submissionValue === undefined || sub.submissionValue === null) return;

      if (vote.voteType === 'multiple_choice' || vote.voteType === 'yes_no') {
        let selectedOptions: string[] = [];
        try {
          const parsed = JSON.parse(sub.submissionValue);
          if (Array.isArray(parsed)) {
            selectedOptions = parsed;
          }
        } catch (e) {
          if (typeof sub.submissionValue === 'string' && sub.submissionValue.trim() !== '') {
            selectedOptions = [sub.submissionValue];
          } else {
            console.warn("Could not parse submission value:", sub.submissionValue, e);
            return;
          }
        }
        
        selectedOptions.forEach(optionValue => {
          if(optionValue) {
            const text = getOptionText(optionValue);
            counts[text] = (counts[text] || 0) + 1;
          }
        });

      } else { // free_text
        const value = sub.submissionValue;
        if(value.trim() !== '') {
            counts[value] = (counts[value] || 0) + 1;
        }
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, count: value }));
  };

  const chartData = aggregateResults();

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
            <>
              <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">並べ替え:</span>
                  <Button variant="outline" size="sm" onClick={() => handleSort('number')}>
                      出席番号
                      {sortConfig.key === 'number' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSort('text')}>
                      回答内容
                      {sortConfig.key === 'text' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                      )}
                  </Button>
              </div>
              <ScrollArea className="h-60 w-full rounded-md border p-3 bg-background">
                <ul className="space-y-2">
                  {sortedFreeTextSubmissions.map(sub => (
                    <li key={sub.id} className="text-sm p-2 border-b flex justify-between items-center">
                      <span>
                          <span className="font-medium">{sub.voterAttendanceNumber}番: </span>{sub.submissionValue}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          )}
        </>
      );
    }
    
    // For multiple_choice and yes_no
    return (
      <>
        <h4 className="text-md font-semibold mb-3 flex items-center">
            <BarChartBigIcon className="mr-2 h-5 w-5 text-primary"/>
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
                    if (sub.submissionValue === undefined || sub.submissionValue === null) {
                        displayValue = "（空の投票）";
                    } else if (vote.voteType === 'multiple_choice' || vote.voteType === 'yes_no') {
                        try {
                            const parsedValues = JSON.parse(sub.submissionValue);
                            if (Array.isArray(parsedValues)) {
                                displayValue = parsedValues.map(val => getOptionText(val)).join(", ");
                            }
                        } catch {
                            displayValue = getOptionText(sub.submissionValue); // Fallback for non-JSON
                        }
                    } else { 
                         displayValue = sub.submissionValue;
                    }
                    if (!displayValue && vote.allowEmptyVotes) displayValue = "（空の投票）";

                   return (
                      <li key={sub.id} className="text-sm flex items-center justify-between p-1.5 rounded hover:bg-secondary/50">
                        <span className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground"/>
                            {sub.voterAttendanceNumber}番: <span className="font-semibold ml-1">{displayValue}</span>
                        </span>
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
