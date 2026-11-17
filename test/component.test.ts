import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import CalculatorSelect from '../src/components/sections/CalculatorSelect.vue'

// в jsdom нет scrollIntoView, а список прокручивает к активному пункту
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

const options = [
  { value: 1, label: 'Одно' },
  { value: 2, label: 'Два' },
  { value: 3, label: 'Три' },
]

describe('component CalculatorSelect.vue', () => {
  it('показывает выбранный вариант и закрыт по умолчанию', () => {
    const wrapper = mount(CalculatorSelect, { props: { modelValue: 2, options, ariaLabel: 'Мест' } })

    expect(wrapper.get('[role="combobox"]').text()).toContain('Два')
    expect(wrapper.get('[role="combobox"]').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('открывается по клику и выбирает вариант', async () => {
    const wrapper = mount(CalculatorSelect, { props: { modelValue: 1, options } })

    await wrapper.get('[role="combobox"]').trigger('click')
    const items = wrapper.findAll('[role="option"]')
    expect(items).toHaveLength(3)
    expect(items[0].attributes('aria-selected')).toBe('true')

    await items[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('работает с клавиатуры: стрелка вниз и Enter', async () => {
    const wrapper = mount(CalculatorSelect, { props: { modelValue: 1, options } })
    const combobox = wrapper.get('[role="combobox"]')

    await combobox.trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    await combobox.trigger('keydown', { key: 'ArrowDown' })
    await combobox.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])
  })

  it('закрывается по Escape без выбора', async () => {
    const wrapper = mount(CalculatorSelect, { props: { modelValue: 1, options } })
    const combobox = wrapper.get('[role="combobox"]')

    await combobox.trigger('click')
    await combobox.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
