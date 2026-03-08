import { useStore } from "@nanostores/react";
import { $agentsData, $activeAgent, setActiveAgent } from "@/stores/agentsStore";
import { getAgentIconComponent } from "@/utils/agentIcons";
import styles from "./EntryAgentSelector.module.css";

function EntryAgentSelector() {
  const agentsData = useStore($agentsData);
  const activeAgentId = useStore($activeAgent);

  const handleEntryAgentChange = (agentId) => {
    setActiveAgent(agentId);
  };

  return (
    <div className={styles.compactSection}>
      <div className={styles.formGroup}>
        <label htmlFor="entry-agent" className={styles.label}>
          Entry Agent <span className={styles.required}>*</span>
        </label>
        <div className={styles.selectWrapper}>
          {activeAgentId && (() => {
            const agent = agentsData.find((a) => a.id === activeAgentId);
            const AgentIcon = getAgentIconComponent(agent?.icon);
            return <AgentIcon className={styles.selectIcon} aria-hidden />;
          })()}
          <select
            id="entry-agent"
            value={activeAgentId || ""}
            onChange={(e) => handleEntryAgentChange(e.target.value)}
            className={styles.select}
          >
            <option value="">Select an agent...</option>
            {agentsData.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default EntryAgentSelector;
