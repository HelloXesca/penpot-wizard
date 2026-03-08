import { atom } from 'nanostores';

/**
 * Store for the streaming message (V2)
 * Manages the message currently being streamed from the AI
 * NOT persisted - ephemeral state only
 * 
 * This separation allows ChatMessages to render:
 * - Static message history (no re-renders)
 * - Streaming message separately (only this re-renders)
 */

/**
 * The current streaming message
 * Null when no message is streaming
 */
export const $streamingMessage = atom(null);

/**
 * AbortController for cancelling the current stream
 * Allows user to stop AI generation in progress
 */
let currentAbortController = null;

/**
 * Flag to track if stream is being aborted by user
 */
let isAborting = false;

/**
 * Pending action to execute after user confirms cancellation
 */
export const $pendingAction = atom(null);

/**
 * Pending handoff: when a tool aborts to hand off to another agent.
 * { agentId, handoffContent } - when set, abort handler should execute handoff instead of adding cancellation message
 */
let pendingHandoff = null;

export const setPendingHandoff = (payload) => {
  pendingHandoff = payload;
};

export const getPendingHandoff = () => pendingHandoff;

export const clearPendingHandoff = () => {
  const p = pendingHandoff;
  pendingHandoff = null;
  return p;
};

/**
 * Whether to show the cancel dialog
 */
export const $showCancelDialog = atom(false);

/**
 * Starts a new streaming message
 * @param messageId - The ID for the new message
 * @param agentId - The ID of the agent sending the message
 */
export const startStreaming = (messageId, agentId) => {
  const newStreamingMessage = {
    id: messageId,
    role: 'assistant',
    agentId: agentId ?? null,
    content: '',
    isStreaming: true
  };
  
  $streamingMessage.set(newStreamingMessage);
};

/**
 * Updates the content of the streaming message
 * @param content - The new content (full content, not delta)
 */
export const updateStreamingContent = (content) => {
  const current = $streamingMessage.get();

  if (!current) {
    console.warn('Attempted to update streaming content when no message is streaming');
    return;
  }
  
  $streamingMessage.set({
    ...current,
    content
  });
};

export const getToolCallById = (
  toolCallId,
  currentToolCalls = $streamingMessage.get()?.toolCalls || []
) => {
  // 1) Buscar en el nivel actual
  const direct = currentToolCalls.find(tc => tc.toolCallId === toolCallId);
  if (direct) return direct;

  // 2) Buscar recursivamente en los hijos
  for (const tc of currentToolCalls) {
    if (tc.toolCalls?.length) {
      const found = getToolCallById(toolCallId, tc.toolCalls);
      if (found) return found;
    }
  }
  return undefined;
};

export const updateToolCallById = (toolCallId, updates, currentToolCalls) => {
  if (!currentToolCalls) {
    currentToolCalls = $streamingMessage.get()?.toolCalls || [];
  }
  const updatedToolCalls = currentToolCalls.map((tc) => {
    if (tc.toolCallId === toolCallId) {
      const updatedToolCall = { ...tc, ...updates };
      return updatedToolCall;
    } else if (tc.toolCalls) {
      const updatedToolCalls = updateToolCallById(toolCallId, updates, tc.toolCalls);
      return { ...tc, toolCalls: updatedToolCalls };
    }
    return tc;
  });
  return updatedToolCalls;
}

export const addToolCall = (toolCall, parentCallId) => {
  const current = $streamingMessage.get();

  if (!current) {
    console.warn('Attempted to add tool call when no message is streaming');
    return;
  }
  
  const currentToolCalls = current.toolCalls || [];

  if (parentCallId) {
    const parentToolCall = getToolCallById(parentCallId);

    if (parentToolCall) {
      updateToolCall(parentCallId, { toolCalls: [...(parentToolCall.toolCalls || []), toolCall] });
    } else {
      console.warn('Attempted to add tool call to non-existent parent tool call');
      return;
    }
  } else {
    $streamingMessage.set({ ...current, toolCalls: [...currentToolCalls, toolCall] });
  }
};

export const updateToolCall = (toolCallId, updates) => {
  const current = $streamingMessage.get();

  if (!current) {
    console.warn('Attempted to update tool call when no message is streaming');
    return;
  }
  
  const updatedToolCalls = updateToolCallById(toolCallId, updates);
  $streamingMessage.set({ ...current, toolCalls: updatedToolCalls });
}

/**
 * Sets an error on the streaming message
 * @param error - The error message
 */
export const setStreamingError = (error) => {
  const current = $streamingMessage.get();
  
  if (!current) {
    console.warn('Attempted to set error when no message is streaming');
    return;
  }
  
  $streamingMessage.set({
    ...current,
    error,
    isStreaming: false
  });
};

/**
 * Finalizes the streaming message
 * Returns the final message and clears the streaming state
 * The caller is responsible for adding this message to the conversation
 * @returns The final streaming message, or null if no message was streaming
 */
export const finalizeStreaming = () => {
  const message = $streamingMessage.get();
  
  if (!message) {
    return null;
  }
  
  // Create final message with streaming flag set to false
  const finalMessage = {
    ...message,
    isStreaming: false
  };
  
  // Clear streaming state
  $streamingMessage.set(null);
  
  return finalMessage;
};

/**
 * Checks if a message is currently streaming
 * @returns True if streaming is active
 */
export const isStreaming = () => {
  const message = $streamingMessage.get();
  return message !== null && message.isStreaming;
};

/**
 * Sets a pending action that will be executed after streaming is cancelled
 * @param action - The action to execute
 */
export const setPendingAction = (action) => {
  $pendingAction.set(action);
  $showCancelDialog.set(true);
};

/**
 * Clears the pending action and hides dialog
 */
export const clearPendingAction = () => {
  $pendingAction.set(null);
  $showCancelDialog.set(false);
};

/**
 * Gets the current pending action
 */
export const getPendingAction = () => {
  return $pendingAction.get();
};

/**
 * Cancels streaming and adds a cancellation message
 * Returns the conversation ID where the cancelled message should be added
 */
export const cancelStreamingWithMessage = () => {
  const message = $streamingMessage.get();
  
  if (!message) {
    return { conversationId: null, messageId: null };
  }
  
  const messageId = message.id;
  
  // Clear streaming state
  $streamingMessage.set(null);
  
  // Return info so caller can add the cancellation message to the right conversation
  return { conversationId: null, messageId }; // conversationId will be determined by caller
};

/**
 * Creates a new AbortController for the current stream
 * Aborts any previous controller if it exists
 * @returns The new AbortController
 */
export const createAbortController = () => {
  // Abort the previous controller if it exists
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();
  isAborting = false; // Reset flag
  return currentAbortController;
};

/**
 * Aborts the current stream
 * Called when user clicks the STOP button
 */
export const abortCurrentStream = () => {
  if (currentAbortController) {
    isAborting = true; // Set flag before aborting
    currentAbortController.abort();
    currentAbortController = null;
  }
};

/**
 * Clears the AbortController reference
 * Called after stream completes normally
 */
export const clearAbortController = () => {
  currentAbortController = null;
  isAborting = false;
};

/**
 * Checks if stream is currently being aborted
 * @returns true if user initiated abort
 */
export const isStreamAborting = () => {
  return isAborting;
};

/**
 * Resets the aborting flag
 */
export const resetAbortFlag = () => {
  isAborting = false;
};

/**
 * Gets the current AbortSignal
 * Used by agents to share the same abort signal
 * @returns The current AbortSignal or undefined if none exists
 */
export const getAbortSignal = () => {
  return currentAbortController?.signal;
};

