import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@nanostores/react";
import SettingsForm from "@/components/LeftSidebar/SettingsForm/SettingsForm";
import AgentsList from "@/components/LeftSidebar/AgentsList/AgentsList";
import Tools from "@/components/LeftSidebar/Tools/Tools";
import { $isConnected } from "@/stores/settingsStore";
import { $penpotTheme } from "@/stores/penpotStore";
import { $isSettingsPanelClosing } from "@/stores/settingsPanelStore";
import styles from "./SettingsPanel.module.css";

function SettingsPanel({ isOpen, onClose }) {
  const penpotTheme = useStore($penpotTheme);
  const isClosing = useStore($isSettingsPanelClosing);
  const [activeTab, setActiveTab] = useState("settings");
  const isConnected = useStore($isConnected);

  const isConfigComplete = isConnected;

  useEffect(() => {
    if (!isConfigComplete && isOpen) {
      setActiveTab("settings");
    }
  }, [isConfigComplete, isOpen]);

  const handleAnimationEnd = () => {
    if (isClosing) {
      onClose();
    }
  };

  const shouldRender = isOpen || isClosing;
  if (!shouldRender) return null;

  return createPortal(
    <div data-theme={penpotTheme} className={styles.themeWrapper}>
      <div
          className={`${styles.panel} ${isClosing ? styles.closing : ""}`}
          role="dialog"
          aria-label="Settings panel"
          onAnimationEnd={handleAnimationEnd}
        >
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "settings" ? styles.active : ""
            } ${!isConfigComplete ? styles.disabled : ""}`}
            onClick={() => setActiveTab("settings")}
            disabled={!isConfigComplete}
          >
            AI Settings
            <span
              className={
                !isConfigComplete ? styles.warningDot : styles.successDot
              }
            />
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "agents" ? styles.active : ""
            } ${!isConfigComplete ? styles.disabled : ""}`}
            onClick={() => setActiveTab("agents")}
            disabled={!isConfigComplete}
          >
            Agents
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "tools" ? styles.active : ""
            } ${!isConfigComplete ? styles.disabled : ""}`}
            onClick={() => setActiveTab("tools")}
            disabled={!isConfigComplete}
          >
            Tools
          </button>
        </div>

        <div className={styles.tabContent}>
          <div
            className={`${styles.tabPanel} ${
              activeTab === "settings" ? styles.active : ""
            }`}
          >
            <SettingsForm />
          </div>
          <div
            className={`${styles.tabPanel} ${
              activeTab === "agents" ? styles.active : ""
            }`}
          >
            <AgentsList />
          </div>
          <div
            className={`${styles.tabPanel} ${
              activeTab === "tools" ? styles.active : ""
            }`}
          >
            <Tools />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SettingsPanel;
