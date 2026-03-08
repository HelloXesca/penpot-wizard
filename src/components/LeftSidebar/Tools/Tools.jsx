import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { $userSelectableTools } from "@/stores/toolsStore";
import { toJSONSchema } from "zod";
import SchemaVisor from "@/components/LeftSidebar/AgentsList/SchemaVisor/SchemaVisor";
import styles from "./Tools.module.css";

function Tools() {
  const [expandedTools, setExpandedTools] = useState({});
  const [toolSchemas, setToolSchemas] = useState({});

  // Get tools data from the store (excludes system agent tools)
  const tools = useStore($userSelectableTools);

  // Convert schemas when tools change
  useEffect(() => {
    const convertSchemas = () => {
      const schemas = {};
      tools.forEach(tool => {
        if (tool.inputSchema) {
          try {
            const schemaParsed = tool.inputSchema ? toJSONSchema(tool.inputSchema) : null;
            schemas[tool.id] = schemaParsed;
          } catch (error) {
            console.error(`Error parsing schema for tool ${tool.id}:`, error);
            schemas[tool.id] = null;
          }
        }
      });
      setToolSchemas(schemas);
    };
    
    convertSchemas();
  }, [tools]);
  const toggleTool = (toolId) => {
    setExpandedTools((prev) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  // Note: Create/Edit/Delete functionality removed as tools are now managed by the store

  return (
    <div className={styles.toolsContainer}>
      {/* Create Tool Button - Hidden for now */}
      <div className={styles.createToolSection}>
        <button
          className={styles.createToolButton}
          onClick={() => {}}
          disabled
          title="Available soon"
        >
          <PlusIcon className={styles.plusIcon} />
          Create New Tool
        </button>
      </div>


      {/* Tools List */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Existing Tools</h3>
        <p className={styles.sectionDescription}>
          Manage and view all available tools in the system.
        </p>

        {tools.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No tools available. Tools will be loaded from the store.</p>
          </div>
        ) : (
          <div className={styles.toolsList}>
            {tools.map((tool) => (
              <div
                key={tool.id}
                className={styles.toolItem}
              >
                <div className={styles.toolHeader}>
                  <button
                    className={styles.toolHeaderButton}
                    onClick={() => toggleTool(tool.id)}
                  >
                    <div className={styles.toolInfo}>
                      <div className={styles.toolNameRow}>
                        <h4 className={styles.toolName}>{tool.name}</h4>
                        <span className={`${styles.toolType} ${styles[tool.type]}`}>
                          {tool.type}
                        </span>
                      </div>
                      <span className={styles.toolTechnicalName}>
                        {tool.id}
                      </span>
                    </div>
                    {expandedTools[tool.id] ? (
                      <ChevronDownIcon className={styles.chevronIcon} />
                    ) : (
                      <ChevronRightIcon className={styles.chevronIcon} />
                    )}
                  </button>
                </div>

                {expandedTools[tool.id] && (
                  <div className={styles.toolContent}>
                    <div className={styles.toolDescription}>
                      <strong>Description:</strong>
                    </div>
                    <div className={styles.toolDescriptionText}>
                      {tool.description}
                    </div>
                    {tool.inputSchema && (
                      <div className={styles.toolCode}>
                        <strong>Input Schema:</strong>
                        <SchemaVisor schema={toolSchemas[tool.id]} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Tools;
