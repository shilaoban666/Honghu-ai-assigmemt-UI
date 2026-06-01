<template>
  <div ref="chartEl" class="echart-canvas" :style="{ height }"></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { GridComponent, TooltipComponent, LegendComponent, GraphicComponent } from 'echarts/components'
import { PieChart, BarChart, GaugeChart, LineChart, RadarChart } from 'echarts/charts'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

// 集中注册技能管理页用到的图表与组件，按需引入保持打包体积可控。
echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  GraphicComponent,
  PieChart,
  BarChart,
  GaugeChart,
  LineChart,
  RadarChart,
  LabelLayout,
  CanvasRenderer
])

/**
 * 通用 ECharts 容器。
 *
 * 调用方传入一个 `build({ echarts, cssVar, dark })` 函数，在每次渲染时实时读取主题 CSS 变量，
 * 因此明暗主题切换、容器尺寸变化、数据变化都会自动重绘，无需调用方关心生命周期。
 */
const props = defineProps({
  // 构建 ECharts option 的工厂函数；渲染时调用，返回值直接 setOption。
  build: { type: Function, required: true },
  // 触发重绘的数据依赖；深度 watch，数据变化即重渲。
  deps: { type: [Object, Array, Number, String, Boolean], default: () => ({}) },
  height: { type: String, default: '280px' }
})

const chartEl = ref(null)
let chart = null
let themeObserver = null
let resizeObserver = null
let renderFrame = null

const cssVar = (name, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const renderNow = () => {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  const dark = document.documentElement.classList.contains('dark-mode')
  const option = props.build({ echarts, cssVar, dark })
  if (option) chart.setOption(option, true)
}

// requestAnimationFrame 合并同一帧内的多次重绘请求，避免主题/数据连续变化时抖动。
const render = () => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
  renderFrame = requestAnimationFrame(() => {
    renderFrame = null
    renderNow()
  })
}

onMounted(() => {
  nextTick(render)
  // 主题切换（html.dark-mode / data-theme）时重新读取 CSS 变量重绘。
  themeObserver = new MutationObserver(render)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  // 容器尺寸变化时只 resize，不重建 option，保持动画连续。
  resizeObserver = new ResizeObserver(() => chart?.resize())
  if (chartEl.value) resizeObserver.observe(chartEl.value)
  window.addEventListener('resize', handleWindowResize)
})

const handleWindowResize = () => chart?.resize()

watch(() => props.deps, render, { deep: true })

onBeforeUnmount(() => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
  themeObserver?.disconnect()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', handleWindowResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.echart-canvas {
  width: 100%;
  /* 允许在 flex/grid 容器里收缩，避免 ECharts 固定像素宽撑破父级布局。 */
  min-width: 0;
}
</style>
