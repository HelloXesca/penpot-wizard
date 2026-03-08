import {
  $conversationsMetadata,
  deleteConversationMetadata
} from '@/stores/conversationsMetadataStore';

/**
 * Utilities for managing messages in localStorage
 * V2 stores messages separately from conversation metadata
 * This allows loading conversation lists without loading all messages
 */

const MESSAGES_PREFIX = 'messages_v2_';
const LOCALSTORAGE_BYTES_PER_CHAR = 2;
const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024;
const STORAGE_USAGE_THRESHOLD = 0.8;
const ESTIMATE_TTL_MS = 30000;

let lastKnownQuotaBytes;
let lastEstimateTimestamp = 0;

const refreshStorageEstimate = () => {
  if (!navigator?.storage?.estimate) return;
  const now = Date.now();
  if (now - lastEstimateTimestamp < ESTIMATE_TTL_MS) return;
  lastEstimateTimestamp = now;

  navigator.storage
    .estimate()
    .then(({ quota }) => {
      if (typeof quota === 'number') {
        lastKnownQuotaBytes = quota;
      }
    })
    .catch(() => {});
};

const estimateLocalStorageUsageBytes = () => {
  let totalBytes = 0;

  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      totalBytes += (key.length + value.length) * LOCALSTORAGE_BYTES_PER_CHAR;
    }
  } catch (error) {
    console.error('Error estimating localStorage usage:', error);
  }

  return totalBytes;
};

const getStorageUsageAndQuota = () => {
  refreshStorageEstimate();
  const usageBytes = estimateLocalStorageUsageBytes();
  const quotaBytes = lastKnownQuotaBytes ?? DEFAULT_QUOTA_BYTES;
  return { usageBytes, quotaBytes };
};

const isOverThreshold = (usageBytes, quotaBytes) => {
  if (!quotaBytes || quotaBytes <= 0) return false;
  return usageBytes / quotaBytes >= STORAGE_USAGE_THRESHOLD;
};

const getProjectedUsageBytes = (currentUsageBytes, key, serialized) => {
  const existingValue = localStorage.getItem(key);
  const existingValueBytes = existingValue
    ? existingValue.length * LOCALSTORAGE_BYTES_PER_CHAR
    : 0;
  const keyBytes = existingValue ? 0 : key.length * LOCALSTORAGE_BYTES_PER_CHAR;
  const newValueBytes = serialized.length * LOCALSTORAGE_BYTES_PER_CHAR;

  return currentUsageBytes - existingValueBytes + keyBytes + newValueBytes;
};

const isQuotaExceededError = (error) =>
  error instanceof DOMException && error.name === 'QuotaExceededError';

/**
 * Deletes both messages and metadata for a conversation
 * @param conversationId - The conversation ID
 */
export const deleteConversationData = (conversationId) => {
  deleteMessagesFromStorage(conversationId);
  deleteConversationMetadata(conversationId);
};

/**
 * Removes oldest conversations (excluding one) until under threshold
 * @param options - Cleanup options
 * @param options.excludeConversationId - Conversation ID to skip
 * @returns Number of conversations removed
 */
export const cleanupOldestConversations = (options = {}) => {
  const { excludeConversationId } = options;
  const metadata = $conversationsMetadata.get();
  const candidates = metadata
    .filter((conv) => conv.id !== excludeConversationId)
    .sort((a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0));

  let cleanedCount = 0;

  for (const conv of candidates) {
    deleteConversationData(conv.id);
    cleanedCount += 1;

    const { usageBytes, quotaBytes } = getStorageUsageAndQuota();
    if (!isOverThreshold(usageBytes, quotaBytes)) {
      break;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned ${cleanedCount} old conversations to free space`);
  }

  return cleanedCount;
};

/**
 * Saves all messages for a conversation to localStorage
 * @param conversationId - The conversation ID
 * @param messages - Array of messages to save
 */
export const saveMessagesToStorage = (conversationId, messages, options = {}) => {
  const { excludeConversationId = conversationId } = options;

  try {
    const key = `${MESSAGES_PREFIX}${conversationId}`;
    const serialized = JSON.stringify(
      messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    );
    const { usageBytes, quotaBytes } = getStorageUsageAndQuota();
    const projectedUsageBytes = getProjectedUsageBytes(usageBytes, key, serialized);

    if (isOverThreshold(projectedUsageBytes, quotaBytes)) {
      cleanupOldestConversations({ excludeConversationId });
    }

    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Error saving messages to storage:', error);
    // Handle QuotaExceededError or other storage errors
    if (isQuotaExceededError(error)) {
      console.error('localStorage quota exceeded. Consider cleaning old conversations.');
      cleanupOldestConversations({ excludeConversationId });
      try {
        const key = `${MESSAGES_PREFIX}${conversationId}`;
        const serialized = JSON.stringify(
          messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          }))
        );
        localStorage.setItem(key, serialized);
      } catch (retryError) {
        console.error('Retry saving messages failed:', retryError);
      }
    }
  }
};

/**
 * Loads all messages for a conversation from localStorage
 * @param conversationId - The conversation ID
 * @returns Array of messages, or empty array if not found
 */
export const loadMessagesFromStorage = (conversationId) => {
  try {
    const key = `${MESSAGES_PREFIX}${conversationId}`;
    const serialized = localStorage.getItem(key);
    
    if (!serialized) {
      return [];
    }
    
    const parsed = JSON.parse(serialized);
    
    // Deserialize and reconstruct Date objects
    return parsed.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error loading messages from storage:', error);
    return [];
  }
};

/**
 * Deletes all messages for a conversation from localStorage
 * @param conversationId - The conversation ID
 */
export const deleteMessagesFromStorage = (conversationId) => {
  try {
    const key = `${MESSAGES_PREFIX}${conversationId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error deleting messages from storage:', error);
  }
};

/**
 * Adds a single message to the end of a conversation in localStorage
 * This is more efficient than loading all messages, adding one, and saving all
 * @param conversationId - The conversation ID
 * @param message - The message to add
 */
export const addMessageToStorage = (conversationId, message) => {
  try {
    const messages = loadMessagesFromStorage(conversationId);
    messages.push(message);
    saveMessagesToStorage(conversationId, messages);
  } catch (error) {
    console.error('Error adding message to storage:', error);
  }
};

/**
 * Updates a specific message in localStorage
 * @param conversationId - The conversation ID
 * @param messageId - The ID of the message to update
 * @param content - The new content
 * @param isStreaming - Optional streaming flag
 */
export const updateMessageInStorage = (
  conversationId,
  messageId,
  content,
  isStreaming
) => {
  try {
    const messages = loadMessagesFromStorage(conversationId);
    const updatedMessages = messages.map(msg =>
      msg.id === messageId
        ? {
            ...msg,
            content,
            ...(isStreaming !== undefined && { isStreaming })
          }
        : msg
    );
    saveMessagesToStorage(conversationId, updatedMessages);
  } catch (error) {
    console.error('Error updating message in storage:', error);
  }
};
