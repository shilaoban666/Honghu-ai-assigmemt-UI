import { readFileSync, writeFileSync } from 'fs'

const file = 'src/stores/chatStore.js'
let c = readFileSync(file, 'utf8')

// 删除旧的 sendMessage 函数（从第39行到78行）
// 用正则匹配整个函数块
const sendMsgRegex = /\n {2}const sendMessage = async[\s\S]*?\n {2}}\n\n {2}const deleteChat/
if (sendMsgRegex.test(c)) {
  c = c.replace(sendMsgRegex, '\n  const deleteChat')
  console.log('✅ 删除 sendMessage 函数')
} else {
  console.error('❌ 未找到 sendMessage 函数')
}

// 从 return 里删除 sendMessage
const oldReturn = `    addMessage,\n    sendMessage,\n    deleteChat,`
const newReturn = `    addMessage,\n    deleteChat,`
if (c.includes(oldReturn)) {
  c = c.replace(oldReturn, newReturn)
  console.log('✅ 从 return 中删除 sendMessage')
} else if (!c.includes('sendMessage')) {
  console.log('⏭  return 中已无 sendMessage')
} else {
  console.error('❌ 未找到 return 中的 sendMessage')
}

writeFileSync(file, c, 'utf8')
console.log('✅ chatStore.js 写入完成')
console.log('\n当前 chatStore.js:')
console.log(c)
