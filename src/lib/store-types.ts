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
}

export interface Submission {
  id: string;
  voteId: string;
  voterAttendanceNumber: string; // Remains string, input form will ensure it's a number converted to string
  // For multiple_choice, this will be the option ID. For yes/no, "yes" or "no". For free_text, the text.
  submissionValue: string; 
  submittedAt: string; // ISO string
}
