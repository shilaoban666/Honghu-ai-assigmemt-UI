import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

async function bootstrap() {
  const RootApp = window.location.pathname.startsWith('/admin')
    ? (await import('./AdminApp.vue')).default
    : App
  const app = createApp(RootApp)

  // 全局错误处理：防止单个组件异常直接中断整个应用。
  app.config.errorHandler = (err, instance, info) => {
    console.error('应用错误:', err)
    console.error('错误信息:', info)
  }

  // 捕获未处理的 Promise 拒绝，方便定位接口和异步流程问题。
  window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的 Promise 拒绝:', event.reason)
  })

  app.use(createPinia())
  app.mount('#app')
}

bootstrap()

console.log('Vue 应用已挂载')
