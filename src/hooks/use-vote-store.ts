
"use client"

import { useState, useEffect, useCallback } from 'react';
import type { Vote, Submission, ResetRequest, VoteType, VisibilitySetting } from '@/lib/store-types';
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
  writeBatch,
} from 'firebase/firestore';
import { useToast } from './use-toast';

function generateId(): string {
  return doc(collection(db, '_temp')).id; 
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
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
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
      options: data.options?.map((opt: any, index: number) => ({ 
        id: opt.id || `${docData.id}_opt_${index}`, 
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
  
  const mapFirestoreDocToResetRequest = (docData: DocumentData): ResetRequest => {
    const data = docData.data();
    return {
      id: docData.id,
      voteId: data.voteId,
      voterAttendanceNumber: data.voterAttendanceNumber,
      requestedAt: (data.requestedAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
    };
  };

  useEffect(() => {
    let initialVotesLoaded = false;
    let initialSubmissionsLoaded = false;
    let initialRequestsLoaded = false;

    const checkAllLoaded = () => {
        if (initialVotesLoaded && initialSubmissionsLoaded && initialRequestsLoaded && !isLoaded) {
            setIsLoaded(true);
        }
    };

    const votesQuery = query(collection(db, "votes"));
    const unsubscribeVotes = onSnapshot(votesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      setVotes(querySnapshot.docs.map(mapFirestoreDocToVote));
      initialVotesLoaded = true;
      checkAllLoaded();
    }, (error) => {
      console.error("Error fetching votes:", error);
      toast({ title: "エラー", description: "投票データの読み込みに失敗しました。", variant: "destructive" });
      initialVotesLoaded = true; checkAllLoaded();
    });

    const submissionsQuery = query(collection(db, "submissions"));
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      setSubmissions(querySnapshot.docs.map(mapFirestoreDocToSubmission));
      initialSubmissionsLoaded = true;
      checkAllLoaded();
    }, (error) => {
      console.error("Error fetching submissions:", error);
      toast({ title: "エラー", description: "提出データの読み込みに失敗しました。", variant: "destructive" });
      initialSubmissionsLoaded = true; checkAllLoaded();
    });

    const requestsQuery = query(collection(db, "resetRequests"));
    const unsubscribeRequests = onSnapshot(requestsQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
      setResetRequests(querySnapshot.docs.map(mapFirestoreDocToResetRequest));
      initialRequestsLoaded = true;
      checkAllLoaded();
    }, (error) => {
      console.error("Error fetching reset requests:", error);
      toast({ title: "エラー", description: "リセット申請の読み込みに失敗しました。", variant: "destructive" });
      initialRequestsLoaded = true; checkAllLoaded();
    });

    return () => {
      unsubscribeVotes();
      unsubscribeSubmissions();
      unsubscribeRequests();
    };
  }, [toast, isLoaded]); // isLoaded is included to prevent re-running after initial load

  const addVote = useCallback(async (voteData: AddVoteData): Promise<Vote> => {
    const newVoteId = generateId();
    const votePayload = {
      ...voteData,
      status: 'open' as 'open' | 'closed',
      createdAt: Timestamp.fromDate(new Date()),
      options: voteData.options ? voteData.options.map(optText => ({ id: generateId(), text: optText })) : [],
    };

    try {
      await setDoc(doc(db, "votes", newVoteId), votePayload);
      const createdVote: Vote = {
        id: newVoteId,
        ...votePayload,
        createdAt: votePayload.createdAt.toDate().toISOString(),
      };
      return createdVote;
    } catch (error) {
      console.error("Error adding vote:", error);
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
    }
    try {
      await updateDoc(voteRef, updatePayload);
    } catch (error) {
      console.error("Error updating vote status:", error);
      toast({ title: "エラー", description: "ステータスの更新に失敗しました。", variant: "destructive" });
    }
  }, [toast]);

  const addSubmission = useCallback(async (submissionData: Omit<Submission, 'id' | 'submittedAt'>): Promise<Submission> => {
    const submissionPayload = {
      ...submissionData,
      submittedAt: Timestamp.fromDate(new Date()),
    };
    try {
      const docRef = await addDoc(collection(db, "submissions"), submissionPayload);
      return { ...submissionPayload, id: docRef.id, submittedAt: submissionPayload.submittedAt.toDate().toISOString() };
    } catch (error) {
      console.error("Error adding submission:", error);
      toast({ title: "エラー", description: "投票の提出に失敗しました。", variant: "destructive" });
      throw error;
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
    const votedNumbers = new Set(getSubmissionsByVoteId(voteId).map(s => s.voterAttendanceNumber));
    const unvoted: string[] = [];
    for (let i = 1; i <= vote.totalExpectedVoters; i++) {
      if (!votedNumbers.has(i.toString())) {
        unvoted.push(i.toString());
      }
    }
    return unvoted;
  }, [getVoteById, getSubmissionsByVoteId]);

  const requestVoteReset = useCallback(async (voteId: string, voterAttendanceNumber: string) => {
    if (resetRequests.some(r => r.voteId === voteId && r.voterAttendanceNumber === voterAttendanceNumber)) {
      toast({ title: "情報", description: "リセット申請は既に送信済みです。" });
      return;
    }
    const requestPayload = {
      voteId,
      voterAttendanceNumber,
      requestedAt: Timestamp.fromDate(new Date()),
    };
    try {
      await addDoc(collection(db, "resetRequests"), requestPayload);
      toast({ title: "成功", description: "投票リセットの申請を送信しました。" });
    } catch (error) {
      console.error("Error requesting vote reset:", error);
      toast({ title: "エラー", description: "リセット申請に失敗しました。", variant: "destructive" });
      throw error;
    }
  }, [resetRequests, toast]);

  const hasPendingResetRequest = useCallback((voteId: string, voterAttendanceNumber: string): boolean => {
    return resetRequests.some(r => r.voteId === voteId && r.voterAttendanceNumber === voterAttendanceNumber);
  }, [resetRequests]);

  const getResetRequestsByVoteId = useCallback((voteId: string): ResetRequest[] => {
    return resetRequests.filter(r => r.voteId === voteId).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }, [resetRequests]);

  const approveVoteReset = useCallback(async (requestId: string) => {
    const request = resetRequests.find(r => r.id === requestId);
    if (!request) {
      toast({ title: "エラー", description: "対象の申請が見つかりません。", variant: "destructive" });
      return;
    }
    
    const submissionToDelete = submissions.find(s => s.voteId === request.voteId && s.voterAttendanceNumber === request.voterAttendanceNumber);
    if (!submissionToDelete) {
      // The submission might have been deleted already. Just delete the request.
      try {
        await deleteDoc(doc(db, "resetRequests", requestId));
      } catch (e) {
         console.error("Error deleting request:", e);
         toast({ title: "エラー", description: "申請の削除に失敗しました。", variant: "destructive" });
      }
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, "submissions", submissionToDelete.id));
      batch.delete(doc(db, "resetRequests", requestId));
      await batch.commit();
    } catch (error) {
      console.error("Error approving reset:", error);
      toast({ title: "エラー", description: "リセットの承認中にエラーが発生しました。", variant: "destructive" });
      throw error;
    }
  }, [submissions, resetRequests, toast]);

  return {
    votes,
    addVote,
    getVoteById,
    updateVoteStatus,
    submissions,
    addSubmission,
    getSubmissionsByVoteId,
    hasVoted,
    getUnvotedAttendanceNumbers,
    requestVoteReset,
    hasPendingResetRequest,
    getResetRequestsByVoteId,
    approveVoteReset,
    isLoaded,
  };
}
