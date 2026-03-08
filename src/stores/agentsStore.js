import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { ToolLoopAgent } from 'ai';
import { agents } from '@/assets/agents/agents';
import { AGENT_TOOL_IDS, COMMON_AGENT_INSTRUCTIONS } from '@/assets/tools/agentsTools';
import { $selectedLanguageModel, $isConnected } from '@/stores/settingsStore';
import { createModelInstance } from '@/utils/modelUtils';
import { getToolsByIds } from '@/stores/toolsStore';
import { $userAgents } from '@/stores/userAgentsStore';

let modelIdInitialized = '';

$userAgents.listen(() => {
  if (!modelIdInitialized) {
    return;
  }
  modelIdInitialized = '';
  initializeAgents();
});

// Base atoms for predefined agents data
const $predefinedAgents = atom(
  agents.map((agent) => ({
    ...agent,
    isUserCreated: false,
  }))
);

// Computed atom that combines predefined and user-created agents (always available, no API needed)
export const $combinedAgents = computed(
  [$predefinedAgents, $userAgents],
  (predefinedAgents, userAgents) => {
    const markedUserAgents = userAgents.map(agent => ({
      ...agent,
      isUserCreated: true,
      icon: agent.icon || 'UserCircleIcon',
    }));
    return [...predefinedAgents, ...markedUserAgents];
  }
);

// Atom for initialized agents (with AI instances)
export const $agentsData = atom([]);

// Persistent atom for active agent - saved to localStorage
export const $activeAgent = persistentAtom(
  'activeAgent',
  agents.length > 0 ? agents[0].id : null,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const getAgentById = (agentId) => {
  const agentsData = $agentsData.get();
  return agentsData.find(d => d.id === agentId) || null;
};

export const setActiveAgent = (agentId) => {
  $activeAgent.set(agentId);
};

export const initializeAgents = () => {
  const agentsData = $combinedAgents.get();
  const isConnected = $isConnected.get();

  if (!isConnected || modelIdInitialized === $selectedLanguageModel.get()) {
    return;
  }

  try {
    const modelInstance = createModelInstance();

    const updatedAgents = agentsData.map(agent => {
      try {
        // Agent tools are always included (system tools); config toolIds are user-selectable only
        const toolIds = [...AGENT_TOOL_IDS, ...(agent.toolIds || [])];
        const allTools = getToolsByIds(toolIds);

        // Common instructions prepended to all agents (not in agent config)
        const instructions = COMMON_AGENT_INSTRUCTIONS + (agent.system || '');

        const agentInstance = new ToolLoopAgent({
          model: modelInstance,
          instructions,
          tools: allTools.reduce((acc, t) => {
            acc[t.id] = t.instance;
            return acc;
          }, {}),
        });

        return {
          ...agent,
          instance: agentInstance
        };
      } catch (error) {
        console.error(`Failed to initialize agent ${agent.id}:`, error);
        return {
          ...agent,
          instance: undefined,
        };
      }
    });

    $agentsData.set(updatedAgents);
    modelIdInitialized = $selectedLanguageModel.get();

    const activeAgentId = $activeAgent.get();
    const activeAgentExists = updatedAgents.some(a => a.id === activeAgentId);

    if (!activeAgentExists && updatedAgents.length > 0) {
      $activeAgent.set(updatedAgents[0].id);
    }
  } catch (error) {
    console.error('Failed to initialize agents:', error);
  }
};
