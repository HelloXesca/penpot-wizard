import { generateText } from 'ai';
import { createModelInstance } from '@/utils/modelUtils';
import { getAgentById, $activeAgent, setActiveAgent } from './agentsStore';

// Metadata store
import {
  createConversationMetadata,
  getMetadataById,
  incrementMessageCount,
  updateTitleAndSummary,
  getMetadataByAgent
} from './conversationsMetadataStore';

// Active conversation store
import {
  $activeConversationId,
  loadActiveConversation,
  clearActiveConversation,
  addMessageToActive,
  getActiveMessages,
  $activeConversationFull
} from './activeConversationStore';

// Streaming store
import {
  $streamingMessage,
  startStreaming,
  finalizeStreaming,
  isStreaming,
  setPendingAction,
  clearPendingAction,
  getPendingAction,
  cancelStreamingWithMessage,
  setStreamingError,
  createAbortController,
  clearAbortController,
  isStreamAborting,
  resetAbortFlag,
  getPendingHandoff,
  clearPendingHandoff
} from './streamingMessageStore';

// Messages storage utilities
import {
  deleteConversationData,
  saveMessagesToStorage,
  loadMessagesFromStorage
} from '@/utils/messagesStorageUtils';

// Message conversion for AI SDK
import { convertMessagesForAgent } from '@/utils/messagesForAgentUtils';

// Streaming utilities
import { StreamHandler } from '@/utils/streamingMessageUtils';

const GREETING_SYSTEM_MESSAGE = 'Start the conversation by greeting the user and introducing yourself.';
const SUMMARY_UPDATE_INTERVAL = 5;

/**
 * Conversation Actions Store (V2)
 * Orchestrates all conversation-related actions
 * Coordinates between metadata, active conversation, and streaming stores
 */

/**
 * Creates a new conversation and streams the agent's greeting
 * Adds hidden system message "Saluda al usuario y preséntate" and streams response
 * @param agentId - The agent ID
 * @returns The new conversation ID
 */
export const createNewConversation = async (agentId) => {
  // 1. Create metadata
  const conversationId = createConversationMetadata(agentId);

  // 2. Create empty messages storage
  saveMessagesToStorage(conversationId, []);

  // 3. Load as active conversation
  loadActiveConversation(conversationId);

  // 4. Set active agent (needed for streaming)
  setActiveAgent(agentId);

  // 5. Add system message (hidden) and stream agent's greeting
  await addMessageAndStreamResponse('system', GREETING_SYSTEM_MESSAGE, true);

  return conversationId;
};

/**
 * Navigates to the new conversation page (agent selection)
 */
export const goToNewConversation = () => {
  if (isStreaming()) {
    setPendingAction({
      type: 'go_to_new_conversation',
    });
    return;
  }
  clearActiveConversation();
};

/**
 * Sets a conversation as active and loads its messages
 * @param conversationId - The conversation ID
 */
export const setActiveConversation = (conversationId) => {
  const metadata = getMetadataById(conversationId);

  if (!metadata) {
    console.error('Conversation metadata not found');
    return;
  }

  // Load conversation (loads messages from storage into active atom)
  loadActiveConversation(conversationId);
};

/**
 * Internal: adds a message (user or system) and streams the assistant's response
 * @param role - 'user' | 'system'
 * @param text - The message text
 * @param hidden - Whether the message should be hidden from the UI
 */
async function addMessageAndStreamResponse(role, text, hidden = false) {
  const activeConversation = $activeConversationFull.get();
  const activeAgentId = $activeAgent.get();

  if (!activeConversation || !activeAgentId) {
    console.error('No active conversation or agent');
    return;
  }

  try {
    // 1. Add message to active conversation
    const messageId = addMessageToActive({
      role,
      content: text,
      hidden
    });

    if (!messageId) {
      console.error('Failed to add message');
      return;
    }

    incrementMessageCount(activeConversation.id);

    // 2. Get the agent instance
    const agent = getAgentById(activeAgentId);
    if (!agent?.instance) {
      console.error('Agent not initialized');
      return;
    }

    // 3. Generate message ID for assistant response
    const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 4. Start streaming (pass agentId for message attribution)
    startStreaming(assistantMessageId, activeAgentId);

    // 5. Create AbortController for this stream
    const abortController = createAbortController();

    // 6. Prepare messages for the agent (includes toolCalls; message already in getActiveMessages)
    const currentMessages = getActiveMessages();
    const agentMessages = convertMessagesForAgent(currentMessages);

    // 7. Stream response from agent
    const stream = await agent.instance.stream({
      messages: agentMessages,
      abortSignal: abortController.signal
    });

    // 8. Handle stream processing
    const streamHandler = new StreamHandler(stream.fullStream);
    await streamHandler.handleStream();

    // 9. Check if stream was aborted (even if no error was thrown)
    if (isStreamAborting()) {
      resetAbortFlag();
      clearAbortController();

      const handoff = getPendingHandoff();
      if (handoff) {
        clearPendingHandoff();
        finalizeStreaming();
        setActiveAgent(handoff.agentId);
        return addMessageAndStreamResponse('system', handoff.handoffContent, false);
      }

      const cancelMessage = finalizeStreaming();
      if (cancelMessage) {
        const messageContent = cancelMessage.content || '';
        addMessageToActive({
          role: 'assistant',
          agentId: cancelMessage.agentId ?? activeAgentId,
          content: messageContent + '\n\n⚠️ _Cancelado por el usuario_',
          toolCalls: cancelMessage.toolCalls
        });
        incrementMessageCount(activeConversation.id);
        const updatedMeta = getMetadataById(activeConversation.id);
        if (updatedMeta && updatedMeta.messageCount >= SUMMARY_UPDATE_INTERVAL && updatedMeta.messageCount % SUMMARY_UPDATE_INTERVAL === 0) {
          setTimeout(() => generateConversationSummary(activeConversation.id), 1000);
        }
      }
      return;
    }

    // 10. Clear AbortController after successful completion
    clearAbortController();

    // 11. Finalize streaming
    const finalMessage = finalizeStreaming();

    if (finalMessage) {
      const hasError = Boolean(finalMessage.error);
      const content = hasError
        ? `${finalMessage.content ? `${finalMessage.content}\n\n` : ''}⚠️ ${finalMessage.error}`
        : finalMessage.content;

      addMessageToActive({
        role: 'assistant',
        agentId: finalMessage.agentId ?? activeAgentId,
        content,
        toolCalls: finalMessage.toolCalls
      });

      incrementMessageCount(activeConversation.id);
    }

    // 12. Generate/update summary every 5 messages
    const updatedMetadata = getMetadataById(activeConversation.id);
    if (updatedMetadata && updatedMetadata.messageCount >= SUMMARY_UPDATE_INTERVAL && updatedMetadata.messageCount % SUMMARY_UPDATE_INTERVAL === 0) {
      setTimeout(() => {
        generateConversationSummary(activeConversation.id);
      }, 1000);
    }
  } catch (error) {
    console.error('Error sending message:', error);

    clearAbortController();

    const wasAborting = isStreamAborting();
    resetAbortFlag();

    const isAborted = wasAborting || (error instanceof Error &&
      (error.name === 'AbortError' ||
       error.message?.toLowerCase().includes('abort') ||
       error.message?.toLowerCase().includes('cancel')));

    if (isAborted) {
      const handoff = getPendingHandoff();
      if (handoff) {
        clearPendingHandoff();
        finalizeStreaming(); // Discard current message, don't add to conversation
        setActiveAgent(handoff.agentId);
        return addMessageAndStreamResponse('system', handoff.handoffContent, true);
      }

      const cancelMessage = finalizeStreaming();
      if (cancelMessage) {
        const messageContent = cancelMessage.content || '';
        addMessageToActive({
          role: 'assistant',
          agentId: cancelMessage.agentId ?? activeAgentId,
          content: messageContent + '\n\n⚠️ _Cancelado por el usuario_',
          toolCalls: cancelMessage.toolCalls
        });
        incrementMessageCount(activeConversation.id);
        const updatedMeta = getMetadataById(activeConversation.id);
        if (updatedMeta && updatedMeta.messageCount >= SUMMARY_UPDATE_INTERVAL && updatedMeta.messageCount % SUMMARY_UPDATE_INTERVAL === 0) {
          setTimeout(() => generateConversationSummary(activeConversation.id), 1000);
        }
      }
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const formattedError = `Error: ${errorMessage}`;
    setStreamingError(formattedError);

    const finalMessage = finalizeStreaming();
    const content = finalMessage?.content
      ? `${finalMessage.content}\n\n⚠️ ${formattedError}`
      : `⚠️ ${formattedError}`;

    addMessageToActive({
      role: 'assistant',
      content,
      toolCalls: finalMessage?.toolCalls
    });

    incrementMessageCount(activeConversation.id);
    const updatedMeta = getMetadataById(activeConversation.id);
    if (updatedMeta && updatedMeta.messageCount >= SUMMARY_UPDATE_INTERVAL && updatedMeta.messageCount % SUMMARY_UPDATE_INTERVAL === 0) {
      setTimeout(() => generateConversationSummary(activeConversation.id), 1000);
    }
  }
}

/**
 * Sends a system message. By default streams the assistant's response.
 * @param text - The system message text
 * @param hidden - Whether the message should be hidden from the UI
 * @param options - { streamResponse?: boolean } When false, only adds the message (no streaming). Use when closing the current stream (e.g. handoff).
 */
export const sendSystemMessage = (text, hidden = false, options = {}) => {
  const { streamResponse = true } = options;
  if (!streamResponse) {
    const activeConversation = $activeConversationFull.get();
    const activeAgentId = $activeAgent.get();
    if (!activeConversation || !activeAgentId) {
      console.error('No active conversation or agent');
      return;
    }
    const messageId = addMessageToActive({ role: 'system', content: text, hidden });
    if (messageId) incrementMessageCount(activeConversation.id);
    return;
  }
  return addMessageAndStreamResponse('system', text, hidden);
};

/**
 * Sends a user message and streams the assistant's response
 * @param text - The user's message text
 * @param hidden - Whether the message should be hidden from the UI
 */
export const sendUserMessage = (text, hidden = false) =>
  addMessageAndStreamResponse('user', text, hidden);

/**
 * Parses title and summary from AI response
 * @param text - Raw response text
 * @returns { title, summary } or null if parsing fails
 */
function parseTitleAndSummary(text) {
  const match = text.match(/Title:\s*(.+?)\n\s*Summary:\s*([\s\S]*)/i);
  if (match) {
    const title = match[1].trim();
    const summary = match[2].trim();
    if (title && summary) return { title, summary };
  }
  if (text.trim()) return { title: text.trim().slice(0, 50), summary: text.trim() };
  return null;
}

/**
 * Generates a title and summary for a conversation
 * @param conversationId - The conversation ID
 */
export const generateConversationSummary = async (conversationId) => {
  const metadata = getMetadataById(conversationId);

  if (!metadata || metadata.messageCount < 2) {
    return;
  }

  try {
    // Load messages for this conversation (they might not be in active if user switched)
    const activeId = $activeConversationId.get();
    let messages;

    if (activeId === conversationId) {
      // Messages are in active conversation
      messages = getActiveMessages();
    } else {
      // Need to load from storage
      messages = loadMessagesFromStorage(conversationId);
    }

    if (messages.length < 2) {
      return;
    }

    const model = createModelInstance();

    // Use last messages for summary (more relevant for longer conversations)
    const maxMessages = 12;
    const messagesToSummarize = messages.length <= maxMessages
      ? messages
      : messages.slice(-maxMessages);
    const messagesText = messagesToSummarize
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const { text } = await generateText({
      model,
      prompt: `Generate a brief title (max 6 words) and a brief summary (max 50 words) for this conversation.
Format your response exactly as:
Title: [title here]
Summary: [summary here]

Conversation:
${messagesText}

Response:`
    });

    const parsed = parseTitleAndSummary(text.trim());
    if (parsed) {
      updateTitleAndSummary(conversationId, parsed.title, parsed.summary);
    }
  } catch (error) {
    console.error('Failed to generate conversation summary:', error);
  }
};

/**
 * Deletes a conversation (metadata and messages)
 * @param conversationId - The conversation ID
 */
export const deleteConversation = (conversationId) => {
  // 1. Delete messages + metadata
  deleteConversationData(conversationId);

  // 2. If deleting active conversation, clear active
  const activeId = $activeConversationId.get();
  if (activeId === conversationId) {
    clearActiveConversation();
  }
};

/**
 * Gets conversations for a specific agent
 * Returns only metadata (lightweight)
 * @param agentId - The agent ID
 * @returns Array of conversation metadata
 */
export const getConversationsForAgent = (agentId) => {
  return getMetadataByAgent(agentId);
};

/**
 * Attempts to switch conversation, checking for active streaming first
 * Returns true if switched immediately, false if pending user confirmation
 */
export const trySetActiveConversation = (conversationId) => {
  if (isStreaming()) {
    // Set pending action and show dialog
    setPendingAction({
      type: 'switch_conversation',
      data: { conversationId }
    });
    return false;
  }
  
  // No streaming, switch immediately
  setActiveConversation(conversationId);
  return true;
};

/**
 * Attempts to create new conversation, checking for active streaming first
 * Returns true if created immediately, false if pending user confirmation
 */
export const tryCreateNewConversation = async (agentId) => {
  if (isStreaming()) {
    setPendingAction({
      type: 'new_conversation',
      data: { agentId }
    });
    return false;
  }

  await createNewConversation(agentId);
  return true;
};

/**
 * Handles user continuing to wait for streaming (cancels the pending action)
 */
export const handleContinueStreaming = () => {
  clearPendingAction();
};

/**
 * Handles user cancelling the streaming and executing the pending action
 */
export const handleCancelStreaming = () => {
  const currentConversationId = $activeConversationId.get();
  const wasStreaming = isStreaming();
  
  // Cancel streaming if still active
  if (wasStreaming) {
    const streamingMsg = $streamingMessage.get();
    const agentIdForCancel = streamingMsg?.agentId ?? $activeAgent.get();
    cancelStreamingWithMessage();
    
    // Add cancellation message to the conversation where streaming was happening
    if (currentConversationId) {
      const cancellationMessage = JSON.stringify({
        text: '⚠️ Message cancelled by user'
      });
      
      addMessageToActive({
        role: 'assistant',
        agentId: agentIdForCancel ?? undefined,
        content: cancellationMessage
      });
      
      incrementMessageCount(currentConversationId);
    }
  } else {
    // Streaming already finished naturally
    // Check if the message was added to the conversation
    // If it was, we can proceed with the action
    // The message should already be in the conversation from finalizeStreaming()
    console.log('Streaming finished naturally, proceeding with pending action');
  }
  
  // Execute the pending action
  const action = getPendingAction();
  clearPendingAction();
  
  if (action) {
    switch (action.type) {
      case 'switch_conversation':
        if (action.data?.conversationId) {
          setActiveConversation(action.data.conversationId);
        }
        break;
      
      case 'new_conversation':
        if (action.data?.agentId) {
          createNewConversation(action.data.agentId);
        }
        break;
      
      case 'delete_conversation':
        if (action.data?.conversationId) {
          deleteConversation(action.data.conversationId);
        }
        break;
      
      case 'go_to_new_conversation':
        clearActiveConversation();
        break;
      
      case 'reload':
        // For reload, we just cancel and add the message if was streaming
        // The actual reload is handled by the browser
        break;
    }
  }
};

