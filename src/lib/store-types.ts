export interface VoteOption {
  id: string;
  text: string;
}

export type VoteType = "free_text" | "multiple_choice" | "yes_no";
export type VisibilitySetting = "everyone" | "admin_only" | "anonymous";

export interface Vote {
  id: string;
  title: string;
  adminPassword: string; // Changed from creatorAttendanceNumber
  totalExpectedVoters: number;
  voteType: VoteType;
  options?: VoteOption[]; // For multiple_choice
  visibilitySetting: VisibilitySetting;
  status: "open" | "closed";
  createdAt: string; // ISO string
  closedAt?: string; // ISO string
  allowEmptyVotes?: boolean; // New field to allow/disallow empty submissions
}

export interface Submission {
  id: string;
  voteId: string;
  voterAttendanceNumber: string; // Remains string, input form will ensure it's a number converted to string
  // For multiple_choice, this will be the option ID. For yes/no, "yes" or "no". For free_text, the text.
  // Can be empty string or undefined if allowEmptyVotes is true for the vote.
  submissionValue: string | undefined;
  submittedAt: string; // ISO string
}
