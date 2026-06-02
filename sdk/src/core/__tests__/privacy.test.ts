import { describe, it, expect } from 'vitest';
import { maskInput } from '../privacy';

// Helper: build a real input element in jsdom with the given attributes
function input(attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement('input');
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

describe('maskInput', () => {
  it('masks when no element is given', () => {
    expect(maskInput('secret')).toBe('[masked]');
  });

  it('masks passwords with fixed-length stars', () => {
    expect(maskInput('hunter2', input({ type: 'password' }))).toBe('********');
  });

  it('passes text through when data-allow is set', () => {
    expect(maskInput('public', input({ 'data-allow': '' }))).toBe('public');
  });

  it('masks email by type and by autocomplete', () => {
    expect(maskInput('a@b.com', input({ type: 'email' }))).toBe('[email-masked]');
    expect(maskInput('a@b.com', input({ autocomplete: 'email' }))).toBe('[email-masked]');
  });

  it('masks phone by type and by autocomplete', () => {
    expect(maskInput('555', input({ type: 'tel' }))).toBe('[phone-masked]');
    expect(maskInput('555', input({ autocomplete: 'tel' }))).toBe('[phone-masked]');
  });

  it('masks credit card and name by autocomplete', () => {
    expect(maskInput('4111', input({ autocomplete: 'cc-number' }))).toBe('[card-masked]');
    expect(maskInput('Jane', input({ autocomplete: 'name' }))).toBe('[name-masked]');
  });

  it('masks a generic input with the default label', () => {
    expect(maskInput('whatever', input({ type: 'text' }))).toBe('[masked]');
  });

  // Precedence: these prove the early-return order, not just the labels.
  it('prefers password over data-allow', () => {
    expect(maskInput('pw', input({ type: 'password', 'data-allow': '' }))).toBe('********');
  });

  it('prefers data-allow over email masking', () => {
    expect(maskInput('a@b.com', input({ type: 'email', 'data-allow': '' }))).toBe('a@b.com');
  });
});
