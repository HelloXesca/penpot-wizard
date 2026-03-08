import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { AgentIcon } from "@/utils/agentIcons";
import AgentDetailsContent from "./AgentDetailsContent/AgentDetailsContent";
import styles from "./AgentDetailsCard.module.css";

function AgentDetailsCard({ agent, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.agentItem}>
      <div className={styles.agentHeader}>
        <button
          className={styles.agentHeaderButton}
          onClick={toggleExpanded}
        >
          <AgentIcon iconName={agent?.icon} className={styles.agentListIcon} aria-hidden />
          <div className={styles.agentInfo}>
            <div className={styles.agentNameRow}>
              <h4 className={styles.agentName}>{agent.name}</h4>
              <div className={styles.badgeContainer}>
                <span
                  className={`${styles.agentType} ${
                    styles[agent.type || "system"]
                  }`}
                >
                  {agent.type || "system"}
                </span>
                {agent.isUserCreated && (
                  <span className={`${styles.agentType} ${styles.userCreated}`}>
                    User Created
                  </span>
                )}
              </div>
            </div>
            <span className={styles.agentTechnicalName}>
              {agent.id}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDownIcon className={styles.chevronIcon} />
          ) : (
            <ChevronRightIcon className={styles.chevronIcon} />
          )}
        </button>

        {agent.isUserCreated && (
          <div className={styles.agentActions}>
            <button
              className={styles.actionButton}
              onClick={() => onEdit(agent)}
              title="Edit agent"
            >
              <PencilIcon className={styles.actionIcon} />
            </button>
            <button
              className={styles.actionButton}
              onClick={() => onDelete(agent.id, agent.type)}
              title="Delete agent"
            >
              <TrashIcon className={styles.actionIcon} />
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <>
          <AgentDetailsContent agent={agent} />
        </>
      )}
    </div>
  );
}

export default AgentDetailsCard;
