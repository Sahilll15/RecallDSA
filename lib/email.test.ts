import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn().mockResolvedValue(undefined);

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

// Imported after the mock so the module under test picks up the mocked transport.
const { sendRevisionReminder } = await import('./email');

describe('sendRevisionReminder', () => {
  beforeEach(() => {
    sendMail.mockClear();
  });

  it('escapes a problem title that would otherwise break the markup', async () => {
    await sendRevisionReminder('user@example.com', 'Sahil', [
      { id: 'p1', title: '<img src=x onerror=alert(1)>', difficulty: null },
    ]);

    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).not.toContain('<img src=x onerror');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes a user name that would otherwise break the markup', async () => {
    await sendRevisionReminder('user@example.com', '<b>Sahil</b>', [
      { id: 'p1', title: 'Two Sum', difficulty: 'easy' },
    ]);

    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).not.toContain('Hi <b>Sahil</b>,');
    expect(html).toContain('Hi &lt;b&gt;Sahil&lt;/b&gt;,');
  });

  it('encodes the problem id into the url rather than interpolating it raw', async () => {
    await sendRevisionReminder('user@example.com', 'Sahil', [
      { id: 'a b/c', title: 'Two Sum', difficulty: null },
    ]);

    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain('/problems/a%20b%2Fc');
  });

  it('falls back to a plain greeting when no name is given', async () => {
    await sendRevisionReminder('user@example.com', '', []);
    const html = sendMail.mock.calls[0][0].html as string;
    expect(html).toContain('Hi there,');
  });
});
