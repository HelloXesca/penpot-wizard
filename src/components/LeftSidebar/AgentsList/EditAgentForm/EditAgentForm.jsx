import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { $userSelectableTools } from "@/stores/toolsStore";
import { 
  createUserAgent, 
  updateUserAgent,
} from "@/stores/userAgentsStore";
import styles from "./EditAgentForm.module.css";

function EditAgentForm({ agentToEdit, onClose }) {
  const userSelectableTools = useStore($userSelectableTools);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    technical_name: "",
    description: "",
    prompt: "",
    linked_tools: [],
  });

  // Initialize form data when agentToEdit changes
  useEffect(() => {
    if (agentToEdit) {
      setFormData({
        name: agentToEdit.name || "",
        technical_name: agentToEdit.technical_name || agentToEdit.id || "",
        description: agentToEdit.description || "",
        prompt: agentToEdit.system || "",
        linked_tools: agentToEdit.toolIds || [],
      });
    } else {
      setFormData({
        name: "",
        technical_name: "",
        description: "",
        prompt: "",
        linked_tools: [],
      });
    }
  }, [agentToEdit]);

  // Available tools for selection (excludes system agent tools)
  const availableTools = userSelectableTools.map(tool => ({
    id: tool.id,
    name: tool.name,
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToolToggle = (toolId) => {
    setFormData(prev => ({
      ...prev,
      linked_tools: prev.linked_tools.includes(toolId)
        ? prev.linked_tools.filter(id => id !== toolId)
        : [...prev.linked_tools, toolId],
    }));
  };

  const handleSave = () => {
    if (
      formData.name &&
      formData.technical_name &&
      formData.description &&
      formData.prompt
    ) {
      try {
        const agentData = {
          id: agentToEdit ? agentToEdit.id : Date.now().toString(),
          name: formData.name,
          description: formData.description,
          system: formData.prompt,
          toolIds: formData.linked_tools,
        };
        
        if (agentToEdit) {
          updateUserAgent(agentData);
        } else {
          createUserAgent(agentData);
        }
        
        onClose();
      } catch (error) {
        console.error("Error saving agent:", error);
        alert(`Error saving agent: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const isFormValid = formData.name && formData.technical_name && formData.description && formData.prompt;

  return (
    <div className={styles.fullscreenContainer}>
      {/* Header with close button */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          {agentToEdit ? "Edit Agent" : "Create New Agent"}
        </h3>
        <button
          className={styles.closeButton}
          onClick={handleCancel}
          title="Close form"
        >
          <XMarkIcon className={styles.closeIcon} />
        </button>
      </div>

      {/* Form content */}
      <div className={styles.content}>
        <p className={styles.description}>
          {agentToEdit
            ? "Modify the agent properties, prompt, and linked tools."
            : "Define a new agent with its properties, prompt, and linked tools."}
        </p>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="agent-name" className={styles.label}>
              Agent Name <span className={styles.required}>*</span>
            </label>
            <input
              id="agent-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={styles.input}
              placeholder="e.g., Design Assistant"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="agent-technical-name" className={styles.label}>
              Technical Name <span className={styles.required}>*</span>
            </label>
            <input
              id="agent-technical-name"
              type="text"
              value={formData.technical_name}
              onChange={(e) => handleInputChange("technical_name", e.target.value)}
              className={styles.input}
              placeholder="e.g., design_assistant"
            />
            <small className={styles.helpText}>
              Used internally by the system (lowercase, underscores)
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="agent-description" className={styles.label}>
              Description <span className={styles.required}>*</span>
            </label>
            <textarea
              id="agent-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={styles.textarea}
              placeholder="Describe what this agent does..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="agent-prompt" className={styles.label}>
              System Prompt <span className={styles.required}>*</span>
            </label>
            <textarea
              id="agent-prompt"
              value={formData.prompt}
              onChange={(e) => handleInputChange("prompt", e.target.value)}
              className={styles.codeTextarea}
              placeholder="Enter the system prompt for this agent..."
              rows={8}
            />
            <small className={styles.helpText}>
              System prompt that defines the agent's behavior and personality
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Linked Tools</label>
            <div className={styles.selectionGrid}>
              {availableTools.map((tool) => (
                <label key={tool.id} className={styles.selectionItem}>
                  <input
                    type="checkbox"
                    checked={formData.linked_tools.includes(tool.id)}
                    onChange={() => handleToolToggle(tool.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.selectionLabel}>{tool.name}</span>
                </label>
              ))}
            </div>
            <small className={styles.helpText}>
              Select which tools this agent can use
            </small>
          </div>
        </div>

        {/* Action buttons */}
        <div className={styles.actionButtons}>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveButton}
            disabled={!isFormValid}
          >
            {agentToEdit ? "Update Agent" : "Create Agent"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditAgentForm;
