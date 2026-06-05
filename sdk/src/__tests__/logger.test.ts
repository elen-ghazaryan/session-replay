import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log, setLogLevel } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    setLogLevel('warn'); // reset shared level — it persists across tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('at the default warn level, warn and error print but info is muted', () => {
    log.error('boom');
    log.warn('careful');
    log.info('fyi');

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.info).not.toHaveBeenCalled();
  });

  it('prefixes every message with [tracker]', () => {
    log.warn('careful', 42);
    expect(console.warn).toHaveBeenCalledWith('[tracker]', 'careful', 42);
  });

  it('shows info once the level is raised to info', () => {
    setLogLevel('info');
    log.info('fyi');
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it('at error level, error prints but warn is muted', () => {
    setLogLevel('error');
    log.error('boom');
    log.warn('careful');

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('silent mutes everything, even error', () => {
    setLogLevel('silent');
    log.error('boom');
    log.warn('careful');
    log.info('fyi');

    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
  });
});
