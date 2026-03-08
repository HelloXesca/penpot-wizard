/**
 * Converts messages from localStorage / getActiveMessages() format to AI SDK format.
 *
 * - User messages: passed as-is (hidden ones skipped)
 * - Assistant messages: only text content
 * - System messages: passed as-is (e.g. handoff context)
 *
 * @param messages - Array of messages in storage format
 * @returns {Array<object>} Messages in AI SDK format for stream({ messages })
 */
export function convertMessagesForAgent(messages) {
  const result = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (msg.hidden) continue;
      result.push({
        role: 'user',
        content: msg.content ?? ''
      });
    } else if (msg.role === 'assistant') {
      const textContent = (msg.content && String(msg.content).trim()) || '';
      if (textContent) {
        result.push({ role: 'assistant', content: textContent });
      }
    } else if (msg.role === 'system') {
      const textContent = (msg.content && String(msg.content).trim()) || '';
      if (textContent) {
        result.push({ role: 'system', content: textContent });
      }
    }
  }
  return result;
}
