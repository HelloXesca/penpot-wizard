import { pathCommandsToSvgString } from './utils';
import { Board, Fill, Shape, Text } from '@penpot/plugin-types';
import { ClientQueryType, DrawShapeQueryPayload, MessageSourceName, PenpotShapeType, PluginResponseMessage } from '../types/types';
import { PathShapeProperties, PenpotShapeProperties, TextShapeProperties } from '@/types/shapeTypes';

function setParamsToShape(shape: Shape, params: PenpotShapeProperties) {
  const { backgroundImage, parentId, color, width, height, ...rest } = params;
  
  if (color || backgroundImage) {
    const fills: Fill[] = [];

    if (backgroundImage) {
      const backgroundImageFill: Fill = {
        fillImage: {
          id: backgroundImage,
          width: Math.round(width),
          height: Math.round(height),
          mtype: "image/png",
          keepAspectRatio: true,
        }
      }
      fills.push(backgroundImageFill);
    }
    if (color) {
      const colorFill: Fill = {
        fillColor: color,
      }
      fills.push(colorFill);
    }

    shape.fills = fills;
  }

  if (width && height) {
    shape.resize(width, height);
  }

  (Object.keys(rest) as Array<keyof typeof rest>).forEach((key) => {
    const value = rest[key];
    if (value !== undefined) {
      (shape as unknown as Record<string, unknown>)[key as string] = value as unknown;
    }
  });

  if (parentId) {
    const parent = penpot.currentPage?.getShapeById(parentId);
    if (parent && parent.type === PenpotShapeType.BOARD) {
      (parent as Board).appendChild(shape);
    }
  }
}

export function handleDrawShape( payload: DrawShapeQueryPayload): PluginResponseMessage {
  const { shapeType, params } = payload;

  const pluginResponse: PluginResponseMessage = {
    source: MessageSourceName.Plugin,
    type: ClientQueryType.DRAW_SHAPE,
    messageId: '',
    message: '',
    success: true,
  };

  let newShape: Shape | Text | null;
  try {
    switch (shapeType) {
      case PenpotShapeType.RECTANGLE:
        newShape = penpot.createRectangle();
        break;
      case PenpotShapeType.ELLIPSE:
        newShape = penpot.createEllipse();
        break;
      case PenpotShapeType.PATH:
        // @ts-expect-error Penpot path content only accepts SVG string; type def is narrower
        (params as PathShapeProperties).content = pathCommandsToSvgString((params as PathShapeProperties).content);
        newShape = penpot.createPath();
        break;
      case PenpotShapeType.TEXT:
        newShape = penpot.createText((params as TextShapeProperties).characters);
        delete (params as Partial<TextShapeProperties>).characters;
        break;
      case PenpotShapeType.BOARD:
        newShape = penpot.createBoard();
        break;
      default:
        throw new Error('Invalid shape type');
    }

    if (!newShape) {
      throw new Error('Failed to create shape');
    }

    setParamsToShape(newShape, params);

    return {
      ...pluginResponse,
      message: 'Shape drawn successfully',
      payload: {
        shape: newShape,
      },
    };
  } catch (error) {
    return {
      ...pluginResponse,
      success: false,
      message: `error drawing shape ${shapeType}: ${error}`,
    };
  }
}
