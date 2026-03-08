import { ClientQueryType, ToolResponse } from '@/types/types';
import { z } from 'zod';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import { generateImageFromPrompt } from '@/utils/imageUtils';

export const imageTools = [
  {
    id: "generate-image",
    name: "generateImage",
    description: `
      Use this tool to generate an image from a text prompt (AI image generation) and set it as the fill/background of an existing shape.
      
      Workflow: Generates the image using the configured AI image model, adds it to the Penpot project, then applies it as the shape's fill.
      
      Use when you need to:
      - Create AI-generated artwork inside a shape the user selected
      - Visualize a text description as an image background
      - Generate illustrations, icons, or graphics for a rectangle/ellipse/board
      
      The shape must already exist on the page. Use get-current-page or get-selected-shapes to obtain shape IDs.
    `,
    inputSchema: z.object({
      shapeId: z.string().describe('ID of the shape to fill with the generated image'),
      imagePrompt: z.string().describe('Text description of the image to generate (detailed prompts produce better results)'),
      width: z.number().positive().optional().describe('Image width in pixels. If omitted, uses the shape\'s width.'),
      height: z.number().positive().optional().describe('Image height in pixels. If omitted, uses the shape\'s height.'),
    }),
    function: async ({ shapeId, imagePrompt, width, height }) => {
      try {
        let targetWidth = width;
        let targetHeight = height;

        if (targetWidth == null || targetHeight == null) {
          const getShapeRes = await sendMessageToPlugin(ClientQueryType.GET_SHAPE, { shapeId });
          if (!getShapeRes.success || !getShapeRes.payload?.shape) {
            return {
              ...ToolResponse,
              success: false,
              message: getShapeRes.message || 'Failed to get shape',
              payload: { error: getShapeRes.payload?.error },
            };
          }
          const shape = getShapeRes.payload.shape;
          targetWidth = targetWidth ?? shape.width;
          targetHeight = targetHeight ?? shape.height;
        }

        const roundedWidth = Math.round(targetWidth || 1024);
        const roundedHeight = Math.round(targetHeight || 1024);
        const { uint8Array, mediaType } = await generateImageFromPrompt(imagePrompt, { width: roundedWidth, height: roundedHeight });

        const imageName = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const addImageRes = await sendMessageToPlugin(ClientQueryType.ADD_IMAGE, {
          name: imageName,
          data: uint8Array,
          mimeType: mediaType,
        });

        if (!addImageRes.success || !addImageRes.payload?.newImageData) {
          return {
            ...ToolResponse,
            success: false,
            message: addImageRes.message || 'Failed to add image to project',
            payload: { error: addImageRes.payload?.error },
          };
        }

        const newImageData = addImageRes.payload.newImageData;
        const fillImage = {
          id: newImageData.id,
          width: newImageData.width,
          height: newImageData.height,
          mtype: newImageData.mtype ?? newImageData.mimeType ?? mediaType,
          keepAspectRatio: true,
        };

        const modifyRes = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, {
          shapeId,
          propertiesToModify: {
            fills: [{ fillImage, fillOpacity: 1 }],
          },
        });

        if (!modifyRes.success) {
          return {
            ...ToolResponse,
            success: false,
            message: modifyRes.message || 'Image generated but failed to apply to shape',
            payload: {
              error: modifyRes.payload?.error,
              imageId: newImageData.id,
            },
          };
        }

        return {
          ...ToolResponse,
          success: true,
          message: 'Image generated and applied to shape successfully',
          payload: {
            shapeId,
            imageId: newImageData.id,
          },
        };
      } catch (error) {
        return {
          ...ToolResponse,
          success: false,
          message: `Error generating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    },
  },
  {
    id: "set-image-from-url",
    name: "setImageFromUrl",
    description: `
      Use this tool to set an image from a URL as the fill/background of an existing shape.
      
      Workflow: Downloads the image from the provided URL, adds it to the Penpot project, then applies it as the shape's fill.
      
      Use when you need to:
      - Place an existing image (from a URL) as the background of a shape
      - Use stock photos, icons, or other hosted images in a design
      - Apply images the user provides via URL to a selected shape
      
      The shape must already exist on the page. The URL must be publicly accessible.
    `,
    inputSchema: z.object({
      shapeId: z.string().describe('ID of the shape to fill with the image'),
      imageUrl: z.string().url().describe('Public URL of the image (e.g. https://example.com/image.png)'),
    }),
    function: async ({ shapeId, imageUrl }) => {
      try {
        const imageName = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const addImageRes = await sendMessageToPlugin(ClientQueryType.ADD_IMAGE, {
          name: imageName,
          url: imageUrl,
        });

        if (!addImageRes.success || !addImageRes.payload?.newImageData) {
          return {
            ...ToolResponse,
            success: false,
            message: addImageRes.message || 'Failed to add image from URL',
            payload: { error: addImageRes.payload?.error },
          };
        }

        const newImageData = addImageRes.payload.newImageData;
        const fillImage = {
          id: newImageData.id,
          width: newImageData.width,
          height: newImageData.height,
          mtype: newImageData.mtype ?? newImageData.mimeType ?? 'image/png',
          keepAspectRatio: true,
        };

        const modifyRes = await sendMessageToPlugin(ClientQueryType.MODIFY_SHAPE, {
          shapeId,
          propertiesToModify: {
            fills: [{ fillImage, fillOpacity: 1 }],
          },
        });

        if (!modifyRes.success) {
          return {
            ...ToolResponse,
            success: false,
            message: modifyRes.message || 'Image added but failed to apply to shape',
            payload: {
              error: modifyRes.payload?.error,
              imageId: newImageData.id,
            },
          };
        }

        return {
          ...ToolResponse,
          success: true,
          message: 'Image from URL applied to shape successfully',
          payload: {
            shapeId,
            imageId: newImageData.id,
          },
        };
      } catch (error) {
        return {
          ...ToolResponse,
          success: false,
          message: `Error setting image from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
          payload: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    },
  },
];
