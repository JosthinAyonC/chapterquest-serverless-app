import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Book } from '../mocks/books';
import type { RoleId } from '../mocks/roles';
import { shuffleRoles } from '../mocks/roles';
import type { MockReview } from '../mocks/reviews';
import { INITIAL_MOCK_REVIEWS } from '../mocks/reviews';

export type PlayPhase =
  | 'setup'
  | 'roulette'
  | 'confirmed'
  | 'timer'
  | 'finished'
  | 'review';

export interface Participant {
  name: string;
  roleId: RoleId;
}

export interface PlaySessionState {
  phase: PlayPhase;
  names: string[];
  participants: Participant[];
  selectedBook: Book | null;
  durationMinutes: number;
  remainingSeconds: number;
  timerRunning: boolean;
  reviews: MockReview[];
  rouletteSpinning: boolean;
}

type Action =
  | { type: 'SET_NAMES'; names: string[] }
  | { type: 'START_ROULETTE' }
  | { type: 'FINISH_ROULETTE'; participants: Participant[] }
  | { type: 'CONFIRM_ROSTER' }
  | { type: 'SELECT_BOOK'; book: Book }
  | { type: 'SET_DURATION'; minutes: number }
  | { type: 'START_TIMER' }
  | { type: 'TICK' }
  | { type: 'STOP_TIMER' }
  | { type: 'GO_TO_REVIEW' }
  | { type: 'ADD_REVIEW'; review: MockReview }
  | { type: 'RESET' };

const DEFAULT_DURATION = 40;

const initialState: PlaySessionState = {
  phase: 'setup',
  names: Array(6).fill(''),
  participants: [],
  selectedBook: null,
  durationMinutes: DEFAULT_DURATION,
  remainingSeconds: DEFAULT_DURATION * 60,
  timerRunning: false,
  reviews: [...INITIAL_MOCK_REVIEWS],
  rouletteSpinning: false,
};

function reducer(state: PlaySessionState, action: Action): PlaySessionState {
  switch (action.type) {
    case 'SET_NAMES':
      return { ...state, names: action.names };
    case 'START_ROULETTE':
      return { ...state, phase: 'roulette', rouletteSpinning: true };
    case 'FINISH_ROULETTE':
      return {
        ...state,
        participants: action.participants,
        rouletteSpinning: false,
        phase: 'confirmed',
      };
    case 'CONFIRM_ROSTER':
      return { ...state, phase: 'timer' };
    case 'SELECT_BOOK':
      return { ...state, selectedBook: action.book };
    case 'SET_DURATION': {
      const seconds = action.minutes * 60;
      return {
        ...state,
        durationMinutes: action.minutes,
        remainingSeconds: state.timerRunning ? state.remainingSeconds : seconds,
      };
    }
    case 'START_TIMER':
      return {
        ...state,
        phase: 'timer',
        timerRunning: true,
        remainingSeconds: state.durationMinutes * 60,
      };
    case 'TICK':
      if (state.remainingSeconds <= 1) {
        return {
          ...state,
          remainingSeconds: 0,
          timerRunning: false,
          phase: 'finished',
        };
      }
      return { ...state, remainingSeconds: state.remainingSeconds - 1 };
    case 'STOP_TIMER':
      return { ...state, timerRunning: false, phase: 'finished' };
    case 'GO_TO_REVIEW':
      return { ...state, phase: 'review', timerRunning: false };
    case 'ADD_REVIEW':
      return { ...state, reviews: [...state.reviews, action.review] };
    case 'RESET':
      return {
        ...initialState,
        reviews: [...INITIAL_MOCK_REVIEWS],
      };
    default:
      return state;
  }
}

interface PlaySessionContextValue extends PlaySessionState {
  hasActiveSession: boolean;
  setNames: (names: string[]) => void;
  spinRoulette: (names: string[]) => void;
  confirmRoster: () => void;
  selectBook: (book: Book) => void;
  setDuration: (minutes: number) => void;
  startTimer: () => void;
  tick: () => void;
  stopTimer: () => void;
  goToReview: () => void;
  addReview: (name: string, message: string) => void;
  resetSession: () => void;
}

const PlaySessionContext = createContext<PlaySessionContextValue | null>(null);

function assignParticipants(names: string[]): Participant[] {
  const roles = shuffleRoles();
  return names.map((name, i) => ({
    name,
    roleId: roles[i].id,
  }));
}

export function PlaySessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setNames = useCallback((names: string[]) => {
    dispatch({ type: 'SET_NAMES', names });
  }, []);

  const spinRoulette = useCallback((names: string[]) => {
    dispatch({ type: 'START_ROULETTE' });
    const trimmed = names.map((n) => n.trim()).filter(Boolean);
    window.setTimeout(() => {
      dispatch({
        type: 'FINISH_ROULETTE',
        participants: assignParticipants(trimmed),
      });
    }, 2200);
  }, []);

  const confirmRoster = useCallback(() => {
    dispatch({ type: 'CONFIRM_ROSTER' });
  }, []);

  const selectBook = useCallback((book: Book) => {
    dispatch({ type: 'SELECT_BOOK', book });
  }, []);

  const setDuration = useCallback((minutes: number) => {
    dispatch({ type: 'SET_DURATION', minutes });
  }, []);

  const startTimer = useCallback(() => {
    dispatch({ type: 'START_TIMER' });
  }, []);

  const tick = useCallback(() => {
    dispatch({ type: 'TICK' });
  }, []);

  const stopTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
  }, []);

  const goToReview = useCallback(() => {
    dispatch({ type: 'GO_TO_REVIEW' });
  }, []);

  const addReview = useCallback(
    (name: string, message: string) => {
      const participant = state.participants.find((p) => p.name === name);
      if (!participant || !message.trim()) return;
      dispatch({
        type: 'ADD_REVIEW',
        review: {
          id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          participantName: name,
          roleId: participant.roleId,
          message: message.trim(),
        },
      });
    },
    [state.participants],
  );

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const hasActiveSession =
    state.participants.length > 0 &&
    ['confirmed', 'timer', 'finished', 'review'].includes(state.phase);

  const value = useMemo<PlaySessionContextValue>(
    () => ({
      ...state,
      hasActiveSession,
      setNames,
      spinRoulette,
      confirmRoster,
      selectBook,
      setDuration,
      startTimer,
      tick,
      stopTimer,
      goToReview,
      addReview,
      resetSession,
    }),
    [
      state,
      hasActiveSession,
      setNames,
      spinRoulette,
      confirmRoster,
      selectBook,
      setDuration,
      startTimer,
      tick,
      stopTimer,
      goToReview,
      addReview,
      resetSession,
    ],
  );

  return (
    <PlaySessionContext.Provider value={value}>
      {children}
    </PlaySessionContext.Provider>
  );
}

export function usePlaySession(): PlaySessionContextValue {
  const ctx = useContext(PlaySessionContext);
  if (!ctx) {
    throw new Error('usePlaySession must be used within PlaySessionProvider');
  }
  return ctx;
}
