import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AIContext } from '../ai-context';
import type { AIStore } from '../ai-context';
import { lessons } from '../data/curriculum';
import TutorPanel from './TutorPanel';

afterEach(cleanup);
function store(overrides: Partial<AIStore> = {}): AIStore {
  return {
    status:{connected:true,sharing:true,activeId:'fixture',pending:false,authError:null,csrf:'fixture',profiles:[{id:'fixture',email:'learner@example.test',name:'Learner',connected:true,welcomeSeen:true}]},
    models:[{slug:'fixture-model',name:'Fixture model'}],loading:false,connecting:false,error:'',notice:'',loginUrl:'',
    refresh:vi.fn().mockResolvedValue(undefined),connect:vi.fn().mockResolvedValue(undefined),select:vi.fn().mockResolvedValue(undefined),disconnect:vi.fn().mockResolvedValue(undefined),acknowledge:vi.fn().mockResolvedValue(undefined),post:vi.fn(),...overrides,
  };
}
function Panel({ value }: { value: AIStore }) { return <MemoryRouter><AIContext.Provider value={value}><TutorPanel lesson={lessons[4]} standalone/></AIContext.Provider></MemoryRouter>; }
const response = (events: unknown[]) => new Response(events.map(event=>JSON.stringify(event)).join('\n')+'\n');

describe('tutor UI',()=>{
  it('shows sign-in and does not enable inference before plan permission',()=>{
    const value=store({status:{connected:false,sharing:false,activeId:null,pending:false,authError:null,csrf:'fixture',profiles:[]},models:[]});
    const view=render(<Panel value={value}/>);
    fireEvent.click(view.getByRole('button',{name:'Continue with ChatGPT'}));
    expect(value.connect).toHaveBeenCalled();
    expect(view.queryByRole('textbox')).toBeNull();expect(value.post).not.toHaveBeenCalled();
  });
  it('sends correction mode with the selected lesson and displays completed Markdown',async()=>{
    const value=store({post:vi.fn().mockResolvedValue(response([{type:'delta',text:'**Versi tepat:** 日本語が好きです。'},{type:'done'}]))});
    const view=render(<Panel value={value}/>);
    fireEvent.click(view.getByRole('button',{name:'Koreksi kalimat'}));
    fireEvent.change(view.getByRole('textbox'),{target:{value:'私は日本語を好きです。'}});
    fireEvent.click(view.getByRole('button',{name:'Periksa kalimat'}));
    await waitFor(()=>expect(view.getByText('Versi tepat:')).toBeDefined());
    expect(value.post).toHaveBeenCalledWith('chat',expect.objectContaining({lessonId:'lesson-05',mode:'correct',message:'私は日本語を好きです。',history:[],model:'fixture-model'}),expect.any(AbortSignal));
    await waitFor(()=>expect(view.queryByText('Sedang menyusun penjelasan…')).toBeNull());
  });
  it('labels partial failed answers and excludes them from the next conversation context',async()=>{
    const post=vi.fn().mockResolvedValueOnce(response([{type:'delta',text:'Partial answer'},{type:'error',code:'usage_limit',error:'Batas penggunaan tercapai.'}])).mockResolvedValueOnce(response([{type:'delta',text:'Completed answer'},{type:'done'}]));
    const view=render(<Panel value={store({post})}/>);
    fireEvent.change(view.getByRole('textbox'),{target:{value:'Jelaskan は.'}});fireEvent.click(view.getByRole('button',{name:'Tanya tutor'}));
    await waitFor(()=>expect(view.getByRole('alert').textContent).toContain('Batas penggunaan'));
    expect(view.getAllByText('Belum selesai')).toHaveLength(2);
    expect((view.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Jelaskan は.');
    fireEvent.click(view.getByRole('button',{name:'Tanya tutor'}));
    await waitFor(()=>expect(view.getByText('Completed answer')).toBeDefined());
    expect(post.mock.calls[1][1].history).toEqual([]);
  });
  it('does not restore old-account answers after an account switch',async()=>{
    let resolveResponse!: (value:Response)=>void;
    const post=vi.fn().mockImplementation(()=>new Promise<Response>(resolve=>{resolveResponse=resolve;}));
    const first=store({post});const view=render(<Panel value={first}/>);
    fireEvent.change(view.getByRole('textbox'),{target:{value:'Pertanyaan akun pertama'}});fireEvent.click(view.getByRole('button',{name:'Tanya tutor'}));
    await waitFor(()=>expect(post).toHaveBeenCalled());
    const second=store({post,status:{...first.status!,activeId:'second',profiles:[{id:'second',name:'Second',email:'second@example.test',connected:true,welcomeSeen:true}]}});
    view.rerender(<Panel value={second}/>);
    resolveResponse(response([{type:'delta',text:'Old private reply'},{type:'done'}]));
    await waitFor(()=>expect(view.queryByText('Pertanyaan akun pertama')).toBeNull());
    expect(view.queryByText('Old private reply')).toBeNull();
  });
});
