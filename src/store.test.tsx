import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { LearningProvider, useLearning } from './store';

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function Harness() {
  const { progress, sync, error, send, retry } = useLearning();
  return <><span data-testid="status">{sync}</span><span data-testid="studied">{Object.values(progress.lessons).filter(l=>l.studied).length}</span><span data-testid="error">{error}</span>{[1,2,3].map(n=><button key={n} onClick={()=>send({id:`study-test-${n}`,type:'study',lessonId:`lesson-0${n}`,date:'2026-10-10',at:1000+n})}>{n===1?'Study':`Study ${n}`}</button>)}<button onClick={retry}>Retry</button></>;
}
describe('local persistence', () => {
  it('restores progress on remount without needing Firebase', () => {
    const view = render(<LearningProvider><Harness/></LearningProvider>);
    fireEvent.click(view.getByText('Study'));
    expect(view.getByTestId('studied').textContent).toBe('1');
    cleanup();
    const reopened = render(<LearningProvider><Harness/></LearningProvider>);
    expect(reopened.getByTestId('studied').textContent).toBe('1');
    expect(reopened.getByTestId('status').textContent).toBe('local');
  });
  it('reports storage failure and retries the in-memory result without losing it', () => {
    const view = render(<LearningProvider><Harness/></LearningProvider>);
    const blocked = vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Full','QuotaExceededError');});
    fireEvent.click(view.getByText('Study'));
    expect(view.getByTestId('status').textContent).toBe('error');
    expect(view.getByTestId('studied').textContent).toBe('1');
    expect(view.getByTestId('error').textContent).toContain('belum bisa disimpan');
    blocked.mockRestore();
    fireEvent.click(view.getByText('Retry'));
    expect(view.getByTestId('status').textContent).toBe('local');
    expect(JSON.parse(localStorage.getItem('nichinichi-v1:local')!).progress.lessons['lesson-01'].studied).toBe(true);
  });
  it('keeps all new progress if storage fills after an older save', () => {
    const view = render(<LearningProvider><Harness/></LearningProvider>);
    fireEvent.click(view.getByText('Study'));
    const blocked = vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Full','QuotaExceededError');});
    fireEvent.click(view.getByText('Study 2'));
    fireEvent.click(view.getByText('Study 3'));
    expect(view.getByTestId('studied').textContent).toBe('3');
    blocked.mockRestore();
    fireEvent.click(view.getByText('Retry'));
    expect(Object.keys(JSON.parse(localStorage.getItem('nichinichi-v1:local')!).progress.lessons)).toHaveLength(3);
  });
});
