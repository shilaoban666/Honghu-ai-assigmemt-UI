import { getStoredUserId } from '@/api/identity'
import { createApiClient } from '@/api/http'

// MCP 商店接口复用后端 /api/v1 基础地址，和 auth/chat/rag 模块保持同一套环境变量。
const mcpMarketplaceClient = createApiClient({ timeout: 12000 })

/**
 * 查询全网 MCP 技能商店。
 *
 * @param {Object} params - 分页和筛选参数。
 * @param {string} params.category - 左侧分类 key，all 表示全部。
 * @param {string} params.q - 搜索关键词。
 * @param {boolean} params.healthyOnly - 是否只看健康 MCP。
 * @param {boolean} params.noAuthOnly - 是否只看免鉴权 MCP。
 * @param {string} params.sort - 排序方式：popular/rating/tools/recent。
 * @param {number} params.page - 页码，从 0 开始。
 * @param {number} params.size - 每页数量。
 * @returns {Promise<{items: Array, page: number, size: number, total: number, hasMore: boolean, categories: Array}>}
 */
export const fetchMcpMarketplace = async (params = {}) => {
  const response = await mcpMarketplaceClient.get('/skills/mcp-marketplace', { params })
  return response.data
}

/**
 * 安装全网 MCP 技能。
 *
 * <p>后端会把 MCP 条目写入 skill / user_skill_install；前端仍会同步 localStorage，
 * 这样输入框下方的 LobeHub 胶囊栏可以立即刷新，不需要等下一次会话接口返回。</p>
 *
 * @param {string} mcpId - MCP 技能 id，例如 mcp:tavily。
 * @param {Object} config - 用户配置，例如 API Key；当前可为空对象。
 * @returns {Promise<Object>} 安装后的 MCP 条目。
 */
export const installMcpSkill = async (mcpId, config = {}) => {
  const response = await mcpMarketplaceClient.post('/skills/mcp-marketplace/install', {
    userId: getStoredUserId() || 'guest',
    mcpId,
    config
  })
  return response.data
}
