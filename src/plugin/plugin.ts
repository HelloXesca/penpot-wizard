import {
  PluginMessageType,
  ClientQueryType,
  MessageSourceName,
  ClientMessage,
  AddImageQueryPayload,
  DrawShapeQueryPayload,
  PluginResponseMessage,
} from '../types/types';
import type { Shape } from '@penpot/plugin-types';

import { handleDrawShape } from './drawHandlers';
import { handleGetProjectData, handleGetUserData, handleAddImage, getCurrentPage, getAvailableFonts, updateCurrentSelection } from './mainHandlers';

console.log('AI Agent Chat Plugin loaded successfully!')

// Listen for selection changes
penpot.on('selectionchange', (selectedIds: string[]) => {
  console.log('🔍 Selection change event fired with IDs:', selectedIds);
  try {
    // Defensive check: ensure selectedIds is an array of strings
    if (Array.isArray(selectedIds)) {
      const validIds = selectedIds.filter(id => typeof id === 'string' && id.length > 0);
      console.log('✅ Filtered valid IDs:', validIds);
      updateCurrentSelection(validIds);
    } else {
      console.warn('❌ Selection change event received invalid data:', selectedIds);
      updateCurrentSelection([]);
    }
  } catch (error) {
    console.warn('❌ Error in selection change handler:', error);
    updateCurrentSelection([]);
  }
});

// Initial selection will be captured by the selectionchange listener when user makes selections
console.log('Plugin loaded - selection tracking active');

// Try to capture initial selection on plugin load (safe way with timeout)
setTimeout(() => {
  try {
    console.log('🔍 Checking for initial selection...');
    const directSel = (penpot as unknown as { selection: Shape[] }).selection;
    if (directSel && Array.isArray(directSel) && directSel.length > 0) {
      const initialIds = directSel
        .map((shape) => shape?.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0);
      if (initialIds.length > 0) {
        console.log('📝 Capturing initial selection:', initialIds);
        updateCurrentSelection(initialIds);
      }
    } else {
      console.log('ℹ️ No initial selection found');
    }
  } catch (error) {
    console.warn('⚠️ Could not capture initial selection:', error);
  }
}, 100); // Shorter timeout for more responsive initial capture

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
  const { type, messageId, payload, source } = message;

  if (source !== MessageSourceName.Client) {
    return ;
  }

  let responseMessage: PluginResponseMessage;

  switch (type) {
    case ClientQueryType.DRAW_SHAPE:
      responseMessage = handleDrawShape(payload as DrawShapeQueryPayload);
      break;

    case ClientQueryType.ADD_IMAGE:
      responseMessage = await handleAddImage(payload as AddImageQueryPayload);
      break;

    case ClientQueryType.GET_USER_DATA:
      responseMessage = handleGetUserData();
      break;

    case ClientQueryType.GET_PROJECT_DATA:
      responseMessage = handleGetProjectData();
      break;

    case ClientQueryType.GET_AVAILABLE_FONTS:
      responseMessage = getAvailableFonts();
      break;

    case ClientQueryType.GET_CURRENT_PAGE:
      responseMessage = getCurrentPage();
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
