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

export const getStoredAuthToken = () => readLocalStorage('authToken')

export const buildIdentityHeaders = (explicitUserId = '') => {
  const userId = explicitUserId || getStoredUserId()
  const workspaceId = getStoredWorkspaceId()
  const token = getStoredAuthToken()

  return {
    // Authorization: Bearer <JWT> 是新的权威身份来源；后端验签后据此还原可信 userId。
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // X-User-Id 保留兼容：后端在有 JWT 时会用 token 里的 userId 覆盖它，无 JWT 且关闭兜底时直接忽略它。
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
