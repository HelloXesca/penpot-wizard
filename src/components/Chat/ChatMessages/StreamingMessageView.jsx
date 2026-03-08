import ReactMarkdown from 'react-markdown'
import ToolCallDetails from './ToolCallDetails/ToolCallDetails'
import AgentBadge from './AgentBadge/AgentBadge'
import styles from './ChatMessages.module.css'

/**
 * StreamingMessageView Component (V2)
 * Displays the currently streaming message
 * This component re-renders with each chunk, but it's just ONE message
 * Much more efficient than re-rendering the entire message history
 */
function StreamingMessageView({ message }) {
  if (!message) return null

  // Generate a temporary timestamp for display
  const timestamp = new Date().toLocaleTimeString()

  return (
    <div className={`${styles.message} ${styles.assistant}`}>
      {/* Show agent badge for streaming assistant messages */}
      {message.agentId && <AgentBadge agentId={message.agentId} />}
      {/* Show tool calls above the message */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className={styles.toolCallsContainer}>
          {message.toolCalls.map((toolCall, index) => (
            <ToolCallDetails 
              key={toolCall.toolCallId || index} 
              toolCall={toolCall} 
            />
          ))}
        </div>
      )}
      
      <div className={styles.messageContent}>
        {message.error ? (
          <div className={styles.errorMessage}>
            ⚠️ {message.error}
          </div>
        ) : (
          <>
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {message.isStreaming && <span className={styles.cursor}>|</span>}
          </>
        )}
      </div>
      <div className={styles.timestamp}>{timestamp}</div>
    </div>
  )
}

export default StreamingMessageView

