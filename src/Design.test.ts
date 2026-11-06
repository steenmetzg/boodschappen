import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'
import main from './main.tsx?raw'

const css = readFileSync('src/index.css', 'utf8')

/** De regels van één CSS-selector, precies zoals ze in index.css staan. */
function rule(selector: string): string {
  const start = `\n${css}`.indexOf(`\n${selector} {`)
  expect(start).toBeGreaterThan(-1)
  return css.slice(start, css.indexOf('}', start))
}

describe('AC19: past op een telefoon', () => {
  it('is een smalle kolom met lange teksten die afbreken in plaats van zijwaarts te scrollen', () => {
    expect(rule('.app')).toContain('max-width: 480px;')
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0" />')
    expect(rule('.item-text')).toContain('overflow-wrap: anywhere;')
    expect(rule('.list-header h1')).toContain('text-overflow: ellipsis;')
  })

  it('houdt het tekstveld onderaan in beeld, ook met het toetsenbord open', () => {
    expect(rule('.bottom')).toContain('position: sticky;')
    expect(rule('.bottom')).toContain('bottom: 0;')
    expect(rule('.app.list-screen,\n.app.lists-screen')).toContain('min-height: 100dvh;')
  })

  it('heeft aanraakgebieden van minstens 44 pixels voor afvinken, aanpassen en weggooien', () => {
    expect(rule('.item-check')).toContain('width: 44px;')
    expect(rule('.item-check')).toContain('height: 48px;')
    expect(rule('.item-text')).toContain('min-height: 48px;')
    expect(rule('.item-delete')).toContain('height: 44px;')
  })
})

describe('Ontwerp zoals WoonWerk', () => {
  it('heeft een lichtgrijze achtergrond, ook in de statusbalk', () => {
    expect(rule(':root')).toContain('--bg: #f5f6f8;')
    expect(html).toContain('<meta name="theme-color" content="#f5f6f8" />')
  })

  it('maakt de knoppen wit met een schaduw en zonder zichtbare rand', () => {
    for (const selector of ['.icon-button', '.wide-button']) {
      const r = rule(selector)
      expect(r).toContain('background: var(--surface);')
      expect(r).toContain('box-shadow: var(--shadow);')
      expect(r).toContain('border: 1px solid transparent;')
    }
  })

  it('vraagt de browser nooit om onder de systeembalken door te tekenen', () => {
    expect(html).not.toContain('viewport-fit')
    expect(main).not.toContain('viewport-fit')
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'))
    expect(manifest).not.toHaveProperty('theme_color')
    expect(manifest.name).toBe('Lijstjes')
  })
})
