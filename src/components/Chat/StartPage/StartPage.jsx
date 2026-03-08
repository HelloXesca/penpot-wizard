import { useStore } from '@nanostores/react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { 
  tryCreateNewConversation,
  trySetActiveConversation,
  deleteConversation
} from '@/stores/conversationActionsStore'
import { $activeAgent, $combinedAgents } from '@/stores/agentsStore'
import { $conversationsMetadata } from '@/stores/conversationsMetadataStore'
import { isStreaming, setPendingAction } from '@/stores/streamingMessageStore'
import { getAgentIconComponent } from '@/utils/agentIcons'
import styles from './StartPage.module.css'

/**
 * StartPage Component
 * 1. Title: "Elige el agente"
 * 2. Full list of agents (name + description) - click to start conversation
 * 3. On agent click: create conversation, system "saluda y preséntate", stream response
 */
function StartPage() {
  const activeAgentId = useStore($activeAgent)
  const agentsData = useStore($combinedAgents)
  const conversationsMetadata = useStore($conversationsMetadata)
  const agentConversations = activeAgentId
    ? conversationsMetadata
        .filter(conversation => conversation.agentId === activeAgentId)
        .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0))
    : []

  const handleAgentClick = async (agentId) => {
    await tryCreateNewConversation(agentId)
  }
  
  const handleLoadConversation = (conversationId) => {
    trySetActiveConversation(conversationId)
  }

  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation()
    if (isStreaming()) {
      setPendingAction({
        type: 'delete_conversation',
        data: { conversationId }
      })
      return
    }
    deleteConversation(conversationId)
  }

  return (
    <div className={styles.startPageContainer}>
      <div className={styles.mainContent}>
        <h2 className={styles.pageTitle}>Elige el agente</h2>
        <div className={styles.agentsGrid}>
          {agentsData.map((agent) => {
            const AgentIcon = getAgentIconComponent(agent.icon)
            return (
              <button
                key={agent.id}
                className={styles.agentCard}
                onClick={() => handleAgentClick(agent.id)}
              >
                <AgentIcon className={styles.agentCardIcon} aria-hidden />
                <div className={styles.agentCardContent}>
                  <h3 className={styles.agentCardName}>{agent.name}</h3>
                  <p className={styles.agentCardDescription}>
                    {agent.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Conversation History */}
      {agentConversations.length > 0 && (
        <div className={styles.historySection}>
          <h3 className={styles.historyTitle}>Conversaciones recientes</h3>
          <div className={styles.conversationGrid}>
            {agentConversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={styles.conversationCard}
                onClick={() => handleLoadConversation(conversation.id)}
              >
                <button
                  className={styles.deleteConversationButton}
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                  title="Eliminar conversación"
                  aria-label="Eliminar conversación"
                >
                  <TrashIcon className={styles.deleteConversationIcon} />
                </button>
                <div className={styles.conversationSummary} title={conversation.summary || undefined}>
                  {conversation.title || conversation.summary || 'Nueva conversación'}
                </div>
                <div className={styles.conversationDate}>
                  {conversation.createdAt.toLocaleDateString()}
                </div>
                <div className={styles.conversationMessages}>
                  {conversation.messageCount} mensajes
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StartPage
