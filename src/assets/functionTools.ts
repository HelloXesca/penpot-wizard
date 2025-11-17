import { FunctionTool, ClientQueryType } from '@/types/types';
import { z } from 'zod';
import { sendMessageToPlugin } from '@/utils/pluginUtils';

// Function to get user data - this would typically come from Penpot context
export const functionTools: FunctionTool[] = [
  {
    id: "get-user-data",
    name: "getUserData",
    description: `
      Use this tool to get information about the active user on Penpot.
      It returns the user name and id.
    `,
    inputSchema: z.object({}),
    function: async () => {
      const response = await sendMessageToPlugin(ClientQueryType.GET_USER_DATA, undefined);
      return response;
    },
  },{
    id: "get-project-data",
    name: "getProjectData",
    description: `
      Use this tool to get information about the active project on Penpot.
      This includes: name, id and pages
    `,
    inputSchema: z.object({}),
    function: async () => {
      const response = await sendMessageToPlugin(ClientQueryType.GET_PROJECT_DATA, undefined);
      return response;
    },
  },{
    id: "get-available-fonts",
    name: "getAvailableFonts",
    description: `
      Use this tool to get the available fonts on Penpot.
    `,
    inputSchema: z.object({}),
    function: async () => {
      const response = await sendMessageToPlugin(ClientQueryType.GET_AVAILABLE_FONTS, undefined);
      return response;
    },
  },{
    id: "get-current-page",
    name: "getCurrentPage",
    description: `
      Use this tool to get the current page on Penpot.
      This includes: name, id and shapes
    `,
    inputSchema: z.object({}),
    function: async () => {
      const response = await sendMessageToPlugin(ClientQueryType.GET_CURRENT_PAGE, undefined);
      return response;
    },
  },
  {
    id: "get-selection-info",
    name: "getSelectionInfo",
    description: `
      Get detailed information about the currently selected shapes in Penpot.
      Returns properties like dimensions, position, type, and other attributes for each selected shape.
      This is useful for understanding what shapes are selected before performing operations.
    `,
    inputSchema: z.object({}),
    function: async () => {
      const response = await sendMessageToPlugin(ClientQueryType.GET_SELECTION_INFO, undefined);
      return response;
    },
  },
];

