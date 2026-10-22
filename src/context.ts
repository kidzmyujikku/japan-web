import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { Attempt, LearningEvent, Progress, Settings } from './types';

export type Store = {
  progress: Progress; attempts: Attempt[]; send: (event: LearningEvent) => void;
  setSettings: (settings: Settings) => void; retry: () => void;
  sync: 'local' | 'saving' | 'saved' | 'error'; error: string; user: User | null;
  authLoading: boolean; ready: boolean; logout: () => Promise<void>;
};
// Keep provider identity stable during Vite Fast Refresh.
export const LearningContext = createContext<Store | null>(null);
