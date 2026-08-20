import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLeetCodeProblem } from './leetcode';

const okResponse = (question: unknown) =>
  ({ ok: true, json: async () => ({ data: { question } }) }) as Response;

const failResponse = (status: number) =>
  ({ ok: false, status, json: async () => ({}) }) as Response;

describe('fetchLeetCodeProblem', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not cache a rate-limited response as "problem does not exist"', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(failResponse(429));
    fetchMock.mockResolvedValueOnce(
      okResponse({
        questionFrontendId: '1',
        title: 'Two Sum',
        titleSlug: 'two-sum-429-case',
        difficulty: 'Easy',
        content: '<p>...</p>',
        topicTags: [{ slug: 'array' }],
        hints: [],
      }),
    );

    const first = await fetchLeetCodeProblem('two-sum-429-case');
    expect(first).toBeNull();

    // A second call right after the first must hit the network again, not a
    // 12-hour cache entry poisoned by the rate-limit response.
    const second = await fetchLeetCodeProblem('two-sum-429-case');
    expect(second?.title).toBe('Two Sum');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache a 5xx response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(failResponse(500));

    const result = await fetchLeetCodeProblem('some-slug-5xx-case');
    expect(result).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await fetchLeetCodeProblem('some-slug-5xx-case');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('caches a genuine "unknown problem" result (200 with a null question)', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(okResponse(null));

    const first = await fetchLeetCodeProblem('not-a-real-problem-case');
    expect(first).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await fetchLeetCodeProblem('not-a-real-problem-case');
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches a successful result and skips the network on the next call', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      okResponse({
        questionFrontendId: '410',
        title: 'Split Array Largest Sum',
        titleSlug: 'split-array-largest-sum-cache-case',
        difficulty: 'Hard',
        content: '<p>...</p>',
        topicTags: [{ slug: 'binary-search' }],
        hints: [],
      }),
    );

    await fetchLeetCodeProblem('split-array-largest-sum-cache-case');
    await fetchLeetCodeProblem('split-array-largest-sum-cache-case');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null and does not throw on a network exception', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(fetchLeetCodeProblem('network-error-case')).resolves.toBeNull();
  });
});
