import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapApp } from '@app/bootstrap'
import './index.css'
import { App } from './App'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element #root not found in index.html')
}

void bootstrapApp()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
