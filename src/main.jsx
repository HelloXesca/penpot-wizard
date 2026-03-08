import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App.jsx'
// Import the store to initialize it
import './stores/penpotStore'
import { initializeAgents } from '@/stores/agentsStore'
import { initializeTools } from '@/stores/toolsStore'
import { $selectedLanguageModel, $isConnected } from '@/stores/settingsStore'

// Set up subscriptions for tools and director agents initialization
$isConnected.subscribe(async (newValue) => {
  if (newValue) {
    await initializeTools()
    initializeAgents();

    $selectedLanguageModel.subscribe((newValue, oldValue) => {
      if (newValue !== oldValue) {
        initializeAgents();
      }
    });
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
