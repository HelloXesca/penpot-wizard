import {
  AddImageQueryPayload,
  ClientQueryType,
  GetProjectDataPayload,
  MessageSourceName,
  PluginResponseMessage,
} from "../types/types";
import type { Shape } from '@penpot/plugin-types';

const pluginResponse: PluginResponseMessage = {
  source: MessageSourceName.Plugin,
  type: ClientQueryType.ADD_IMAGE,
  messageId: '',
  message: '',
  success: true,
};

// Global variable to store current selection IDs (updated by plugin.ts)
let currentSelectionIds: string[] = [];

// Function to update selection IDs from plugin.ts
export function updateCurrentSelection(ids: string[]) {
  currentSelectionIds = ids;
  console.log('Selection updated to:', ids);
}

// Export currentSelectionIds for access from plugin.ts
export { currentSelectionIds };

// Helper function to get current selection shapes safely
function getCurrentSelectionShapes(): Shape[] {
  console.log('🔍 getCurrentSelectionShapes called, currentSelectionIds:', currentSelectionIds);

  // First, always try to get fresh selection data to ensure we don't miss anything
  let freshSelection: Shape[] = [];
  try {
    const directSel = (penpot as any).selection as Shape[];
    if (directSel && Array.isArray(directSel) && directSel.length > 0) {
      console.log(`✅ Found ${directSel.length} shapes via direct selection`);
      freshSelection = directSel;
      // Update our tracked selection for future use
      const ids = directSel.map((shape: Shape) => shape?.id).filter((id: string | undefined): id is string => id !== undefined && typeof id === 'string');
      if (ids.length > 0) {
        console.log('📝 Updating tracked selection from fresh data:', ids);
        currentSelectionIds = ids;
      }
    }
  } catch (directError) {
    console.warn('❌ Direct selection access failed:', directError);
  }

  // If we got fresh selection, use it
  if (freshSelection.length > 0) {
    console.log(`✅ Returning ${freshSelection.length} shapes from fresh selection`);
    return freshSelection;
  }

  // Fallback: use tracked selection IDs if fresh selection failed
  if (currentSelectionIds && currentSelectionIds.length > 0) {
    console.log('⚠️ Using tracked selection IDs as fallback:', currentSelectionIds);

    try {
      const currentPage = penpot.currentPage;
      if (!currentPage) {
        console.log('❌ No current page found');
        return [];
      }

      const shapes: Shape[] = [];
      for (const id of currentSelectionIds) {
        try {
          const shape = currentPage.getShapeById(id);
          if (shape) {
            console.log(`✅ Found shape ${id}:`, shape.name || shape.id);
            shapes.push(shape);
          } else {
            console.log(`❌ Shape ${id} not found on page`);
          }
        } catch (error) {
          console.warn(`❌ Could not find shape with ID ${id}:`, error);
        }
      }

      if (shapes.length > 0) {
        console.log(`✅ Returning ${shapes.length} shapes from tracked IDs`);
        return shapes;
      }
    } catch (pageError) {
      console.warn('❌ Error accessing current page:', pageError);
    }
  }

  console.log('❌ No selection found via any method');
  return [];
}

// Safely checks if there are selected shapes available
export function hasSelection(): PluginResponseMessage {
  try {
    const shapes = getCurrentSelectionShapes();
    const count = shapes.length;

    return {
      ...pluginResponse,
      type: ClientQueryType.GET_USER_DATA,
      success: true,
      message: count > 0 ? `Found ${count} selected item(s)` : 'No selection',
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