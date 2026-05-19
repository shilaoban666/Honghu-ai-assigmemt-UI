<template>
  <div v-if="visible" class="profile-overlay" @click="closeProfile">
    <section class="profile-panel" @click.stop>
      <header class="profile-header">
        <div>
          <p class="eyebrow">Account Center</p>
          <h2>{{ isLoggedIn ? '企业账户中心' : '用户中心' }}</h2>
        </div>
        <button class="icon-btn" type="button" aria-label="关闭" @click="closeProfile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <div class="profile-content">
        <template v-if="isLoggedIn">
          <section class="identity-card">
            <div class="identity-main">
              <div class="avatar">
                <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="用户头像" />
                <span v-else>{{ avatarLetter }}</span>
              </div>
              <div class="identity-text">
                <h3>{{ displayName }}</h3>
                <p>{{ userInfo.email || '未绑定邮箱' }}</p>
                <div class="badge-row">
                  <span class="badge primary">{{ roleLabel }}</span>
                  <span class="badge">{{ statusLabel }}</span>
                  <span class="badge">{{ planLabel }}</span>
                </div>
              </div>
            </div>
            <div class="identity-actions">
              <button class="soft-btn" type="button" :disabled="avatarUploading" @click="triggerFileInput">
                {{ avatarUploading ? '上传中' : '上传头像' }}
              </button>
              <small v-if="avatarError" class="avatar-error">{{ avatarError }}</small>
              <input ref="fileInput" type="file" accept="image/*" @change="handleAvatarUpload" hidden />
            </div>
          </section>

          <section class="metric-grid">
            <div class="metric-card">
              <span>话题(Session)</span>
              <strong>{{ sessionCount }}</strong>
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
          </section>

          <section class="quota-section">
            <div class="section-title">
              <div>
                <h3>Token 额度</h3>
                <p>用量以标准 token 为主，金额用于成本对账。高阶模型会按价格折算消耗更多标准 token。</p>
              </div>
              <button class="ghost-btn" type="button" :disabled="chatStore.quotaLoading" @click="refreshQuota">
                {{ chatStore.quotaLoading ? '刷新中' : '刷新额度' }}
              </button>
            </div>

            <div class="quota-list">
              <div class="quota-item">
                <div class="quota-head">
                  <span>月度额度</span>
                  <strong>{{ formatQuotaPair(monthlyQuota) }}</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill monthly" :style="{ width: monthlyProgress + '%' }"></div>
                </div>
                <div class="quota-foot">
                  <span>已用 {{ formatToken(monthlyQuota.tokenUsed) }}</span>
                  <span>剩余 {{ monthlyQuota.unlimited ? '不限' : formatToken(monthlyQuota.tokenRemaining) }}</span>
                  <span>金额 {{ formatMoney(monthlyQuota.moneyUsed) }} / {{ monthlyQuota.unlimited ? '不限' : formatMoney(monthlyQuota.moneyLimit) }}</span>
                </div>
              </div>

              <div class="quota-item">
                <div class="quota-head">
                  <span>今日额度</span>
                  <strong>{{ formatQuotaPair(dailyQuota) }}</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-fill daily" :style="{ width: dailyProgress + '%' }"></div>
                </div>
                <div class="quota-foot">
                  <span>已用 {{ formatToken(dailyQuota.tokenUsed) }}</span>
                  <span>剩余 {{ dailyQuota.unlimited ? '不限' : formatToken(dailyQuota.tokenRemaining) }}</span>
                  <span>原始 Token {{ formatToken(dailyQuota.rawTokenUsed) }}</span>
                </div>
              </div>
            </div>
          </section>

          <section class="detail-grid">
            <div class="detail-card">
              <div class="section-title compact">
                <h3>账户资料</h3>
                <p>企业后台需要能快速识别用户归属、状态和联系方式。</p>
              </div>
              <dl class="info-list">
                <div><dt>用户 ID</dt><dd>{{ currentUser?.userId || '-' }}</dd></div>
                <div><dt>用户名</dt><dd>{{ userInfo.name || '-' }}</dd></div>
                <div><dt>手机号</dt><dd>{{ userInfo.phone || '未绑定' }}</dd></div>
                <div><dt>邮箱</dt><dd>{{ userInfo.email || '未绑定' }}</dd></div>
              </dl>
            </div>

            <div class="detail-card">
              <div class="section-title compact">
                <h3>安全设置</h3>
                <p>保留账户信息变更入口，后续可接验证码和审计日志。</p>
              </div>
              <div class="action-list">
                <button class="setting-item" type="button" @click="showEditPhone">
                  <span>更换手机号</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button class="setting-item" type="button" @click="showEditEmail">
                  <span>更换邮箱</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button class="setting-item" type="button" @click="showEditPassword">
                  <span>修改密码</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="detail-card wide">
              <div class="section-title compact">
                <h3>工作空间与权限</h3>
                <p>当前主界面按用户默认工作空间查询额度；企业空间切换后可继续复用同一额度组件。</p>
              </div>
              <div class="workspace-strip">
                <div>
                  <span>默认工作空间</span>
                  <strong>{{ workspaceId || '个人空间' }}</strong>
                </div>
                <div>
                  <span>成员身份</span>
                  <strong>{{ roleLabel }}</strong>
                </div>
                <div>
                  <span>模型授权</span>
                  <strong>{{ availableModelCount }} 个模型</strong>
                </div>
              </div>
            </div>
          </section>

          <footer class="profile-footer">
            <button class="logout-btn" type="button" @click="handleLogout">退出登录</button>
          </footer>

          <div v-if="editModal" class="modal-overlay-inner" @click="editModal = null">
            <div class="modal-content" @click.stop>
              <h3>{{ editTitle }}</h3>
              <p>{{ editHint }}</p>
              <input
                v-model="editValue"
                :type="editModal === 'password' ? 'password' : editModal === 'email' ? 'email' : 'tel'"
                :placeholder="editPlaceholder"
                class="edit-input"
              />
              <div class="modal-buttons">
                <button type="button" class="btn-cancel" @click="editModal = null">取消</button>
                <button type="button" class="btn-save" @click="saveEdit">保存</button>
              </div>
            </div>
          </div>

          <ConfirmDialog
            :visible="showLogoutConfirm"
            icon=""
            title="确认退出登录"
            message="退出后需要重新登录才能继续查看账户额度和历史会话。"
            confirm-text="退出"
            @confirm="confirmLogout"
            @cancel="cancelLogout"
          />

          <AvatarCropper
            v-if="selectedAvatarFile"
            :file="selectedAvatarFile"
            @cancel="cancelAvatarCrop"
            @save="uploadCroppedAvatar"
          />
        </template>

        <template v-else>
          <div class="login-section">
            <h3>登录后查看账户、额度和会话数据</h3>
            <p>用户中心会展示标准 token 额度、session 数、角色权限和安全设置。</p>
            <div class="login-actions">
              <button class="primary-btn" type="button" @click="handleLogin">登录账户</button>
              <button class="ghost-btn" type="button" @click="handleRegister">注册账户</button>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { uploadUserAvatar } from '@/api/auth'
import AvatarCropper from '@/components/AvatarCropper.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useChat } from '@/stores/chatStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  currentUser: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'logout', 'login', 'show-forgot-password', 'show-register'])

const chatStore = useChat()
const fileInput = ref(null)
const editModal = ref(null)
const editValue = ref('')
const showLogoutConfirm = ref(false)
const selectedAvatarFile = ref(null)
const avatarUploading = ref(false)
const avatarError = ref('')

const userInfo = reactive({
  name: '',
  nickname: '',
  email: '',
  phone: '',
  avatar: null
})

/**
 * 把后端用户信息同步到弹窗本地状态。
 * 这里只做展示层缓存，真正的用户身份仍然以 Pinia store 和后端接口为准。
 */
watch(() => props.currentUser, (newUser) => {
  if (newUser && (newUser.username || newUser.userId)) {
    userInfo.name = newUser.username || ''
    userInfo.nickname = newUser.nickname || newUser.username || ''
    userInfo.email = newUser.email || ''
    userInfo.phone = newUser.phone || ''
    userInfo.avatar = chatStore.userAvatar || newUser.avatar || newUser.avatarUrl || localStorage.getItem('userAvatar') || null
  }
}, { deep: true, immediate: true })

const emptyQuota = {
  tokenUsed: 0,
  tokenLimit: 0,
  tokenRemaining: 0,
  rawTokenUsed: 0,
  moneyUsed: 0,
  moneyLimit: 0,
  usagePercent: 0,
  unlimited: false
}

const displayName = computed(() => userInfo.nickname || userInfo.name || props.currentUser?.username || '用户')
const avatarLetter = computed(() => displayName.value.charAt(0).toUpperCase())
const sessionCount = computed(() => chatStore.chats.length)
const availableModelCount = computed(() => chatStore.availableModels?.length || props.currentUser?.availableModels?.length || 0)
const dailyQuota = computed(() => chatStore.quotaSnapshot?.daily || props.currentUser?.dailyQuota || emptyQuota)
const monthlyQuota = computed(() => chatStore.quotaSnapshot?.monthly || props.currentUser?.monthlyQuota || emptyQuota)
const dailyProgress = computed(() => quotaPercent(dailyQuota.value))
const monthlyProgress = computed(() => quotaPercent(monthlyQuota.value))
const workspaceId = computed(() => monthlyQuota.value?.workspaceId || dailyQuota.value?.workspaceId || '')
const roleLabel = computed(() => chatStore.identityLabel || roleName(chatStore.userRole || props.currentUser?.userRole))
const statusLabel = computed(() => statusName(props.currentUser?.userStatus || props.currentUser?.status || 'ACTIVE'))
const planLabel = computed(() => props.currentUser?.planCode || monthlyQuota.value?.planCode || '个人版')

const editTitle = computed(() => {
  if (editModal.value === 'phone') return '更换手机号'
  if (editModal.value === 'password') return '修改密码'
  return '更换邮箱'
})
const editHint = computed(() => {
  if (editModal.value === 'password') return '当前仅更新前端展示状态，接入验证码后可落库审计。'
  return '保存后会先更新本地账户中心展示，后续可接用户资料更新接口。'
})
const editPlaceholder = computed(() => {
  if (editModal.value === 'phone') return '请输入新的手机号'
  if (editModal.value === 'password') return '请输入新的密码'
  return '请输入新的邮箱'
})

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const formatToken = (value) => {
  const n = toNumber(value)
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${Math.round(n)}`
}

const formatMoney = (value) => `¥${toNumber(value).toFixed(2)}`

const quotaPercent = (quota) => {
  if (!quota || quota.unlimited) return 0
  const limit = toNumber(quota.tokenLimit)
  if (!limit) return 0
  return Math.min(100, Math.max(0, Math.round((toNumber(quota.tokenUsed) / limit) * 100)))
}

const formatQuotaPair = (quota) => {
  if (!quota || quota.unlimited) return `${formatToken(quota?.tokenUsed)} / 不限`
  return `${formatToken(quota.tokenUsed)} / ${formatToken(quota.tokenLimit)}`
}

const roleName = (role = 'GUEST') => {
  const names = {
    GUEST: '游客',
    USER: '普通用户',
    PRO: 'PRO',
    PLUS: 'PLUS',
    PRO_PLUS: 'PRO PLUS',
    VIP: 'VIP',
    ADMIN: '管理员'
  }
  return names[role] || role
}

const statusName = (status) => {
  const names = {
    ACTIVE: '正常',
    INACTIVE: '停用',
    BANNED: '封禁',
    DISABLED: '禁用'
  }
  return names[status] || status
}

const closeProfile = () => {
  emit('close')
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleAvatarUpload = (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  avatarError.value = ''
  if (!file) {
    return
  }
  if (!file.type?.startsWith('image/')) {
    avatarError.value = '请选择图片文件'
    return
  }
  selectedAvatarFile.value = file
}

const cancelAvatarCrop = () => {
  selectedAvatarFile.value = null
}

const uploadCroppedAvatar = async (file) => {
  if (!chatStore.userId) return
  avatarUploading.value = true
  avatarError.value = ''
  try {
    const result = await uploadUserAvatar(chatStore.userId, file)
    userInfo.avatar = result.avatar
    chatStore.updateUserInfo({
      avatar: result.avatar,
      avatarObjectKey: result.avatarObjectKey
    })
    selectedAvatarFile.value = null
  } catch (error) {
    avatarError.value = error?.message || '头像上传失败'
  } finally {
    avatarUploading.value = false
  }
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

const handleLogout = () => {
  showLogoutConfirm.value = true
}

const confirmLogout = () => {
  emit('logout')
  closeProfile()
  showLogoutConfirm.value = false
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const handleLogin = () => {
  emit('login')
  closeProfile()
}

const handleRegister = () => {
  emit('show-register')
  closeProfile()
}
</script>

<style scoped>
.profile-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(18, 24, 31, 0.46);
  backdrop-filter: blur(10px);
  z-index: 1001;
}

.profile-panel {
  width: min(920px, 96vw);
  max-height: min(88vh, 920px);
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 252, 250, 0.98)),
    var(--bg-primary, #fff);
  border: 1px solid rgba(56, 96, 73, 0.14);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(17, 31, 24, 0.22);
  animation: panelIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes panelIn {
  from { opacity: 0; transform: translateY(18px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(37, 67, 48, 0.1);
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  color: #4c8062;
  text-transform: uppercase;
}

.profile-header h2,
.section-title h3,
.identity-text h3 {
  margin: 0;
  color: #15251b;
}

.profile-header h2 {
  font-size: 22px;
  font-weight: 750;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(32, 61, 44, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  color: #45604f;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.icon-btn:hover,
.soft-btn:hover,
.ghost-btn:hover,
.setting-item:hover {
  transform: translateY(-1px);
  border-color: rgba(43, 129, 84, 0.34);
  background: rgba(235, 247, 240, 0.82);
}

.profile-content {
  max-height: calc(min(88vh, 920px) - 81px);
  overflow-y: auto;
  padding: 24px 26px 26px;
}

.identity-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  border: 1px solid rgba(45, 134, 89, 0.16);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(236, 248, 241, 0.94), rgba(255, 255, 255, 0.88));
}

.identity-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  background: linear-gradient(135deg, #2f8d60, #7abf8c);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 12px 28px rgba(37, 121, 77, 0.22);
  color: #fff;
  font-size: 28px;
  font-weight: 800;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.identity-text {
  min-width: 0;
}

.identity-text h3 {
  font-size: 20px;
  font-weight: 750;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-text p,
.section-title p,
.metric-card small,
.login-section p {
  margin: 6px 0 0;
  color: #6b786f;
  font-size: 13px;
  line-height: 1.5;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.badge {
  padding: 4px 10px;
  border: 1px solid rgba(68, 104, 80, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #42564a;
  font-size: 12px;
  font-weight: 650;
}

.badge.primary {
  border-color: rgba(47, 141, 96, 0.26);
  background: rgba(47, 141, 96, 0.12);
  color: #226f49;
}

.soft-btn,
.ghost-btn,
.primary-btn,
.logout-btn {
  border: 1px solid rgba(45, 134, 89, 0.22);
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.soft-btn,
.ghost-btn {
  background: rgba(255, 255, 255, 0.82);
  color: #286b47;
}

.identity-actions {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.avatar-error {
  max-width: 160px;
  color: #b64232;
  font-size: 12px;
  text-align: right;
}

.soft-btn:disabled,
.ghost-btn:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.metric-card,
.quota-section,
.detail-card {
  border: 1px solid rgba(40, 76, 52, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 32px rgba(39, 74, 51, 0.06);
}

.metric-card {
  padding: 16px;
}

.metric-card span {
  display: block;
  color: #6c7a70;
  font-size: 12px;
  font-weight: 650;
}

.metric-card strong {
  display: block;
  margin-top: 9px;
  color: #172a1e;
  font-size: 24px;
  line-height: 1;
}

.quota-section {
  margin-top: 14px;
  padding: 18px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.section-title.compact {
  display: block;
  margin-bottom: 14px;
}

.section-title h3 {
  font-size: 16px;
  font-weight: 750;
}

.quota-list {
  display: grid;
  gap: 14px;
}

.quota-item {
  padding: 14px;
  border-radius: 12px;
  background: rgba(246, 250, 247, 0.92);
}

.quota-head,
.quota-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.quota-head span {
  color: #33493a;
  font-size: 13px;
  font-weight: 750;
}

.quota-head strong {
  color: #172a1e;
  font-size: 13px;
}

.progress-track {
  height: 10px;
  margin: 12px 0 10px;
  border-radius: 999px;
  overflow: hidden;
  background: #e6eee9;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.35s ease;
}

.progress-fill.monthly {
  background: linear-gradient(90deg, #2f8d60, #6bbf83);
}

.progress-fill.daily {
  background: linear-gradient(90deg, #3875a8, #65b6b1);
}

.quota-foot {
  flex-wrap: wrap;
  color: #69766d;
  font-size: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.detail-card {
  padding: 18px;
}

.detail-card.wide {
  grid-column: 1 / -1;
}

.info-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.info-list div {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.info-list dt {
  color: #7a867d;
  font-size: 12px;
}

.info-list dd {
  margin: 0;
  color: #233629;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-list {
  display: grid;
  gap: 10px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(45, 134, 89, 0.14);
  border-radius: 10px;
  background: rgba(247, 251, 248, 0.9);
  color: #233629;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.workspace-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.workspace-strip div {
  padding: 14px;
  border-radius: 12px;
  background: rgba(246, 250, 247, 0.92);
}

.workspace-strip span {
  display: block;
  margin-bottom: 8px;
  color: #748178;
  font-size: 12px;
}

.workspace-strip strong {
  display: block;
  color: #20382a;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.logout-btn {
  background: #fff6f3;
  border-color: rgba(202, 84, 66, 0.24);
  color: #b64232;
}

.logout-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(190, 72, 50, 0.14);
}

.login-section {
  padding: 56px 24px;
  text-align: center;
}

.login-section h3 {
  margin: 0;
  color: #172a1e;
  font-size: 20px;
}

.login-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

.primary-btn {
  border-color: transparent;
  background: linear-gradient(135deg, #2f8d60, #67b77e);
  color: #fff;
  box-shadow: 0 12px 26px rgba(47, 141, 96, 0.22);
}

.modal-overlay-inner {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(17, 29, 22, 0.38);
  z-index: 1002;
}

.modal-content {
  width: min(360px, 92vw);
  padding: 22px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(17, 31, 24, 0.24);
}

.modal-content h3 {
  margin: 0;
  color: #172a1e;
  font-size: 18px;
}

.modal-content p {
  margin: 8px 0 16px;
  color: #6a776f;
  font-size: 13px;
  line-height: 1.5;
}

.edit-input {
  box-sizing: border-box;
  width: 100%;
  padding: 11px 12px;
  border: 1px solid rgba(32, 61, 44, 0.16);
  border-radius: 10px;
  color: #172a1e;
  font-size: 14px;
}

.edit-input:focus {
  outline: none;
  border-color: rgba(47, 141, 96, 0.55);
  box-shadow: 0 0 0 4px rgba(47, 141, 96, 0.11);
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn-cancel,
.btn-save {
  border: none;
  border-radius: 9px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-cancel {
  background: #eff4f1;
  color: #536359;
}

.btn-save {
  background: #2f8d60;
  color: #fff;
}

@media (max-width: 760px) {
  .profile-overlay {
    padding: 10px;
  }

  .profile-panel {
    width: 100%;
    max-height: 94vh;
    border-radius: 16px;
  }

  .profile-header,
  .profile-content {
    padding-left: 16px;
    padding-right: 16px;
  }

  .identity-card,
  .identity-main,
  .section-title {
    flex-direction: column;
    align-items: stretch;
  }

  .metric-grid,
  .detail-grid,
  .workspace-strip {
    grid-template-columns: 1fr;
  }

  .detail-card.wide {
    grid-column: auto;
  }
}
</style>
