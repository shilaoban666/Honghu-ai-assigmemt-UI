<template>
  <Teleport to="body">
    <Transition name="screenshot-fade">
      <div v-if="visible" class="screenshot-overlay" @mousedown.self="handleCancel">
        <div class="screenshot-editor" :class="{ 'is-mobile': isMobile }">
          <!-- 顶部工具栏 -->
          <div class="editor-toolbar">
            <div class="toolbar-tools">
              <button
                v-for="tool in tools"
                :key="tool.id"
                class="editor-tool-btn"
                :class="{ active: currentTool === tool.id }"
                @click="currentTool = tool.id"
                :title="tool.label"
              >
                <span v-html="tool.icon"></span>
              </button>
              <!-- 颜色选择 -->
              <div class="color-picker-group">
                <button
                  v-for="c in colors"
                  :key="c"
                  class="color-dot"
                  :class="{ active: currentColor === c }"
                  :style="{ background: c }"
                  @click="currentColor = c"
                />
              </div>
              <!-- 线宽 -->
              <select v-model.number="lineWidth" class="line-width-select">
                <option :value="2">2px</option>
                <option :value="3">3px</option>
                <option :value="5">5px</option>
                <option :value="8">8px</option>
              </select>
            </div>
            <div class="toolbar-actions">
              <button class="editor-action-btn undo" @click="undo" :disabled="history.length === 0">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5"/></svg>
              </button>
              <button class="editor-action-btn cancel" @click="handleCancel">取消</button>
              <button class="editor-action-btn confirm" @click="handleConfirm">确认</button>
            </div>
          </div>

          <!-- 画布区域 -->
          <div class="canvas-wrapper" ref="canvasWrapper">
            <canvas
              ref="bgCanvas"
              class="bg-canvas"
            ></canvas>
            <canvas
              ref="drawCanvas"
              class="draw-canvas"
              @mousedown="startDraw"
              @mousemove="drawing"
              @mouseup="endDraw"
              @mouseleave="endDraw"
              @touchstart.prevent="startDrawTouch"
              @touchmove.prevent="drawingTouch"
              @touchend.prevent="endDraw"
            ></canvas>
          </div>

          <!-- 文本输入浮层 -->
          <div
            v-if="showTextInput"
            class="text-input-overlay"
            :style="{ left: textInputPos.x + 'px', top: textInputPos.y + 'px' }"
          >
            <input
              ref="textInputRef"
              v-model="textContent"
              class="text-input-field"
              :style="{ color: currentColor }"
              @keydown.enter="commitText"
              @keydown.esc="cancelText"
              placeholder="输入文字..."
              autofocus
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, watch, onUnmounted, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  image: { type: [HTMLImageElement, HTMLCanvasElement, null], default: null }
})

const emit = defineEmits(['confirm', 'cancel'])

const isMobile = computed(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

const canvasWrapper = ref(null)
const bgCanvas = ref(null)
const drawCanvas = ref(null)
const textInputRef = ref(null)

// 工具定义
const tools = [
  { id: 'arrow', label: '箭头', icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19L19 5M19 5h-6M19 5v6"/></svg>' },
  { id: 'rect', label: '矩形', icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/></svg>' },
  { id: 'ellipse', label: '圈住', icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="8" stroke-width="2"/></svg>' },
  { id: 'freehand', label: '画笔', icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>' },
  { id: 'text', label: '文字', icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>' },
]

const colors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#FFFFFF', '#000000']
const currentTool = ref('arrow')
const currentColor = ref('#FF3B30')
const lineWidth = ref(3)

// 绘图状态
const isDrawing = ref(false)
const startPos = ref({ x: 0, y: 0 })
const history = ref([]) // ImageData 数组
const showTextInput = ref(false)
const textInputPos = ref({ x: 0, y: 0 })
const textContent = ref('')

// 自由绘制路径
const freehandPoints = ref([])

// 当 visible 和 image 变化时初始化画布
watch(() => [props.visible, props.image], async ([vis, img]) => {
  if (vis && img) {
    await nextTick()
    initCanvas(img)
  }
}, { immediate: true })

function initCanvas(img) {
  if (!bgCanvas.value || !drawCanvas.value || !canvasWrapper.value) return

  const wrapper = canvasWrapper.value
  const maxW = wrapper.clientWidth
  const maxH = wrapper.clientHeight

  let w = img.width || img.naturalWidth
  let h = img.height || img.naturalHeight

  // 适配容器
  const scale = Math.min(maxW / w, maxH / h, 1)
  w = Math.round(w * scale)
  h = Math.round(h * scale)

  bgCanvas.value.width = w
  bgCanvas.value.height = h
  drawCanvas.value.width = w
  drawCanvas.value.height = h

  const bgCtx = bgCanvas.value.getContext('2d')
  bgCtx.drawImage(img, 0, 0, w, h)

  const drawCtx = drawCanvas.value.getContext('2d')
  drawCtx.clearRect(0, 0, w, h)

  history.value = []
}

function getCanvasPos(e) {
  const rect = drawCanvas.value.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function getTouchPos(e) {
  const touch = e.touches[0] || e.changedTouches[0]
  const rect = drawCanvas.value.getBoundingClientRect()
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  }
}

function saveState() {
  const ctx = drawCanvas.value.getContext('2d')
  history.value.push(ctx.getImageData(0, 0, drawCanvas.value.width, drawCanvas.value.height))
}

function undo() {
  if (history.value.length === 0) return
  const ctx = drawCanvas.value.getContext('2d')
  history.value.pop()
  ctx.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height)
  if (history.value.length > 0) {
    ctx.putImageData(history.value[history.value.length - 1], 0, 0)
  }
}

// --- 鼠标事件 ---
function startDraw(e) {
  if (currentTool.value === 'text') {
    const pos = getCanvasPos(e)
    textInputPos.value = {
      x: e.clientX,
      y: e.clientY
    }
    showTextInput.value = true
    textContent.value = ''
    // 记录画布坐标用于绘制
    startPos.value = pos
    nextTick(() => textInputRef.value?.focus())
    return
  }

  isDrawing.value = true
  startPos.value = getCanvasPos(e)
  freehandPoints.value = [startPos.value]
  saveState()
}

function drawing(e) {
  if (!isDrawing.value) return
  const pos = getCanvasPos(e)
  const ctx = drawCanvas.value.getContext('2d')

  // 恢复上一状态
  if (history.value.length > 0) {
    ctx.putImageData(history.value[history.value.length - 1], 0, 0)
  }

  if (currentTool.value === 'freehand') {
    freehandPoints.value.push(pos)
    drawFreehand(ctx)
  } else if (currentTool.value === 'arrow') {
    drawArrow(ctx, startPos.value, pos)
  } else if (currentTool.value === 'rect') {
    drawRect(ctx, startPos.value, pos)
  } else if (currentTool.value === 'ellipse') {
    drawEllipse(ctx, startPos.value, pos)
  }
}

function endDraw() {
  if (!isDrawing.value) return
  isDrawing.value = false

  // 将当前结果保存为新状态（替换之前 saveState 存的）
  const ctx = drawCanvas.value.getContext('2d')
  history.value[history.value.length - 1] = ctx.getImageData(0, 0, drawCanvas.value.width, drawCanvas.value.height)
  freehandPoints.value = []
}

// --- 触摸事件 ---
function startDrawTouch(e) {
  if (currentTool.value === 'text') {
    const pos = getTouchPos(e)
    const touch = e.touches[0]
    textInputPos.value = { x: touch.clientX, y: touch.clientY }
    showTextInput.value = true
    textContent.value = ''
    startPos.value = pos
    nextTick(() => textInputRef.value?.focus())
    return
  }
  isDrawing.value = true
  startPos.value = getTouchPos(e)
  freehandPoints.value = [startPos.value]
  saveState()
}

function drawingTouch(e) {
  if (!isDrawing.value) return
  const pos = getTouchPos(e)
  const ctx = drawCanvas.value.getContext('2d')

  if (history.value.length > 0) {
    ctx.putImageData(history.value[history.value.length - 1], 0, 0)
  }

  if (currentTool.value === 'freehand') {
    freehandPoints.value.push(pos)
    drawFreehand(ctx)
  } else if (currentTool.value === 'arrow') {
    drawArrow(ctx, startPos.value, pos)
  } else if (currentTool.value === 'rect') {
    drawRect(ctx, startPos.value, pos)
  } else if (currentTool.value === 'ellipse') {
    drawEllipse(ctx, startPos.value, pos)
  }
}

// --- 绘制函数 ---
function drawArrow(ctx, from, to) {
  const headLen = 14
  const dx = to.x - from.x
  const dy = to.y - from.y
  const angle = Math.atan2(dy, dx)

  ctx.strokeStyle = currentColor.value
  ctx.lineWidth = lineWidth.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // 线段
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  // 箭头头部
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6))
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6))
  ctx.stroke()
}

function drawRect(ctx, from, to) {
  ctx.strokeStyle = currentColor.value
  ctx.lineWidth = lineWidth.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.rect(from.x, from.y, to.x - from.x, to.y - from.y)
  ctx.stroke()
}

function drawEllipse(ctx, from, to) {
  const cx = (from.x + to.x) / 2
  const cy = (from.y + to.y) / 2
  const rx = Math.abs(to.x - from.x) / 2
  const ry = Math.abs(to.y - from.y) / 2

  ctx.strokeStyle = currentColor.value
  ctx.lineWidth = lineWidth.value
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI)
  ctx.stroke()
}

function drawFreehand(ctx) {
  if (freehandPoints.value.length < 2) return
  ctx.strokeStyle = currentColor.value
  ctx.lineWidth = lineWidth.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(freehandPoints.value[0].x, freehandPoints.value[0].y)
  for (let i = 1; i < freehandPoints.value.length; i++) {
    ctx.lineTo(freehandPoints.value[i].x, freehandPoints.value[i].y)
  }
  ctx.stroke()
}

function commitText() {
  if (!textContent.value.trim()) {
    cancelText()
    return
  }
  saveState()
  const ctx = drawCanvas.value.getContext('2d')
  const fontSize = Math.max(16, lineWidth.value * 6)
  ctx.font = `${fontSize}px sans-serif`
  ctx.fillStyle = currentColor.value
  ctx.fillText(textContent.value, startPos.value.x, startPos.value.y + fontSize)

  // 更新历史
  history.value[history.value.length - 1] = ctx.getImageData(0, 0, drawCanvas.value.width, drawCanvas.value.height)

  showTextInput.value = false
  textContent.value = ''
}

function cancelText() {
  showTextInput.value = false
  textContent.value = ''
}

function handleConfirm() {
  // 合并两个 canvas
  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = bgCanvas.value.width
  resultCanvas.height = bgCanvas.value.height
  const ctx = resultCanvas.getContext('2d')
  ctx.drawImage(bgCanvas.value, 0, 0)
  ctx.drawImage(drawCanvas.value, 0, 0)

  resultCanvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' })
      emit('confirm', file)
    }
  }, 'image/png')
}

function handleCancel() {
  emit('cancel')
}

// ESC 关闭
function onKeydown(e) {
  if (e.key === 'Escape' && props.visible) {
    if (showTextInput.value) {
      cancelText()
    } else {
      handleCancel()
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown)
}
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<style scoped>
.screenshot-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.screenshot-editor {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #fff);
  border-radius: 20px;
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.06);
  overflow: hidden;
  width: 90vw;
  height: 88vh;
  max-width: 1400px;
  max-height: 900px;
}

/* 工具栏 */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-secondary, #f5f5f5);
  border-bottom: 1px solid var(--border-color, #e5e5e5);
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.editor-tool-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--text-sub, #999);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  position: relative;
}
.editor-tool-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  opacity: 0;
  background: var(--primary-color, #2d8659);
  transition: opacity 0.2s;
}
.editor-tool-btn:hover {
  background: var(--hover-bg-medium, rgba(0,0,0,0.08));
  color: var(--primary-color, #2d8659);
  transform: translateY(-1px);
}
.editor-tool-btn.active {
  background: var(--primary-color, #2d8659);
  color: #fff;
  box-shadow: 0 4px 14px rgba(45, 134, 89, 0.35);
  transform: translateY(-1px);
}
.editor-tool-btn.active::after { opacity: 0; }

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--border-color, #e5e5e5);
}

.color-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 0;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
}
.color-dot:hover {
  transform: scale(1.25);
}
.color-dot.active {
  border-color: var(--text-primary, #333);
  transform: scale(1.3);
  box-shadow: 0 0 0 2px var(--bg-primary, #fff), 0 0 0 4px var(--text-primary, #333);
}

.line-width-select {
  margin-left: 12px;
  padding: 6px 10px;
  border: 1px solid var(--border-color, #e5e5e5);
  border-radius: 8px;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #333);
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}
.line-width-select:focus {
  border-color: var(--primary-color, #2d8659);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-action-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
}
.editor-action-btn.undo {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hover-bg, rgba(0,0,0,0.05));
  color: var(--text-primary, #333);
  border-radius: 12px;
}
.editor-action-btn.undo:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.editor-action-btn.undo:hover:not(:disabled) {
  background: var(--hover-bg-medium, rgba(0,0,0,0.1));
  transform: translateY(-1px);
}
.editor-action-btn.cancel {
  background: var(--hover-bg, rgba(0,0,0,0.05));
  color: var(--text-primary, #333);
}
.editor-action-btn.cancel:hover {
  background: var(--hover-bg-medium, rgba(0,0,0,0.1));
  transform: translateY(-1px);
}
.editor-action-btn.confirm {
  background: linear-gradient(135deg, var(--theme-gradient-from, #2d8659), var(--theme-gradient-to, #4a9d6f));
  color: #fff;
  position: relative;
  overflow: hidden;
}
.editor-action-btn.confirm::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}
.editor-action-btn.confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(45, 134, 89, 0.35);
}
.editor-action-btn.confirm:hover::after {
  opacity: 1;
}
.editor-action-btn.confirm:active {
  transform: translateY(0);
}

/* 画布区域 */
.canvas-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  min-height: 400px;
  overflow: auto;
}

.bg-canvas,
.draw-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.bg-canvas {
  z-index: 1;
}
.draw-canvas {
  z-index: 2;
  cursor: crosshair;
}

/* 文本输入 */
.text-input-overlay {
  position: fixed;
  z-index: 10001;
  transform: translate(-50%, -100%);
}
.text-input-field {
  padding: 8px 14px;
  border: 2px solid var(--primary-color, #2d8659);
  border-radius: 10px;
  background: var(--bg-primary, #fff);
  font-size: 16px;
  min-width: 180px;
  outline: none;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  animation: textInputPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes textInputPop {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* 入场动画 */
.screenshot-fade-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.screenshot-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.screenshot-fade-enter-from {
  opacity: 0;
  backdrop-filter: blur(0);
}
.screenshot-fade-enter-from .screenshot-editor {
  transform: scale(0.85) translateY(30px);
  opacity: 0;
}
.screenshot-fade-leave-to {
  opacity: 0;
}
.screenshot-fade-leave-to .screenshot-editor {
  transform: scale(0.92) translateY(10px);
  opacity: 0;
}

/* 手机端 — 全屏 */
.screenshot-editor.is-mobile {
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
}
.screenshot-editor.is-mobile .editor-toolbar {
  padding: 8px 12px;
}
.screenshot-editor.is-mobile .editor-tool-btn {
  width: 36px;
  height: 36px;
}
.screenshot-editor.is-mobile .color-dot {
  width: 20px;
  height: 20px;
}
.screenshot-editor.is-mobile .canvas-wrapper {
  min-height: 200px;
}
</style>
