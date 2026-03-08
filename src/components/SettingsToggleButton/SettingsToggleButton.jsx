import { useStore } from '@nanostores/react'
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { $isSettingsPanelOpen, toggleSettingsPanel } from '@/stores/settingsPanelStore'
import styles from './SettingsToggleButton.module.css'

function SettingsToggleButton() {
  const isOpen = useStore($isSettingsPanelOpen)

  return (
    <button
      className={styles.button}
      onClick={toggleSettingsPanel}
      title={isOpen ? 'Close settings' : 'Settings'}
      aria-label={isOpen ? 'Close settings' : 'Open settings'}
    >
      {isOpen ? (
        <XMarkIcon className={styles.icon} />
      ) : (
        <Cog6ToothIcon className={styles.icon} />
      )}
    </button>
  )
}

export default SettingsToggleButton
