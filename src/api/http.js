import axios from 'axios'
import { attachIdentityHeaders } from '@/api/identity'

/**
 * 所有面向普通用户的 API 模块共享的后端基础地址。
 *
 * 构建时通过环境变量 VITE_AUTH_API_URL 覆盖（生产部署务必设置为真实后端地址）；
 * 未设置时回退到本地开发默认值。auth / chat / rag / marketplace 全部复用这里，
 * 避免同一个地址在多个文件里各写一遍、各自漂移。
 */
export const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/v1'

/**
 * 创建一个绑定到 {@link API_BASE_URL} 的面向用户的 axios 客户端。
 *
 * 默认会为每个请求自动注入身份头（X-User-Id / X-Workspace-Id），让聊天、历史、
 * RAG、技能商店等接口共用同一套可信用户上下文。需要自定义鉴权的场景
 * （例如后台 adminClient 用 Bearer Token）应单独创建，不走这里。
 *
 * @param {object}  [options]
 * @param {number}  [options.timeout=30000]       单请求超时（毫秒）
 * @param {boolean} [options.attachIdentity=true] 是否自动附带身份头
 * @returns {import('axios').AxiosInstance}
 */
export function createApiClient({ timeout = 30000, attachIdentity = true } = {}) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout,
    headers: { 'Content-Type': 'application/json' }
  })
  if (attachIdentity) {
    client.interceptors.request.use(config => attachIdentityHeaders(config))
  }
  return client
}
