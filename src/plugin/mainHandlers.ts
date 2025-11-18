import {
  AddImagePayload,
  AddImageQueryPayload,
  GetSelectionInfoQueryPayload,
  ClientQueryType,
  GetProjectDataPayload,
  MessageSourceName,
  PluginResponseMessage,
} from "../types/types";
import { readSelectionInfo } from './selectionHelpers';
import { getSelectionForAction as actionGetSelectionForAction, hasValidSelection as actionHasValidSelection } from './actionSelection';
import type { Shape } from '@penpot/plugin-types';

const pluginResponse: PluginResponseMessage = {
  source: MessageSourceName.Plugin,
  type: ClientQueryType.ADD_IMAGE,
  messageId: '',
  message: '',
  success: true,
};

// Global variable to store current selection IDs (updated by plugin.ts)
// NOTE: currentSelectionIds and updateCurrentSelection now live in actionSelection.ts
// which contains action-only helpers for safe selection mutation.

// SAFE SELECTION ACCESS PATTERN
// =============================
// This function should ONLY be called by tools when they are actually
// performing an action, not for general selection querying.
// Never use this for AI consumption or serialization.
export function getSelectionForAction(): Shape[] {
  // Delegate to actionSelection — only call when the plugin intends to mutate shapes
  return actionGetSelectionForAction();
}

// Check if selection exists (safe utility)
export function hasValidSelection(): boolean {
  return actionHasValidSelection();
}

// Safely checks if there are selected shapes available
export function hasSelection(): PluginResponseMessage {
  try {
    const hasSelection = hasValidSelection();
    const count = hasSelection ? 1 : 0; // We don't know exact count without accessing selection

    return {
      ...pluginResponse,
      type: ClientQueryType.GET_USER_DATA,
      success: true,
      message: hasSelection ? 'Selection exists' : 'No selection',
      payload: { name: '', id: '', count } as unknown as GetProjectDataPayload
    };
  } catch (error) {
    console.warn('Error checking selection:', error);
    return {
      ...pluginResponse,
      type: ClientQueryType.GET_USER_DATA,
      success: false,
      message: 'Error checking selection',
    };
  }
}

export function handleGetUserData(): PluginResponseMessage {
  if (penpot.currentUser) {
    return {
      ...pluginResponse,
      type: ClientQueryType.GET_USER_DATA,
      message: 'User data successfully retrieved',
      payload: {
        name: penpot.currentUser.name || '',
        id: penpot.currentUser.id,
      },
    };
  } else {
    return {
      ...pluginResponse,
      type: ClientQueryType.GET_USER_DATA,
      success: false,
      message: 'Error retrieving user data',
    }
  }
}

export function handleGetProjectData(): PluginResponseMessage {
  if (penpot.currentFile && penpot.currentPage) {
    return {
      ...pluginResponse,
      type: ClientQueryType.GET_PROJECT_DATA,
      message: 'Project data successfully retrieved',
      payload: {
        name: penpot.currentFile?.name,
        id: penpot.currentFile?.id,
        pages: penpot.currentFile?.pages.map((page) => ({
          name: page.name,
          id: page.id,
        })),
      },
    };
  } else {
    return {
      ...pluginResponse,
      type: ClientQueryType.GET_PROJECT_DATA,
      success: false,
      message: 'Error retrieving project data',
    }
  }
}

export function getAvailableFonts(): PluginResponseMessage {
  return {
    ...pluginResponse,
    type: ClientQueryType.GET_AVAILABLE_FONTS,
    message: 'Available fonts successfully retrieved',
    payload: {
      fonts: penpot.fonts.all.map((font) => font.name),
    },
  };
}

export function getCurrentPage(): PluginResponseMessage {
  return {
    ...pluginResponse,
    type: ClientQueryType.GET_CURRENT_PAGE,
    message: 'Current page successfully retrieved',
    payload: {
      name: penpot.currentPage?.name || '',
      id: penpot.currentPage?.id || '',
      shapes: penpot.currentPage?.findShapes({}) || [],
    },
  };
}

// Thin compatibility wrapper — use readSelectionInfo for new code
export function getSelectionInfo() {
  return readSelectionInfo();
}

export async function getSelectionInfoTool(_payload: GetSelectionInfoQueryPayload): Promise<PluginResponseMessage> {
  try {
    const selectedObjects = readSelectionInfo();

    if (selectedObjects.length === 0) {
      return {
        ...pluginResponse,
        type: ClientQueryType.GET_SELECTION_INFO,
        success: false,
        message: 'No shapes are currently selected. Please select one or more shapes first.',
      };
    }

    return {
      ...pluginResponse,
      type: ClientQueryType.GET_SELECTION_INFO,
      message: `Found ${selectedObjects.length} selected shape${selectedObjects.length > 1 ? 's' : ''}`,
      payload: {
        selectionCount: selectedObjects.length,
        selectedObjects,
      },
    };
  } catch (error) {
    return {
      ...pluginResponse,
      type: ClientQueryType.GET_SELECTION_INFO,
      success: false,
      message: `Error reading selection information: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function handleAddImage(payload: AddImageQueryPayload) : Promise<PluginResponseMessage> {
  const { name, data, mimeType } = payload;

  try {
    const imageCreatedData = await penpot.uploadMediaData(name, data, mimeType);
    if (imageCreatedData) {
      return {
        ...pluginResponse,
        message: 'Image added successfully',
        payload: {
          newImageData: imageCreatedData,
        },
      };
    } else {
      throw new Error('error creating image in Penpot');
    }
  } catch (error) {
    return {
      ...pluginResponse,
      success: false,
      message: `error adding image ${name}: ${error}`,
    }
  }
}