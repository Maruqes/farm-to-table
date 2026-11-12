import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/big-shoulders-display/800'
import '@fontsource/azeret-mono/400'
import '@fontsource/azeret-mono/600'
import './styles/globals.css'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
