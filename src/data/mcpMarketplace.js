// 全网 MCP 商店的分类配置。
// key 用于筛选，label 展示给用户，icon 保持短文本是为了避免额外图片资源加载。
export const mcpCategories = [
  { key: 'all', label: '全部', icon: '□', count: 1268 },
  { key: 'no-auth', label: 'No Auth', icon: '▣', count: 4395 },
  { key: 'healthy', label: 'Healthy', icon: '✓', count: 2050 },
  { key: 'tools', label: 'Tools', icon: '⌁', count: 2050 },
  { key: 'security', label: '安全', icon: '盾', count: 249 },
  { key: 'prompts', label: '提示词', icon: '词', count: 1056 },
  { key: 'resources', label: '资源', icon: '库', count: 1090 },
  { key: 'search', label: '搜索', icon: '搜', count: 1129 },
  { key: 'developer', label: '开发工具', icon: '</>', count: 661 },
  { key: 'research', label: '研究与数据', icon: '研', count: 551 },
  { key: 'finance', label: '金融', icon: '¥', count: 554 },
  { key: 'automation', label: '自动化', icon: '⚙', count: 531 },
  { key: 'open-data', label: '开放数据', icon: '数', count: 502 },
  { key: 'government', label: '政务数据', icon: '政', count: 454 },
  { key: 'marketing', label: '营销', icon: 'M', count: 339 },
  { key: 'agent', label: 'Agent', icon: 'A', count: 316 },
  { key: 'blockchain', label: '区块链', icon: '链', count: 315 },
  { key: 'ai-ml', label: 'AI & ML', icon: 'AI', count: 301 },
  { key: 'commerce', label: '电商零售', icon: '店', count: 270 },
  { key: 'oauth', label: 'OAuth 2.0', icon: '钥', count: 254 }
]

// 真实热门 MCP 样例。页面会把这些作为种子，再扩展生成 1000+ 条目录数据。
// 后端接入 Smithery / PulseMCP / 自建爬虫后，可以直接用接口数据替换 generatedMcpServers。
const seedServers = [
  {
    id: 'mcp:adis',
    name: 'adis',
    grade: 'A',
    category: 'government',
    categoryLabel: '政务数据',
    endpoint: 'https://adis.cz-agents.dev/mcp',
    description: 'ADIS Czech VAT-payer reliability via MFCR SOAP，适合查询捷克税务与企业可靠性数据。',
    auth: 'No Auth',
    health: 'healthy',
    tools: 3,
    resources: 2,
    prompts: 1,
    downloads: 126000,
    rating: 4.8,
    tags: ['tax', 'government', 'soap'],
    updated: '今天同步',
    verified: true
  },
  {
    id: 'mcp:acrelens',
    name: 'AcreLens',
    grade: 'A',
    category: 'research',
    categoryLabel: '研究与数据',
    endpoint: 'https://mcp.acrelens.com/mcp',
    description: 'US land due-diligence MCP server，返回太阳能、洪水区、建筑法规等结构化报告。',
    auth: 'API Key',
    health: 'healthy',
    tools: 5,
    resources: 1,
    prompts: 1,
    downloads: 98000,
    rating: 4.9,
    tags: ['land', 'real-estate', 'report'],
    updated: '昨天更新',
    verified: true
  },
  {
    id: 'mcp:actiongate',
    name: 'ActionGate',
    grade: 'A',
    category: 'security',
    categoryLabel: '安全',
    endpoint: 'https://api.actiongate.xyz/mcp',
    description: 'Pre-execution safety layer for autonomous agent wallets via MCP and x402。',
    auth: 'OAuth 2.0',
    health: 'healthy',
    tools: 6,
    resources: 0,
    prompts: 1,
    downloads: 154000,
    rating: 4.8,
    tags: ['wallet', 'x402', 'guard'],
    updated: '今天同步',
    verified: true
  },
  {
    id: 'mcp:academic-research',
    name: 'academic-research-mcp-server',
    grade: 'A',
    category: 'research',
    categoryLabel: '研究与数据',
    endpoint: 'https://nexgendata-mcp-proxy.steve-corbeil.workers.dev',
    description: 'ArXiv preprints + Google Scholar papers，单次查询返回论文、引用数和摘要。',
    auth: 'No Auth',
    health: 'healthy',
    tools: 2,
    resources: 2,
    prompts: 0,
    downloads: 211000,
    rating: 4.7,
    tags: ['arxiv', 'scholar', 'paper'],
    updated: '本周更新',
    verified: true
  },
  {
    id: 'mcp:acled',
    name: 'Acled',
    grade: 'A',
    category: 'open-data',
    categoryLabel: '开放数据',
    endpoint: 'https://gateway.pipeworx.io/acled/mcp',
    description: 'ACLED MCP，查询武装冲突、事件位置与公共开放数据项目。',
    auth: 'API Key',
    health: 'healthy',
    tools: 18,
    resources: 1,
    prompts: 0,
    downloads: 87000,
    rating: 4.6,
    tags: ['conflict', 'open-data', 'events'],
    updated: '3 天前',
    verified: true
  },
  {
    id: 'mcp:4bots',
    name: '4bots',
    grade: 'A',
    category: 'automation',
    categoryLabel: '自动化',
    endpoint: 'https://4bots.net/mcp',
    description: 'Drop-in daily content for AI briefing agents，提供 10 个频道和免费调用额度。',
    auth: 'No Auth',
    health: 'healthy',
    tools: 9,
    resources: 1,
    prompts: 1,
    downloads: 143000,
    rating: 4.8,
    tags: ['briefing', 'content', 'daily'],
    updated: '昨天更新',
    verified: true
  },
  {
    id: 'mcp:1stay',
    name: '1stay',
    grade: 'A',
    category: 'commerce',
    categoryLabel: '电商零售',
    endpoint: 'https://mcp.1stay.com/mcp',
    description: 'Hotel booking MCP server，可搜索、预订并管理全球住宿预订。',
    auth: 'API Key',
    health: 'healthy',
    tools: 7,
    resources: 3,
    prompts: 1,
    downloads: 73000,
    rating: 4.5,
    tags: ['hotel', 'booking', 'travel'],
    updated: '本周更新',
    verified: true
  },
  {
    id: 'mcp:a2ax',
    name: 'a2ax',
    grade: 'B',
    category: 'agent',
    categoryLabel: 'Agent',
    endpoint: 'https://openjuno.example.com/mcp',
    description: 'OpenJuno social network for AI agents，支持发布、关注、搜索和 Agent 互动。',
    auth: 'OAuth 2.0',
    health: 'unhealthy',
    tools: 1,
    resources: 1,
    prompts: 1,
    downloads: 46000,
    rating: 4.1,
    tags: ['agent', 'social', 'network'],
    updated: '待复测',
    verified: false
  },
  {
    id: 'mcp:github',
    name: 'GitHub MCP',
    grade: 'A',
    category: 'developer',
    categoryLabel: '开发工具',
    endpoint: 'https://api.githubcopilot.com/mcp',
    description: 'GitHub 仓库、Issue、Pull Request、代码搜索和文件读取 MCP 工具集。',
    auth: 'OAuth 2.0',
    health: 'healthy',
    tools: 32,
    resources: 4,
    prompts: 2,
    downloads: 1200000,
    rating: 4.9,
    tags: ['github', 'repo', 'issue'],
    updated: '今天同步',
    verified: true
  },
  {
    id: 'mcp:tavily',
    name: 'Tavily Search',
    grade: 'A',
    category: 'search',
    categoryLabel: '搜索',
    endpoint: 'https://api.tavily.com/mcp',
    description: '面向 Agent 的实时网页搜索、网页提取、站点抓取和网页地图 MCP。',
    auth: 'API Key',
    health: 'healthy',
    tools: 4,
    resources: 0,
    prompts: 1,
    downloads: 319000,
    rating: 4.8,
    tags: ['search', 'extract', 'crawl'],
    updated: '昨天更新',
    verified: true
  }
]

const generatedNames = [
  'PromptForge', 'SecureFetch', 'DataHarbor', 'BrowserPilot', 'MemoryBridge',
  'FinanceLens', 'ResearchFlow', 'CloudOps', 'SchemaScout', 'CrawlerHub',
  'VectorDock', 'TicketSmith', 'MailPilot', 'NotionBridge', 'SheetRunner',
  'DocuMind', 'MetricWatch', 'DeployMate', 'OAuthVault', 'AgentRouter'
]

const virtualCategoryKeys = new Set(['all', 'no-auth', 'healthy', 'tools'])
const categoryKeys = mcpCategories.filter(item => !virtualCategoryKeys.has(item.key)).map(item => item.key)

const categoryLabelByKey = Object.fromEntries(mcpCategories.map(item => [item.key, item.label]))

// 生成 1000+ 条本地目录数据，用于模拟“定时爬取全网热门 MCP 后分页返回”的真实体验。
// 这样页面可以验证懒加载、搜索、分类筛选和安装状态，不会因为样例太少掩盖性能问题。
const generated = Array.from({ length: 1120 }, (_, index) => {
  const category = categoryKeys[index % categoryKeys.length]
  const name = `${generatedNames[index % generatedNames.length]} ${index + 1}`
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const healthy = index % 9 !== 0
  const noAuth = index % 4 === 0
  return {
    id: `mcp:market-${index + 1}`,
    name,
    grade: index % 7 === 0 ? 'B' : 'A',
    category,
    categoryLabel: categoryLabelByKey[category] || '工具',
    endpoint: `https://${safeName}.mcp.tools/mcp`,
    description: `${categoryLabelByKey[category] || '工具'} MCP Server，提供可被 Agent 直接调用的工具、资源和提示词模板，已通过目录健康检查。`,
    auth: noAuth ? 'No Auth' : (index % 5 === 0 ? 'OAuth 2.0' : 'API Key'),
    health: healthy ? 'healthy' : 'unhealthy',
    tools: 1 + (index % 18),
    resources: index % 5,
    prompts: index % 4,
    downloads: 1200 + index * 97,
    rating: Number((4.1 + (index % 9) * 0.1).toFixed(1)),
    tags: [category, healthy ? 'healthy' : 'needs-review', noAuth ? 'no-auth' : 'auth'],
    updated: index % 3 === 0 ? '今天同步' : index % 3 === 1 ? '昨天更新' : '本周更新',
    verified: healthy
  }
})

export const generatedMcpServers = [...seedServers, ...generated]

// localStorage 读写做容错，避免用户浏览器里已有损坏 JSON 导致页面白屏。
export const readInstalledMcpIds = () => {
  try {
    // 如果用户还没打开过轻量技能弹窗，enabledSkills 可能不存在；
    // 此时用输入区默认能力兜底，避免首次从全网商店安装能力时把时间/计算/记忆这些默认技能覆盖掉。
    const parsed = JSON.parse(localStorage.getItem('enabledSkills') || '["time","math","memory"]')
    return new Set(Array.isArray(parsed) ? parsed : ['time', 'math', 'memory'])
  } catch {
    return new Set(['time', 'math', 'memory'])
  }
}

// 根据能力 id 推断它应该落在哪个前端分组里。
// 这个函数让“全网 MCP / 全网 Skills / 全网 CLI”三类商店都能复用同一个本地持久化入口，
// 同时不会把 CLI 能力错误地塞进普通技能级联菜单。
const inferAbilityMeta = (item = {}) => {
  const id = String(item.id || '')
  if (id === 'cli' || id.startsWith('cli:')) {
    return {
      icon: item.icon || 'CLI',
      group: 'cli',
      source: 'CLI',
      menuDesc: item.categoryLabel || item.description || '全网 CLI 能力'
    }
  }
  if (id.startsWith('skill:')) {
    return {
      icon: item.icon || '技',
      group: 'skill',
      source: 'SKILL',
      menuDesc: item.categoryLabel || item.description || '全网 Skills 技能'
    }
  }
  return {
    icon: item.icon || 'MCP',
    group: 'skill',
    source: 'MCP',
    menuDesc: item.categoryLabel || item.description || '全网 MCP 技能'
  }
}

// 保存全网商店能力的轻量展示元数据。
// enabledSkills 只保存 id，输入框下方的胶囊栏还需要 name/icon/menuDesc，
// 所以这里额外维护 enabledSkillMeta，让新安装的 mcp:market-*、skill:*、cli:* 能立刻显示名称。
export const persistInstalledMcpIds = (ids, installedItems = []) => {
  const values = Array.from(ids)
  localStorage.setItem('enabledSkills', JSON.stringify(values))
  localStorage.setItem('enabledSkillCount', String(values.length))

  try {
    const oldMeta = JSON.parse(localStorage.getItem('enabledSkillMeta') || '{}')
    const nextMeta = { ...(oldMeta && typeof oldMeta === 'object' ? oldMeta : {}) }
    installedItems.forEach((item) => {
      if (!item?.id) return
      const inferred = inferAbilityMeta(item)
      nextMeta[item.id] = {
        id: item.id,
        name: item.name || item.id,
        icon: inferred.icon,
        group: inferred.group,
        menuDesc: inferred.menuDesc,
        source: inferred.source
      }
    })
    Object.keys(nextMeta).forEach((id) => {
      if (!values.includes(id)) delete nextMeta[id]
    })
    localStorage.setItem('enabledSkillMeta', JSON.stringify(nextMeta))
  } catch {
    localStorage.setItem('enabledSkillMeta', '{}')
  }

  // CLI 级能力既要出现在 enabledSkills 里，也要进入 enabledCliTools，
  // 这样输入框下方的“命令行”级联菜单和设置页“已安装 CLI”统计才能同步显示。
  const touchedCliIds = installedItems
    .map(item => String(item?.id || ''))
    .filter(id => id === 'cli' || id.startsWith('cli:'))
  if (touchedCliIds.length > 0) {
    try {
      const oldCli = JSON.parse(localStorage.getItem('enabledCliTools') || '[]')
      const nextCli = new Set(Array.isArray(oldCli) ? oldCli : [])
      touchedCliIds.forEach((id) => {
        if (values.includes(id)) nextCli.add(id)
        else nextCli.delete(id)
      })
      localStorage.setItem('enabledCliTools', JSON.stringify(Array.from(nextCli)))
    } catch {
      localStorage.setItem('enabledCliTools', JSON.stringify(touchedCliIds.filter(id => values.includes(id))))
    }
  }

  window.dispatchEvent(new Event('skills-updated'))
}
