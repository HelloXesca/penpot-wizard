import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { reorderShapeSchema } from '@/types/shapeTypes';

export const toolsReorderShapes = [
  {
    id: 'bring-to-front-shape',
    name: 'BringToFrontShapeTool',
    description: `
      Brings a shape to the front (top of the stacking order).
      Provide the shapeId. Use get-current-page or get-selected-shapes to get shape IDs.
    `,
    inputSchema: reorderShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.BRING_TO_FRONT_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to bring shape to front: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'bring-forward-shape',
    name: 'BringForwardShapeTool',
    description: `
      Brings a shape one step forward in the stacking order.
      Provide the shapeId.
    `,
    inputSchema: reorderShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.BRING_FORWARD_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to bring shape forward: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'send-to-back-shape',
    name: 'SendToBackShapeTool',
    description: `
      Sends a shape to the back (bottom of the stacking order).
      Provide the shapeId.
    `,
    inputSchema: reorderShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.SEND_TO_BACK_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to send shape to back: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'send-backward-shape',
    name: 'SendBackwardShapeTool',
    description: `
      Sends a shape one step backward in the stacking order.
      Provide the shapeId.
    `,
    inputSchema: reorderShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.SEND_BACKWARD_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to send shape backward: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
