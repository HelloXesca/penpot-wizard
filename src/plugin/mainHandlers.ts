import {
  AddImagePayload,
  AddImageQueryPayload,
  ClientQueryType,
  GetProjectDataPayload,
  MessageSourceName,
  PluginResponseMessage,
} from "../types/types";

const pluginResponse: PluginResponseMessage = {
  source: MessageSourceName.Plugin,
  type: ClientQueryType.ADD_IMAGE,
  messageId: '',
  message: '',
  success: true,
};

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
      message: `Error adding image ${name}: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function getFileVersions(): Promise<PluginResponseMessage> {
  try {
    console.log('getFileVersions called');

    if (!penpot.currentFile) {
      throw new Error('No current file available');
    }

    if (!penpot.currentFile.findVersions) {
      throw new Error('findVersions API not available');
    }

    const versions = await penpot.currentFile.findVersions();
    console.log('Raw versions data:', versions);

    const processedVersions = versions.map((version: { id?: string; label?: string; isAutosave?: boolean; createdAt?: unknown }) => ({
      id: version.id || '',
      label: version.label || '',
      isAutosave: version.isAutosave || false,
      createdAt: null,
    }));

    const responsePayload = {
      versions: processedVersions,
      totalVersions: processedVersions.length,
      displayedVersions: processedVersions.length,
      hasMoreVersions: false,
    };

    console.log('Processed versions payload:', responsePayload);

    return {
      source: MessageSourceName.Plugin,
      type: ClientQueryType.GET_FILE_VERSIONS,
      messageId: '',
      message: 'File versions retrieved successfully',
      success: true,
      payload: responsePayload,
    };

  } catch (error) {
    console.error('Error in getFileVersions:', error);
    return {
      source: MessageSourceName.Plugin,
      type: ClientQueryType.GET_FILE_VERSIONS,
      messageId: '',
      message: `Error retrieving file versions: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    };
  }
}