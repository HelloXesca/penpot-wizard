import { MessageSourceName, ClientQueryType } from "@/types/types";
import { isStandaloneMode, getMockResponse } from "@/utils/standaloneUtils";

const PLUGIN_TIMEOUT_MS = 20000;

const pluginUnavailableResponse = (err) => ({
  success: true,
  message: 'Plugin unavailable - running in standalone mode',
  payload: {
    pluginUnavailable: true,
    originalError: err instanceof Error ? err.message : String(err),
  },
});

const pluginErrorResponse = (err) => ({
  success: false,
  message: err instanceof Error ? err.message : 'Failed to communicate with plugin',
  payload: {
    error: err instanceof Error ? err.message : String(err),
  },
});

export const drawShape = async (shapeType, params) => {
  try {
    const response = await sendMessageToPlugin(ClientQueryType.DRAW_SHAPE, {
      shapeType,
      params,
    });
    return response;
  } catch (err) {
    return pluginUnavailableResponse(err);
  }
}

export const sendMessageToPlugin = async (type, payload) => {
  if (isStandaloneMode) {
    return getMockResponse(type);
  }

  try {
    const messageId = crypto.randomUUID();
    const queryMessage = {
      source: MessageSourceName.Client,
      messageId,
      type,
      payload,
    };

    const responseMessagePromise = new Promise((resolve) => {
      const handleMessage = (event) => {
        const { source, messageId: responseMessageId, ...response } = event.data;
        if (
          source === MessageSourceName.Plugin
          && messageId === responseMessageId
        ) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          resolve(response);
        }
      };
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        resolve(pluginErrorResponse(new Error('Failed to send message to plugin')));
      }, PLUGIN_TIMEOUT_MS);
      window.addEventListener('message', handleMessage);
    });

    window.parent.postMessage(queryMessage, '*');

    return responseMessagePromise;
  } catch (err) {
    return pluginErrorResponse(err);
  }
}

