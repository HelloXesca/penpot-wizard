import { atom, computed } from 'nanostores';
import { tool } from 'ai';
import { tools } from '@/assets/tools/index.js';
import { AGENT_TOOL_IDS } from '@/assets/tools/agentsTools';

let toolsInitialized = false;

// Base atom for tools data
export const $toolsData = atom(tools);

/** Tools available for user selection (excludes system agent tools) */
export const $userSelectableTools = computed($toolsData, (toolsData) =>
  toolsData.filter((t) => !AGENT_TOOL_IDS.includes(t.id))
);

// Derived functions for getters
export const getToolById = (toolId) => {
  const toolsData = $toolsData.get();
  return toolsData.find(t => t.id === toolId) || null;
};

export const getToolsByIds = (toolIds) => {
  const toolsData = $toolsData.get();
  return toolsData.filter(tool => toolIds.includes(tool.id))
};

// Initialize tools uniformly - all tools have a function property
const initializeTool = async (toolDef) => {
  const toolInstance = tool({
    id: toolDef.id,
    name: toolDef.name,
    description: toolDef.description,
    inputSchema: toolDef.inputSchema,
    execute: toolDef.function,
  });

  return {
    ...toolDef,
    instance: toolInstance,
    type: 'function',
  };
};

// Action function for initializing tools
export const initializeTools = async () => {
  if (toolsInitialized) {
    return true;
  }

  try {
    const allTools = await Promise.all(
      tools.map(async (toolDef) => {
        try {
          return await initializeTool(toolDef);
        } catch (error) {
          console.error(`Failed to initialize tool ${toolDef.id}:`, error);
          return toolDef;
        }
      })
    );

    $toolsData.set(allTools);
    toolsInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize tools:', error);
    return false;
  }
};
