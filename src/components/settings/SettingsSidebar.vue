<template>
  <aside class="settings-sidebar">
    <SettingsBreadcrumb :group="currentMeta.group" :title="currentMeta.title" />

    <div class="mobile-select">
      <select :value="route.path" @change="router.push($event.target.value)">
        <option v-for="item in flatItems" :key="item.path" :value="item.path">
          {{ item.group }} / {{ item.label }}
        </option>
      </select>
    </div>

    <div class="settings-nav">
      <section v-for="group in groups" :key="group.key" class="nav-group">
        <button class="group-head" type="button" @click="toggle(group.key)">
          <span>{{ group.label }}</span>
          <ChevronRight :class="['chevron', { open: openGroups[group.key] }]" :size="13" />
        </button>
        <Transition name="group-fold">
          <div v-show="openGroups[group.key]" class="group-items">
            <RouterLink
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-item"
            >
              <span class="nav-icon">
                <component :is="item.icon" :size="17" :stroke-width="1.9" />
              </span>
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>
        </Transition>
      </section>
    </div>
  </aside>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Brain,
  ChevronRight,
  Coins,
  Database,
  Gem,
  Gift,
  Info,
  Keyboard,
  Palette,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
  UserRound
} from '@lucide/vue'
import SettingsBreadcrumb from '@/components/settings/SettingsBreadcrumb.vue'
import { st } from '@/components/settings/settingsLocale'

const route = useRoute()
const router = useRouter()

const groups = computed(() => [
  {
    key: 'general',
    label: st('general'),
    items: [
      { path: '/settings/general/profile', label: st('profile'), icon: UserRound },
      { path: '/settings/general/stats', label: st('stats'), icon: BarChart3 },
      { path: '/settings/general/appearance', label: st('appearance'), icon: Palette },
      { path: '/settings/general/shortcuts', label: st('shortcuts'), icon: Keyboard },
      { path: '/settings/general/notification', label: st('notification'), icon: Bell }
    ]
  },
  {
    key: 'plan',
    label: st('planGroup'),
    items: [
      { path: '/settings/plan/overview', label: st('plan'), icon: Gem },
      { path: '/settings/plan/usage', label: st('usage'), icon: Activity },
      { path: '/settings/plan/credits', label: st('credits'), icon: Coins },
      { path: '/settings/plan/billing', label: st('billing'), icon: ReceiptText },
      { path: '/settings/plan/referral', label: st('referral'), icon: Gift }
    ]
  },
  {
    key: 'agent',
    label: st('agent'),
    items: [
      { path: '/settings/agent/models', label: st('models'), icon: Sparkles },
      { path: '/settings/agent/skills', label: st('skills'), icon: Boxes },
      { path: '/settings/agent/memory', label: st('memory'), icon: Brain }
    ]
  },
  {
    key: 'system',
    label: st('system'),
    items: [
      { path: '/settings/system/storage', label: st('storage'), icon: Database },
      { path: '/settings/system/advanced', label: st('advanced'), icon: SlidersHorizontal },
      { path: '/settings/system/about', label: st('about'), icon: Info }
    ]
  }
])

const openGroups = reactive({
  general: true,
  plan: true,
  agent: true,
  system: true
})

const flatItems = computed(() => groups.value.flatMap(group => group.items.map(item => ({ ...item, group: group.label }))))
const currentMeta = computed(() => {
  const item = flatItems.value.find(entry => entry.path === route.path)
  return item ? { group: item.group, title: item.label } : { group: route.meta.group, title: route.meta.title }
})

const toggle = (key) => {
  openGroups[key] = !openGroups[key]
}
</script>

<style scoped>
.settings-sidebar {
  display: flex;
  flex-direction: column;
  width: 290px;
  min-width: 290px;
  height: 100%;
  padding: 0 10px 14px;
  border-right: 1px solid var(--border-color);
  background: color-mix(in srgb, var(--bg-secondary) 82%, #fff);
}

.settings-nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.settings-nav::-webkit-scrollbar {
  width: 5px;
}

.settings-nav::-webkit-scrollbar-track {
  background: transparent;
}

.settings-nav::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.nav-group {
  margin-bottom: 10px;
}

.group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-sub);
  cursor: pointer;
  padding: 7px 4px;
  font-size: 12px;
  font-weight: 700;
}

.chevron {
  transition: transform .18s ease;
}

.chevron.open {
  transform: rotate(90deg);
}

.group-items {
  display: grid;
  gap: 2px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  transition: background .16s ease, color .16s ease, border-color .16s ease;
}

.nav-item:hover {
  background: var(--hover-bg);
}

.nav-item.router-link-active {
  border-color: color-mix(in srgb, var(--primary-color) 24%, transparent);
  background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  color: var(--primary-color);
  font-weight: 750;
}

.nav-item.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  bottom: 9px;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: var(--primary-color);
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--primary-color) 74%, var(--text-sub));
}

.mobile-select {
  display: none;
}

.group-fold-enter-active,
.group-fold-leave-active {
  transition: all .18s ease;
}

.group-fold-enter-from,
.group-fold-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

:global(html.dark-mode) .settings-sidebar {
  background: #151515;
  border-right-color: rgba(255,255,255,.10);
}

:global(html.dark-mode) .nav-item {
  color: rgba(238, 247, 241, .86);
}

:global(html.dark-mode) .nav-item.router-link-active {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
}

@media (max-width: 900px) {
  .settings-sidebar {
    width: 100%;
    min-width: 0;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }

  .settings-nav {
    display: none;
  }

  .mobile-select {
    display: block;
    padding-bottom: 10px;
  }

  .mobile-select select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 10px;
    background: var(--bg-primary);
    color: var(--text-primary);
  }
}
</style>
