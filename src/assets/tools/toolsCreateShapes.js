import { drawShape } from '@/utils/pluginUtils';
import { positionAdvice, parentAdvice, textPropertiesAdvice } from './constants';

import {
  createRectangleSchema,
  createEllipseSchema,
  createTextSchema,
  createBoardSchema,
  createPathSchema,
} from '@/types/shapeTypes';

export const toolsCreateShapes = [
  {
    id: 'create-rectangle',
    name: 'CreateRectangleTool',
    description: `
      Creates a single rectangle in Penpot.
      ${positionAdvice('rectangle')}
      ${parentAdvice('rectangle')}
    `,
    inputSchema: createRectangleSchema,
    function: async (input) => {
      try {
        const response = await drawShape('rectangle', input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create rectangle: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'create-ellipse',
    name: 'CreateEllipseTool',
    description: `
      Creates a single ellipse in Penpot.
      ${positionAdvice('ellipse')}
      ${parentAdvice('ellipse')}
    `,
    inputSchema: createEllipseSchema,
    function: async (input) => {
      try {
        const response = await drawShape('ellipse', input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create ellipse: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'create-text',
    name: 'CreateTextTool',
    description: `
      Creates a single text in Penpot.
      To define the fontFamily, use the tool get-fonts for available fonts.

      ${positionAdvice('text')}
      ${parentAdvice('text')}
      ${textPropertiesAdvice}
    `,
    inputSchema: createTextSchema,
    function: async (input) => {
      try {
        const processedInput = { ...input };
        if (typeof processedInput.characters === 'string') {
          processedInput.characters = processedInput.characters.replace(/\\n/g, '\n');
        }
        const response = await drawShape('text', processedInput);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create text: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'create-path',
    name: 'CreatePathTool',
    description: `
      Creates a single path (vector shape) in Penpot.
      Use content to define the path as an array of SVG path commands (move-to, line-to, curve-to, close-path, etc.).

      ${positionAdvice('path')}
      ${parentAdvice('path')}
    `,
    inputSchema: createPathSchema,
    function: async (input) => {
      try {
        const response = await drawShape('path', input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create path: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'create-board',
    name: 'CreateBoardTool',
    description: `
      Creates a single board in Penpot.
      ${positionAdvice('board')}
      ${parentAdvice('board')}

      IMPORTANT!!
      If you are planning to add items to the board, first order them by layoutChild.zIndex or parentIndex in ascending order and then add them to the board.
    `,
    inputSchema: createBoardSchema,
    function: async (input) => {
      try {
        const response = await drawShape('board', input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create board: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
