<template>
  <section class="settings-view">
    <h1 class="settings-title">个人资料</h1>

    <div v-if="chatStore.isLoggedIn" class="profile-hero">
      <div class="avatar">
        <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="用户头像" />
        <span v-else>{{ avatarLetter }}</span>
      </div>
      <div class="profile-main">
        <h2>{{ displayName }}</h2>
        <p>{{ userInfo.email || '未绑定邮箱' }}</p>
        <div class="badges">
          <span>{{ roleLabel }}</span>
          <span>{{ statusLabel }}</span>
          <span>{{ planLabel }}</span>
        </div>
      </div>
      <button class="soft-btn" type="button" @click="triggerFileInput">上传头像</button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="handleAvatarUpload" />
    </div>

    <div v-if="chatStore.isLoggedIn" class="metric-grid">
      <div class="metric-card">
        <span>话题(Session)</span>
        <strong>{{ chatStore.chats.length }}</strong>
        <small>当前用户会话数量</small>
      </div>
      <div class="metric-card">
        <span>月已用 Token</span>
        <strong>{{ formatToken(monthlyQuota.tokenUsed) }}</strong>
        <small>标准 token 口径</small>
      </div>
      <div class="metric-card">
        <span>月剩余 Token</span>
        <strong>{{ monthlyQuota.unlimited ? '不限' : formatToken(monthlyQuota.tokenRemaining) }}</strong>
        <small>{{ monthlyQuota.unlimited ? '不限额度账户' : `${monthlyProgress}% 已使用` }}</small>
      </div>
      <div class="metric-card">
        <span>可用模型</span>
        <strong>{{ availableModelCount }}</strong>
        <small>由角色/套餐/授权决定</small>
      </div>
    </div>

    <div v-if="chatStore.isLoggedIn" class="settings-card">
      <div class="card-head quota-headline">
        <div>
          <h2>Token 额度</h2>
          <p>用量以标准 token 为主，金额用于成本对账。高阶模型会按价格折算消耗更多标准 token。</p>
        </div>
        <button class="soft-btn" type="button" :disabled="chatStore.quotaLoading" @click="refreshQuota">
          {{ chatStore.quotaLoading ? '刷新中' : '刷新额度' }}
        </button>
      </div>
      <div class="quota-stack">
        <QuotaProgress label="月度额度" :quota="monthlyQuota" show-money />
        <QuotaProgress label="今日额度" :quota="dailyQuota" />
      </div>
    </div>

    <div v-if="chatStore.isLoggedIn" class="detail-grid">
      <div class="settings-card">
        <div class="card-head">
          <h2>账户资料</h2>
          <p>用于识别用户归属、状态和联系方式。</p>
        </div>
        <dl class="info-list">
          <div><dt>用户 ID</dt><dd>{{ chatStore.userId || '-' }}</dd></div>
          <div><dt>用户名</dt><dd>{{ userInfo.name || '-' }}</dd></div>
          <div><dt>手机号</dt><dd>{{ userInfo.phone || '未绑定' }}</dd></div>
          <div><dt>邮箱</dt><dd>{{ userInfo.email || '未绑定' }}</dd></div>
        </dl>
      </div>

      <div class="settings-card">
        <div class="card-head">
          <h2>安全设置</h2>
          <p>保留账户信息变更入口，后续可接验证码和审计日志。</p>
        </div>
        <div class="action-list">
          <button type="button" @click="showEditPhone">更换手机号 <span>›</span></button>
          <button type="button" @click="showEditEmail">更换邮箱 <span>›</span></button>
          <button type="button" @click="showEditPassword">修改密码 <span>›</span></button>
        </div>
      </div>
    </div>

    <div v-if="chatStore.isLoggedIn" class="settings-card">
      <div class="card-head">
        <h2>工作空间与权限</h2>
      </div>
      <div class="workspace-strip">
        <div><span>默认工作空间</span><strong>{{ workspaceId || '个人空间' }}</strong></div>
        <div><span>成员身份</span><strong>{{ roleLabel }}</strong></div>
        <div><span>模型授权</span><strong>{{ availableModelCount }} 个模型</strong></div>
      </div>
    </div>

    <div v-if="chatStore.isLoggedIn" class="logout-row">
      <button class="logout-btn" type="button" @click="showLogoutConfirm = true">退出登录</button>
    </div>

    <div v-else class="settings-card">
      <div class="login-empty">
        <h2>登录后查看账户、额度和会话数据</h2>
        <p>个人资料会展示标准 token 额度、session 数、角色权限和安全设置。</p>
        <div>
          <button class="primary-btn" type="button" @click="router.push('/')">返回登录</button>
        </div>
      </div>
    </div>

    <div v-if="editModal" class="modal-overlay-inner" @click="editModal = null">
      <div class="modal-content" @click.stop>
        <h3>{{ editTitle }}</h3>
        <p>{{ editHint }}</p>
        <input v-model="editValue" :type="editModal === 'password' ? 'password' : editModal === 'email' ? 'email' : 'tel'" :placeholder="editPlaceholder" />
        <div class="modal-buttons">
          <button type="button" @click="editModal = null">取消</button>
          <button type="button" class="primary-btn" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :visible="showLogoutConfirm"
      title="确认退出登录"
      message="退出后需要重新登录才能继续查看账户额度和历史会话。"
      confirm-text="退出"
      @confirm="confirmLogout"
      @cancel="showLogoutConfirm = false"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import QuotaProgress from '@/components/settings/QuotaProgress.vue'
import { emptyQuota, formatToken, quotaPercent } from '@/components/settings/settingsUtils'
import { useChat } from '@/stores/chatStore'

const router = useRouter()
const chatStore = useChat()
const fileInput = ref(null)
const editModal = ref(null)
const editValue = ref('')
const showLogoutConfirm = ref(false)

const userInfo = reactive({
  name: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: null
})

watch(() => chatStore.currentUser, (newUser) => {
  if (newUser && (newUser.username || newUser.userId)) {
    userInfo.name = newUser.username || ''
    userInfo.nickname = newUser.nickname || newUser.username || ''
    userInfo.email = newUser.email || ''
    userInfo.phone = newUser.phone || ''
    userInfo.avatar = newUser.avatar || localStorage.getItem('userAvatar') || null
  }
}, { deep: true, immediate: true })

const displayName = computed(() => userInfo.nickname || userInfo.name || chatStore.username || '用户')
const avatarLetter = computed(() => displayName.value.charAt(0).toUpperCase())
const availableModelCount = computed(() => chatStore.availableModels?.length || chatStore.currentUser?.availableModels?.length || 0)
const dailyQuota = computed(() => chatStore.quotaSnapshot?.daily || chatStore.currentUser?.dailyQuota || emptyQuota)
const monthlyQuota = computed(() => chatStore.quotaSnapshot?.monthly || chatStore.currentUser?.monthlyQuota || emptyQuota)
const monthlyProgress = computed(() => quotaPercent(monthlyQuota.value))
const workspaceId = computed(() => monthlyQuota.value?.workspaceId || dailyQuota.value?.workspaceId || '')
const roleLabel = computed(() => chatStore.identityLabel || roleName(chatStore.userRole || chatStore.currentUser?.userRole))
const statusLabel = computed(() => statusName(chatStore.currentUser?.userStatus || chatStore.currentUser?.status || 'ACTIVE'))
const planLabel = computed(() => chatStore.currentUser?.planCode || monthlyQuota.value?.planCode || '个人版')

const editTitle = computed(() => editModal.value === 'phone' ? '更换手机号' : editModal.value === 'password' ? '修改密码' : '更换邮箱')
const editHint = computed(() => editModal.value === 'password' ? '当前保留前端入口，接入验证码后可落库审计。' : '保存后会先更新本地展示，后续可接用户资料更新接口。')
const editPlaceholder = computed(() => editModal.value === 'phone' ? '请输入新的手机号' : editModal.value === 'password' ? '请输入新的密码' : '请输入新的邮箱')

const roleName = (role = 'GUEST') => ({
  GUEST: '游客',
  USER: '普通用户',
  PRO: 'PRO',
  PLUS: 'PLUS',
  PRO_PLUS: 'PRO PLUS',
  VIP: 'VIP',
  ADMIN: '管理员'
}[role] || role)

const statusName = (status) => ({
  ACTIVE: '正常',
  INACTIVE: '停用',
  BANNED: '封禁',
  DISABLED: '禁用'
}[status] || status)

const triggerFileInput = () => fileInput.value?.click()

const handleAvatarUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    userInfo.avatar = e.target.result
    localStorage.setItem('userAvatar', userInfo.avatar)
    chatStore.updateUserInfo({ avatar: userInfo.avatar })
  }
  reader.readAsDataURL(file)
}

const refreshQuota = () => {
  chatStore.loadUserQuota(chatStore.userId).catch(error => {
    console.warn('刷新用户额度失败:', error)
  })
}

const showEditPhone = () => {
  editModal.value = 'phone'
  editValue.value = userInfo.phone
}

const showEditPassword = () => {
  editModal.value = 'password'
  editValue.value = ''
}

const showEditEmail = () => {
  editModal.value = 'email'
  editValue.value = userInfo.email
}

const saveEdit = () => {
  if (!editValue.value) return
  if (editModal.value === 'phone') {
    userInfo.phone = editValue.value
    chatStore.updateUserInfo({ phone: editValue.value })
  } else if (editModal.value === 'email') {
    userInfo.email = editValue.value
    chatStore.updateUserInfo({ email: editValue.value })
  }
  editModal.value = null
}

const confirmLogout = () => {
  chatStore.logout()
  showLogoutConfirm.value = false
  router.push('/')
}
</script>

<style scoped>
.profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px;
  padding: 22px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 20%, transparent);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--hover-bg), var(--bg-primary));
}

.avatar {
  display: grid;
  place-items: center;
  width: 74px;
  height: 74px;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: #fff;
  font-size: 30px;
  font-weight: 800;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.profile-main h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 22px;
}

.profile-main p {
  margin: 6px 0 0;
  color: var(--text-sub);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.badges span {
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
}

.metric-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric-card {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
}

.metric-card span,
.metric-card small,
.workspace-strip span {
  color: var(--text-sub);
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin: 8px 0 6px;
  color: var(--text-primary);
  font-size: 25px;
}

.quota-headline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.quota-stack {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.info-list {
  display: grid;
  gap: 0;
  padding: 8px 18px 18px;
  margin: 0;
}

.info-list div {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-list div:last-child {
  border-bottom: none;
}

.info-list dt {
  color: var(--text-sub);
  font-size: 12px;
}

.info-list dd {
  margin: 0;
  overflow: hidden;
  color: var(--text-primary);
  font-size: 13px;
  text-overflow: ellipsis;
}

.action-list {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.action-list button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.workspace-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.workspace-strip div {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  background: var(--bg-secondary);
}

.workspace-strip strong {
  overflow: hidden;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.soft-btn,
.primary-btn,
.logout-btn {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 9px 14px;
  background: var(--bg-primary);
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 700;
}

.soft-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.primary-btn {
  border-color: transparent;
  background: var(--primary-color);
  color: #fff;
}

.logout-row {
  display: flex;
  justify-content: flex-end;
}

.logout-btn {
  color: #b64232;
  background: #fff6f3;
}

.login-empty {
  padding: 40px;
  text-align: center;
}

.login-empty h2 {
  margin: 0;
  color: var(--text-primary);
}

.login-empty p {
  color: var(--text-sub);
}

.modal-overlay-inner {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.35);
}

.modal-content {
  width: min(360px, 92vw);
  padding: 22px;
  border-radius: 8px;
  background: var(--bg-primary);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.24);
}

.modal-content h3 {
  margin: 0;
  color: var(--text-primary);
}

.modal-content p {
  color: var(--text-sub);
  font-size: 13px;
  line-height: 1.5;
}

.modal-content input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.modal-buttons button {
  border: none;
  border-radius: 8px;
  padding: 9px 14px;
  cursor: pointer;
}

@media (max-width: 760px) {
  .profile-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-grid,
  .detail-grid,
  .workspace-strip {
    grid-template-columns: 1fr;
  }
}
</style>
