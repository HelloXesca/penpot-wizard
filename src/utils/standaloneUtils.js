import { ClientQueryType } from '@/types/types';

export const isStandaloneMode = import.meta.env.VITE_STANDALONE_MODE === 'true';

const genericMockResponse = {
  success: true,
  message: 'Plugin unavailable - running in standalone mode',
  payload: {
    pluginUnavailable: true,
  },
};

export const STANDALONE_MOCK_RESPONSES = {
  [ClientQueryType.GET_USER_DATA]: {
    success: true,
    message: 'Standalone mode - mock user',
    payload: {
      name: 'Standalone User',
      id: 'standalone-id',
    },
  },
  [ClientQueryType.GET_CURRENT_PAGE]: {
    success: true,
    message: 'Standalone mode - mock page',
    payload: {
      name: 'Mock Page',
      id: 'mock-page-id',
      shapes: [],
      components: [],
      flows: [],
    },
  },
  [ClientQueryType.GET_SELECTED_SHAPES]: {
    success: true,
    message: 'No selection in standalone',
    payload: {
      selectedShapeIds: [],
    },
  },
  [ClientQueryType.GET_FONTS]: {
    success: true,
    message: 'Standalone mode - mock fonts',
    payload: {
      fonts: [{ name: 'Inter', fontId: 'inter', fontFamily: 'Inter' }],
    },
  },
};

export const getMockResponse = (type) => {
  return STANDALONE_MOCK_RESPONSES[type] ?? genericMockResponse;
};
