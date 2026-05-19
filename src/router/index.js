import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'chat',
    component: () => import('@/layouts/ChatLayout.vue')
  },
  {
    path: '/settings',
    component: () => import('@/views/settings/SettingsLayout.vue'),
    redirect: '/settings/general/profile',
    children: [
      { path: 'general/profile', name: 'settings-profile', component: () => import('@/views/settings/general/ProfileView.vue'), meta: { group: '通用', title: '个人资料' } },
      { path: 'general/stats', name: 'settings-stats', component: () => import('@/views/settings/general/StatsView.vue'), meta: { group: '通用', title: '数据统计' } },
      { path: 'general/appearance', name: 'settings-appearance', component: () => import('@/views/settings/general/AppearanceView.vue'), meta: { group: '通用', title: '外观' } },
      { path: 'general/shortcuts', name: 'settings-shortcuts', component: () => import('@/views/settings/general/ShortcutsView.vue'), meta: { group: '通用', title: '快捷键' } },
      { path: 'general/notification', name: 'settings-notification', component: () => import('@/views/settings/general/NotificationView.vue'), meta: { group: '通用', title: '通知' } },
      { path: 'plan/overview', name: 'settings-plan', component: () => import('@/views/settings/plan/PlanView.vue'), meta: { group: '套餐', title: '套餐' } },
      { path: 'plan/usage', name: 'settings-usage', component: () => import('@/views/settings/plan/UsageView.vue'), meta: { group: '套餐', title: '用量' } },
      { path: 'plan/credits', name: 'settings-credits', component: () => import('@/views/settings/plan/CreditsView.vue'), meta: { group: '套餐', title: '积分' } },
      { path: 'plan/billing', name: 'settings-billing', component: () => import('@/views/settings/plan/BillingView.vue'), meta: { group: '套餐', title: '账单' } },
      { path: 'plan/referral', name: 'settings-referral', component: () => import('@/views/settings/plan/ReferralView.vue'), meta: { group: '套餐', title: '推荐奖励' } },
      { path: 'agent/models', name: 'settings-agent-models', component: () => import('@/views/settings/agent/ServiceModelsView.vue'), meta: { group: '智能体', title: '服务模型' } },
      { path: 'agent/skills', name: 'settings-agent-skills', component: () => import('@/views/settings/agent/SkillsView.vue'), meta: { group: '智能体', title: '技能管理' } },
      { path: 'agent/memory', name: 'settings-agent-memory', component: () => import('@/views/settings/agent/MemoryView.vue'), meta: { group: '智能体', title: '记忆设置' } },
      { path: 'system/storage', name: 'settings-storage', component: () => import('@/views/settings/system/StorageView.vue'), meta: { group: '系统', title: '数据存储' } },
      { path: 'system/advanced', name: 'settings-advanced', component: () => import('@/views/settings/system/AdvancedView.vue'), meta: { group: '系统', title: '高级设置' } },
      { path: 'system/about', name: 'settings-about', component: () => import('@/views/settings/system/AboutView.vue'), meta: { group: '系统', title: '关于' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
