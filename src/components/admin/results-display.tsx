
"use client"

import type { Vote, Submission } from "@/lib/store-types";
import { useState, useMemo } from "react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, MessageSquare, EyeOff, User, List, RotateCcw, BarChartBigIcon, ArrowUp, ArrowDown, ArrowUpDown, BrainCircuit, Loader2 } from "lucide-react";
import { summarizeResults, type SummarizeResultsOutput } from "@/ai/flows/summarize-results-flow";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { useVoteStore } from "@/hooks/use-vote-store";

const USER_OPTION_PREFIX = "USER_OPTION:";
const COLORS = ['#29ABE2', '#FF9933', '#82ca9d', '#ffc658', '#FF6B6B', '#A0E7E5', '#d0ed57', '#ffc0cb', '#8884d8'];

interface ResultsDisplayProps {
  vote: Vote;
  submissions: Submission[];
  isAdmin?: boolean;
}

export function ResultsDisplay({ vote, submissions, isAdmin = false }: ResultsDisplayProps) {
  const { toast } = useToast();
  const { updateVoteWithAISummary } = useVoteStore();
  const [sortConfig, setSortConfig] = useState<{ key: 'number' | 'text' | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  const [aiSummary, setAiSummary] = useState<SummarizeResultsOutput | null>(
     vote.aiSummary && vote.aiThemes ? { summary: vote.aiSummary, themes: vote.aiThemes } : null
  );
  const [isSummarizing, setIsSummarizing] = useState(false);

  const canShowIndividualVotes = vote.visibilitySetting === 'everyone' || (vote.visibilitySetting === 'admin_only');
  const isAnonymous = vote.visibilitySetting === 'anonymous';

  const freeTextSubmissionsForAI = useMemo(() => {
    if (vote.voteType !== 'free_text') return [];
    return submissions
      .map(s => s.submissionValue)
      .filter((s): s is string => typeof s === 'string' && s.trim() !== '' && s !== 'ANONYMOUS_VOTED_STUB');
  }, [submissions, vote.voteType]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await summarizeResults({
        title: vote.title,
        submissions: freeTextSubmissionsForAI,
      });
      setAiSummary(result);
      await updateVoteWithAISummary(vote.id, result.summary, result.themes);
      toast({
        title: "AI要約を更新しました",
        description: "結果がデータベースに保存されました。",
      });
    } catch (error) {
      console.error("AI summary failed:", error);
      toast({
        title: "AI要約エラー",
        description: "結果の要約中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };


  const sortedFreeTextSubmissions = useMemo(() => {
    if (vote.voteType !== 'free_text') return [];

    let itemsToDisplay;
    if (isAnonymous) {
      itemsToDisplay = submissions.filter(s => s.voterAttendanceNumber === 'ANONYMOUS_CONTENT');
    } else if (canShowIndividualVotes) {
      itemsToDisplay = submissions;
    } else {
      return []; // Not visible and not anonymous, show nothing
    }

    const sortableItems = [...itemsToDisplay];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'number' && !isAnonymous) {
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
    } else { // Default sort by submission time
       sortableItems.sort((a,b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    }
    return sortableItems;
  }, [submissions, sortConfig, vote.voteType, canShowIndividualVotes, isAnonymous]);

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
          // Guard against non-string values before parsing
          if (typeof sub.submissionValue === 'string') {
            const parsed = JSON.parse(sub.submissionValue);
            if (Array.isArray(parsed)) {
              selectedOptions = parsed;
            }
          }
        } catch (e) {
          // This fallback logic is now safer, only handling strings that are not JSON.
          if (typeof sub.submissionValue === 'string' && sub.submissionValue.trim() !== '' && !sub.submissionValue.startsWith(USER_OPTION_PREFIX)) {
            selectedOptions = [sub.submissionValue];
          } else if (typeof sub.submissionValue === 'string' && sub.submissionValue.startsWith(USER_OPTION_PREFIX)) {
            selectedOptions = [sub.submissionValue]
          } else {
             console.warn("Could not parse or is custom submission value:", sub.submissionValue, e);
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
       const submissionCount = isAnonymous
        ? submissions.filter(s => s.voterAttendanceNumber !== 'ANONYMOUS_CONTENT').length
        : submissions.length;
        
      return (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-semibold mb-2 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary"/>
              提出内容 ({submissionCount}件):
            </h4>
            {(!canShowIndividualVotes && !isAnonymous) ? (
              <p className="text-sm text-muted-foreground flex items-center">
                  <EyeOff className="mr-2 h-4 w-4"/>
                  公開設定により、個別の自由記述内容は非表示です。
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-muted-foreground">並べ替え:</span>
                    {!isAnonymous && (
                      <Button variant="outline" size="sm" onClick={() => handleSort('number')}>
                          出席番号
                          {sortConfig.key === 'number' ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                          ) : (
                              <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                          )}
                      </Button>
                    )}
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
                  {sortedFreeTextSubmissions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">まだ提出はありません。</p>
                  ) : (
                    <ul className="space-y-2">
                      {sortedFreeTextSubmissions.map(sub => (
                        <li key={sub.id} className="text-sm p-2 border-b flex justify-between items-center">
                          {isAnonymous ? (
                              <span>{sub.submissionValue}</span>
                          ) : (
                              <span>
                                  <span className="font-medium">{sub.voterAttendanceNumber}番: </span>{sub.submissionValue}
                              </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
          <Separator />
          <div>
            {isAdmin && (
              <div className="mb-4">
                <h4 className="text-md font-semibold mb-3 flex items-center">
                  <BrainCircuit className="mr-2 h-5 w-5 text-primary"/>
                  AIによる結果分析
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  AI（人工知能）を利用して、提出された自由記述回答の概要と主要なテーマを生成します。AIによる要約は不正確または不適切な内容を含む可能性があります。必ず元の回答と照らし合わせて内容を確認してください。
                </p>
                <Button onClick={handleSummarize} disabled={isSummarizing || freeTextSubmissionsForAI.length === 0}>
                  {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  {aiSummary ? "AIで再要約" : "AIで結果を要約"}
                </Button>
                {freeTextSubmissionsForAI.length === 0 && !isSummarizing && <p className="text-xs text-muted-foreground mt-1">要約できる回答がありません。</p>}
              </div>
            )}
            
            {isSummarizing && (
                <div className="mt-4 space-y-2 p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        AIが結果を分析中です。しばらくお待ちください...
                    </p>
                    <div className="h-4 bg-muted rounded w-1/4 animate-pulse mt-4"></div>
                    <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                </div>
            )}
            
            {aiSummary && !isSummarizing && (
              <Card className="mt-4 bg-secondary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                      <BrainCircuit className="mr-2 h-5 w-5"/>
                      AIによる要約結果
                  </CardTitle>
                   <CardDescription className="text-xs">
                    この要約はAIによって生成されたものであり、誤りを含む可能性があります。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h5 className="font-semibold">主要なテーマ</h5>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {aiSummary.themes.map((theme, index) => (
                            <Badge key={index} variant="secondary">{theme}</Badge>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-semibold">全体の概要</h5>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-1">{aiSummary.summary}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    }
    
    // For multiple_choice and yes_no
    return (
      <>
        <h4 className="text-md font-semibold mb-3 flex items-center">
            <BarChartBigIcon className="mr-2 h-5 w-5 text-primary"/>
            投票分布
        </h4>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
            <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))" 
                tick={{fontSize: 12}} 
                interval={0}
                angle={-45}
                textAnchor="end"
              />
            <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{fontSize: 12}}/>
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))'
                }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}}/>
            <Bar dataKey="count" name="票数">
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                {submissions.sort((a,b) => parseInt(a.voterAttendanceNumber, 10) - parseInt(b.voterAttendanceNumber, 10)).map(sub => {
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
                            // This might be a single string for older data or non-JSON, handle it
                             if (typeof sub.submissionValue === 'string') {
                                displayValue = getOptionText(sub.submissionValue);
                             }
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
        <CardDescription>
            合計 {submissions.length} 件の提出
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
