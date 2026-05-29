import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs in jsdom environment', () => {
    expect(document).toBeDefined();
  });
});
