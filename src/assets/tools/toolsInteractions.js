import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import {
  addNavigateToInteractionSchema,
  addCloseOverlayInteractionSchema,
  addPreviousScreenInteractionSchema,
  addOpenUrlInteractionSchema,
} from '@/types/shapeTypes';

export const toolsInteractions = [
  {
    id: 'add-navigate-to-interaction',
    name: 'AddNavigateToInteractionTool',
    description: `
      Add a navigate-to interaction to a shape (e.g. button). When triggered, goes to another board.
      Triggers: click, mouse-enter, mouse-leave, after-delay (requires delay in ms).
      Use get-current-page to get board IDs.
    `,
    inputSchema: addNavigateToInteractionSchema,
    function: async (input) => {
      try {
        const { shapeId, trigger, delay, destinationBoardId, preserveScrollPosition, animation } =
          input;
        const payload = {
          shapeId,
          trigger,
          delay,
          action: { type: 'navigate-to', destinationBoardId, preserveScrollPosition, animation },
        };
        return await sendMessageToPlugin(ClientQueryType.ADD_INTERACTION, payload);
      } catch (error) {
        return {
          success: false,
          message: `Failed to add interaction: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'add-close-overlay-interaction',
    name: 'AddCloseOverlayInteractionTool',
    description: `
      Add a close-overlay interaction to a shape. Closes the current or specified overlay.
      Triggers: click, mouse-enter, mouse-leave, after-delay (requires delay in ms).
    `,
    inputSchema: addCloseOverlayInteractionSchema,
    function: async (input) => {
      try {
        const { shapeId, trigger, delay, destinationBoardId, animation } = input;
        const payload = {
          shapeId,
          trigger,
          delay,
          action: { type: 'close-overlay', destinationBoardId, animation },
        };
        return await sendMessageToPlugin(ClientQueryType.ADD_INTERACTION, payload);
      } catch (error) {
        return {
          success: false,
          message: `Failed to add interaction: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'add-previous-screen-interaction',
    name: 'AddPreviousScreenInteractionTool',
    description: `
      Add a previous-screen interaction to a shape. Goes back to the previous screen in the flow.
      Triggers: click, mouse-enter, mouse-leave, after-delay (requires delay in ms).
    `,
    inputSchema: addPreviousScreenInteractionSchema,
    function: async (input) => {
      try {
        const { shapeId, trigger, delay } = input;
        const payload = { shapeId, trigger, delay, action: { type: 'previous-screen' } };
        return await sendMessageToPlugin(ClientQueryType.ADD_INTERACTION, payload);
      } catch (error) {
        return {
          success: false,
          message: `Failed to add interaction: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'add-open-url-interaction',
    name: 'AddOpenUrlInteractionTool',
    description: `
      Add an open-url interaction to a shape. Opens a URL in a new browser tab.
      Triggers: click, mouse-enter, mouse-leave, after-delay (requires delay in ms).
    `,
    inputSchema: addOpenUrlInteractionSchema,
    function: async (input) => {
      try {
        const { shapeId, trigger, delay, url } = input;
        const payload = { shapeId, trigger, delay, action: { type: 'open-url', url } };
        return await sendMessageToPlugin(ClientQueryType.ADD_INTERACTION, payload);
      } catch (error) {
        return {
          success: false,
          message: `Failed to add interaction: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
