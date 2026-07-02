import { describe, it, expect } from 'vitest';
import { loreFileSchema, katekizamFileSchema } from './schemas';

describe('content schemas', () => {
  it('validates lore entries', () => {
    const parsed = loreFileSchema.parse([
      {
        keywords: ['kava'],
        phrases: ['Jedan espresso, molim.'],
      },
    ]);

    expect(parsed).toHaveLength(1);
  });

  it('rejects invalid katekizam entries', () => {
    expect(() =>
      katekizamFileSchema.parse([
        {
          keywords: [],
          answer: '',
          satireHint: 'hint',
        },
      ])
    ).toThrow();
  });
});
