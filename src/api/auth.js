import axios from 'axios'

// API 基础URL - 根据环境变量设置，默认为 localhost:8080
const API_BASE_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/v1'

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 用户注册
 * @param {Object} data - 注册数据
 * @param {string} data.username - 用户名
 * @param {string} data.password - 密码
 * @param {string} data.phone - 手机号（必填）
 * @param {string} [data.email] - 邮箱（可选）
 * @param {string} [data.nickname] - 昵称（可选）
 * @returns {Promise}
 */
export const registerUser = async (data) => {
  try {
    const response = await authClient.post('/users', {
      username: data.username,
      password: data.password,
      phone: data.phone,
      email: data.email || '',
      nickname: data.nickname || data.username,
      userStatus: 'ACTIVE'
    })
    return response.data
  } catch (error) {
    console.error('注册失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 用户登录 - 账号密码登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<UserResponse>} 包含 identity, identityLabel, permissionSummary, availableModels
 */
export const loginWithPassword = async (username, password) => {
  try {
    const response = await authClient.post('/users/login', {
      username,
      password
    })

    const data = response.data
    console.info('登录失败:', data)
    if (data && data.success === false) {
      throw { status: 400, message: data.errorMessage || '登录失败' }
    }
    return data
  } catch (error) {
    if (error.status && !error.response) throw error          // 已是手动throw的对象，直接往上抛
    const serverData = error.response?.data
    throw {
      status: error.response?.status || 500,
      message: serverData?.errorMessage || serverData?.message || error.message
    }
  }
}

/**
 * 游客登录
 * @returns {Promise<UserResponse>} 游客身份的 UserResponse
 */
export const loginAsGuest = async () => {
  try {
    const response = await authClient.post('/users/login', {
      guestLogin: true
    })
    return response.data
  } catch (error) {
    console.error('游客登录失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 用户登录 - 手机号登录（模拟）
 * @param {string} phone - 手机号
 * @param {string} verificationCode - 验证码
 * @returns {Promise}
 */
export const loginWithPhone = async (phone, verificationCode) => {
  try {
    // 模拟手机号登录 - 实际接口可能需要根据后端实现调整
    const response = await authClient.post('/users/login', {
      phone,
      verificationCode
    })
    return response.data
  } catch (error) {
    console.error('手机号登录失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 用户登录 - 微信登录（模拟）
 * @param {string} code - 微信授权码
 * @returns {Promise}
 */
export const loginWithWeChat = async (code) => {
  try {
    const response = await authClient.post('/users/login/wechat', {
      code
    })
    return response.data
  } catch (error) {
    console.error('微信登录失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 发送验证码
 * @param {string} phone - 手机号
 * @returns {Promise}
 */
export const sendVerificationCode = async (phone) => {
  try {
    const response = await authClient.post('/users/send-code', {
      phone
    })
    return response.data
  } catch (error) {
    console.error('发送验证码失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 获取用户信息
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const getUserInfo = async (userId) => {
  try {
    const response = await authClient.get(`/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('获取用户信息失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 更新用户信息
 * @param {string} userId - 用户ID
 * @param {Object} data - 更新数据
 * @returns {Promise}
 */
export const updateUserInfo = async (userId, data) => {
  try {
    const response = await authClient.put(`/users/${userId}`, data)
    return response.data
  } catch (error) {
    console.error('更新用户信息失败:', error.response?.data || error.message)
    throw {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message
    }
  }
}

/**
 * 检查用户名是否存在
 * @param {string} username - 用户名
 * @returns {Promise}
 */
export const checkUsernameExists = async (username) => {
  try {
    const response = await authClient.get(`/users/check/username/${username}`)
    return response.data
  } catch (error) {
    return { exists: true } // 如果返回错误，认为用户名已存在
  }
}

/**
 * 检查手机号是否存在
 * @param {string} phone - 手机号
 * @returns {Promise}
 */
export const checkPhoneExists = async (phone) => {
  try {
    const response = await authClient.get(`/users/check/phone/${phone}`)
    return response.data
  } catch (error) {
    return { exists: true } // 如果返回错误，认为手机号已存在
  }
}

/**
 * 检查邮箱是否存在
 * @param {string} email - 邮箱
 * @returns {Promise}
 */
export const checkEmailExists = async (email) => {
  try {
    const response = await authClient.get(`/users/check/email/${email}`)
    return response.data
  } catch (error) {
    return { exists: true } // 如果返回错误，认为邮箱已存在
  }
}

export default authClient
