import BubbleAPI, { bubbleKey, bubbleUrl, resolveBubble } from './bubble-api'

const HOME = 'https://bubbles.hestialabs.org'
const OTHER = 'https://bubbles.example.org'

describe('resolveBubble', () => {
  test('a name is on the default server', () => {
    expect(resolveBubble('frc-participant', HOME)).toEqual({
      apiUrl: HOME,
      name: 'frc-participant'
    })
  })

  test('a URL names its own server', () => {
    expect(resolveBubble(`${OTHER}/bubbles/study`, HOME)).toEqual({
      apiUrl: OTHER,
      name: 'study'
    })
    expect(resolveBubble(`${OTHER}/api/bubbles/study/`, HOME)).toEqual({
      apiUrl: `${OTHER}/api`,
      name: 'study'
    })
    expect(resolveBubble('http://127.0.0.1:8000/bubbles/demo', HOME)).toEqual({
      apiUrl: 'http://127.0.0.1:8000',
      name: 'demo'
    })
  })

  test('bubbleUrl is the inverse', () => {
    const { apiUrl, name } = resolveBubble(`${OTHER}/bubbles/study`, HOME)
    expect(bubbleUrl(apiUrl, name)).toBe(`${OTHER}/bubbles/study`)
  })
})

describe('bubbleKey', () => {
  test('keeps plain names for the default server', () => {
    expect(bubbleKey('frc-participant', HOME)).toBe('frc-participant')
    expect(bubbleKey(`${HOME}/bubbles/frc-participant`, HOME)).toBe('frc-participant')
  })

  test('adds the host for other servers', () => {
    expect(bubbleKey(`${OTHER}/bubbles/study`, HOME)).toBe('study@bubbles.example.org')
  })
})

describe('BubbleAPI', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = jest.fn(async() => ({
      ok: true,
      status: 200,
      json: async() => ({ title: 'A bubble' })
    }))
    global.fetch = fetchMock
  })

  afterEach(() => {
    delete global.fetch
  })

  test('getConfig fetches from the bubble\'s own server', async() => {
    const config = await new BubbleAPI(HOME).getConfig(`${OTHER}/bubbles/study`)
    expect(fetchMock.mock.calls[0][0]).toBe(`${OTHER}/bubbles/study/config`)
    expect(config).toMatchObject({
      title: 'A bubble',
      id: 'study',
      apiUrl: OTHER,
      url: `${OTHER}/bubbles/study`
    })
  })

  test('getConfig by name is unchanged', async() => {
    const config = await new BubbleAPI(HOME).getConfig('frc-participant')
    expect(fetchMock.mock.calls[0][0]).toBe(`${HOME}/bubbles/frc-participant/config`)
    expect(config).toMatchObject({ id: 'frc-participant', apiUrl: HOME })
  })

  function uploaded() {
    const [url, { method, body }] = fetchMock.mock.calls[0]
    return {
      url,
      method,
      source: body.get('source-bubble'),
      codeword: body.get('codeword')
    }
  }

  test('uploads to a destination on the same server send the source name', async() => {
    const file = new File(['x'], 'results.zip')
    const error = await new BubbleAPI(HOME).uploadFile(file, 'frc-aggregator', 'frc-participant', '0123')
    expect(error).toBeUndefined()
    expect(uploaded()).toEqual({
      url: `${HOME}/bubbles/frc-aggregator/files`,
      method: 'POST',
      source: 'frc-participant',
      codeword: '0123'
    })
  })

  test('uploads to another server send the source URL', async() => {
    const file = new File(['x'], 'results.zip')
    await new BubbleAPI(HOME).uploadFile(file, `${OTHER}/bubbles/study-aggregator`, 'frc-participant', '0123')
    expect(uploaded()).toEqual({
      url: `${OTHER}/bubbles/study-aggregator/files`,
      method: 'POST',
      source: `${HOME}/bubbles/frc-participant`,
      codeword: '0123'
    })
  })

  test('a destination URL on the same server is treated as local', async() => {
    const file = new File(['x'], 'results.zip')
    await new BubbleAPI(HOME).uploadFile(file, `${HOME}/bubbles/frc-aggregator`, 'frc-participant', '0123')
    expect(uploaded().source).toBe('frc-participant')
  })
})
