
'use server';
/**
 * @fileOverview A flow to summarize the results of a free-text vote.
 *
 * - summarizeResults - A function that takes submissions and returns a summary.
 * - SummarizeResultsInput - The input type for the summarizeResults function.
 * - SummarizeResultsOutput - The return type for the summarizeResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeResultsInputSchema = z.object({
  title: z.string().describe('The title of the vote.'),
  submissions: z
    .array(z.string())
    .describe('A list of all the free-text submissions to be summarized.'),
});
export type SummarizeResultsInput = z.infer<typeof SummarizeResultsInputSchema>;

const SummarizeResultsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      '提供されたすべての意見を網羅した、中立的な要約。'
    ),
  themes: z
    .array(z.string())
    .describe('意見の中から見つかった主要なテーマやトピックのリスト（最大15個）。'),
});
export type SummarizeResultsOutput = z.infer<
  typeof SummarizeResultsOutputSchema
>;

export async function summarizeResults(
  input: SummarizeResultsInput
): Promise<SummarizeResultsOutput> {
  return summarizeResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeResultsPrompt',
  input: {schema: SummarizeResultsInputSchema},
  output: {schema: SummarizeResultsOutputSchema},
  prompt: `あなたは、生徒たちの意見をまとめるのが得意な、経験豊富なクラスのファシリテーターです。
以下の投票結果を分析し、日本語で要約してください。

投票タイトル: {{{title}}}

提出された意見:
{{#each submissions}}
- {{{this}}}
{{/each}}

あなたのタスク:
1.  **全体像の要約:** すべての意見を網羅した、中立的で公平な要約を作成してください。多様な視点がどのように分布しているかを示してください。
2.  **主要なテーマの抽出:** 意見の中で繰り返し現れる、あるいは重要だと思われる主要なテーマやキーワードを最大15個特定し、リストアップしてください。

出力は指定されたJSON形式に従い、すべてのテキストは日本語で記述してください。`,
});

const summarizeResultsFlow = ai.defineFlow(
  {
    name: 'summarizeResultsFlow',
    inputSchema: SummarizeResultsInputSchema,
    outputSchema: SummarizeResultsOutputSchema,
  },
  async (input) => {
    if (input.submissions.length === 0) {
      return {
        summary: '要約する意見がありませんでした。',
        themes: [],
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
