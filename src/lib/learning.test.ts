import { describe, expect, it } from 'vitest';
import { lessons } from '../data/curriculum';
import { achievements, addDays, applyEvent, defaultSettings, earnedPoints, emptyProgress, isCorrect, jakartaDate, remainingSeconds, streak, unlocked } from './learning';
import type { Attempt, LearningEvent, Progress } from '../types';
import { kanjiWords } from '../data/kanji';

const day = '2026-10-10';
const study: LearningEvent = { id:'study', type:'study', lessonId:lessons[0].id, at:1000, date:day };
function quiz(score: number, id = `quiz-${score}`): LearningEvent {
  const attempt: Attempt = { id, lessonId:lessons[0].id, score, answers:[], date:day, at:2000, timer:0 };
  return { id, type:'quiz', attempt, at:2000 };
}
describe('progress and rewards', () => {
  it('opens all lessons in exploration and requires every prior pass in challenge', () => {
    const state = emptyProgress();
    expect(unlocked(state,23)).toBe(true);
    state.settings.mode = 'challenge';
    expect(unlocked(state,0)).toBe(true);
    expect(unlocked(state,1)).toBe(false);
    state.lessons[lessons[1].id] = { studied:true, best:100 };
    expect(unlocked(state,2)).toBe(false);
    state.lessons[lessons[0].id] = { studied:true, best:80 };
    expect(unlocked(state,2)).toBe(true);
  });
  it('preserves the best grade and awards points once across repeated quizzes', () => {
    let state = applyEvent(emptyProgress(),study);
    state = applyEvent(state,{...study,id:'study-again'});
    state = applyEvent(state,quiz(80));
    state = applyEvent(state,quiz(40));
    state = applyEvent(state,quiz(100));
    expect(state.lessons[lessons[0].id].best).toBe(100);
    expect(earnedPoints(state)).toBe(30);
    expect(achievements(state)[0].earned).toBe(true);
  });
  it('deduplicates receipt IDs and does not mutate previous state', () => {
    const previous = emptyProgress();
    const next = applyEvent(previous,study);
    expect(previous.lessons).toEqual({});
    expect(applyEvent(next,study)).toBe(next);
    expect(Object.keys(next.reviews)).toHaveLength(6);
  });
  it('keeps progress when switching modes and ignores older settings', () => {
    const state = applyEvent(emptyProgress(),study);
    const event: LearningEvent = { id:'settings',type:'settings',settings:{...defaultSettings,mode:'challenge'},at:5000 };
    const next = applyEvent(state,event);
    expect(next.lessons).toEqual(state.lessons);
    expect(applyEvent(next,{...event,id:'old',at:4000,settings:defaultSettings}).settings.mode).toBe('challenge');
  });
});
describe('spaced repetition', () => {
  it('saves kanji without completing a lesson and preserves its schedule on repeated saves', () => {
    const cardId = kanjiWords.find(w => w.word === '私')!.id;
    const save: LearningEvent = { id: 'save-kanji', type: 'kanji-save', cardId, date: day, at: 1000 };
    let state = applyEvent(emptyProgress(), save);
    expect(state.lessons).toEqual({});
    expect(state.reviews[cardId]).toEqual({ step: -1, due: day, lastAt: 1000 });
    expect(applyEvent(state, save)).toBe(state);
    state = applyEvent(state, { id: 'review-kanji', type: 'review', cardId, remembered: true, date: day, at: 2000 });
    expect(state.reviews[cardId].due).toBe(addDays(day, 1));
    const resaved = applyEvent(state, { ...save, id: 'save-again', at: 3000 });
    expect(resaved.reviews).toEqual(state.reviews);
    expect(resaved.days[day].reviews).toBe(1);
    expect(applyEvent(state, { ...save, id: 'unknown-kanji', cardId: 'kanji:invalid' })).toBe(state);
  });
  it('uses 1/3/7/14/30 days and resets a forgotten card to tomorrow', () => {
    let state = applyEvent(emptyProgress(),study);
    const cardId = lessons[0].vocabulary[0].id;
    for (const [i,interval] of [1,3,7,14,30,30].entries()) {
      state = applyEvent(state,{id:`review-${i}`,type:'review',cardId,remembered:true,date:day,at:2000+i});
      expect(state.reviews[cardId].due).toBe(addDays(day,interval));
    }
    const forget: LearningEvent = {id:'forget',type:'review',cardId,remembered:false,date:day,at:9999};
    state = applyEvent(state,forget);
    expect(state.reviews[cardId].due).toBe('2026-10-11');
    expect(earnedPoints(state)).toBe(15);
    expect(applyEvent(state,forget).days[day].reviews).toBe(7);
  });
  it('retains the newer schedule when an old device syncs late', () => {
    const state = applyEvent(applyEvent(emptyProgress(),study),{id:'new',type:'review',cardId:lessons[0].vocabulary[0].id,remembered:true,date:day,at:9000});
    const next = applyEvent(state,{id:'late',type:'review',cardId:lessons[0].vocabulary[0].id,remembered:false,date:day,at:2000});
    expect(next.reviews).toEqual(state.reviews);
  });
});
describe('dates and timer', () => {
  it('uses the Jakarta midnight boundary independent of device timezone', () => {
    expect(jakartaDate(Date.parse('2026-10-09T16:59:59Z'))).toBe('2026-10-09');
    expect(jakartaDate(Date.parse('2026-10-09T17:00:00Z'))).toBe(day);
    expect(addDays('2026-12-31',1)).toBe('2027-01-01');
  });
  it('holds a streak until the end of the next Jakarta day', () => {
    const state: Progress = {...emptyProgress(),days:{'2026-10-08':{quiz:true,reviews:0},'2026-10-09':{quiz:false,reviews:5}}};
    expect(streak(state,day)).toBe(2);
    expect(streak(state,'2026-10-11')).toBe(0);
    state.days[day] = {quiz:true,reviews:0};
    expect(streak(state,day)).toBe(3);
    expect(achievements(state)[2].earned).toBe(true);
  });
  it('derives the timer from a deadline rather than interval counts', () => {
    expect(remainingSeconds(20000,11000)).toBe(9);
    expect(remainingSeconds(20000,19500)).toBe(1);
    expect(remainingSeconds(20000,90000)).toBe(0);
  });
});
describe('answer grading', () => {
  it('normalizes surrounding whitespace and width without accepting spelling mistakes', () => {
    const question = lessons[1].questions[8];
    expect(isCorrect(question,' ﾊﾟﾝ ')).toBe(true);
    expect(isCorrect(question,'ばん')).toBe(false);
  });
  it('requires all pairs and the exact sentence sequence', () => {
    const matching = lessons[0].questions[4];
    const order = lessons[0].questions[6];
    expect(isCorrect(matching,['kucing','anjing','rumah'])).toBe(true);
    expect(isCorrect(matching,['anjing','kucing','rumah'])).toBe(false);
    expect(isCorrect(order,['ねこ','です'])).toBe(true);
    expect(isCorrect(order,['です','ねこ'])).toBe(false);
  });
});
