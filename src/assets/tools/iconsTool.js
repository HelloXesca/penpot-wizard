import { z } from 'zod';
import iconsCatalog from './iconsToolCatalog.json';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { ClientQueryType, ToolResponse } from '@/types/types';

const inputSchema = z.object({
  libraryId: z.string().describe('Icon library ID to use. This parameter is mandatory.'),
  iconName: z.string().describe('Icon name to draw (kebab-case). This parameter is mandatory.'),
  styleId: z.string().describe('Style ID within the library. This parameter is mandatory.'),
  x: z.number().optional().describe('The absolute x position of the icon, relative to the Root Frame board. If you define parentId, you should use parentX instead of x.'),
  y: z.number().optional().describe('The absolute y position of the icon, relative to the Root Frame board. If you define parentId, you should use parentY instead of y.'),
  parentX: z.number().optional().describe('The x position of the icon relative to its parent. If you define parentId, you should use parentX instead of x.'),
  parentY: z.number().optional().describe('The y position of the icon relative to its parent. If you define parentId, you should use parentY instead of y.'),
  width: z.number().optional().describe('The width of the icon in pixels'),
  height: z.number().optional().describe('The height of the icon in pixels'),
  parentId: z.string().optional().describe('Optional parent board or shape ID.'),
  name: z.string().optional().describe('Optional name for the created shape.'),
});

const libraryIndex = (() => {
  const index = new Map();
  for (const lib of iconsCatalog.libraries) {
    index.set(lib.id, lib);
  }

  return index;
})();

const findLibrary = (libraryId) => {
  return libraryIndex.get(libraryId) || null;
};

const resolveStyle = (library, styleId) => {
  if (!library?.styles?.length) {
    return null;
  }

  if (styleId) {
    return library.styles.find((style) => style.id === styleId) || null;
  }

  return library.styles[0];
};

const deduceIconUrl = ({ libraryId, styleId, iconName }) => {
  const library = findLibrary(libraryId);
  if (!library) {
    throw new Error(`Incorrect libraryId: "${libraryId}"`);
  }

  const style = resolveStyle(library, styleId);
  if (!style) {
    throw new Error(`Style "${styleId}" not found in library "${library.id}".`);
  }

  const pattern = style.urlPattern || '';
  if (!pattern) {
    throw new Error(`Missing urlPattern for library "${library.id}".`);
  }

  let url = null;
  if (pattern.includes('{category}')) {
    const parts = iconName.split('/');
    if (parts.length !== 2) {
      throw new Error(`Icon "${iconName}" must be in "category/name" format.`);
    }
    const [category, name] = parts;
    url = pattern.replace('{category}', category).replace('{name}', name);
  } else {
    url = pattern.replace('{name}', iconName);
  }

  return { library, style, url };
};

const downloadSvg = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SVG (${response.status}).`);
  }
  const svgString = await response.text();
  if (!svgString || !svgString.includes('<svg')) {
    throw new Error('Downloaded content is not a valid SVG.');
  }
  return svgString;
};

const getIconListInputSchema = z.object({
  libraryId: z
    .enum([
      'boxicons',
      'circum',
      'flowbite',
      'heroicons',
      'iconoir',
      'ionicons',
      'lineicons',
      'lucide',
      'mingcute',
      'phosphor',
      'tabler',
    ])
    .describe('Icon library ID.'),
  styleId: z
    .string()
    .min(1)
    .describe(
      'Style ID within the library. E.g. outline, solid, outline-24, solid-24, thin, light, regular, bold, fill, duotone, filled, logos.'
    ),
});

export const iconsTool = [
  {
    id: 'get-icon-list',
    name: 'GetIconList',
    description: `
      Returns the complete list of icon names for a given library+style combination.
      Call this BEFORE draw-icon to get valid iconName values. Use EXACT names from the list.

      Available library+style combinations:
      boxicons: regular, solid, logos
      circum: outline
      flowbite: outline, solid
      heroicons: outline-24, solid-24, solid-20, solid-16
      iconoir: regular, solid
      ionicons: filled, outline, sharp
      lineicons: regular
      lucide: outline
      mingcute: line, fill
      phosphor: thin, light, regular, bold, fill, duotone
      tabler: outline, filled
    `,
    inputSchema: getIconListInputSchema,
    function: async ({ libraryId, styleId }) => {
      try {
        const filename = `${libraryId}-${styleId}.txt`;
        const url = `/icon-lists/${filename}`;
        const response = await fetch(url);
        if (!response.ok) {
          return {
            ...ToolResponse,
            success: false,
            message: `Icon list not found for ${libraryId}/${styleId}. Check libraryId and styleId.`,
            payload: { libraryId, styleId, error: `HTTP ${response.status}` },
          };
        }
        const iconsString = await response.text();
        const icons = iconsString ? iconsString.split(',').filter(Boolean) : [];
        return {
          ...ToolResponse,
          success: true,
          message: `Loaded ${icons.length} icons for ${libraryId}/${styleId}.`,
          payload: { libraryId, styleId, iconCount: icons.length, icons },
        };
      } catch (error) {
        const errorMessage = error?.message || String(error);
        return {
          ...ToolResponse,
          success: false,
          message: `Failed to load icon list: ${errorMessage}`,
          payload: { libraryId, styleId, error: errorMessage },
        };
      }
    },
  },
  {
    id: 'draw-icon',
    name: 'IconsTool',
    description: `
      Use this tool to draw a free icon in Penpot.
      Provide libraryId, iconName, styleId, position, size, and optional parentId.
      The tool resolves the icon within the library catalog, downloads its SVG, and creates a vector group in Penpot.
      
      🚨 CRITICAL - iconName MUST come from get-icon-list:
      - ALWAYS call get-icon-list first with libraryId and styleId to get the exact list of icon names.
      - iconName must be EXACTLY one of the names in that list. No guessing, no synonyms.
      
      Available libraries and styles:
      boxicons: regular, solid, logos
      circum: outline
      flowbite: outline, solid
      heroicons: outline-24, solid-24, solid-20, solid-16
      iconoir: regular, solid
      ionicons: filled, outline, sharp
      lineicons: regular
      lucide: outline
      mingcute: line, fill
      phosphor: thin, light, regular, bold, fill, duotone
      tabler: outline, filled
      
      Use GetIconList before this tool to get valid iconName and styleId.
    `,
    inputSchema,
    function: async ({ libraryId, iconName, styleId, name, ...params }) => {
      try {
        const { url, library, style } = deduceIconUrl({ libraryId, styleId, iconName });
        const svgString = await downloadSvg(url);

        const pluginResponse = await sendMessageToPlugin(ClientQueryType.CREATE_SHAPE_FROM_SVG, {
          svgString,
          params: {
            name: name || iconName,
            ...params,
          },
        });

        return {
          ...pluginResponse,
          payload: {
            ...pluginResponse?.payload,
            libraryId: library.id,
            iconName,
            styleId: style.id,
            url,
          },
        };
      } catch (error) {
        const errorMessage = error?.message || String(error);
        return {
          ...ToolResponse,
          success: false,
          message: `Failed to draw icon: ${errorMessage}`,
          payload: {
            libraryId,
            iconName,
            styleId,
            error: errorMessage,
          },
        };
      }
    },
  },
];
