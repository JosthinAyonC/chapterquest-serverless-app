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

export type PlayPhase =
  | 'setup'
  | 'roulette'
  | 'confirmed'
  | 'timer'
  | 'finished';

export interface Participant {
  name: string;
  roleId: RoleId;
}

export interface PlaySessionState {
  phase: PlayPhase;
  names: string[];
  rouletteNames: string[];
  participants: Participant[];
  selectedBook: Book | null;
  durationMinutes: number;
  remainingSeconds: number;
  timerRunning: boolean;
  readingPrepared: boolean;
  endedEarly: boolean;
  rouletteSpinning: boolean;
}

type Action =
  | { type: 'SET_NAMES'; names: string[] }
  | { type: 'START_ROULETTE'; names: string[] }
  | { type: 'FINISH_ROULETTE'; participants: Participant[] }
  | { type: 'CONFIRM_ROSTER' }
  | { type: 'SELECT_BOOK'; book: Book }
  | { type: 'SET_DURATION'; minutes: number }
  | { type: 'OPEN_READING' }
  | { type: 'START_TIMER' }
  | { type: 'TICK' }
  | { type: 'STOP_TIMER' }
  | { type: 'FINISH_EARLY' }
  | { type: 'RESET' };

const DEFAULT_DURATION = 40;

/** Quick timer testing: set to seconds (e.g. 1). Set to `null` for normal minutes-based timer. */
const DEV_TIMER_SECONDS: number | null = 1;

const initialState: PlaySessionState = {
  phase: 'setup',
  names: Array(6).fill(''),
  rouletteNames: [],
  participants: [],
  selectedBook: null,
  durationMinutes: DEFAULT_DURATION,
  remainingSeconds: DEFAULT_DURATION * 60,
  timerRunning: false,
  readingPrepared: false,
  endedEarly: false,
  rouletteSpinning: false,
};

function reducer(state: PlaySessionState, action: Action): PlaySessionState {
  switch (action.type) {
    case 'SET_NAMES':
      return { ...state, names: action.names };
    case 'START_ROULETTE':
      return {
        ...state,
        phase: 'roulette',
        rouletteSpinning: true,
        rouletteNames: action.names,
        participants: [],
      };
    case 'FINISH_ROULETTE':
      return {
        ...state,
        participants: action.participants,
        rouletteSpinning: false,
        rouletteNames: [],
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
    case 'OPEN_READING':
      return {
        ...state,
        phase: 'timer',
        readingPrepared: true,
        timerRunning: false,
        endedEarly: false,
      };
    case 'START_TIMER':
      return {
        ...state,
        phase: 'timer',
        timerRunning: true,
        endedEarly: false,
        remainingSeconds: DEV_TIMER_SECONDS ?? state.durationMinutes * 60,
      };
    case 'TICK':
      if (state.remainingSeconds <= 1) {
        return {
          ...state,
          remainingSeconds: 0,
          timerRunning: false,
          phase: 'finished',
          endedEarly: false,
        };
      }
      return { ...state, remainingSeconds: state.remainingSeconds - 1 };
    case 'STOP_TIMER':
      return { ...state, timerRunning: false, phase: 'finished' };
    case 'FINISH_EARLY':
      return {
        ...state,
        timerRunning: false,
        remainingSeconds: 0,
        phase: 'finished',
        endedEarly: true,
      };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

interface PlaySessionContextValue extends PlaySessionState {
  hasActiveSession: boolean;
  setNames: (names: string[]) => void;
  spinRoulette: (names: string[]) => void;
  finishRoulette: (participants: Participant[]) => void;
  confirmRoster: () => void;
  selectBook: (book: Book) => void;
  setDuration: (minutes: number) => void;
  openReading: () => void;
  startTimer: () => void;
  tick: () => void;
  stopTimer: () => void;
  finishEarly: () => void;
  resetSession: () => void;
}

const PlaySessionContext = createContext<PlaySessionContextValue | null>(null);

export function PlaySessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setNames = useCallback((names: string[]) => {
    dispatch({ type: 'SET_NAMES', names });
  }, []);

  const spinRoulette = useCallback((names: string[]) => {
    dispatch({ type: 'START_ROULETTE', names });
  }, []);

  const finishRoulette = useCallback((participants: Participant[]) => {
    dispatch({ type: 'FINISH_ROULETTE', participants });
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

  const openReading = useCallback(() => {
    dispatch({ type: 'OPEN_READING' });
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

  const finishEarly = useCallback(() => {
    dispatch({ type: 'FINISH_EARLY' });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const hasActiveSession =
    state.participants.length > 0 &&
    ['confirmed', 'timer', 'finished'].includes(state.phase);

  const value = useMemo<PlaySessionContextValue>(
    () => ({
      ...state,
      hasActiveSession,
      setNames,
      spinRoulette,
      finishRoulette,
      confirmRoster,
      selectBook,
      setDuration,
      openReading,
      startTimer,
      tick,
      stopTimer,
      finishEarly,
      resetSession,
    }),
    [
      state,
      hasActiveSession,
      setNames,
      spinRoulette,
      finishRoulette,
      confirmRoster,
      selectBook,
      setDuration,
      openReading,
      startTimer,
      tick,
      stopTimer,
      finishEarly,
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
