import { z } from 'zod';
import { queryAgent } from '@/utils/agentUtils';
import { agents } from '@/assets/agents/agents';
import { getAgentById, setActiveAgent, $activeAgent, initializeAgents } from '@/stores/agentsStore';
import { getActiveConversationId } from '@/stores/activeConversationStore';
import { setPendingHandoff, abortCurrentStream } from '@/stores/streamingMessageStore';

/** IDs of system agent tools - always added to every agent, not user-selectable */
export const AGENT_TOOL_IDS = ['send-query-to-agent', 'pass-conversation-to-agent'];

/** Common instructions prepended to all agents at creation (not shown in agent config) */
export const COMMON_AGENT_INSTRUCTIONS = `
<context>
- You work in Penpot, a professional vector design and user interface software.
- You are part of the support agent team; this team's task is to help Penpot users develop their projects.
- Teamwork is essential: use the rest of the team agents whenever you need them.
</context>

<communication>
- Use technical language.
- Reply in the user's language.
- Avoid excessive explanations and prose; be concise.
- Communicate professionally—you are a professional tool.
- Be direct and actionable.
</communication>
`;

const agentsListDescription = agents
  .map((a) => `- ${a.id}: ${(a.description || a.name || '')}`)
  .join('\n');

/**
 * Tool that allows an agent to send a query to another agent and receive its response.
 * Use this to delegate specialized tasks (design systems, drawing, modification, etc.)
 * to the appropriate agent.
 */
export const sendQueryToAgentTool = {
  id: 'send-query-to-agent',
  name: 'SendQueryToAgentTool',
  inputSchema: z.object({
    agentId: z
      .string()
      .min(1)
      .describe(`ID of the target agent. Available: ${agents.map((a) => a.id).join(', ')}`),
    query: z.string().min(1).describe(
      'The natural language query or request to send to the target agent. Be specific and include all context needed for the agent to respond.'
    ),
  }),
  description: `
    Send a query to another agent and receive its response. Use this tool when you need to:
    - Delegate a task to a specialized agent (e.g. Designer for design systems, Drawer for shapes)
    - Get expert advice from an agent with different tools or knowledge
    - Ask another agent to perform work outside your scope

    Available agents (from agents.js):
    ${agentsListDescription}

    The target agent receives your query as a user message and responds with its full capabilities (tools, RAG, etc.).
    Use clear, complete queries so the target agent has enough context to respond.
  `,
  function: async ({ agentId, query }, { toolCallId }) => {
    try {
      const response = await queryAgent({
        id: agentId,
        query: { query },
        parentToolCallId: toolCallId,
      });

      return {
        success: true,
        message: `Received response from agent "${agentId}".`,
        payload: response,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to query agent "${agentId}": ${error.message}`,
        payload: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * Tool that passes the current conversation to another agent.
 * Sets the target agent as active and adds a system message informing the handoff.
 * The new agent receives the full conversation plus the handoff context.
 */
export const passConversationToAgentTool = {
  id: 'pass-conversation-to-agent',
  name: 'PassConversationToAgentTool',
  inputSchema: z.object({
    agentId: z
      .string()
      .min(1)
      .describe(`ID of the target agent. Available: ${agents.map((a) => a.id).join(', ')}`),
  }),
  description: `
    Pass the current conversation to another agent. This tool:
    - Sets the target agent as active
    - Adds a system message informing that the previous agent has passed the conversation
    - Sends the full conversation to the new agent so it responds immediately

    Use when the user wants to hand off to a specialized agent
    (e.g. Designer for design systems, Drawer for drawing tasks).

    Available agents:
    ${agentsListDescription}
  `,
  function: async ({ agentId }) => {
    try {
      const activeConversationId = getActiveConversationId();
      if (!activeConversationId) {
        return {
          success: false,
          message: 'No active conversation to pass.',
          payload: null,
        };
      }

      initializeAgents();
      const agent = getAgentById(agentId);
      if (!agent) {
        return {
          success: false,
          message: `Agent not found: ${agentId}`,
          payload: null,
        };
      }

      const previousAgentId = $activeAgent.get();
      const previousAgent = previousAgentId ? getAgentById(previousAgentId) : null;
      const previousAgentName = previousAgent?.name || previousAgentId || 'previous agent';

      const handoffContent = `The agent "${previousAgentName}" has passed this conversation to ${agent.name}.`;

      setPendingHandoff({ agentId, handoffContent });
      setActiveAgent(agentId);
      abortCurrentStream();

      return {
        success: true,
        message: `Conversation passed to agent "${agentId}".`,
        payload: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to pass conversation to agent: ${error.message}`,
        payload: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const agentsTools = [sendQueryToAgentTool, passConversationToAgentTool];
