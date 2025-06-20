"use client"

import { useState, useEffect, useCallback } from 'react';
import type { Vote, Submission, VoteOption } from '@/lib/store-types';

const VOTES_KEY = 'classvote_votes';
const SUBMISSIONS_KEY = 'classvote_submissions';

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
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
      console.error("Failed to load from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
      } catch (error) {
        console.error("Failed to save votes to localStorage", error);
      }
    }
  }, [votes, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
      } catch (error) {
        console.error("Failed to save submissions to localStorage", error);
      }
    }
  }, [submissions, isLoaded]);

  const addVote = useCallback((voteData: Omit<Vote, 'id' | 'createdAt' | 'status' | 'options'> & { options?: string[] }) => {
    const newVote: Vote = {
      ...voteData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'open',
      options: voteData.options?.map(optText => ({ id: generateId(), text: optText }))
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

  const addSubmission = useCallback((submissionData: Omit<Submission, 'id' | 'submittedAt'>) => {
    const newSubmission: Submission = {
      ...submissionData,
      id: generateId(),
      submittedAt: new Date().toISOString(),
    };
    setSubmissions(prevSubmissions => [...prevSubmissions, newSubmission]);
    return newSubmission;
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
    getSubmissionsByVoteId,
    hasVoted,
    getUnvotedAttendanceNumbers,
    isLoaded, // To allow components to wait for localStorage hydration
  };
}
