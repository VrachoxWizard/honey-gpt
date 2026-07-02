import { describe, it, expect } from 'vitest';
import { buildShareRedirectScript } from './share';

describe('api/share', () => {
  it('escapes quotes and script-breaking sequences in share redirect script', () => {
    const malicious = '";alert(1)//</script><script>alert(2)';
    const script = buildShareRedirectScript(malicious);

    expect(script).not.toContain('</script>');
    expect(script).not.toMatch(/\+ "\/\\?share="/);
    expect(script).toContain('encodeURIComponent');
    expect(script).toContain('\\u003c');
  });

  it('produces valid JS for normal share payloads', () => {
    const share = 'eyJ0aXRsZSI6InRlc3QifQ';
    const script = buildShareRedirectScript(share);

    expect(script).toBe(
      `window.location.href = "/?share=" + encodeURIComponent(${JSON.stringify(share)});`
    );
  });
});
