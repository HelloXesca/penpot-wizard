import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { alignShapesSchema, distributeShapesSchema } from '@/types/shapeTypes';

export const toolsLayoutShapes = [
  {
    id: 'align-shapes',
    name: 'AlignShapesTool',
    description: `
      Use this tool to align two or more shapes along an axis.
    `,
    inputSchema: alignShapesSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.ALIGN_SHAPES, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to align shapes: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'distribute-shapes',
    name: 'DistributeShapesTool',
    description: `
      Use this tool to distribute shapes with equal spacing along an axis.
    `,
    inputSchema: distributeShapesSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.DISTRIBUTE_SHAPES, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to distribute shapes: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
