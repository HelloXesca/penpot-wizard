import {
  PluginMessageType,
  ClientQueryType,
  MessageSourceName,
  ClientMessage,
  PluginResponseMessage,
} from '../types/types';

import { getFileVersions } from './mainHandlers';

console.log('AI Agent Chat Plugin loaded successfully!')

// Open the plugin UI with current theme
penpot.ui.open("AI Penpot Wizard", `?theme=${penpot.theme}`, {
  width: 500,
  height: 700,
});

// Listen for theme change events from Penpot
penpot.on('themechange', (newTheme: string) => {
  penpot.ui.sendMessage({
    type: PluginMessageType.THEME_CHANGE,
    payload: { theme: newTheme },
  });
});

penpot.ui.onMessage(async (message: ClientMessage) => {
  const { type, messageId, source } = message;

  if (source !== MessageSourceName.Client) {
    return ;
  }

  let responseMessage: PluginResponseMessage;

  switch (type) {
    case ClientQueryType.GET_FILE_VERSIONS:
      responseMessage = await getFileVersions();
      break;

    default:
      responseMessage = {
        source: MessageSourceName.Plugin,
        type: type,
        messageId: messageId,
        message: `unknown command: ${type}`,
        success: false,
      };
      break;
  }
  responseMessage.messageId = messageId;
  penpot.ui.sendMessage(responseMessage);
});
