import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { afterEach, expect } from 'vitest'

// RTL's guiding principle (query by role/label/text) and the project's no
// snapshot-tests rule are enforced by convention in each spec, not here.
// This file wires the matcher extensions every spec needs and RTL's
// unmount-after-each-test cleanup — registered explicitly since `globals`
// is off, so RTL's own auto-cleanup (which looks for a global `afterEach`)
// never fires on its own.
expect.extend(toHaveNoViolations)
afterEach(() => {
  cleanup()
})

// jsdom implements neither of these, but Radix's Dialog/Toast/Tabs
// primitives (used by Modal/Dialog/Drawer/Toast/Accordion) call them
// internally for pointer capture and viewport sizing.
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = () => false
}
if (!window.HTMLElement.prototype.releasePointerCapture) {
  window.HTMLElement.prototype.releasePointerCapture = () => {}
}
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {}
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}
