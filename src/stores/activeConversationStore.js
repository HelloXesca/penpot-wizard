import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { $conversationsMetadata } from './conversationsMetadataStore';
import {
  loadMessagesFromStorage,
  addMessageToStorage as addMessageToStorageUtil,
  updateMessageInStorage as updateMessageInStorageUtil
} from '@/utils/messagesStorageUtils';

/**
 * Store for the active conversation (V2)
 * Only loads messages for the currently active conversation
 * This significantly reduces memory usage compared to V1
 */

/**
 * Active conversation ID (persisted)
 * This determines which conversation is currently being viewed
 */
export const $activeConversationId = persistentAtom(
  'activeConversationId',
  undefined
);

/**
 * Messages for the active conversation (NOT persisted in atom)
 * Messages are loaded from localStorage when conversation changes
 * This is a reactive atom but not persisted itself
 */
export const $activeConversationMessages = atom([]);

/**
 * Computed atom that combines metadata + messages for the active conversation
 * Returns a full Conversation object for compatibility with existing code
 * Returns null if no active conversation
 */
export const $activeConversationFull = computed(
  [$activeConversationMessages, $activeConversationId, $conversationsMetadata],
  (messages, activeId, metadata) => {
    if (!activeId) return null;

    const conversationMetadata = metadata.find(m => m.id === activeId);
    if (!conversationMetadata) return null;

    const conversation = {
      id: conversationMetadata.id,
      agentId: conversationMetadata.agentId,
      messages,
      title: conversationMetadata.title,
      summary: conversationMetadata.summary,
      createdAt: conversationMetadata.createdAt
    };

    return conversation;
  }
);

/**
 * Loads a conversation's messages into the active conversation atom
 * @param conversationId - The conversation ID to load
 */
export const loadActiveConversation = (conversationId) => {
  // Load messages from localStorage
  const messages = loadMessagesFromStorage(conversationId);
  
  // Update atoms
  $activeConversationId.set(conversationId);
  $activeConversationMessages.set(messages);
};

/**
 * Clears the active conversation
 * Sets both ID and messages to empty
 */
export const clearActiveConversation = () => {
  $activeConversationId.set(undefined);
  $activeConversationMessages.set([]);
};

/**
 * Adds a message to the active conversation
 * Updates both the atom and localStorage
 * @param message - Message without id and timestamp (will be generated). Assistant messages may include agentId.
 * @returns The new message ID, or undefined if no active conversation
 */
export const addMessageToActive = (
  message
) => {
  const activeId = $activeConversationId.get();
  if (!activeId) return undefined;

  const newMessage = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    isStreaming: false
  };

  // Update atom (reactive)
  const currentMessages = $activeConversationMessages.get();
  $activeConversationMessages.set([...currentMessages, newMessage]);

  // Update localStorage (persistent)
  addMessageToStorageUtil(activeId, newMessage);

  return newMessage.id;
};

/**
 * Updates a message in the active conversation
 * Updates both the atom and localStorage
 * @param messageId - The message ID to update
 * @param content - The new content
 * @param isStreaming - Optional streaming flag
 */
export const updateMessageInActive = (
  messageId,
  content,
  isStreaming
) => {
  const activeId = $activeConversationId.get();
  if (!activeId) return;

  // Update atom (reactive)
  const currentMessages = $activeConversationMessages.get();
  const updatedMessages = currentMessages.map(msg =>
    msg.id === messageId
      ? {
          ...msg,
          content,
          ...(isStreaming !== undefined && { isStreaming })
        }
      : msg
  );
  $activeConversationMessages.set(updatedMessages);

  // Update localStorage (persistent)
  updateMessageInStorageUtil(activeId, messageId, content, isStreaming);
};

/**
 * Gets the current messages of the active conversation
 * @returns Array of messages, or empty array if no active conversation
 */
export const getActiveMessages = () => {
  return $activeConversationMessages.get();
};

/**
 * Checks if there's an active conversation
 * @returns True if there's an active conversation
 */
export const hasActiveConversation = () => {
  return $activeConversationId.get() !== undefined;
};

/**
 * Gets the ID of the active conversation
 * @returns The conversation ID or undefined
 */
export const getActiveConversationId = () => {
  return $activeConversationId.get();
};
