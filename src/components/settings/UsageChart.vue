<template>
  <div ref="chartEl" class="usage-chart"></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([GridComponent, TooltipComponent, LineChart, CanvasRenderer])

const props = defineProps({
  rows: { type: Array, default: () => [] }
})

const chartEl = ref(null)
let chart = null
let observer = null
let renderFrame = null

const cssVar = (name, fallback) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

const renderNow = () => {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)

  const primary = cssVar('--primary-color', '#2d8659')
  const primaryLight = cssVar('--primary-light', '#4a9d6f')
  const textPrimary = cssVar('--text-primary', '#333')
  const textSub = cssVar('--text-sub', '#8ba599')
  const dark = document.documentElement.classList.contains('dark-mode')
  const axisColor = dark ? 'rgba(220, 238, 226, .42)' : 'rgba(45, 62, 52, .28)'
  const gridColor = dark ? 'rgba(116, 185, 148, .14)' : 'rgba(45, 134, 89, .12)'

  chart.setOption({
    animationDuration: 650,
    animationEasing: 'cubicOut',
    grid: { left: 42, right: 22, top: 28, bottom: 34 },
    tooltip: {
      trigger: 'axis',
      appendToBody: true,
      backgroundColor: dark ? 'rgba(13, 20, 17, .94)' : 'rgba(255,255,255,.96)',
      borderColor: primary,
      textStyle: { color: textPrimary },
      extraCssText: 'box-shadow: 0 18px 46px rgba(0,0,0,.22); border-radius: 12px;'
    },
    xAxis: {
      type: 'category',
      data: props.rows.map(row => row.date.slice(5)),
      boundaryGap: false,
      axisLabel: { color: textSub },
      axisLine: { lineStyle: { color: axisColor } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textSub },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        name: '标准 Token',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbolSize: 8,
        emphasis: { focus: 'series', showSymbol: true },
        areaStyle: {
          opacity: 0.24,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: primaryLight },
              { offset: 1, color: 'rgba(0,0,0,0)' }
            ]
          }
        },
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: primary },
              { offset: 1, color: primaryLight }
            ]
          }
        },
        data: props.rows.map(row => row.tokens)
      }
    ]
  }, true)
}

const render = () => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
  renderFrame = requestAnimationFrame(() => {
    renderFrame = null
    renderNow()
  })
}

const resize = () => {
  chart?.resize()
}

onMounted(() => {
  nextTick(render)
  observer = new MutationObserver(render)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })
  window.addEventListener('resize', resize)
})

watch(() => props.rows, render, { deep: true })

onBeforeUnmount(() => {
  if (renderFrame) cancelAnimationFrame(renderFrame)
  observer?.disconnect()
  window.removeEventListener('resize', resize)
  chart?.dispose()
})
</script>

<style scoped>
.usage-chart {
  width: 100%;
  height: 300px;
}
</style>
