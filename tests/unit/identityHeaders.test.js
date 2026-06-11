import { beforeEach, describe, expect, it } from 'vitest'
import { attachIdentityHeaders, buildIdentityHeaders, getStoredUserId } from '@/api/identity'

describe('identity headers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads the user id stored after login', () => {
    localStorage.setItem('userId', 'user-1')
    expect(getStoredUserId()).toBe('user-1')
    expect(buildIdentityHeaders()).toMatchObject({ 'X-User-Id': 'user-1' })
  })

  it('falls back to userInfo when old localStorage has no standalone userId', () => {
    localStorage.setItem('userInfo', JSON.stringify({ userId: 'user-from-info' }))
    expect(buildIdentityHeaders()).toMatchObject({ 'X-User-Id': 'user-from-info' })
  })

  it('prefers the explicit user id used by path-based APIs', () => {
    localStorage.setItem('userId', 'local-user')
    expect(buildIdentityHeaders('path-user')).toMatchObject({ 'X-User-Id': 'path-user' })
  })

  it('attaches workspace context when present', () => {
    localStorage.setItem('userId', 'user-1')
    localStorage.setItem('currentWorkspaceId', 'workspace-1')
    expect(buildIdentityHeaders()).toMatchObject({
      'X-User-Id': 'user-1',
      'X-Workspace-Id': 'workspace-1'
    })
  })

  it('mutates an axios config with identity headers', () => {
    localStorage.setItem('userId', 'user-1')
    const config = attachIdentityHeaders({ headers: { Accept: 'application/json' } })
    expect(config.headers.Accept).toBe('application/json')
    expect(config.headers['X-User-Id']).toBe('user-1')
  })
})
