<template>
  <div class="avatar-cropper-overlay" @click="$emit('cancel')">
    <section class="avatar-cropper" @click.stop>
      <header class="cropper-header">
        <div>
          <h2>调整头像</h2>
          <p>拖动画面定位，滚轮或滑杆缩放，旋转后保存。</p>
        </div>
        <button class="icon-btn" type="button" aria-label="关闭" @click="$emit('cancel')">
          <X :size="18" />
        </button>
      </header>

      <div
        ref="stageRef"
        class="crop-stage"
        @pointerdown="startDrag"
        @pointermove="drag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
        @wheel.prevent="zoomByWheel"
      >
        <canvas ref="canvasRef" width="420" height="420"></canvas>
        <div class="crop-mask"></div>
      </div>

      <div class="crop-controls">
        <label class="control-row">
          <span><ZoomIn :size="16" /> 缩放</span>
          <input v-model.number="scale" type="range" :min="minScale" :max="4" step="0.01" @input="draw" />
        </label>
        <div class="button-row">
          <button type="button" @click="rotateLeft"><RotateCcw :size="17" /> 左转</button>
          <button type="button" @click="rotateRight"><RotateCw :size="17" /> 右转</button>
          <button type="button" @click="resetView"><RefreshCcw :size="17" /> 重置</button>
        </div>
      </div>

      <footer class="cropper-actions">
        <button class="ghost-btn" type="button" @click="$emit('cancel')">取消</button>
        <button class="primary-btn" type="button" :disabled="saving || !imageReady" @click="save">
          {{ saving ? '处理中' : '保存头像' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RefreshCcw, RotateCcw, RotateCw, X, ZoomIn } from '@lucide/vue'

const props = defineProps({
  file: {
    type: File,
    default: null
  }
})

const emit = defineEmits(['cancel', 'save'])

const canvasRef = ref(null)
const stageRef = ref(null)
const image = ref(null)
const imageReady = ref(false)
const scale = ref(1)
const minScale = ref(1)
const rotation = ref(0)
const offset = ref({ x: 0, y: 0 })
const saving = ref(false)
const dragging = ref(false)
const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
let objectUrl = ''

watch(() => props.file, async (file) => {
  cleanupUrl()
  imageReady.value = false
  image.value = null
  if (!file) return

  objectUrl = URL.createObjectURL(file)
  const img = new Image()
  img.onload = async () => {
    image.value = img
    await nextTick()
    resetView()
    imageReady.value = true
    draw()
  }
  img.src = objectUrl
}, { immediate: true })

onBeforeUnmount(cleanupUrl)

function cleanupUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = ''
  }
}

function getCanvasSize() {
  const canvas = canvasRef.value
  return canvas?.width || 420
}

function rotatedSize() {
  const img = image.value
  if (!img) return { width: 1, height: 1 }
  const rightAngle = Math.abs(rotation.value / 90) % 2 === 1
  return {
    width: rightAngle ? img.height : img.width,
    height: rightAngle ? img.width : img.height
  }
}

function resetView() {
  const size = getCanvasSize()
  const bounds = rotatedSize()
  minScale.value = Math.max(size / bounds.width, size / bounds.height)
  scale.value = Math.max(minScale.value, 1)
  offset.value = { x: 0, y: 0 }
  draw()
}

function draw() {
  const canvas = canvasRef.value
  const img = image.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  const size = canvas.width
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.translate(size / 2 + offset.value.x, size / 2 + offset.value.y)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.scale(scale.value, scale.value)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  ctx.restore()
}

function rotateLeft() {
  rotation.value = (rotation.value - 90) % 360
  resetView()
}

function rotateRight() {
  rotation.value = (rotation.value + 90) % 360
  resetView()
}

function zoomByWheel(event) {
  const delta = event.deltaY > 0 ? -0.08 : 0.08
  scale.value = Math.min(4, Math.max(minScale.value, scale.value + delta))
  draw()
}

function startDrag(event) {
  if (!imageReady.value) return
  dragging.value = true
  stageRef.value?.setPointerCapture(event.pointerId)
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    offsetX: offset.value.x,
    offsetY: offset.value.y
  }
}

function drag(event) {
  if (!dragging.value) return
  offset.value = {
    x: dragStart.value.offsetX + event.clientX - dragStart.value.x,
    y: dragStart.value.offsetY + event.clientY - dragStart.value.y
  }
  draw()
}

function endDrag(event) {
  dragging.value = false
  stageRef.value?.releasePointerCapture?.(event.pointerId)
}

async function save() {
  const canvas = canvasRef.value
  if (!canvas) return
  saving.value = true
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.92))
    if (!blob) throw new Error('头像导出失败')
    const file = new File([blob], 'avatar.webp', { type: 'image/webp' })
    emit('save', file)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.avatar-cropper-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(14, 22, 18, 0.48);
  backdrop-filter: blur(8px);
}

.avatar-cropper {
  width: min(520px, 96vw);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  overflow: hidden;
}

.cropper-header,
.cropper-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-color);
}

.cropper-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.cropper-header p {
  margin: 4px 0 0;
  color: var(--text-sub);
  font-size: 12px;
}

.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-sub);
  cursor: pointer;
}

.crop-stage {
  position: relative;
  width: min(420px, calc(100vw - 56px));
  aspect-ratio: 1;
  margin: 20px auto;
  overflow: hidden;
  border-radius: 50%;
  background: repeating-conic-gradient(#eef2ef 0 25%, #f8faf9 0 50%) 50% / 24px 24px;
  cursor: grab;
  touch-action: none;
}

.crop-stage:active {
  cursor: grabbing;
}

.crop-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.crop-mask {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}

.crop-controls {
  display: grid;
  gap: 14px;
  padding: 0 20px 18px;
}

.control-row {
  display: grid;
  gap: 8px;
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}

.control-row span,
.button-row button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.control-row input {
  width: 100%;
}

.button-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.button-row button,
.ghost-btn,
.primary-btn {
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 9px 12px;
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 700;
}

.cropper-actions {
  border-top: 1px solid var(--border-color);
  border-bottom: none;
}

.primary-btn {
  border-color: transparent;
  background: var(--primary-color);
  color: #fff;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 520px) {
  .button-row {
    grid-template-columns: 1fr;
  }
}
</style>
