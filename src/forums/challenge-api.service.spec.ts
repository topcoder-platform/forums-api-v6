import { ConfigService } from '@nestjs/config';
import { auth } from 'tc-core-library-js';
import { ChallengeApiService } from './challenge-api.service';

/**
 * Creates a Challenge API adapter with test M2M and endpoint configuration.
 *
 * @param overrides Configuration replacements, including undefined for missing settings.
 * @returns Service configured for mocked outbound requests.
 * @throws Does not throw.
 */
function createService(overrides: Record<string, string | undefined> = {}) {
  const values = {
    'notifications.topcoderApiUrlBase': 'https://api.topcoder-dev.com/',
    'notifications.auth0Url': 'https://auth.example.com/oauth/token',
    'notifications.auth0Audience': 'https://m2m.example.com/',
    'notifications.tokenCacheTime': '86400',
    'notifications.auth0ProxyServerUrl': 'https://proxy.example.com/token',
    'notifications.m2mClientId': 'client-id',
    'notifications.m2mClientSecret': 'client-secret',
    ...overrides,
  };
  return new ChallengeApiService({
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService);
}

describe('ChallengeApiService', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;
  let m2mSpy: jest.SpiedFunction<typeof auth.m2m>;
  let getMachineToken: jest.Mock;

  beforeEach(() => {
    getMachineToken = jest.fn().mockResolvedValue('machine-token');
    m2mSpy = jest.spyOn(auth, 'm2m').mockReturnValue({ getMachineToken });
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ id: 'challenge-1', name: 'Challenge title' }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('looks up the challenge name using the configured M2M credentials', async () => {
    const service = createService();

    expect(m2mSpy).not.toHaveBeenCalled();
    await expect(service.getChallengeTitle('challenge-1')).resolves.toBe(
      'Challenge title',
    );
    expect(m2mSpy).toHaveBeenCalledWith({
      AUTH0_URL: 'https://auth.example.com/oauth/token',
      AUTH0_AUDIENCE: 'https://m2m.example.com/',
      TOKEN_CACHE_TIME: 86400,
      AUTH0_PROXY_SERVER_URL: 'https://proxy.example.com/token',
    });
    expect(getMachineToken).toHaveBeenCalledWith('client-id', 'client-secret');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.topcoder-dev.com/v6/challenges/challenge-1',
      {
        headers: { Authorization: 'Bearer machine-token' },
        signal: expect.any(AbortSignal),
      },
    );
  });

  it('uses an explicit collection URL and encodes the challenge id', async () => {
    const service = createService({
      'notifications.challengeApiUrl': ' http://localhost:4000/v6/challenges/ ',
    });

    await service.getChallengeTitle('challenge/id?query');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:4000/v6/challenges/challenge%2Fid%3Fquery',
      expect.any(Object),
    );
  });

  it('builds an environment-correct Opportunities link from the shared API host', () => {
    expect(createService().getChallengeUrl('challenge/id?query')).toBe(
      'https://www.topcoder-dev.com/opportunities/challenge/challenge%2Fid%3Fquery',
    );
  });

  it('uses the explicit Topcoder web URL for public challenge links', () => {
    const service = createService({
      'notifications.topcoderUrl': 'https://community.example.com/ignored/path?query=1',
    });

    expect(service.getChallengeUrl('challenge-1')).toBe(
      'https://community.example.com/opportunities/challenge/challenge-1',
    );
  });

  it.each([
    [{ 'notifications.topcoderApiUrlBase': undefined }, 'must configure'],
    [
      { 'notifications.topcoderUrl': 'javascript:alert(1)' },
      'absolute HTTP(S) URL',
    ],
    [{ 'notifications.topcoderUrl': 'not-a-url' }, 'absolute HTTP(S) URL'],
  ])('rejects unusable public challenge URL configuration: %p', (overrides, message) => {
    expect(() => createService(overrides).getChallengeUrl('challenge-1')).toThrow(
      message,
    );
  });

  it.each([
    ['notifications.topcoderApiUrlBase', 'CHALLENGE_API_URL'],
    ['notifications.m2mClientId', 'M2M_CLIENT_ID'],
    ['notifications.m2mClientSecret', 'M2M_CLIENT_SECRET'],
  ])('fails before outbound requests when %s is missing', async (key, message) => {
    await expect(
      createService({ [key]: undefined }).getChallengeTitle('challenge-1'),
    ).rejects.toThrow(message);
    expect(getMachineToken).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('propagates token failures without calling the Challenge API', async () => {
    getMachineToken.mockRejectedValue(new Error('Token unavailable'));

    await expect(createService().getChallengeTitle('challenge-1')).rejects.toThrow(
      'Token unavailable',
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each([403, 404, 500])('rejects HTTP %s responses', async (status) => {
    fetchSpy.mockResolvedValue(new Response(null, { status }));

    await expect(createService().getChallengeTitle('challenge-1')).rejects.toThrow(
      `Challenge API returned HTTP ${status}`,
    );
  });

  it.each([null, {}, { name: '' }, { name: '  ' }, { name: 123 }])(
    'rejects a response without a usable title: %p',
    async (body) => {
      fetchSpy.mockResolvedValue(Response.json(body));

      await expect(createService().getChallengeTitle('challenge-1')).rejects.toThrow(
        'no usable challenge name',
      );
    },
  );

  it('propagates HTTP timeouts for best-effort notification handling', async () => {
    const timeoutError = new DOMException('Request timed out', 'TimeoutError');
    fetchSpy.mockRejectedValue(timeoutError);

    await expect(createService().getChallengeTitle('challenge-1')).rejects.toBe(
      timeoutError,
    );
  });
});
