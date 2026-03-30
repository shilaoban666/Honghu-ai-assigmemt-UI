import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('应用错误:', err)
  console.error('错误信息:', info)
  // 错误不会导致应用崩溃
}

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason)
})

app.use(createPinia())
app.mount('#app')

console.log('Vue 应用已挂载')
