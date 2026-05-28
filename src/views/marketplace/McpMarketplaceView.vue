<template>
  <main class="mcp-market-page">
    <aside class="market-sidebar" :aria-label="`${storeCopy.sidebarMark} 分类`">
      <div class="sidebar-title">
        <span class="title-mark">{{ storeCopy.sidebarMark }}</span>
        <div>
          <strong>{{ storeCopy.sidebarTitle }}</strong>
          <small>已同步 {{ totalCountText }} 个{{ storeCopy.itemName }}</small>
        </div>
      </div>

      <div class="category-list">
        <button
          v-for="category in categoryView"
          :key="category.key"
          class="category-row"
          :class="{ active: activeCategory === category.key }"
          type="button"
          @click="selectCategory(category.key)"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.label }}</span>
          <span class="category-count">{{ formatNumber(category.visibleCount) }}</span>
        </button>
      </div>
    </aside>

    <section class="market-main">
      <header class="market-header">
        <div class="header-copy">
          <span class="eyebrow">{{ storeCopy.eyebrow }}</span>
          <h1>{{ storeCopy.title }}</h1>
          <p>{{ storeCopy.description }}</p>
        </div>
        <button class="back-btn" type="button" @click="goBack">
          <X :size="18" />
          <span>关闭</span>
        </button>
      </header>

      <div class="market-status">
        <span class="source-pill" :class="{ fallback: usingLocalFallback }">
          {{ usingLocalFallback ? '本地兜底目录' : '后端分页目录' }}
        </span>
        <span>{{ activeCategoryLabel }} · {{ formatNumber(displayTotal) }} 个结果</span>
        <span v-if="storeNotice" class="notice-text">{{ storeNotice }}</span>
      </div>

      <div class="search-panel">
        <Search :size="20" />
        <input
          v-model.trim="searchText"
          type="search"
          :placeholder="storeCopy.searchPlaceholder"
          @keydown.esc="searchText = ''"
        />
        <button v-if="searchText" class="clear-btn" type="button" @click="searchText = ''">
          <X :size="15" />
        </button>
      </div>

      <div class="market-toolbar">
        <div class="toolbar-left">
          <span>{{ activeCategoryLabel }}</span>
          <strong>{{ formatNumber(displayTotal) }}</strong>
          <small>个结果</small>
        </div>
        <div class="toolbar-actions">
          <button
            class="filter-chip"
            :class="{ active: onlyHealthy }"
            type="button"
            @click="onlyHealthy = !onlyHealthy"
          >
            <ShieldCheck :size="15" />
            健康
          </button>
          <button
            class="filter-chip"
            :class="{ active: onlyNoAuth }"
            type="button"
            @click="onlyNoAuth = !onlyNoAuth"
          >
            <Unlock :size="15" />
            No Auth
          </button>
          <select v-model="sortBy" class="sort-select" aria-label="排序">
            <option value="popular">热门优先</option>
            <option value="rating">评分优先</option>
            <option value="tools">工具数优先</option>
            <option value="recent">最近同步</option>
          </select>
        </div>
      </div>

      <div ref="scrollPanelRef" class="connector-scroll" @scroll.passive="handleScroll">
        <section v-if="initialLoading" class="connector-grid" :aria-label="`${storeCopy.itemName} 加载中`">
          <article v-for="index in 8" :key="index" class="connector-card skeleton-card">
            <div class="skeleton-line wide"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </article>
        </section>

        <section v-else-if="displayServers.length > 0" class="connector-grid" :aria-label="`${storeCopy.itemName} 列表`">
          <article
            v-for="(connector, index) in displayServers"
            :key="connector.id"
            class="connector-card"
            :class="{ installed: isInstalled(connector.id), unhealthy: connector.health !== 'healthy' }"
            :style="{ '--card-index': index }"
            @click="openDetail(connector)"
          >
            <div class="connector-head">
              <div class="connector-title">
                <strong>{{ connector.name }}</strong>
                <span class="grade-badge">{{ connector.grade }}</span>
                <span v-if="connector.verified" class="verified-badge"><ShieldCheck :size="12" /></span>
              </div>
              <span class="status-dot" :class="connector.health" />
            </div>

            <p class="connector-desc">{{ connector.description }}</p>

            <div class="connector-meta">
              <span class="category-pill">{{ connector.categoryLabel }}</span>
              <span><Wrench :size="13" />{{ connector.tools }}</span>
              <span><Database :size="13" />{{ connector.resources }}</span>
              <span><MessageSquareText :size="13" />{{ connector.prompts }}</span>
              <span><Star :size="13" />{{ connector.rating }}</span>
            </div>

            <div class="endpoint-row">
              <code>{{ connector.endpoint }}</code>
              <button
                class="install-btn"
                :class="{ enabled: isInstalled(connector.id) }"
                :disabled="isPending(connector.id)"
                type="button"
                @click.stop="toggleInstall(connector)"
              >
                <LoaderCircle v-if="isPending(connector.id)" :size="15" class="spin" />
                <Check v-else-if="isInstalled(connector.id)" :size="16" />
                <Plus v-else :size="16" />
                <span>{{ isInstalled(connector.id) ? '已添加' : storeCopy.installShortText }}</span>
              </button>
            </div>
          </article>
        </section>

        <div v-else class="empty-state">
          <Search :size="22" />
          <span>没有找到匹配的{{ storeCopy.itemName }}，换个分类或关键词试试。</span>
        </div>

        <div class="load-sentinel">
          <span v-if="loading && !initialLoading">
            <LoaderCircle :size="15" class="spin" />
            正在加载更多{{ storeCopy.itemName }}...
          </span>
          <button v-else-if="displayHasMore" class="load-more-btn" type="button" @click="loadMore">
            加载更多
          </button>
          <span v-else>已显示当前筛选下的全部结果</span>
        </div>
      </div>
    </section>

    <Transition name="detail-slide">
      <aside v-if="detailConnector" class="detail-drawer" :aria-label="`${storeCopy.itemName} 详情`">
        <header class="detail-drawer-head">
          <div>
            <span class="eyebrow">{{ storeCopy.detailEyebrow }}</span>
            <h2>{{ detailConnector.name }}</h2>
          </div>
          <button class="icon-close" type="button" @click="detailConnector = null">
            <X :size="18" />
          </button>
        </header>

        <div class="detail-body">
          <div class="detail-status">
            <span class="grade-large">{{ detailConnector.grade }}</span>
            <div>
              <strong>{{ detailConnector.categoryLabel }}</strong>
              <small>{{ detailConnector.auth }} · {{ detailConnector.updated }}</small>
            </div>
          </div>
          <p>{{ detailConnector.description }}</p>
          <div class="detail-endpoint">
            <span>Endpoint</span>
            <code>{{ detailConnector.endpoint }}</code>
          </div>
          <div class="detail-stats">
            <div><strong>{{ detailConnector.tools }}</strong><span>Tools</span></div>
            <div><strong>{{ detailConnector.resources }}</strong><span>Resources</span></div>
            <div><strong>{{ detailConnector.prompts }}</strong><span>Prompts</span></div>
            <div><strong>{{ formatNumber(detailConnector.downloads) }}</strong><span>Downloads</span></div>
          </div>
          <div class="tag-list">
            <span v-for="tag in detailConnector.tags" :key="tag">{{ tag }}</span>
          </div>
          <button
            class="drawer-install"
            :class="{ enabled: isInstalled(detailConnector.id) }"
            :disabled="isPending(detailConnector.id)"
            type="button"
            @click="toggleInstall(detailConnector)"
          >
            <LoaderCircle v-if="isPending(detailConnector.id)" :size="16" class="spin" />
            <Check v-else-if="isInstalled(detailConnector.id)" :size="17" />
            <Plus v-else :size="17" />
            {{ isInstalled(detailConnector.id) ? '已加入当前技能' : storeCopy.drawerInstallText }}
          </button>
        </div>
      </aside>
    </Transition>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Check,
  Database,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Unlock,
  Wrench,
  X
} from '@lucide/vue'
import { fetchMcpMarketplace, installMcpSkill } from '@/api/mcpMarketplace'
import {
  generatedMcpServers,
  mcpCategories,
  persistInstalledMcpIds,
  readInstalledMcpIds
} from '@/data/mcpMarketplace'

const router = useRouter()
const route = useRoute()

// 左侧分类 key。all 表示不过滤，security/prompts/resources 等会传给后端做分页筛选。
const activeCategory = ref('all')
// 顶部搜索关键词。watch 中做了防抖，避免用户连续输入时频繁请求后端。
const searchText = ref('')
// 二级筛选：只看健康 MCP。和分类、搜索、排序共同组成后端查询参数。
const onlyHealthy = ref(false)
// 二级筛选：只看无需 API Key/OAuth 的 MCP，方便用户快速挑选低门槛连接器。
const onlyNoAuth = ref(false)
// 排序方式：默认按热度，和“全网热门可用 MCP”的产品语义一致。
const sortBy = ref('popular')
// 远程分页已经加载到前端的列表。滚动加载时只追加下一页，不一次性塞进 1000+ 条。
const remoteServers = ref([])
// 后端返回的分类统计，用于左侧导航；后端不可用时会自动切换成本地统计。
const remoteCategories = ref([])
// 当前筛选条件下的后端总数。
const remoteTotal = ref(generatedMcpServers.length)
// 后端是否还有下一页。
const remoteHasMore = ref(true)
// 当前要请求的页码，从 0 开始。
const remotePage = ref(0)
// 本地兜底模式下已经渲染的数量，用 slice 实现轻量懒加载。
const localVisibleCount = ref(24)
// 请求状态。initialLoading 用它判断是否展示骨架屏。
const loading = ref(false)
// 首屏是否已经完成过一次加载，不管成功还是失败都要置 true，避免一直显示骨架。
const initialLoaded = ref(false)
// 后端不可达时切到本地 1000+ 目录，保证页面和入口在开发环境也不会白屏。
const usingLocalFallback = ref(false)
// 页面级提示，主要用于告诉用户当前是后端数据还是本地兜底，以及安装同步结果。
const storeNotice = ref('')
// 当前详情抽屉中的 MCP；null 表示不显示详情。
const detailConnector = ref(null)
// 已启用/已添加 MCP id，来源和输入框下方的 LobeHub 胶囊栏一致。
const installedIds = ref(readInstalledMcpIds())
// 正在安装的 MCP id 集合，用 Set 可以让按钮级 loading 判断保持 O(1)。
const pendingInstallIds = ref(new Set())
const scrollPanelRef = ref(null)
const searchDebounceTimer = ref(null)

const PAGE_SIZE = 24
const QUICK_FILTER_KEYS = ['all', 'no-auth', 'healthy', 'tools', 'resources', 'prompts']

// 设置页有“全网 MCP / Skills / CLI”三个入口。详细页复用同一套高性能列表和懒加载逻辑，
// 这里用路由 query 的 type 决定文案、id 前缀和安装配置，避免为了三种商店复制三份大组件。
const storeType = computed(() => {
  const rawType = String(route.query.type || 'mcp').toLowerCase()
  return ['mcp', 'skills', 'cli'].includes(rawType) ? rawType : 'mcp'
})

// 不同商店的可见文案集中在一个 computed 中，模板只消费 storeCopy，
// 这样后续接真实 Skills/CLI 后端接口时，不需要在模板里到处改硬编码文本。
const storeCopy = computed(() => {
  if (storeType.value === 'cli') {
    return {
      sidebarMark: 'CLI',
      sidebarTitle: '全网 CLI 商店',
      itemName: 'CLI 能力',
      eyebrow: 'Global CLI Store',
      detailEyebrow: 'CLI Detail',
      title: '全网 CLI 商店',
      description: '按安全、开发、诊断、部署、自动化等分类筛选可控命令行能力，点击 + 号即可加入当前系统技能。',
      searchPlaceholder: '搜索 CLI 名称、命令、分类、能力关键词...',
      installShortText: '添加',
      drawerInstallText: '添加到当前技能'
    }
  }
  if (storeType.value === 'skills') {
    return {
      sidebarMark: 'SK',
      sidebarTitle: '全网 Skills 商店',
      itemName: 'Skills 技能',
      eyebrow: 'Global Skills Store',
      detailEyebrow: 'Skill Detail',
      title: '全网 Skills 商店',
      description: '按通用能力、业务知识、提示词、资源、工作流等分类筛选技能包，点击 + 号即可加入当前系统技能。',
      searchPlaceholder: '搜索 Skills 名称、工具、分类、能力关键词...',
      installShortText: '添加',
      drawerInstallText: '添加到当前技能'
    }
  }
  return {
    sidebarMark: 'MCP',
    sidebarTitle: '全网 MCP 技能商店',
    itemName: '热门 MCP',
    eyebrow: 'Global MCP Store',
    detailEyebrow: 'MCP Detail',
    title: '全网 MCP 技能商店',
    description: '按安全、提示词、资源、搜索、开发工具等分类筛选热门 MCP Server，点击 + 号即可加入当前系统技能。',
    searchPlaceholder: '搜索 MCP 名称、Endpoint、分类、能力关键词...',
    installShortText: '添加',
    drawerInstallText: '添加到当前技能'
  }
})

const initialLoading = computed(() => loading.value && !initialLoaded.value)

const totalCountText = computed(() => {
  const allCategory = categoryView.value.find(category => category.key === 'all')
  return formatNumber(allCategory?.visibleCount || generatedMcpServers.length)
})

const activeCategoryLabel = computed(() => {
  return categoryView.value.find(item => item.key === activeCategory.value)?.label || '全部'
})

const categoryView = computed(() => {
  const source = !usingLocalFallback.value && remoteCategories.value.length > 0
    ? remoteCategories.value
    : localCategoryView.value

  return source.map(category => ({
    ...category,
    visibleCount: Number(category.visibleCount ?? category.count ?? 0)
  }))
})

const localCategoryView = computed(() => {
  const counts = generatedMcpServers.reduce((acc, rawServer) => {
    const server = normalizeServer(rawServer)
    acc.all += 1
    acc[server.category] = (acc[server.category] || 0) + 1
    if (server.auth === 'No Auth') acc['no-auth'] = (acc['no-auth'] || 0) + 1
    if (server.health === 'healthy') acc.healthy = (acc.healthy || 0) + 1
    if (server.tools > 0) acc.tools = (acc.tools || 0) + 1
    if (server.resources > 0) acc.resources = (acc.resources || 0) + 1
    if (server.prompts > 0) acc.prompts = (acc.prompts || 0) + 1
    return acc
  }, { all: 0 })

  return mcpCategories.map(category => ({
    ...category,
    visibleCount: counts[category.key] ?? category.count ?? 0
  }))
})

const localFilteredServers = computed(() => {
  const q = searchText.value.toLowerCase()
  const list = generatedMcpServers
    .map(normalizeServer)
    .filter(server => server.id)
    .filter(server => matchCategory(server, activeCategory.value))
    .filter(server => !onlyHealthy.value || server.health === 'healthy')
    .filter(server => !onlyNoAuth.value || server.auth === 'No Auth')
    .filter(server => matchQuery(server, q))

  return [...list].sort(compareServers)
})

const displayServers = computed(() => {
  if (usingLocalFallback.value) {
    return localFilteredServers.value.slice(0, localVisibleCount.value)
  }
  return remoteServers.value
})

const displayTotal = computed(() => {
  return usingLocalFallback.value ? localFilteredServers.value.length : remoteTotal.value
})

const displayHasMore = computed(() => {
  if (usingLocalFallback.value) return localVisibleCount.value < localFilteredServers.value.length
  return remoteHasMore.value
})

/**
 * 把后端、本地种子、未来爬虫数据统一整理成页面可直接渲染的安全对象。
 *
 * 这里做了两类兼容：
 * 1. 对后端缺字段的 MCP 元数据做空值兜底，避免 Vue 模板读取时报错；
 * 2. 根据当前商店类型改写 id / 名称 / endpoint 文案，让同一份 1000+ 目录可以支撑 MCP、Skills、CLI 三种详细商店预览。
 */
const normalizeServer = (server = {}) => {
  const rawId = String(server.id || '')
  const baseId = rawId.replace(/^(mcp|skill|cli):/, '')
  const baseName = String(server.name || 'Unnamed MCP')
  const categoryLabel = String(server.categoryLabel || '工具')
  const endpoint = String(server.endpoint || 'https://example.com/mcp')
  const prefix = storeType.value === 'cli' ? 'cli' : storeType.value === 'skills' ? 'skill' : 'mcp'

  if (storeType.value === 'cli') {
    return {
      id: `${prefix}:${baseId || 'unknown'}`,
      name: baseName.includes('CLI') ? baseName : `${baseName} CLI`,
      grade: String(server.grade || 'B'),
      category: String(server.category || 'tools'),
      categoryLabel,
      endpoint: endpoint.replace('/mcp', '/cli'),
      description: String(server.description || '这个 CLI 能力暂未提供详细说明。')
        .replaceAll('MCP Server', 'CLI 能力')
        .replaceAll('MCP', 'CLI'),
      auth: String(server.auth || 'API Key'),
      health: String(server.health || 'unhealthy'),
      tools: Number(server.tools || 0),
      resources: Number(server.resources || 0),
      prompts: Number(server.prompts || 0),
      downloads: Number(server.downloads || 0),
      rating: Number(server.rating || 0),
      tags: Array.isArray(server.tags) ? server.tags.filter(Boolean).map(String) : [],
      updated: String(server.updated || '待同步'),
      verified: Boolean(server.verified),
      icon: 'CLI'
    }
  }

  if (storeType.value === 'skills') {
    return {
      id: `${prefix}:${baseId || 'unknown'}`,
      name: baseName.includes('Skill') ? baseName : `${baseName} Skill`,
      grade: String(server.grade || 'B'),
      category: String(server.category || 'tools'),
      categoryLabel,
      endpoint: endpoint.replace('/mcp', '/skills'),
      description: String(server.description || '这个 Skills 技能暂未提供详细说明。')
        .replaceAll('MCP Server', 'Skills 技能包')
        .replaceAll('MCP', 'Skills'),
      auth: String(server.auth || 'API Key'),
      health: String(server.health || 'unhealthy'),
      tools: Number(server.tools || 0),
      resources: Number(server.resources || 0),
      prompts: Number(server.prompts || 0),
      downloads: Number(server.downloads || 0),
      rating: Number(server.rating || 0),
      tags: Array.isArray(server.tags) ? server.tags.filter(Boolean).map(String) : [],
      updated: String(server.updated || '待同步'),
      verified: Boolean(server.verified),
      icon: '技'
    }
  }

  return {
    id: rawId,
    name: baseName,
    grade: String(server.grade || 'B'),
    category: String(server.category || 'tools'),
    categoryLabel,
    endpoint,
    description: String(server.description || '这个 MCP Server 暂未提供详细说明。'),
    auth: String(server.auth || 'API Key'),
    health: String(server.health || 'unhealthy'),
    tools: Number(server.tools || 0),
    resources: Number(server.resources || 0),
    prompts: Number(server.prompts || 0),
    downloads: Number(server.downloads || 0),
    rating: Number(server.rating || 0),
    tags: Array.isArray(server.tags) ? server.tags.filter(Boolean).map(String) : [],
    updated: String(server.updated || '待同步'),
    verified: Boolean(server.verified),
    icon: 'MCP'
  }
}

const matchCategory = (server, category) => {
  if (category === 'all') return true
  if (category === 'no-auth') return server.auth === 'No Auth'
  if (category === 'healthy') return server.health === 'healthy'
  if (category === 'tools') return server.tools > 0
  if (category === 'resources') return server.resources > 0
  if (category === 'prompts') return server.prompts > 0
  if (!QUICK_FILTER_KEYS.includes(category)) return server.category === category
  return true
}

const matchQuery = (server, q) => {
  if (!q) return true
  return [
    server.name,
    server.description,
    server.endpoint,
    server.categoryLabel,
    server.auth,
    ...server.tags
  ].some(value => String(value || '').toLowerCase().includes(q))
}

const compareServers = (a, b) => {
  if (sortBy.value === 'rating') return (b.rating || 0) - (a.rating || 0)
  if (sortBy.value === 'tools') return (b.tools || 0) - (a.tools || 0)
  if (sortBy.value === 'recent') return updatedWeight(a.updated) - updatedWeight(b.updated)
  return (b.downloads || 0) - (a.downloads || 0)
}

const updatedWeight = (updated = '') => {
  if (updated.includes('今天')) return 0
  if (updated.includes('昨天')) return 1
  if (updated.includes('本周')) return 2
  if (updated.includes('3 天')) return 3
  return 8
}

const formatNumber = (value) => {
  const number = Number(value || 0)
  return number.toLocaleString('zh-CN')
}

const selectCategory = (categoryKey) => {
  activeCategory.value = categoryKey || 'all'
}

const isInstalled = (id) => installedIds.value.has(id)

const isPending = (id) => pendingInstallIds.value.has(id)

const setPending = (id, pending) => {
  const next = new Set(pendingInstallIds.value)
  if (pending) next.add(id)
  else next.delete(id)
  pendingInstallIds.value = next
}

const toggleInstall = async (connector) => {
  const item = normalizeServer(connector)
  if (!item.id) return

  const next = new Set(installedIds.value)
  if (next.has(item.id)) {
    next.delete(item.id)
    installedIds.value = next
    persistInstalledMcpIds(next, [item])
    storeNotice.value = `${item.name} 已从当前会话技能中移除。`
    return
  }

  next.add(item.id)
  installedIds.value = next
  persistInstalledMcpIds(next, [item])
  setPending(item.id, true)

  try {
    // 当前后端只实现了 MCP 安装落库；Skills/CLI 详细商店先写入本地会话状态，
    // 等后端补齐对应安装 API 后，可以在这里按 storeType 分发到不同接口。
    if (storeType.value === 'mcp') {
      await installMcpSkill(item.id, {
        endpoint: item.endpoint,
        auth: item.auth,
        source: 'global-mcp-marketplace'
      })
      storeNotice.value = `${item.name} 已安装，并已同步到后端技能体系。`
    } else {
      storeNotice.value = `${item.name} 已加入本地会话；后端 ${storeType.value === 'cli' ? 'CLI' : 'Skills'} 安装接口接通后会同步落库。`
    }
  } catch (error) {
    console.warn('全网商店安装接口暂不可用，已先写入本地会话技能:', error)
    storeNotice.value = `${item.name} 已先加入本地会话；后端连通后会写入 skill/user_skill_install。`
  } finally {
    setPending(item.id, false)
  }
}

const openDetail = (connector) => {
  detailConnector.value = normalizeServer(connector)
}

const loadRemotePage = async (reset = false) => {
  if (loading.value) return

  if (reset) {
    remotePage.value = 0
    remoteServers.value = []
    remoteHasMore.value = true
  }

  // Skills / CLI 商店目前使用前端 1000+ 本地目录预览，避免误调用 MCP 专属后端安装/分页接口。
  // 后续后端补齐 /skills-marketplace 和 /cli-marketplace 后，只需要替换这里的分支即可。
  if (storeType.value !== 'mcp') {
    usingLocalFallback.value = true
    localVisibleCount.value = PAGE_SIZE
    remoteServers.value = []
    remoteHasMore.value = false
    remoteTotal.value = localFilteredServers.value.length
    storeNotice.value = `当前展示本地 1000+ ${storeCopy.value.itemName} 目录兜底数据。`
    initialLoaded.value = true
    return
  }

  loading.value = true
  try {
    const payload = await fetchMcpMarketplace({
      category: activeCategory.value,
      q: searchText.value,
      healthyOnly: onlyHealthy.value,
      noAuthOnly: onlyNoAuth.value,
      sort: sortBy.value,
      page: remotePage.value,
      size: PAGE_SIZE
    })

    const items = Array.isArray(payload?.items)
      ? payload.items.map(normalizeServer).filter(item => item.id)
      : []

    remoteServers.value = reset ? items : [...remoteServers.value, ...items]
    remoteCategories.value = Array.isArray(payload?.categories) ? payload.categories : []
    remoteTotal.value = Number(payload?.total ?? remoteServers.value.length)
    remoteHasMore.value = Boolean(payload?.hasMore)
    remotePage.value = Number(payload?.page ?? remotePage.value) + 1
    usingLocalFallback.value = false
    storeNotice.value = ''
  } catch (error) {
    console.warn('全网 MCP 商店接口不可用，切换到本地兜底目录:', error)
    usingLocalFallback.value = true
    localVisibleCount.value = PAGE_SIZE
    storeNotice.value = '后端商店接口暂未连接，当前展示本地 1000+ MCP 目录兜底数据。'
  } finally {
    loading.value = false
    initialLoaded.value = true
  }
}

const resetAndLoad = async () => {
  detailConnector.value = null
  localVisibleCount.value = PAGE_SIZE
  await nextTick()
  if (scrollPanelRef.value) scrollPanelRef.value.scrollTop = 0

  if (usingLocalFallback.value) {
    initialLoaded.value = true
    return
  }

  await loadRemotePage(true)
}

const loadMore = async () => {
  if (loading.value || !displayHasMore.value) return
  if (usingLocalFallback.value) {
    localVisibleCount.value = Math.min(localVisibleCount.value + PAGE_SIZE, localFilteredServers.value.length)
    return
  }
  await loadRemotePage(false)
}

const handleScroll = () => {
  const el = scrollPanelRef.value
  if (!el || loading.value || !displayHasMore.value) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 420) {
    loadMore()
  }
}

const goBack = () => {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

watch([activeCategory, onlyHealthy, onlyNoAuth, sortBy], resetAndLoad)

watch(storeType, () => {
  activeCategory.value = 'all'
  searchText.value = ''
  onlyHealthy.value = false
  onlyNoAuth.value = false
  sortBy.value = 'popular'
  usingLocalFallback.value = storeType.value !== 'mcp'
  initialLoaded.value = false
  // query 参数在同一个组件实例内变化时，Vue Router 不会重新挂载页面；
  // 这里主动重置并加载，保证从 MCP 切到 Skills/CLI 时标题、列表和安装状态都同步更新。
  resetAndLoad()
})

watch(searchText, () => {
  window.clearTimeout(searchDebounceTimer.value)
  searchDebounceTimer.value = window.setTimeout(resetAndLoad, 220)
})

const syncInstalled = () => {
  installedIds.value = readInstalledMcpIds()
}

onMounted(() => {
  loadRemotePage(true)
  window.addEventListener('skills-updated', syncInstalled)
  window.addEventListener('storage', syncInstalled)
})

onBeforeUnmount(() => {
  window.clearTimeout(searchDebounceTimer.value)
  window.removeEventListener('skills-updated', syncInstalled)
  window.removeEventListener('storage', syncInstalled)
})
</script>

<style scoped>
.mcp-market-page {
  --market-warm: #ff7a1a;
  --market-cyan: #06b6d4;
  --market-rose: #e11d48;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 292px minmax(0, 1fr);
  background:
    linear-gradient(115deg, color-mix(in srgb, var(--primary-color) 11%, var(--bg-secondary)) 0%, var(--bg-tertiary) 46%, color-mix(in srgb, var(--market-warm) 10%, var(--bg-primary)) 100%);
  color: var(--text-primary);
  overflow: hidden;
}

.market-sidebar {
  min-width: 0;
  height: 100%;
  border-right: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--bg-primary) 90%, var(--primary-color) 10%);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 14px;
  border-bottom: 1px solid var(--border-color);
}

.title-mark {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--primary-color), var(--market-warm));
  color: #fff;
  font-size: 12px;
  font-weight: 850;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary-color) 24%, transparent);
}

.sidebar-title strong {
  display: block;
  color: var(--text-title);
  font-size: 15px;
}

.sidebar-title small {
  display: block;
  color: var(--text-sub);
  margin-top: 2px;
  font-size: 12px;
}

.category-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 2px 4px;
  display: grid;
  gap: 6px;
  align-content: start;
}

.category-row {
  height: 42px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color .16s ease, background .16s ease, transform .16s ease, box-shadow .16s ease;
}

.category-row:hover {
  border-color: color-mix(in srgb, var(--primary-color) 32%, transparent);
  background: color-mix(in srgb, var(--market-warm) 6%, var(--bg-primary));
  transform: translateX(2px);
}

.category-row.active {
  border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
  background: linear-gradient(90deg, color-mix(in srgb, var(--primary-color) 14%, var(--bg-primary)), var(--bg-primary));
  color: var(--primary-color);
  font-weight: 780;
  box-shadow: inset 3px 0 0 var(--market-warm);
}

.category-icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--bg-primary));
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 800;
}

.category-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  color: var(--text-sub);
  font-size: 12px;
}

.market-main {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px 34px 0;
  overflow: hidden;
}

.market-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  animation: headerIn .34s cubic-bezier(.16, 1, .3, 1) both;
}

.eyebrow {
  color: var(--primary-color);
  font-size: 11px;
  font-weight: 850;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.header-copy h1 {
  margin: 4px 0 6px;
  color: var(--text-title);
  font-size: 28px;
  font-weight: 860;
  letter-spacing: 0;
}

.header-copy p {
  margin: 0;
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.6;
}

.back-btn,
.icon-close {
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  color: var(--text-sub);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-btn {
  height: 38px;
  gap: 7px;
  padding: 0 12px;
  flex-shrink: 0;
}

.back-btn:hover,
.icon-close:hover {
  color: var(--primary-color);
  background: var(--hover-bg);
}

.market-status {
  min-height: 32px;
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  color: var(--text-sub);
  font-size: 12px;
}

.source-pill {
  height: 24px;
  border-radius: 999px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  color: #fff;
  background: linear-gradient(135deg, var(--primary-color), var(--market-cyan));
  font-weight: 800;
}

.source-pill.fallback {
  background: linear-gradient(135deg, var(--market-warm), var(--market-rose));
}

.notice-text {
  color: var(--market-warm);
  font-weight: 700;
}

.search-panel {
  height: 54px;
  margin: 12px 0 14px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  color: var(--text-sub);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--primary-color) 8%, transparent);
}

.search-panel:focus-within {
  border-color: color-mix(in srgb, var(--primary-color) 52%, transparent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 13%, transparent);
}

.search-panel input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
}

.clear-btn {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: var(--hover-bg);
  color: var(--text-sub);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.market-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
}

.toolbar-left {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--text-sub);
  font-size: 13px;
}

.toolbar-left strong {
  color: var(--primary-color);
  font-size: 18px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-chip,
.sort-select {
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  cursor: pointer;
}

.filter-chip.active {
  background: color-mix(in srgb, var(--primary-color) 13%, var(--bg-primary));
  color: var(--primary-color);
  border-color: color-mix(in srgb, var(--primary-color) 38%, transparent);
}

.sort-select {
  padding: 0 10px;
}

.connector-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 4px 28px 0;
}

.connector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 12px;
}

.connector-card {
  min-height: 184px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  animation: cardIn .34s cubic-bezier(.16, 1, .3, 1) both;
  animation-delay: calc(min(var(--card-index), 12) * .025s);
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}

.connector-card::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--market-warm), var(--market-cyan));
  opacity: .72;
}

.connector-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--primary-color) 42%, transparent);
  box-shadow: 0 16px 36px color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.connector-card.installed {
  border-color: color-mix(in srgb, var(--primary-color) 60%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--primary-color) 8%, var(--bg-primary)), var(--bg-primary));
}

.connector-card.unhealthy {
  opacity: .78;
}

.connector-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.connector-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.connector-title strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-title);
  font-size: 15px;
}

.grade-badge,
.verified-badge {
  height: 20px;
  min-width: 20px;
  padding: 0 6px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--market-warm) 17%, transparent);
  color: color-mix(in srgb, var(--market-warm) 85%, #7a2d00);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.verified-badge {
  background: color-mix(in srgb, var(--primary-color) 16%, transparent);
  color: var(--primary-color);
}

.status-dot {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 999px;
  background: var(--market-rose);
  flex-shrink: 0;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--market-rose) 12%, transparent);
}

.status-dot.healthy {
  background: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, .13);
}

.connector-desc {
  min-height: 44px;
  margin: 0;
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.connector-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-sub);
  font-size: 12px;
  margin-top: auto;
  flex-wrap: wrap;
}

.connector-meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.category-pill {
  height: 22px;
  border-radius: 999px;
  padding: 0 8px;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  font-weight: 750;
}

.endpoint-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  border-top: 1px dashed var(--border-color);
  padding-top: 11px;
}

.endpoint-row code {
  min-width: 0;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 7px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  padding: 0 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.install-btn,
.drawer-install {
  border: 1px solid color-mix(in srgb, var(--market-warm) 32%, var(--border-color));
  border-radius: 8px;
  background: color-mix(in srgb, var(--market-warm) 8%, var(--bg-primary));
  color: color-mix(in srgb, var(--market-warm) 82%, #7a2d00);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  font-weight: 800;
}

.install-btn {
  width: 94px;
}

.install-btn:hover,
.drawer-install:hover {
  border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
  color: var(--primary-color);
  background: var(--hover-bg);
}

.install-btn.enabled,
.drawer-install.enabled {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
  border-color: transparent;
}

.install-btn:disabled,
.drawer-install:disabled {
  cursor: wait;
  opacity: .75;
}

.spin {
  animation: spin .8s linear infinite;
}

.load-sentinel {
  height: 58px;
  display: grid;
  place-items: center;
  color: var(--text-sub);
  font-size: 12px;
}

.load-sentinel span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.load-more-btn {
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-primary);
  color: var(--primary-color);
  padding: 0 14px;
  cursor: pointer;
  font-weight: 800;
}

.empty-state {
  min-height: 260px;
  border: 1px dashed color-mix(in srgb, var(--primary-color) 32%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg-primary) 82%, var(--primary-color) 6%);
  color: var(--text-sub);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.skeleton-card {
  cursor: default;
}

.skeleton-line {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--hover-bg), color-mix(in srgb, var(--market-warm) 12%, var(--hover-bg-medium)), var(--hover-bg));
  background-size: 220% 100%;
  animation: skeletonFlow 1.25s linear infinite;
}

.skeleton-line.wide {
  width: 72%;
}

.skeleton-line.short {
  width: 48%;
}

.detail-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 100vw);
  height: 100%;
  z-index: 120;
  border-left: 1px solid var(--border-color);
  background: var(--bg-primary);
  box-shadow: -18px 0 60px rgba(0, 0, 0, .12);
  display: flex;
  flex-direction: column;
}

.detail-drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px;
  border-bottom: 1px solid var(--border-color);
}

.detail-drawer-head h2 {
  margin: 4px 0 0;
  color: var(--text-title);
  font-size: 22px;
}

.icon-close {
  width: 34px;
  height: 34px;
}

.detail-body {
  flex: 1;
  overflow: auto;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grade-large {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--market-warm) 20%, transparent), color-mix(in srgb, var(--primary-color) 16%, transparent));
  color: var(--primary-color);
  font-weight: 900;
}

.detail-status strong {
  display: block;
  color: var(--text-title);
}

.detail-status small {
  color: var(--text-sub);
}

.detail-body p {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.7;
}

.detail-endpoint {
  display: grid;
  gap: 7px;
}

.detail-endpoint span {
  color: var(--text-sub);
  font-size: 12px;
  font-weight: 800;
}

.detail-endpoint code {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  word-break: break-all;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-stats div {
  border: 1px solid var(--border-color);
  border-radius: 9px;
  background: var(--bg-secondary);
  padding: 12px;
}

.detail-stats strong {
  display: block;
  color: var(--text-title);
  font-size: 20px;
}

.detail-stats span {
  color: var(--text-sub);
  font-size: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list span {
  height: 26px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0 10px;
  background: var(--hover-bg);
  color: var(--text-sub);
  font-size: 12px;
}

.drawer-install {
  height: 42px;
  margin-top: auto;
}

.detail-slide-enter-active,
.detail-slide-leave-active {
  transition: transform .24s ease, opacity .24s ease;
}

.detail-slide-enter-from,
.detail-slide-leave-to {
  transform: translateX(28px);
  opacity: 0;
}

@keyframes headerIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(10px) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes skeletonFlow {
  from { background-position: 220% 0; }
  to { background-position: -220% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

:global(html.dark-mode) .mcp-market-page {
  background: linear-gradient(135deg, #111 0%, #171717 52%, #0d0d0d 100%);
}

:global(html.dark-mode) .market-sidebar,
:global(html.dark-mode) .detail-drawer {
  background: #151515;
}

:global(html.dark-mode) .connector-card,
:global(html.dark-mode) .search-panel,
:global(html.dark-mode) .category-row,
:global(html.dark-mode) .back-btn,
:global(html.dark-mode) .install-btn,
:global(html.dark-mode) .sort-select,
:global(html.dark-mode) .filter-chip {
  background: rgba(255,255,255,.045);
}

:global(html.dark-mode) .endpoint-row code,
:global(html.dark-mode) .detail-endpoint code,
:global(html.dark-mode) .detail-stats div {
  background: rgba(255,255,255,.05);
}

@media (max-width: 980px) {
  .mcp-market-page {
    grid-template-columns: 1fr;
  }

  .market-sidebar {
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .category-list {
    display: flex;
    overflow-x: auto;
    padding: 10px 0 0;
  }

  .category-row {
    min-width: 178px;
  }
}

@media (max-width: 640px) {
  .market-main {
    padding: 18px 16px 0;
  }

  .market-header,
  .market-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions {
    flex-wrap: wrap;
  }

  .endpoint-row {
    grid-template-columns: 1fr;
  }

  .install-btn {
    width: 100%;
    height: 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
</style>
