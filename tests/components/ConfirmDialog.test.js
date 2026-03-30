import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

describe('ConfirmDialog.vue', () => {
  const defaultProps = {
    visible: true,
    title: '删除确认',
    message: '确定要删除吗？',
    confirmText: '删除',
    icon: '⚠️'
  }

  const mountDialog = (props = {}) => mount(ConfirmDialog, {
    props: { ...defaultProps, ...props },
    global: {
      stubs: { Teleport: true }
    }
  })

  it('visible=false 时不渲染内容', () => {
    const wrapper = mountDialog({ visible: false })
    expect(wrapper.find('.confirm-overlay').exists()).toBe(false)
  })

  it('visible=true 时应显示标题和消息', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('.confirm-title').text()).toBe('删除确认')
    expect(wrapper.find('.confirm-message').text()).toBe('确定要删除吗？')
  })

  it('应显示图标', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('.confirm-icon').text()).toBe('⚠️')
  })

  it('点击确认按钮应触发 confirm 事件', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.btn-confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('点击取消按钮应触发 cancel 事件', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.btn-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('点击遮罩层应触发 cancel 事件', async () => {
    const wrapper = mountDialog()
    await wrapper.find('.confirm-overlay').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('danger=true 时确认按钮应有 danger 类', () => {
    const wrapper = mountDialog({ danger: true })
    expect(wrapper.find('.btn-confirm').classes()).toContain('danger')
  })
})
