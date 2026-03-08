import {
  getAgentById,
  initializeAgents,
} from '@/stores/agentsStore';
import { getAbortSignal } from '@/stores/streamingMessageStore';
import { StreamHandler } from '@/utils/streamingMessageUtils';

/**
 * Consumes the agent stream and returns the accumulated text.
 * Does not update UI - suitable for programmatic use from within tool execute.
 * @param {AsyncIterable} fullStream - The fullStream from agent.stream()
 * @returns {Promise<string>} The complete text response
 */
async function consumeStreamToText(fullStream) {
  let fullResponse = '';
  for await (const chunk of fullStream) {
    if (chunk.type === 'text-delta') {
      fullResponse += chunk.text;
    }
  }
  return fullResponse;
}

/**
 * Sends a query to an agent and returns its text response.
 * Use this from within a tool's execute to delegate work to an agent.
 *
 * When parentToolCallId is provided, uses StreamHandler so tool calls from the
 * sub-agent are shown in the conversation as nested under the parent tool call.
 *
 * @param {{ id: string, query: object, parentToolCallId?: string }} params
 * @param {string} params.id - The agent ID (e.g. 'penpot-wizard')
 * @param {object} params.query - The query object to send (will be JSON-stringified as user message)
 * @param {string} [params.parentToolCallId] - Tool call ID of the caller; when set, sub-agent tool calls are shown in UI
 * @returns {Promise<string>} The agent's text response
 * @throws {Error} If agent not found, not initialized, or execution fails
 *
 * @example
 * // From within a tool's execute (with parentToolCallId for UI visibility):
 * const result = await queryAgent({
 *   id: 'penpot-wizard',
 *   query: { query: 'How do I create a rounded rectangle?' },
 *   parentToolCallId: toolCallId,
 * });
 */
export async function queryAgent({ id, query, parentToolCallId }) {
  initializeAgents();

  const agent = getAgentById(id);
  if (!agent) {
    throw new Error(`Agent not found: ${id}`);
  }
  if (!agent.instance) {
    throw new Error(`Agent not initialized: ${id}`);
  }

  const abortSignal = getAbortSignal();
  const stream = await agent.instance.stream({
    messages: [{ role: 'user', content: JSON.stringify(query) }],
    ...(abortSignal && { abortSignal }),
  });

  if (parentToolCallId) {
    const streamHandler = new StreamHandler(stream.fullStream, parentToolCallId);
    return streamHandler.handleStream();
  }

  return consumeStreamToText(stream.fullStream);
}

/**
 * Streams an agent with a full conversation (messages array).
 * Use when passing a conversation to another agent so it can respond.
 *
 * @param {{ id: string, messages: Array, parentToolCallId?: string }} params
 * @param {string} params.id - The agent ID
 * @param {Array} params.messages - Messages in AI SDK format (user, assistant, system)
 * @param {string} [params.parentToolCallId] - Tool call ID for nested UI display
 * @returns {Promise<string>} The agent's text response
 */
export async function streamAgentWithMessages({ id, messages, parentToolCallId }) {
  initializeAgents();

  const agent = getAgentById(id);
  if (!agent) {
    throw new Error(`Agent not found: ${id}`);
  }
  if (!agent.instance) {
    throw new Error(`Agent not initialized: ${id}`);
  }

  const abortSignal = getAbortSignal();
  const stream = await agent.instance.stream({
    messages,
    ...(abortSignal && { abortSignal }),
  });

  if (parentToolCallId) {
    const streamHandler = new StreamHandler(stream.fullStream, parentToolCallId);
    return streamHandler.handleStream();
  }

  return consumeStreamToText(stream.fullStream);
}
