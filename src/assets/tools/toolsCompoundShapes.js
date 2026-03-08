import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { positionAdvice, parentAdvice } from './constants';

import {
  groupShapesSchema,
  ungroupSchema,
  convertShapesToBoardSchema,
  createBooleanSchema,
} from '@/types/shapeTypes';

export const toolsCompoundShapes = [
  {
    id: 'create-boolean',
    name: 'CreateBooleanTool',
    description: `
      Use this tool to create a boolean shape from two or more existing shapes.
      You must provide the boolType and at least 2 shape IDs.

      ${positionAdvice('boolean')}
      ${parentAdvice('boolean')}
    `,
    inputSchema: createBooleanSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CREATE_BOOLEAN, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create boolean shape: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'group-shapes',
    name: 'GroupShapesTool',
    description: `
      Groups existing shapes.
      Provide an array of existing shape IDs to group together.
      Order shapeIds in the array by zIndex in reverse order. Higher values first.

      ${positionAdvice('group')}
      ${parentAdvice('group')}
    `,
    inputSchema: groupShapesSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CREATE_GROUP, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to group shapes: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'ungroup',
    name: 'UngroupTool',
    description: `
      Ungroups a group.
    `,
    inputSchema: ungroupSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.UNGROUP_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to ungroup: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'convert-to-board',
    name: 'ConvertToBoardTool',
    description: `
      Converts one or more shapes into a board.
    `,
    inputSchema: convertShapesToBoardSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CONVERT_SHAPES_TO_BOARD, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to convert to board: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'convert-to-component',
    name: 'ConvertToComponentTool',
    description: `
      Converts one or more shapes into a component.
    `,
    inputSchema: convertShapesToBoardSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CONVERT_SHAPES_TO_COMPONENT, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to convert to component: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
