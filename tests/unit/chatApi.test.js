import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import apiClient, { getSessionChatHistory, getUserSessions } from '@/api/chat'

const readHeader = (headers, name) => (
  typeof headers?.get === 'function' ? headers.get(name) : headers?.[name]
)

describe('chat api identity', () => {
  let originalAdapter
  let capturedConfig

  beforeEach(() => {
    localStorage.clear()
    capturedConfig = null
    originalAdapter = apiClient.defaults.adapter
    apiClient.defaults.adapter = async (config) => {
      capturedConfig = config
      return {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    }
  })

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter
  })

  it('sends X-User-Id when loading session history', async () => {
    localStorage.setItem('userId', 'user-1')
    await getSessionChatHistory('session-1')

    expect(capturedConfig.url).toBe('/chat/history/session-1')
    expect(readHeader(capturedConfig.headers, 'X-User-Id')).toBe('user-1')
  })

  it('uses the requested user id for session list ownership checks', async () => {
    localStorage.setItem('userId', 'old-user')
    await getUserSessions('user-2')

    expect(capturedConfig.url).toBe('/sessions/user/user-2')
    expect(readHeader(capturedConfig.headers, 'X-User-Id')).toBe('user-2')
  })
})
