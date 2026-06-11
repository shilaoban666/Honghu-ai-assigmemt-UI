import axios from 'axios'
import { reactive } from 'vue'
import { API_BASE_URL } from '@/api/http'

// 后台沿用同一套后端基础地址，但鉴权方式不同（Bearer Token），因此单独建客户端。
const API_BASE = API_BASE_URL
const ADMIN_BASE = import.meta.env.VITE_ADMIN_API_URL || `${API_BASE}/admin`
const ADMIN_USER_KEY = 'adminUserId'
const ADMIN_TOKEN_KEY = 'adminToken'
const ADMIN_PROFILE_KEY = 'adminProfile'

const cleanParams = (params = {}) => {
  const result = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value
    }
  })
  return result
}

export const getAdminUserId = () => {
  return localStorage.getItem(ADMIN_USER_KEY) || ''
}

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || ''

export const getAdminProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_PROFILE_KEY) || 'null')
  } catch {
    return null
  }
}

export const isAdminLoggedIn = () => Boolean(getAdminToken())

export const setAdminUserId = (userId) => {
  const value = String(userId || '').trim()
  if (value) localStorage.setItem(ADMIN_USER_KEY, value)
  else localStorage.removeItem(ADMIN_USER_KEY)
}

export const setAdminSession = (session = {}) => {
  const token = session.token || session.accessToken || ''
  const user = session.user || session.admin || null
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  if (user?.userId) localStorage.setItem(ADMIN_USER_KEY, user.userId)
  if (user) localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(user))
}

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_PROFILE_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

export const adminClient = axios.create({
  baseURL: ADMIN_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

adminClient.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const adminUserId = getAdminUserId()
  if (adminUserId) {
    config.headers['X-User-Id'] = adminUserId
  }
  return config
})

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if ([401, 403].includes(error.response?.status)) {
      clearAdminSession()
      window.dispatchEvent(new CustomEvent('admin-auth-expired', {
        detail: { status: error.response.status }
      }))
    }
    return Promise.reject(error)
  }
)

const normalizeError = (error) => {
  const status = error.response?.status || 0
  const data = error.response?.data || {}
  const normalized = {
    status,
    code: data.code || data.errorCode || '',
    message: data.message || data.errorMessage || error.message || '请求失败',
    raw: data
  }

  if (status === 401) {
    normalized.message = data.message || '后台登录已过期，请重新登录'
    normalized.authExpired = true
  }

  if (status === 403) {
    normalized.authExpired = true
    normalized.adminForbidden = true
    normalized.message = data.message || '当前账号没有后台权限'
  }

  if (status === 429) {
    normalized.message = data.message || '配额超限'
    normalized.quota = {
      dailyUsed: data.dailyUsed,
      dailyLimit: data.dailyLimit,
      monthlyUsed: data.monthlyUsed,
      monthlyLimit: data.monthlyLimit,
      resetAt: data.resetAt
    }
  }

  if (status === 503 && normalized.code === 'PRICING_NOT_CONFIGURED') {
    normalized.message = data.message || '模型缺少价格配置'
    normalized.pricingNotConfigured = true
  }

  return normalized
}

const request = async (method, url, { params, data } = {}) => {
  try {
    const res = await adminClient.request({
      method,
      url,
      params: cleanParams(params),
      data
    })
    return res.data
  } catch (error) {
    throw normalizeError(error)
  }
}

const pageParams = (params = {}) => cleanParams({
  page: params.page ?? 0,
  size: params.size ?? 20,
  ...params
})

export const createAdminLoader = () => {
  const loading = reactive({})
  const errors = reactive({})

  const run = async (key, task) => {
    loading[key] = true
    errors[key] = null
    try {
      return await task()
    } catch (error) {
      errors[key] = error
      throw error
    } finally {
      loading[key] = false
    }
  }

  return { loading, errors, run }
}

export const adminApi = {
  login: (data) => request('post', '/auth/login', { data }),
  me: () => request('get', '/auth/me'),
  logout: () => request('post', '/auth/logout'),

  getModels: () => request('get', '/models'),
  createModel: (data) => request('post', '/models', { data }),
  getModel: (code) => request('get', `/models/${encodeURIComponent(code)}`),
  patchModel: (code, data) => request('patch', `/models/${encodeURIComponent(code)}`, { data }),
  setModelEnabled: (code, enabled) => request('patch', `/models/${encodeURIComponent(code)}/enabled`, { data: { enabled } }),
  softDeleteModel: (code) => request('delete', `/models/${encodeURIComponent(code)}`),
  hardDeleteModel: (code) => request('delete', `/models/${encodeURIComponent(code)}/hard`),
  getModelPricing: (code) => request('get', `/models/${encodeURIComponent(code)}/pricing`),
  createModelPricing: (code, data) => request('post', `/models/${encodeURIComponent(code)}/pricing`, { data }),
  patchModelMarkupRatio: (code, markupRatio) => request('patch', `/models/${encodeURIComponent(code)}/markup-ratio`, { data: { markupRatio } }),
  getModelRoles: (code) => request('get', `/models/${encodeURIComponent(code)}/roles`),
  replaceModelRoles: (code, roles) => request('put', `/models/${encodeURIComponent(code)}/roles`, { data: { roles } }),

  // ---- Provider 注册表（模型提供商配置 + 加密 API Key；查询只回掩码）----
  getProviders: () => request('get', '/providers'),
  getProvider: (code) => request('get', `/providers/${encodeURIComponent(code)}`),
  createProvider: (data) => request('post', '/providers', { data }),
  patchProvider: (code, data) => request('patch', `/providers/${encodeURIComponent(code)}`, { data }),
  setProviderEnabled: (code, enabled) => request('patch', `/providers/${encodeURIComponent(code)}/enabled`, { data: { enabled } }),
  deleteProvider: (code) => request('delete', `/providers/${encodeURIComponent(code)}`),

  getRoles: () => request('get', '/roles'),
  getRoleQuota: (role) => request('get', `/roles/${encodeURIComponent(role)}/quota`),
  updateRoleQuota: (role, data) => request('put', `/roles/${encodeURIComponent(role)}/quota`, { data }),
  getRoleModels: (role) => request('get', `/roles/${encodeURIComponent(role)}/models`),
  replaceRoleModels: (role, modelCodes) => request('put', `/roles/${encodeURIComponent(role)}/models`, { data: { modelCodes } }),
  grantRoleModel: (role, code) => request('post', `/roles/${encodeURIComponent(role)}/models/${encodeURIComponent(code)}`),
  revokeRoleModel: (role, code) => request('delete', `/roles/${encodeURIComponent(role)}/models/${encodeURIComponent(code)}`),

  getUsers: (params) => request('get', '/users', { params: pageParams({ size: 20, ...params }) }),
  getUser: (userId) => request('get', `/users/${encodeURIComponent(userId)}`),
  patchUserRole: (userId, role) => request('patch', `/users/${encodeURIComponent(userId)}/role`, { data: { role } }),
  patchUserStatus: (userId, status) => request('patch', `/users/${encodeURIComponent(userId)}/status`, { data: { status } }),
  createUserModelOverride: (userId, data) => request('post', `/users/${encodeURIComponent(userId)}/overrides/models`, { data }),
  deleteUserModelOverride: (userId, overrideId) => request('delete', `/users/${encodeURIComponent(userId)}/overrides/models/${encodeURIComponent(overrideId)}`),
  createUserQuotaOverride: (userId, data) => request('post', `/users/${encodeURIComponent(userId)}/overrides/quota`, { data }),
  deleteUserQuotaOverride: (userId, overrideId) => request('delete', `/users/${encodeURIComponent(userId)}/overrides/quota/${encodeURIComponent(overrideId)}`),
  getUserEffectiveModels: (userId, params) => request('get', `/users/${encodeURIComponent(userId)}/effective-models`, { params: cleanParams(params) }),
  getUserEffectiveQuota: (userId, params) => request('get', `/users/${encodeURIComponent(userId)}/effective-quota`, { params: cleanParams(params) }),

  getWorkspaces: (params) => request('get', '/workspaces', { params: pageParams({ size: 20, ...params }) }),
  getWorkspace: (id) => request('get', `/workspaces/${encodeURIComponent(id)}`),
  createWorkspace: (data) => request('post', '/workspaces', { data }),
  patchWorkspace: (id, data) => request('patch', `/workspaces/${encodeURIComponent(id)}`, { data }),
  addWorkspaceMember: (id, data) => request('post', `/workspaces/${encodeURIComponent(id)}/members`, { data }),
  removeWorkspaceMember: (id, userId) => request('delete', `/workspaces/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`),

  getPlans: () => request('get', '/plans'),
  createPlan: (data) => request('post', '/plans', { data }),
  getPlanEntitlements: (code) => request('get', `/plans/${encodeURIComponent(code)}/entitlements`),
  createPlanEntitlement: (code, data) => request('post', `/plans/${encodeURIComponent(code)}/entitlements`, { data }),
  deletePlanEntitlement: (code, id) => request('delete', `/plans/${encodeURIComponent(code)}/entitlements/${encodeURIComponent(id)}`),

  getUsageEvents: (params) => request('get', '/usage/events', { params: pageParams({ size: 50, ...params }) }),
  getUsageAggregate: (params) => request('get', '/usage/aggregate', { params: cleanParams(params) }),
  getUsageTopN: (params) => request('get', '/usage/topN', { params: cleanParams(params) }),
  getUsageQuotaStatus: (params) => request('get', '/usage/quota-status', { params: cleanParams(params) }),
  getUserTimeline: (userId, params) => request('get', `/usage/users/${encodeURIComponent(userId)}/timeline`, { params: pageParams({ size: 100, ...params }) }),

  getRagOverview: () => request('get', '/rag/overview'),
  getRagDocuments: (params) => request('get', '/rag/documents', { params: pageParams({ size: 30, ...params }) })
}

export default adminApi
