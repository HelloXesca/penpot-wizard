import { useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Cog6ToothIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { getAgentById } from '@/stores/agentsStore'
import {
  $isSettingsPanelOpen,
  openSettingsPanel,
  requestCloseSettingsPanel,
  closeSettingsPanel,
} from '@/stores/settingsPanelStore'
import {
  $isConversationHistoryPanelOpen,
  openConversationHistoryPanel,
  requestCloseConversationHistoryPanel,
  closeConversationHistoryPanel,
} from '@/stores/conversationHistoryPanelStore'
import { $conversationsMetadata } from '@/stores/conversationsMetadataStore'
import { $activeConversationId } from '@/stores/activeConversationStore'
import { goToNewConversation } from '@/stores/conversationActionsStore'
import styles from './Header.module.css'

const HOVER_TITLES = {
  settings: 'Settings',
  history: 'Historial de conversaciones',
  new: 'Nueva conversación',
  closeSettings: 'Cerrar settings',
  closeHistory: 'Cerrar historial',
}

function Header() {
  const [hoveredButton, setHoveredButton] = useState(null)
  const isSettingsOpen = useStore($isSettingsPanelOpen)
  const isHistoryPanelOpen = useStore($isConversationHistoryPanelOpen)
  const activeConversationId = useStore($activeConversationId)
  const conversationsMetadata = useStore($conversationsMetadata)

  const activeConversationMetadata = activeConversationId
    ? conversationsMetadata.find((m) => m.id === activeConversationId)
    : null

  const activeAgent = activeConversationMetadata?.agentId
    ? getAgentById(activeConversationMetadata.agentId)
    : null

  const handleOpenSettings = () => {
    closeConversationHistoryPanel()
    openSettingsPanel()
  }

  const handleOpenHistory = () => {
    closeSettingsPanel()
    openConversationHistoryPanel()
  }

  const getSectionTitle = () => {
    if (hoveredButton) return HOVER_TITLES[hoveredButton]
    if (isSettingsOpen) return 'Settings'
    if (isHistoryPanelOpen) return 'Historial de conversaciones'
    if (!activeConversationId) return 'Nueva conversación'
    return (
      activeConversationMetadata?.title ||
      activeConversationMetadata?.summary ||
      activeAgent?.name ||
      'Conversación'
    )
  }

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h1 className={styles.sectionTitle}>{getSectionTitle()}</h1>
      </div>

      <div className={styles.rightSection}>
        {isSettingsOpen ? (
          <button
            className={styles.iconBtn}
            onClick={requestCloseSettingsPanel}
            title="Cerrar settings"
            aria-label="Cerrar configuración"
            onMouseEnter={() => setHoveredButton('closeSettings')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <XMarkIcon className={styles.icon} />
          </button>
        ) : (
          <button
            className={styles.iconBtn}
            onClick={handleOpenSettings}
            title="Settings"
            aria-label="Abrir configuración"
            onMouseEnter={() => setHoveredButton('settings')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Cog6ToothIcon className={styles.icon} />
          </button>
        )}
        {isHistoryPanelOpen ? (
          <button
            className={styles.iconBtn}
            onClick={requestCloseConversationHistoryPanel}
            title="Cerrar historial"
            aria-label="Cerrar historial"
            onMouseEnter={() => setHoveredButton('closeHistory')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <XMarkIcon className={styles.icon} />
          </button>
        ) : (
          <button
            className={styles.iconBtn}
            onClick={handleOpenHistory}
            title="Historial de conversaciones"
            aria-label="Abrir historial de conversaciones"
            onMouseEnter={() => setHoveredButton('history')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <ClockIcon className={styles.icon} />
          </button>
        )}
        <button
          className={styles.iconBtn}
          onClick={goToNewConversation}
          title="Nueva conversación"
          aria-label="Nueva conversación"
          onMouseEnter={() => setHoveredButton('new')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <PlusIcon className={styles.icon} />
        </button>
      </div>
    </header>
  )
}

export default Header
