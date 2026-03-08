import { getToolById } from "@/stores/toolsStore";
import styles from "./AgentDetailsContent.module.css";

function AgentDetailsContent({ agent }) {
  // Helper function to get tool name by ID
  const getToolName = (toolId) => {
    const tool = getToolById(toolId);
    return tool ? tool.name : toolId;
  };

  return (
    <div className={styles.agentContent}>
      <div className={styles.fieldSection}>
        <strong className={styles.fieldTitle}>Description:</strong>
        <div className={styles.fieldValue}>
          {agent.description}
        </div>
      </div>

      <div className={styles.fieldSection}>
        <strong className={styles.fieldTitle}>System Prompt:</strong>
        <pre className={styles.codeBlock}>
          <code>{agent.system}</code>
        </pre>
      </div>

      <div className={styles.fieldSection}>
        <strong className={styles.fieldTitle}>Linked Tools:</strong>
        <div className={styles.linkedItems}>
          {(agent.toolIds || []).map((toolId) => (
            <span key={toolId} className={styles.linkedItem}>
              {getToolName(toolId)}
            </span>
          ))}
          {(!agent.toolIds || agent.toolIds.length === 0) && (
            <span className={styles.noItems}>None</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentDetailsContent;
