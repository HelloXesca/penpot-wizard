import { useEffect } from 'react'
import ChatMessages from './ChatMessages/ChatMessages'
import Footer from './Footer/Footer'
import StartPage from './StartPage/StartPage'
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel'
import ConversationHistoryPanel from '@/components/ConversationHistoryPanel/ConversationHistoryPanel'
import StreamingCancelDialog from '@/components/StreamingCancelDialog/StreamingCancelDialog'
import { $activeConversationId, loadActiveConversation } from '@/stores/activeConversationStore'
import { $isSettingsPanelOpen, closeSettingsPanel, openSettingsPanel } from '@/stores/settingsPanelStore'
import { $isConversationHistoryPanelOpen, closeConversationHistoryPanel } from '@/stores/conversationHistoryPanelStore'
import { $isConnected } from '@/stores/settingsStore'
import { $showCancelDialog, $streamingMessage, isStreaming, setPendingAction } from '@/stores/streamingMessageStore'
import { handleContinueStreaming, handleCancelStreaming } from '@/stores/conversationActionsStore'
import { useStore } from '@nanostores/react'
import styles from './Chat.module.css'

/**
 * Chat Component
 * Optimized chat interface
 * 
 * Performance improvements:
 * - Only active conversation messages in memory
 * - Streaming message separated from history
 * - Minimal re-renders during streaming
 * - Lightweight metadata for conversation list
 */
function Chat() {
  const activeConversationId = useStore($activeConversationId)
  const showCancelDialog = useStore($showCancelDialog)
  const streamingMessage = useStore($streamingMessage)
  const isSettingsPanelOpen = useStore($isSettingsPanelOpen)
  const isConversationHistoryPanelOpen = useStore($isConversationHistoryPanelOpen)
  const isConnected = useStore($isConnected)

  // Load messages when component mounts if there's an active conversation ID
  useEffect(() => {
    if (activeConversationId) {
      loadActiveConversation(activeConversationId)
    }
  }, [activeConversationId])

  // Auto-open settings panel when config is not complete (no valid API connection)
  useEffect(() => {
    if (!isConnected) {
      openSettingsPanel()
    }
  }, [isConnected])

  useEffect(() => {
    if (showCancelDialog && !streamingMessage) {
      handleCancelStreaming()
    }
  }, [showCancelDialog, streamingMessage])

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isStreaming()) {
        e.preventDefault()
        e.returnValue = ''
        
        setPendingAction({
          type: 'reload'
        })
        
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return (
    <div className={styles.chat}>
      {!activeConversationId ? (
          <StartPage />
        ) : (
          <ChatMessages />
        )
      }
      <Footer />
      
      {/* Settings panel */}
      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={closeSettingsPanel}
      />

      {/* Conversation history panel */}
      <ConversationHistoryPanel
        isOpen={isConversationHistoryPanelOpen}
        onClose={closeConversationHistoryPanel}
      />

      {/* Streaming cancellation dialog */}
      {showCancelDialog && (
        <StreamingCancelDialog
          onContinue={handleContinueStreaming}
          onCancel={handleCancelStreaming}
        />
      )}
    </div>
  )
}

export default Chat

