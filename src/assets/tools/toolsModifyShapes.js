import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { positionAdvice, parentAdvice, textPropertiesAdvice } from './constants';

import {
  modifyRectangleSchema,
  modifyEllipseSchema,
  modifyTextSchema,
  modifyBoardSchema,
  modifyPathSchema,
  modifyBooleanSchema,
  modifyTextRangeSchema,
  rotateShapeSchema,
  cloneShapeSchema,
  deleteShapeSchema,
} from '@/types/shapeTypes';

export const toolsModifyShapes = [
  {
    id: 'modify-rectangle',
    name: 'ModifyRectangleTool',
    description: `
      Modifies an existing rectangle in Penpot.
      ${positionAdvice('rectangle')}
      ${parentAdvice('rectangle')}
    `,
    inputSchema: modifyRectangleSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify rectangle: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'modify-ellipse',
    name: 'ModifyEllipseTool',
    description: `
      Modifies an existing ellipse in Penpot.
      ${positionAdvice('ellipse')}
      ${parentAdvice('ellipse')}
    `,
    inputSchema: modifyEllipseSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify ellipse: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'modify-text',
    name: 'ModifyTextTool',
    description: `
      Modifies an existing text shape in Penpot.
      To define the fontFamily, you should use the tool get-fonts to know the available fonts.

      ${positionAdvice('text')}
      ${parentAdvice('text')}
      ${textPropertiesAdvice}
    `,
    inputSchema: modifyTextSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify text: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'modify-path',
    name: 'ModifyPathTool',
    description: `
      Modifies an existing path (vector shape) in Penpot.

      ${positionAdvice('path')}
      ${parentAdvice('path')}
    `,
    inputSchema: modifyPathSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify path: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'modify-boolean',
    name: 'ModifyBooleanTool',
    description: `
      Modifies an existing boolean shape in Penpot.

      ${positionAdvice('boolean')}
      ${parentAdvice('boolean')}
    `,
    inputSchema: modifyBooleanSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify boolean shape: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'modify-text-range',
    name: 'ModifyTextRangeTool',
    description: `
      Modifies text styling for a specific range inside an existing text shape.
      Provide the text shapeId, start/end indices for the range, and props (fontFamily, fontSize, etc.).
    `,
    inputSchema: modifyTextRangeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_TEXT_RANGE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify text range: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'rotate-shape',
    name: 'RotateShapeTool',
    description: `
      Rotates an existing shape. Provide shapeId and angle in degrees.
      Optionally provide center {x, y} to rotate around; omit to use shape center.
    `,
    inputSchema: rotateShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.ROTATE_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to rotate shape: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'clone-shape',
    name: 'CloneShapeTool',
    description: `
      Creates a copy of a shape or an instance of a component.

      ${positionAdvice('clone')}
      ${parentAdvice('clone')}
    `,
    inputSchema: cloneShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CLONE_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to clone shape: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'delete-shape',
    name: 'DeleteShapeTool',
    description: `
      Deletes a shape from the current page. Provide the shapeId.
      This action cannot be undone.
    `,
    inputSchema: deleteShapeSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.DELETE_SHAPE, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to delete shape: ${error.message}`,
          payload: error,
        };
      }
    },
  },
  {
    id: 'modify-board',
    name: 'ModifyBoardTool',
    description: `
      Modifies an existing board in Penpot.
      Use parentId to place the board inside a board, group, or component.
      Use parentIndex to define the index at which the board will be inserted in the parent, higher values appear on top of lower values.
    `,
    inputSchema: modifyBoardSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_BOARD, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify board: ${error.message}`,
          payload: error,
        };
      }
    },
  },
];
