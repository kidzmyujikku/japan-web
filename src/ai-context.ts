import { createContext, useContext } from 'react';

export type AIProfile = { id: string; email: string; name: string; connected: boolean; welcomeSeen: boolean };
export type AIStatus = { connected: boolean; sharing: boolean; activeId: string | null; profiles: AIProfile[]; pending: boolean; authError: string | null; csrf: string };
export type AIModel = { slug: string; name: string };
export type TutorMessage = { role: 'user' | 'assistant'; content: string };
export type AIStore = {
  status: AIStatus | null; models: AIModel[]; loading: boolean; connecting: boolean;
  error: string; notice: string; refresh: () => Promise<void>;
  loginUrl: string;
  preferredModel?: string; chooseModel?: (model: string) => void;
  connect: (profileId?: string) => Promise<void>; select: (profileId: string) => Promise<void>;
  disconnect: () => Promise<void>; acknowledge: () => Promise<void>;
  post: (path: string, body: unknown, signal?: AbortSignal) => Promise<Response>;
};
export const AIContext = createContext<AIStore | null>(null);
export function useAI() { const value = useContext(AIContext); if (!value) throw new Error('AIProvider is missing.'); return value; }
