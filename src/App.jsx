import './App.css'
import Chat from '@/components/Chat/Chat'
import Header from '@/components/Chat/Header/Header'
import { useStore } from '@nanostores/react'
import { $penpotTheme } from '@/stores/penpotStore'
import { Analytics } from '@vercel/analytics/react'

function App() {
  const penpotTheme = useStore($penpotTheme);

  return (
    <div className="app" data-theme={penpotTheme}>
      <Header />
      <Chat />
      <Analytics />
    </div>
  )
}

export default App
