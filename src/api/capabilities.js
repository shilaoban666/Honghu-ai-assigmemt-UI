import axios from 'axios'
import { attachIdentityHeaders } from '@/api/identity'

const API_BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/v1'

// Dedicated client for the capability subsystem. Keeping it separate from the
// chat/RAG clients makes timeout, identity headers, and future capability-only
// interceptors easy to change without surprising streaming chat requests.
const capabilityClient = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json'
  }
})

capabilityClient.interceptors.request.use(config => attachIdentityHeaders(config))

/**
 * Fetches one page of the unified marketplace.
 *
 * Backend contract:
 * - kind: builtin | mcp | skill | cli. The view normally requests mcp, skill,
 *   and cli separately because each kind has different detail fields.
 * - category: server-side category key. "all" means no category filtering.
 * - q: plain search text; the backend matches key/name/description/category.
 * - sort: popular | rating | recent | tools.
 *
 * The response is a CapabilityPageDto: { items, page, size, total, hasMore,
 * categories }. Each item already includes the current user's installed and
 * session-enabled flags when sessionId is provided.
 */
export const fetchCapabilityMarketplace = async (params = {}) => {
  const response = await capabilityClient.get('/skills/capabilities/marketplace', { params })
  return response.data
}

/**
 * Reads builtin capabilities registered by the Java backend.
 *
 * Builtins are implicitly installed because they live in the server process.
 * They may still be disabled per session unless mandatory=true. The input
 * capsule filters most builtin/system context capabilities out of the visible
 * chip list because they are runtime plumbing, not user-installed add-ons.
 */
export const fetchBuiltinCapabilities = async (params = {}) => {
  const response = await capabilityClient.get('/skills/capabilities/builtin', { params })
  return response.data
}

/**
 * Reads capabilities owned by the current user plus implicit builtin/default
 * capabilities. This is the list used by settings and lightweight dialogs.
 */
export const fetchInstalledCapabilities = async (params = {}) => {
  const response = await capabilityClient.get('/skills/capabilities/installed', { params })
  return response.data
}

/**
 * Installs one marketplace capability for the current user.
 *
 * payload.config is stored in user_skill_install.user_config as JSONB. Do not
 * put secrets in config. payload.secrets exists in the contract for the future
 * encrypted secret table, but the current backend intentionally does not store
 * real keys there yet.
 */
export const installCapability = async (skillKey, payload = {}, params = {}) => {
  // skillKey 通过 query 传递而不是路径段：含斜杠的 MCP key 放路径里会变成 %2F 被服务端拒绝。
  const response = await capabilityClient.post('/skills/capabilities/install', payload, { params: { skillKey, ...params } })
  return response.data
}

/**
 * Removes the current user's install row and any session override for this
 * skill. Mandatory builtin capabilities are rejected by the backend.
 */
export const uninstallCapability = async (skillKey, params = {}) => {
  const response = await capabilityClient.delete('/skills/capabilities/install', { params: { skillKey, ...params } })
  return response.data
}

/**
 * Reads the effective capability list for a single chat session. This includes
 * backend defaults, mandatory capabilities, user installs, and explicit
 * session_skill_setting overrides.
 */
export const fetchSessionCapabilities = async (sessionId) => {
  const response = await capabilityClient.get(`/sessions/${encodeURIComponent(sessionId)}/skills`)
  return response.data
}

/**
 * Enables or disables one capability for one chat session only. This does not
 * uninstall the capability and does not affect other sessions.
 */
export const setSessionCapabilityEnabled = async (sessionId, skillKey, enabled) => {
  const response = await capabilityClient.put(
    `/sessions/${encodeURIComponent(sessionId)}/skills`,
    { enabled },
    { params: { skillKey } }
  )
  return response.data
}
