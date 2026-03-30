// 主题配置
export const themes = {
  green: {
    id: 'green',
    name: '森林绿',
    primaryColor: '#2d8659',
    primaryLight: '#4a9d6f',
    primaryBg: '#f0f9f1',
    borderColor: 'rgba(45, 134, 89, 0.15)',
    hoverBg: 'rgba(45, 134, 89, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #f9fcfb 0%, #f5faf8 100%)',
    headerBg: 'linear-gradient(135deg, #f9fcfb 0%, #f5faf8 100%)',
    chatBg: 'linear-gradient(135deg, #ffffff 0%, #f9fcfb 100%)'
  },
  dark: {
    id: 'dark',
    name: '暗夜黑',
    primaryColor: '#1a1a1a',
    primaryLight: '#333333',
    primaryBg: '#f5f5f5',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    hoverBg: 'rgba(0, 0, 0, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #2a2a2a 0%, #242424 100%)',
    headerBg: 'linear-gradient(135deg, #2a2a2a 0%, #242424 100%)',
    chatBg: 'linear-gradient(135deg, #1f1f1f 0%, #1a1a1a 100%)'
  },
  blue: {
    id: 'blue',
    name: '天空蓝',
    primaryColor: '#0066cc',
    primaryLight: '#0099ff',
    primaryBg: '#e8f4ff',
    borderColor: 'rgba(0, 102, 204, 0.15)',
    hoverBg: 'rgba(0, 102, 204, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #e8f4ff 0%, #f0f8ff 100%)',
    headerBg: 'linear-gradient(135deg, #e8f4ff 0%, #f0f8ff 100%)',
    chatBg: 'linear-gradient(135deg, #f5faff 0%, #e8f4ff 100%)'
  },
  red: {
    id: 'red',
    name: '热情红',
    primaryColor: '#e54d42',
    primaryLight: '#f06860',
    primaryBg: '#fef2f1',
    borderColor: 'rgba(229, 77, 66, 0.15)',
    hoverBg: 'rgba(229, 77, 66, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #fef5f4 0%, #fef2f1 100%)',
    headerBg: 'linear-gradient(135deg, #fef5f4 0%, #fef2f1 100%)',
    chatBg: 'linear-gradient(135deg, #ffffff 0%, #fef5f4 100%)'
  },
  orange: {
    id: 'orange',
    name: '活力橙',
    primaryColor: '#e67e22',
    primaryLight: '#f0983a',
    primaryBg: '#fef5ec',
    borderColor: 'rgba(230, 126, 34, 0.15)',
    hoverBg: 'rgba(230, 126, 34, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #fef8f0 0%, #fef5ec 100%)',
    headerBg: 'linear-gradient(135deg, #fef8f0 0%, #fef5ec 100%)',
    chatBg: 'linear-gradient(135deg, #ffffff 0%, #fef8f0 100%)'
  },
  purple: {
    id: 'purple',
    name: '梦幻紫',
    primaryColor: '#8b5cf6',
    primaryLight: '#a78bfa',
    primaryBg: '#f5f0ff',
    borderColor: 'rgba(139, 92, 246, 0.15)',
    hoverBg: 'rgba(139, 92, 246, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #f8f5ff 0%, #f5f0ff 100%)',
    headerBg: 'linear-gradient(135deg, #f8f5ff 0%, #f5f0ff 100%)',
    chatBg: 'linear-gradient(135deg, #ffffff 0%, #f8f5ff 100%)'
  },
  pink: {
    id: 'pink',
    name: '浪漫粉',
    primaryColor: '#ec4899',
    primaryLight: '#f472b6',
    primaryBg: '#fdf2f8',
    borderColor: 'rgba(236, 72, 153, 0.15)',
    hoverBg: 'rgba(236, 72, 153, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #fef5fa 0%, #fdf2f8 100%)',
    headerBg: 'linear-gradient(135deg, #fef5fa 0%, #fdf2f8 100%)',
    chatBg: 'linear-gradient(135deg, #ffffff 0%, #fef5fa 100%)'
  },
  cyan: {
    id: 'cyan',
    name: '清新青',
    primaryColor: '#06b6d4',
    primaryLight: '#22d3ee',
    primaryBg: '#ecfeff',
    borderColor: 'rgba(6, 182, 212, 0.15)',
    hoverBg: 'rgba(6, 182, 212, 0.08)',
    sidebarBg: 'linear-gradient(135deg, #f0fdff 0%, #ecfeff 100%)',
    headerBg: 'linear-gradient(135deg, #f0fdff 0%, #ecfeff 100%)',
    chatBg: 'linear-gradient(135deg, #ffffff 0%, #f0fdff 100%)'
  }
}

export const applyTheme = (themeId) => {
  const theme = themes[themeId]
  if (!theme) return

  const root = document.documentElement
  
  // 设置 data-theme 属性，让 CSS 变量根据主题改变
  root.setAttribute('data-theme', themeId)
  
  // 设置所有 CSS 变量
  root.style.setProperty('--primary-color', theme.primaryColor)
  root.style.setProperty('--primary-light', theme.primaryLight)
  root.style.setProperty('--primary-bg', theme.primaryBg)
  root.style.setProperty('--border-color', theme.borderColor)
  root.style.setProperty('--hover-bg', theme.hoverBg)
  root.style.setProperty('--theme-dark', theme.primaryColor)
  root.style.setProperty('--theme-light', theme.primaryLight)
  root.style.setProperty('--theme-gradient-from', theme.primaryColor)
  root.style.setProperty('--theme-gradient-to', theme.primaryLight)

  localStorage.setItem('theme', themeId)
}

export const getTheme = () => {
  return localStorage.getItem('theme') || 'green'
}

export const initTheme = () => {
  const savedTheme = getTheme()
  applyTheme(savedTheme)
}
