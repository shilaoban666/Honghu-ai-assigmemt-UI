const readLocalStorage = (key) => {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(key) || ''
}

const readUserIdFromUserInfo = () => {
  const raw = readLocalStorage('userInfo')
  if (!raw) return ''
  try {
    return JSON.parse(raw)?.userId || ''
  } catch {
    return ''
  }
}

export const getStoredUserId = () => (
  readLocalStorage('userId') ||
  readUserIdFromUserInfo()
)

export const getStoredWorkspaceId = () => (
  readLocalStorage('workspaceId') ||
  readLocalStorage('currentWorkspaceId') ||
  readLocalStorage('defaultWorkspaceId')
)

export const buildIdentityHeaders = (explicitUserId = '') => {
  const userId = explicitUserId || getStoredUserId()
  const workspaceId = getStoredWorkspaceId()

  return {
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {})
  }
}

export const attachIdentityHeaders = (config = {}, explicitUserId = '') => {
  config.headers = config.headers || {}
  Object.entries(buildIdentityHeaders(explicitUserId)).forEach(([key, value]) => {
    if (explicitUserId || !config.headers[key]) {
      config.headers[key] = value
    }
  })
  return config
}
