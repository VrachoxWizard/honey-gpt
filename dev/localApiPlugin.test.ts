import { describe, it, expect } from 'vitest';
import { localApiPlugin } from './localApiPlugin';

describe('localApiPlugin', () => {
  it('registers hanicar local API plugin', () => {
    const plugin = localApiPlugin();
    expect(plugin.name).toBe('hanicar-local-api');
    expect(typeof plugin.configureServer).toBe('function');
  });
});
