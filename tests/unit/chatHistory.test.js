import { describe, expect, it } from 'vitest'
import { normalizeChatRole, normalizeHistoryPayload } from '@/utils/chatHistory'

describe('chat history normalizer', () => {
  it('normalizes backend chat history into renderable messages', () => {
    const messages = normalizeHistoryPayload([
      {
        chatId: 2,
        chatRole: 'ASSISTANT',
        content: 'answer',
        createdAt: '2026-05-19T10:01:00'
      },
      {
        chatId: 1,
        chatRole: 'USER',
        content: 'question',
        createdAt: '2026-05-19T10:00:00'
      }
    ])

    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({ id: 1, role: 'user', content: 'question' })
    expect(messages[1]).toMatchObject({ id: 2, role: 'assistant', content: 'answer' })
  })

  it('accepts paged or wrapped response shapes', () => {
    const messages = normalizeHistoryPayload({
      content: [
        {
          role: 'assistant',
          message: 'wrapped answer',
          timestamp: [2026, 5, 19, 11, 30, 0]
        }
      ]
    })

    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('assistant')
    expect(messages[0].content).toBe('wrapped answer')
    expect(Number.isFinite(messages[0].timestamp)).toBe(true)
  })

  it('defaults unknown roles to user instead of rendering a blank turn', () => {
    expect(normalizeChatRole('human')).toBe('user')
    expect(normalizeChatRole('bot')).toBe('assistant')
  })
})
