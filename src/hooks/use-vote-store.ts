
"use client"

import { useState, useEffect, useCallback } from 'react';
import type { Vote, Submission, VoteOption, VoteType, VisibilitySetting } from '@/lib/store-types';

const VOTES_KEY = 'classvote_votes';
const SUBMISSIONS_KEY = 'classvote_submissions';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

interface AddVoteData {
  title: string;
  adminPassword: string;
  totalExpectedVoters: number;
  voteType: VoteType;
  visibilitySetting: VisibilitySetting;
  allowEmptyVotes?: boolean;
  options?: string[]; // For multiple_choice
  allowMultipleSelections?: boolean; // For multiple_choice
  allowAddingOptions?: boolean; // For multiple_choice
}


export function useVoteStore() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedVotes = localStorage.getItem(VOTES_KEY);
      if (storedVotes) {
        setVotes(JSON.parse(storedVotes));
      }
      const storedSubmissions = localStorage.getItem(SUBMISSIONS_KEY);
      if (storedSubmissions) {
        setSubmissions(JSON.parse(storedSubmissions));
      }
    } catch (error) {
      console.error("localStorageからの読み込みに失敗しました", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
      } catch (error) {
        console.error("投票データのlocalStorageへの保存に失敗しました", error);
      }
    }
  }, [votes, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
      } catch (error) {
        console.error("提出データのlocalStorageへの保存に失敗しました", error);
      }
    }
  }, [submissions, isLoaded]);

  const addVote = useCallback((voteData: AddVoteData) => {
    const newVote: Vote = {
      id: generateId(),
      title: voteData.title,
      adminPassword: voteData.adminPassword,
      totalExpectedVoters: voteData.totalExpectedVoters,
      voteType: voteData.voteType,
      visibilitySetting: voteData.visibilitySetting,
      allowEmptyVotes: voteData.allowEmptyVotes ?? false,
      createdAt: new Date().toISOString(),
      status: 'open',
      options: voteData.options?.map(optText => ({ id: generateId(), text: optText })),
      allowMultipleSelections: voteData.allowMultipleSelections ?? false,
      allowAddingOptions: voteData.allowAddingOptions ?? false,
    };
    setVotes(prevVotes => [...prevVotes, newVote]);
    return newVote;
  }, []);

  const getVoteById = useCallback((id: string): Vote | undefined => {
    return votes.find(vote => vote.id === id);
  }, [votes]);

  const updateVoteStatus = useCallback((id: string, status: 'open' | 'closed') => {
    setVotes(prevVotes =>
      prevVotes.map(vote =>
        vote.id === id ? { ...vote, status, closedAt: status === 'closed' ? new Date().toISOString() : undefined } : vote
      )
    );
  }, []);

  // Function to add a new user-defined option to a vote dynamically
  // This is not directly used by addSubmission but could be if we decide to persist user options to the Vote object
  // For now, custom options are handled within submissionValue.
  // const addUserOptionToVote = useCallback((voteId: string, optionText: string): VoteOption | undefined => {
  //   let newOption: VoteOption | undefined = undefined;
  //   setVotes(prevVotes => 
  //     prevVotes.map(vote => {
  //       if (vote.id === voteId && vote.voteType === 'multiple_choice' && vote.allowAddingOptions) {
  //         newOption = { id: `USER_OPTION_${generateId()}`, text: optionText };
  //         return {
  //           ...vote,
  //           options: [...(vote.options || []), newOption],
  //         };
  //       }
  //       return vote;
  //     })
  //   );
  //   return newOption;
  // }, []);


  const addSubmission = useCallback((submissionData: Omit<Submission, 'id' | 'submittedAt'>) => {
    const newSubmission: Submission = {
      ...submissionData,
      id: generateId(),
      submittedAt: new Date().toISOString(),
    };
    setSubmissions(prevSubmissions => [...prevSubmissions, newSubmission]);
    return newSubmission;
  }, []);

  const deleteSubmissionById = useCallback((submissionId: string) => {
    setSubmissions(prevSubmissions =>
      prevSubmissions.filter(sub => sub.id !== submissionId)
    );
  }, []);

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
