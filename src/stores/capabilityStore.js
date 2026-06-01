import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  fetchBuiltinCapabilities,
  fetchCapabilityMarketplace,
  fetchInstalledCapabilities,
  fetchSessionCapabilities,
  installCapability,
  setSessionCapabilityEnabled,
  uninstallCapability
} from '@/api/capabilities'

// A small allow-list is easier to reason about than inferring behavior from
// display names. These backend builtin skills are execution/context plumbing,
// not user-installed marketplace capabilities, so the input capsule should not
// advertise them as removable chips.
export const SYSTEM_CAPABILITY_KEYS = new Set([
  'time',
  'math',
  'user_context',
  'session',
  'kb',
  'weather',
  'http_fetch',
  'system_metrics',
  'format'
])

export const isSystemCapability = (capability = {}) => {
  const key = capability.skillKey || capability.id || ''
  return capability.kind === 'builtin' || capability.source === 'BUILTIN' || SYSTEM_CAPABILITY_KEYS.has(key)
}

// Browser storage is still kept as a compatibility cache for older components
// and offline fallback. Every read is guarded because a malformed localStorage
// value should never blank the chat input.
const readJsonStorage = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

// The route and old frontend code used both "skill" and "skills"; the backend
// contract uses the singular value. Normalizing here keeps every view on the
// same four-kind vocabulary: builtin, mcp, skill, cli.
const normalizeKind = (kind = '') => {
  const value = String(kind || '').toLowerCase()
  if (value === 'skills') return 'skill'
  return ['builtin', 'mcp', 'skill', 'cli'].includes(value) ? value : 'skill'
}

// Convert backend DTOs, old localStorage entries, and tiny development fallback
// records into one frontend shape. The store owns this mapping so components do
// not need to know whether data came from the database or offline cache.
const normalizeCapability = (raw = {}) => {
  const kind = normalizeKind(raw.kind || raw.source)
  const skillKey = raw.skillKey || raw.id || ''
  const metadata = raw.metadata || {}
  return {
    ...raw,
    id: raw.id || skillKey,
    skillKey,
    kind,
    source: raw.source || kind.toUpperCase(),
    name: raw.name || raw.displayName || skillKey,
    icon: raw.icon || (kind === 'mcp' ? 'MCP' : kind === 'cli' ? 'CLI' : kind === 'builtin' ? '能' : '技'),
    category: raw.category || 'general',
    description: raw.description || '',
    menuDesc: metadata.teaches || raw.description || raw.category || '',
    toolNames: Array.isArray(raw.toolNames) ? raw.toolNames : (Array.isArray(metadata.toolNames) ? metadata.toolNames : []),
    installed: Boolean(raw.installed),
    enabled: Boolean(raw.enabled),
    mandatory: Boolean(raw.mandatory),
    defaultEnabled: Boolean(raw.defaultEnabled),
    enabledAt: raw.enabledAt || null,
    metadata
  }
}

// enabledSkillMeta is the bridge for older UI pieces that still listen to the
// "skills-updated" event. It intentionally stores presentation-only fields and
// no secrets, endpoint auth data, or large tool manifests.
const capabilityToMeta = (capability) => ({
  id: capability.skillKey,
  name: capability.name,
  icon: capability.icon,
  group: capability.kind === 'cli' ? 'cli' : 'skill',
  menuDesc: capability.menuDesc || capability.description || capability.category,
  source: capability.source || capability.kind.toUpperCase(),
  enabledAt: capability.enabledAt || null
})

export const useCapabilityStore = defineStore('capabilities', () => {
  const marketplaceByKind = ref({})
  const categoriesByKind = ref({})
  const installed = ref([])
  const sessionCapabilities = ref([])
  const sessionId = ref('')
  const loading = ref(false)
  const error = ref('')
  const usingFallback = ref(false)

  const installedCapabilities = computed(() => installed.value)
  const enabledCapabilities = computed(() => sessionCapabilities.value.filter(item => item.enabled || item.mandatory))
  const enabledSkillIds = computed(() => enabledCapabilities.value.map(item => item.skillKey))
  const enabledCliIds = computed(() => enabledCapabilities.value.filter(item => item.kind === 'cli').map(item => item.skillKey))

  const writeLocalCache = (items = sessionCapabilities.value) => {
    const normalized = items.map(normalizeCapability)
    const enabled = normalized.filter(item => item.enabled || item.mandatory)
    const userVisibleEnabled = enabled.filter(item => !isSystemCapability(item))
    localStorage.setItem('enabledSkills', JSON.stringify(enabled.map(item => item.skillKey)))
    localStorage.setItem('enabledSkillCount', String(userVisibleEnabled.length))
    localStorage.setItem('enabledCliTools', JSON.stringify(enabled.filter(item => item.kind === 'cli').map(item => item.skillKey)))

    const oldMeta = readJsonStorage('enabledSkillMeta', {})
    const nextMeta = { ...(oldMeta || {}) }
    normalized.forEach((item) => {
      if (isSystemCapability(item)) return
      nextMeta[item.skillKey] = capabilityToMeta(item)
    })
    Object.keys(nextMeta).forEach((key) => {
      if (!normalized.some(item => item.skillKey === key) && !enabled.some(item => item.skillKey === key)) delete nextMeta[key]
    })
    localStorage.setItem('enabledSkillMeta', JSON.stringify(nextMeta))
    window.dispatchEvent(new Event('skills-updated'))
  }

  const loadFromLocalCache = () => {
    const meta = readJsonStorage('enabledSkillMeta', {})
    const enabledIds = readJsonStorage('enabledSkills', ['time', 'math', 'memory'])
    const localItems = enabledIds.map(id => normalizeCapability({
      id,
      skillKey: id,
      kind: id.startsWith('cli:') || id === 'cli' ? 'cli' : id.startsWith('mcp:') ? 'mcp' : 'skill',
      source: meta[id]?.source,
      name: meta[id]?.name || id,
      icon: meta[id]?.icon,
      category: meta[id]?.menuDesc,
      description: meta[id]?.menuDesc,
      installed: true,
      enabled: true,
      mandatory: id === 'time' || id === 'math'
    }))
    installed.value = localItems
    sessionCapabilities.value = localItems
    usingFallback.value = true
    writeLocalCache(localItems)
    return localItems
  }

  // Marketplace data is read on demand by tab/kind. Each response also carries
  // category counts, so the view can render the sidebar without hardcoded MCP,
  // Skill, or CLI categories.
  const fetchMarketplace = async (kind = 'mcp', params = {}) => {
    const normalizedKind = normalizeKind(kind)
    loading.value = true
    error.value = ''
    try {
      const payload = await fetchCapabilityMarketplace({ kind: normalizedKind, ...params })
      const items = Array.isArray(payload?.items) ? payload.items.map(normalizeCapability) : []
      marketplaceByKind.value = { ...marketplaceByKind.value, [normalizedKind]: items }
      categoriesByKind.value = { ...categoriesByKind.value, [normalizedKind]: Array.isArray(payload?.categories) ? payload.categories : [] }
      usingFallback.value = false
      return { ...payload, items }
    } catch (err) {
      error.value = err?.message || 'capability marketplace load failed'
      usingFallback.value = true
      throw err
    } finally {
      loading.value = false
    }
  }

  // Installed state comes from user_skill_install plus implicit builtin/default
  // skills. If the API is unavailable, the chat input keeps working from the
  // last local cache instead of showing an empty skill area.
  const fetchInstalled = async (params = {}) => {
    loading.value = true
    error.value = ''
    try {
      const items = await fetchInstalledCapabilities(params)
      installed.value = Array.isArray(items) ? items.map(normalizeCapability) : []
      usingFallback.value = false
      return installed.value
    } catch (err) {
      error.value = err?.message || 'installed capabilities load failed'
      return loadFromLocalCache()
    } finally {
      loading.value = false
    }
  }

  // Session state is the source of truth for "what will be injected into the
  // next chat request". The backend resolves defaults, mandatory skills, user
  // installs, and session_skill_setting overrides before returning this list.
  const fetchSession = async (sid) => {
    if (!sid) return fetchInstalled({ sessionId: sid })
    sessionId.value = sid
    loading.value = true
    error.value = ''
    try {
      const items = await fetchSessionCapabilities(sid)
      sessionCapabilities.value = Array.isArray(items) ? items.map(normalizeCapability) : []
      installed.value = sessionCapabilities.value.filter(item => item.installed || item.kind === 'builtin')
      usingFallback.value = false
      writeLocalCache(sessionCapabilities.value)
      return sessionCapabilities.value
    } catch (err) {
      error.value = err?.message || 'session capabilities load failed'
      return loadFromLocalCache()
    } finally {
      loading.value = false
    }
  }

  const fetchBuiltin = async (params = {}) => {
    const items = await fetchBuiltinCapabilities(params)
    const normalized = Array.isArray(items) ? items.map(normalizeCapability) : []
    marketplaceByKind.value = { ...marketplaceByKind.value, builtin: normalized }
    return normalized
  }

  // Install marks the capability as owned by the current user. It does not mean
  // every provider can execute it yet; runtime support is handled by provider
  // implementations such as builtin tools, MCP, Claude Skill prompt injection,
  // and future CLI sandbox executors.
  const install = async (skillKey, payload = {}, params = {}) => {
    const existing = [...installed.value, ...sessionCapabilities.value].find(item => item.skillKey === skillKey)
    if (existing) {
      existing.installed = true
      existing.enabled = true
      writeLocalCache(sessionCapabilities.value.length ? sessionCapabilities.value : installed.value)
    }
    const item = normalizeCapability(await installCapability(skillKey, payload, { sessionId: sessionId.value, ...params }))
    upsert(item)
    writeLocalCache(sessionCapabilities.value.length ? sessionCapabilities.value : installed.value)
    return item
  }

  // Uninstall removes ownership and any session override for that skill. The
  // backend rejects mandatory builtin skills, so system context cannot be
  // accidentally removed through the marketplace UI.
  const uninstall = async (skillKey, params = {}) => {
    await uninstallCapability(skillKey, { sessionId: sessionId.value, ...params })
    installed.value = installed.value.filter(item => item.skillKey !== skillKey)
    sessionCapabilities.value = sessionCapabilities.value.filter(item => item.skillKey !== skillKey)
    writeLocalCache(sessionCapabilities.value.length ? sessionCapabilities.value : installed.value)
  }

  // Toggle affects only one chat session. This is why the input area can turn a
  // capability on for the current conversation without changing global install
  // state or other open sessions.
  const toggleSessionSkill = async (sid, skillKey, enabled) => {
    if (!sid) {
      const target = sessionCapabilities.value.find(item => item.skillKey === skillKey) || installed.value.find(item => item.skillKey === skillKey)
      if (target?.mandatory && !enabled) return target
      const item = target || normalizeCapability({ id: skillKey, skillKey, enabled })
      item.enabled = enabled
      item.installed = true
      upsert(item)
      writeLocalCache(sessionCapabilities.value.length ? sessionCapabilities.value : installed.value)
      return item
    }
    sessionId.value = sid
    const item = normalizeCapability(await setSessionCapabilityEnabled(sid, skillKey, enabled))
    upsert(item)
    writeLocalCache(sessionCapabilities.value.length ? sessionCapabilities.value : installed.value)
    return item
  }

  const upsert = (capability) => {
    const merge = (list) => {
      const index = list.findIndex(item => item.skillKey === capability.skillKey)
      if (index >= 0) {
        list.splice(index, 1, { ...list[index], ...capability })
      } else {
        list.push(capability)
      }
    }
    merge(installed.value)
    merge(sessionCapabilities.value)
  }

  return {
    marketplaceByKind,
    categoriesByKind,
    installed,
    sessionCapabilities,
    sessionId,
    loading,
    error,
    usingFallback,
    installedCapabilities,
    enabledCapabilities,
    enabledSkillIds,
    enabledCliIds,
    fetchMarketplace,
    fetchInstalled,
    fetchSession,
    fetchBuiltin,
    install,
    uninstall,
    toggleSessionSkill,
    loadFromLocalCache,
    writeLocalCache
  }
})
