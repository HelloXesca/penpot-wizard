import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { createFlowSchema, removeFlowSchema } from '@/types/shapeTypes';

export const toolsFlows = [
  {
    id: 'create-flow',
    name: 'CreateFlowTool',
    description: `
      Use this tool to create a prototype flow. A flow defines a starting point for user journeys in prototype mode.
      
      Provide a name (e.g. "Onboarding") and the boardId of the starting board.
      Use get-current-page to get board IDs. Flows are listed in the page payload.
    `,
    inputSchema: createFlowSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CREATE_FLOW, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create flow: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'remove-flow',
    name: 'RemoveFlowTool',
    description: `
      Use this tool to remove a prototype flow from the current page.
      
      Provide the flowName (from get-current-page payload.flows or from a previous create-flow).
    `,
    inputSchema: removeFlowSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.REMOVE_FLOW, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to remove flow: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
