import { getAgentById } from '@/stores/agentsStore';
import { AgentIcon } from '@/utils/agentIcons';
import styles from './AgentBadge.module.css';

/**
 * Badge that displays agent icon and name for assistant messages
 */
function AgentBadge({ agentId }) {
  if (!agentId) return null;

  const agent = getAgentById(agentId);
  const displayName = agent?.name || agentId;

  return (
    <div className={styles.agentBadge}>
      <AgentIcon iconName={agent?.icon} className={styles.agentIcon} aria-hidden />
      <span className={styles.agentName}>{displayName}</span>
    </div>
  );
}

export default AgentBadge;
