import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { $conversationsMetadata } from '@/stores/conversationsMetadataStore';
import { $activeConversationId } from '@/stores/activeConversationStore';
import { $penpotTheme } from '@/stores/penpotStore';
import {
  $isConversationHistoryPanelClosing,
  requestCloseConversationHistoryPanel,
} from '@/stores/conversationHistoryPanelStore';
import { getAgentById } from '@/stores/agentsStore';
import {
  trySetActiveConversation,
  deleteConversation,
} from '@/stores/conversationActionsStore';
import { isStreaming, setPendingAction } from '@/stores/streamingMessageStore';
import styles from './ConversationHistoryPanel.module.css';

function ConversationHistoryPanel({ isOpen, onClose }) {
  const penpotTheme = useStore($penpotTheme);
  const isClosing = useStore($isConversationHistoryPanelClosing);
  const conversationsMetadata = useStore($conversationsMetadata);
  const activeConversationId = useStore($activeConversationId);

  const sortedConversations = [...conversationsMetadata].sort(
    (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
  );

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleConversationSelect = (conversationId) => {
    const switched = trySetActiveConversation(conversationId);
    if (switched) {
      requestCloseConversationHistoryPanel();
    }
  };

  const handleDeleteConversation = (conversationId, e) => {
    e.stopPropagation();
    if (isStreaming()) {
      setPendingAction({
        type: 'delete_conversation',
        data: { conversationId },
      });
      return;
    }
    deleteConversation(conversationId);
  };

  const shouldRender = isOpen || isClosing;
  if (!shouldRender) return null;

  return createPortal(
    <div data-theme={penpotTheme} className={styles.themeWrapper}>
      <div
        className={`${styles.panel} ${isClosing ? styles.closing : ''}`}
        role="dialog"
        aria-label="Historial de conversaciones"
        onAnimationEnd={handleAnimationEnd}
      >
        <div className={styles.list}>
          {sortedConversations.length === 0 ? (
            <p className={styles.empty}>No hay conversaciones recientes</p>
          ) : (
            sortedConversations.map((conversation) => {
              const agent = getAgentById(conversation.agentId);
              const isActive = conversation.id === activeConversationId;

              return (
                <div
                  key={conversation.id}
                  className={`${styles.item} ${isActive ? styles.active : ''}`}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemSummary} title={conversation.summary || undefined}>
                      {conversation.title || conversation.summary || 'Nueva conversación'}
                      {conversation.title && conversation.summary && (
                        <span className={styles.itemSummarySubtitle}> — {conversation.summary}</span>
                      )}
                    </div>
                    <div className={styles.itemMeta}>
                      <span className={styles.itemAgent}>
                        {agent?.name ?? 'Agente'}
                      </span>
                      <span className={styles.itemDate}>
                        {conversation.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    title="Eliminar conversación"
                    aria-label="Eliminar conversación"
                  >
                    <TrashIcon className={styles.deleteIcon} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConversationHistoryPanel;
