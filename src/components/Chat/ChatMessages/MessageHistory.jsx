import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import ToolCallDetails from './ToolCallDetails/ToolCallDetails'
import AgentBadge from './AgentBadge/AgentBadge'
import styles from './ChatMessages.module.css'

/**
 * MessageHistory Component (V2)
 * Displays the static message history (non-streaming messages)
 * This component is memoized to prevent re-renders during streaming
 * Only re-renders when the messages array actually changes
 */
const MessageHistory = memo(({ messages }) => {
  return (
    <>
      {messages.map((message) => {
        return !message.hidden && (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.role]}`}
          >
            {/* Show agent badge for assistant messages */}
            {message.role === 'assistant' && message.agentId && (
              <AgentBadge agentId={message.agentId} />
            )}
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
              {message.role === 'assistant' ? (
                <ReactMarkdown>{message.content}</ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
            <div className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )
      })}
    </>
  )
})

MessageHistory.displayName = 'MessageHistory'

export default MessageHistory

