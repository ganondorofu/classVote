
export interface VoteOption {
  id: string;
  text: string;
}

export type VoteType = "free_text" | "multiple_choice" | "yes_no";
export type VisibilitySetting = "everyone" | "admin_only" | "anonymous";

export interface Vote {
  id: string;
  title: string;
  adminPassword: string; 
  totalExpectedVoters: number;
  voteType: VoteType;
  options?: VoteOption[]; // For multiple_choice
  visibilitySetting: VisibilitySetting;
  status: "open" | "closed";
  createdAt: string; // ISO string
  closedAt?: string; // ISO string
  allowEmptyVotes?: boolean;
  // New fields for multiple_choice enhancements
  allowMultipleSelections?: boolean; // For multiple_choice: true if voters can select more than one option
  allowAddingOptions?: boolean; // For multiple_choice: true if voters can add their own options
}

export interface Submission {
  id: string;
  voteId: string;
  voterAttendanceNumber: string; 
  // For multiple_choice with allowMultipleSelections, this will be a JSON stringified array of option IDs or custom "USER_OPTION:text".
  // For single-select multiple_choice, this will be the option ID or custom "USER_OPTION:text".
  // For yes/no, "yes" or "no". For free_text, the text.
  submissionValue: string | undefined;
  submittedAt: string; // ISO string
}

export interface ResetRequest {
  id: string;
  voteId: string;
  voterAttendanceNumber: string;
  requestedAt: string; // ISO string
}
