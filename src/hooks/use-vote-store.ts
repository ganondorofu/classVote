
"use client"

import { useState, useEffect, useCallback } from 'react';
import type { Vote, Submission, VoteOption, VoteType, VisibilitySetting } from '@/lib/store-types';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Timestamp,
  query,
  where,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useToast } from './use-toast';

function generateId(): string {
  // Firestore can generate IDs, but we'll use this for consistency if needed for optimistic updates
  // or if we want to set doc IDs explicitly before creation.
  // For addDoc, Firestore generates the ID. For setDoc(doc(collectionRef, newId)), we provide it.
  return doc(collection(db, '_temp')).id; // Generate a Firestore-compatible ID
}

interface AddVoteData {
  title: string;
  adminPassword: string;
  totalExpectedVoters: number;
  voteType: VoteType;
  visibilitySetting: VisibilitySetting;
  allowEmptyVotes?: boolean;
  options?: string[];
  allowMultipleSelections?: boolean;
  allowAddingOptions?: boolean;
}

export function useVoteStore() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  const mapFirestoreDocToVote = (docData: DocumentData): Vote => {
    const data = docData.data();
    return {
      id: docData.id,
      title: data.title,
      adminPassword: data.adminPassword,
      totalExpectedVoters: data.totalExpectedVoters,
      voteType: data.voteType,
      options: data.options?.map((opt: any) => ({ // Ensure options are mapped correctly
        id: opt.id || generateId(), // Firestore might not store id for sub-objects if not explicitly set
        text: opt.text,
      })),
      visibilitySetting: data.visibilitySetting,
      status: data.status,
      createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
      closedAt: (data.closedAt as Timestamp)?.toDate().toISOString(),
      allowEmptyVotes: data.allowEmptyVotes ?? false,
      allowMultipleSelections: data.allowMultipleSelections ?? false,
      allowAddingOptions: data.allowAddingOptions ?? false,
    };
  };

  const mapFirestoreDocToSubmission = (docData: DocumentData): Submission => {
    const data = docData.data();
    return {
      id: docData.id,
      voteId: data.voteId,
      voterAttendanceNumber: data.voterAttendanceNumber,
      submissionValue: data.submissionValue,
      submittedAt: (data.submittedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    };
  };

  useEffect(() => {
    setIsLoaded(false);
    const votesQuery = query(collection(db, "votes"));
    const unsubscribeVotes = onSnapshot(votesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const votesData = querySnapshot.docs.map(mapFirestoreDocToVote);
      setVotes(votesData);
      if (!isLoaded) setIsLoaded(true); // Set loaded after first fetch for votes
    }, (error) => {
      console.error("Error fetching votes from Firestore:", error);
      toast({ title: "エラー", description: "投票データの読み込みに失敗しました。", variant: "destructive" });
      if (!isLoaded) setIsLoaded(true); // Still set loaded on error to unblock UI
    });

    const submissionsQuery = query(collection(db, "submissions"));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const submissionsData = querySnapshot.docs.map(mapFirestoreDocToSubmission);
      setSubmissions(submissionsData);
       // if votes are already loaded, we can consider overall load complete
      if (votes.length > 0 || querySnapshot.empty) setIsLoaded(true);
    }, (error) => {
      console.error("Error fetching submissions from Firestore:", error);
      toast({ title: "エラー", description: "提出データの読み込みに失敗しました。", variant: "destructive" });
      if (!isLoaded) setIsLoaded(true);
    });

    return () => {
      unsubscribeVotes();
      unsubscribeSubmissions();
    };
  }, [toast]); // Added toast to dependency array

  const addVote = useCallback(async (voteData: AddVoteData): Promise<Vote> => {
    const newVoteId = generateId();
    const votePayload: Omit<Vote, 'id' | 'createdAt' | 'closedAt' | 'status'> & { createdAt: Timestamp } = {
      title: voteData.title,
      adminPassword: voteData.adminPassword,
      totalExpectedVoters: voteData.totalExpectedVoters,
      voteType: voteData.voteType,
      visibilitySetting: voteData.visibilitySetting,
      allowEmptyVotes: voteData.allowEmptyVotes ?? false,
      options: voteData.options ? voteData.options.map(optText => ({ id: generateId(), text: optText })) : [],
      allowMultipleSelections: voteData.allowMultipleSelections ?? false,
      allowAddingOptions: voteData.allowAddingOptions ?? false,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const voteToStore = {
      ...votePayload,
      status: 'open' as 'open' | 'closed',
    }

    try {
      await setDoc(doc(db, "votes", newVoteId), voteToStore);
      const createdVote: Vote = {
        ...voteToStore,
        id: newVoteId,
        createdAt: voteToStore.createdAt.toDate().toISOString(),
      };
      // No need to setVotes here, onSnapshot will handle it.
      return createdVote;
    } catch (error) {
      console.error("Error adding vote to Firestore:", error);
      toast({ title: "エラー", description: "投票の作成に失敗しました。", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  const getVoteById = useCallback((id: string): Vote | undefined => {
    return votes.find(vote => vote.id === id);
  }, [votes]);

  const updateVoteStatus = useCallback(async (id: string, status: 'open' | 'closed') => {
    const voteRef = doc(db, "votes", id);
    const updatePayload: { status: 'open' | 'closed'; closedAt?: Timestamp } = { status };
    if (status === 'closed') {
      updatePayload.closedAt = Timestamp.fromDate(new Date());
    } else {
      // If reopening, Firestore's serverTimestamp can be used, or ensure closedAt is removed/handled
      // For simplicity, we can allow 'closedAt' to remain, or explicitly set it to null / delete it.
      // Firebase specific: updatePayload.closedAt = deleteField() if you want to remove it.
      // Here, we'll just not set it if opening.
    }

    try {
      await updateDoc(voteRef, updatePayload);
      // onSnapshot will update local state
    } catch (error) {
      console.error("Error updating vote status in Firestore:", error);
      toast({ title: "エラー", description: "投票ステータスの更新に失敗しました。", variant: "destructive" });
    }
  }, [toast]);

  const addSubmission = useCallback(async (submissionData: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission> => {
    const newSubmissionId = generateId();
    const submissionPayload: Omit<Submission, 'id'> & { submittedAt: Timestamp } = {
      ...submissionData,
      submittedAt: Timestamp.fromDate(new Date()),
    };

    try {
      await setDoc(doc(db, "submissions", newSubmissionId), submissionPayload);
      const createdSubmission: Submission = {
        ...submissionPayload,
        id: newSubmissionId,
        submittedAt: submissionPayload.submittedAt.toDate().toISOString(),
      };
      // onSnapshot will update local state
      return createdSubmission;
    } catch (error) {
      console.error("Error adding submission to Firestore:", error);
      toast({ title: "エラー", description: "投票の提出に失敗しました。", variant: "destructive" });
      throw error;
    }
  }, [toast]);

  const deleteSubmissionById = useCallback(async (submissionId: string) => {
    try {
      await deleteDoc(doc(db, "submissions", submissionId));
      // onSnapshot will update local state
    } catch (error) {
      console.error("Error deleting submission from Firestore:", error);
      toast({ title: "エラー", description: "投票の削除に失敗しました。", variant: "destructive" });
    }
  }, [toast]);

  const getSubmissionsByVoteId = useCallback((voteId: string): Submission[] => {
    return submissions.filter(submission => submission.voteId === voteId);
  }, [submissions]);

  const hasVoted = useCallback((voteId: string, attendanceNumber: string): boolean => {
    return submissions.some(s => s.voteId === voteId && s.voterAttendanceNumber === attendanceNumber);
  }, [submissions]);
  
  const getUnvotedAttendanceNumbers = useCallback((voteId: string): string[] => {
    const vote = getVoteById(voteId);
    if (!vote) return [];

    const voteSubmissions = getSubmissionsByVoteId(voteId);
    const votedNumbers = new Set(voteSubmissions.map(s => s.voterAttendanceNumber));
    
    const unvoted: string[] = [];
    for (let i = 1; i <= vote.totalExpectedVoters; i++) {
      const attendanceStr = i.toString(); 
      if (!votedNumbers.has(attendanceStr)) {
        unvoted.push(attendanceStr);
      }
    }
    return unvoted;
  }, [getVoteById, getSubmissionsByVoteId]);

  return {
    votes,
    addVote,
    getVoteById,
    updateVoteStatus,
    submissions,
    addSubmission,
    deleteSubmissionById,
    getSubmissionsByVoteId,
    hasVoted,
    getUnvotedAttendanceNumbers,
    isLoaded,
  };
}
