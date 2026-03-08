import { persistentAtom } from '@nanostores/persistent';

/**
 * Store for conversation metadata (V2)
 * Stores only metadata without messages, reducing memory footprint
 * Messages are stored separately in localStorage via messagesStorageUtils
 */

export const $conversationsMetadata = persistentAtom(
  'conversationsMetadata',
  [],
  {
    encode: (metadata) =>
      JSON.stringify(
        metadata.map((conv) => ({
          ...conv,
          createdAt: conv.createdAt.toISOString()
        }))
      ),
    decode: (value) => {
      try {
        const parsed = JSON.parse(value);
        return parsed.map((conv) => ({
          ...conv,
          createdAt: new Date(conv.createdAt)
        }));
      } catch {
        return [];
      }
    }
  }
);

/**
 * Creates new conversation metadata
 * Note: This only creates metadata, not the actual messages store
 * @param agentId - The agent ID
 * @returns The new conversation ID
 */
export const createConversationMetadata = (agentId) => {
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const newMetadata = {
    id: conversationId,
    agentId,
    title: null,
    summary: null,
    createdAt: new Date(),
    messageCount: 0
  };

  const currentMetadata = $conversationsMetadata.get();
  $conversationsMetadata.set([newMetadata, ...currentMetadata]);

  return conversationId;
};

/**
 * Updates conversation metadata
 * @param conversationId - The conversation ID
 * @param updates - Partial updates to apply
 */
export const updateConversationMetadata = (
  conversationId,
  updates
) => {
  const metadata = $conversationsMetadata.get();
  const updatedMetadata = metadata.map(conv =>
    conv.id === conversationId ? { ...conv, ...updates } : conv
  );
  $conversationsMetadata.set(updatedMetadata);
};

/**
 * Deletes conversation metadata
 * Note: This doesn't delete the messages from storage
 * Use deleteMessagesFromStorage() separately if needed
 * @param conversationId - The conversation ID
 */
export const deleteConversationMetadata = (conversationId) => {
  const metadata = $conversationsMetadata.get();
  const updatedMetadata = metadata.filter(conv => conv.id !== conversationId);
  $conversationsMetadata.set(updatedMetadata);
};

/**
 * Gets metadata for a specific conversation
 * @param conversationId - The conversation ID
 * @returns Metadata or undefined if not found
 */
export const getMetadataById = (conversationId) => {
  const metadata = $conversationsMetadata.get();
  return metadata.find(conv => conv.id === conversationId);
};

/**
 * Gets all metadata for a specific agent
 * @param agentId - The agent ID
 * @returns Array of metadata sorted by date (newest first)
 */
export const getMetadataByAgent = (agentId) => {
  const metadata = $conversationsMetadata.get();
  return metadata
    .filter(conv => conv.agentId === agentId)
    .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
};

/**
 * Increments the message count for a conversation
 * Useful when adding messages
 * @param conversationId - The conversation ID
 */
export const incrementMessageCount = (conversationId) => {
  const metadata = $conversationsMetadata.get();
  const updatedMetadata = metadata.map(conv =>
    conv.id === conversationId
      ? { ...conv, messageCount: conv.messageCount + 1 }
      : conv
  );
  $conversationsMetadata.set(updatedMetadata);
};

/**
 * Updates the summary for a conversation
 * @param conversationId - The conversation ID
 * @param summary - The summary text
 */
export const updateSummary = (conversationId, summary) => {
  updateConversationMetadata(conversationId, { summary });
};

/**
 * Updates the title and summary for a conversation
 * @param conversationId - The conversation ID
 * @param title - The title text (short, max ~6 words)
 * @param summary - The summary text
 */
export const updateTitleAndSummary = (conversationId, title, summary) => {
  updateConversationMetadata(conversationId, { title, summary });
};

