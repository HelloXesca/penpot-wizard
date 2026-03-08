import { z } from 'zod';
import { ClientQueryType } from '@/types/types';
import { sendMessageToPlugin } from '@/utils/pluginUtils';
import {
  createTokensSetSchema,
  applyTokensSchema,
  activateTokensSetSchema,
  removeTokensSetSchema,
  modifyTokensSetSchema,
} from '@/types/tokensTypes';

export const toolsTokens = [
  {
    id: 'get-tokens-sets',
    name: 'GetTokensSetsTool',
    description: `
      Returns all design token sets in the current project with their tokens.
      No parameters needed. Use this to discover available sets and tokens before
      applying them or creating new ones.

      Each set includes: setId, name, active status, and its list of tokens (name, type, value).
    `,
    inputSchema: z.object({}),
    function: async () => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.GET_TOKENS_SETS, {});
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to get tokens sets: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'create-tokens-set',
    name: 'CreateTokensSetTool',
    description: `
      Creates a design tokens set in Penpot with the given tokens.
      Each token is a plain OBJECT with three properties: type, name, and value.

      Valid types: color, spacing, dimension, fontSizes, fontFamilies, fontWeights,
      letterSpacing, opacity, number, string, boolean, borderWidth, rotation,
      textCase, textDecoration, sizing.

      Example tokens array:
      [
        { "type": "color", "name": "brand.primary", "value": "#6366F1" },
        { "type": "number", "name": "spacing.md", "value": 16 },
        { "type": "string", "name": "font.body", "value": "Inter" }
      ]

      Token names use dots for grouping (brand.primary creates group "brand" with token "primary").
      NEVER pass tokens as stringified JSON.
    `,
    inputSchema: createTokensSetSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.CREATE_TOKENS_SET, input);
        if (response.success && input.activate !== false) {
          try {
            const activateRes = await sendMessageToPlugin(ClientQueryType.ACTIVATE_TOKENS_SET, {
              setName: input.name,
            });
            if (activateRes.success && activateRes.payload) {
              response.payload.setId = activateRes.payload.setId;
              response.payload.activated = true;
              response.message = response.message.replace(/\.$/, ' and activated.');
            }
          } catch (err) {
            throw new Error(`[createTokensSet] deferred activation failed: ${err?.message || err}`);
          }
        }
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to create tokens set: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'activate-tokens-set',
    name: 'ActivateTokensSetTool',
    description: `
      Activates a token set by ID so its tokens are resolved and available for use.
      Use the setId returned by create-tokens-set.
      Use "exclusive: true" to deactivate all other sets first, keeping only the specified one active.

      Useful for switching themes or versions:
        1. Create multiple sets (e.g. "Light Theme", "Dark Theme")
        2. Switch theme: { "setId": "<id-of-dark-theme>", "exclusive": true }

      Without exclusive, the set is activated alongside any already-active sets.
    `,
    inputSchema: activateTokensSetSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.ACTIVATE_TOKENS_SET, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to activate/deactivate tokens set: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'remove-tokens-set',
    name: 'RemoveTokensSetTool',
    description: `
      Removes a token set by ID. All tokens in the set are deleted.
      Use get-tokens-sets to find the setId.
      This action cannot be undone.
    `,
    inputSchema: removeTokensSetSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.REMOVE_TOKENS_SET, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to remove tokens set: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'modify-tokens-set',
    name: 'ModifyTokensSetTool',
    description: `
      Modifies an existing token set: update, rename, add or remove tokens.
      Use get-tokens-sets to find the setId and current token names.

      tokensToModify: array of modification objects. Each identifies a token by "name":
        - Change value: { "name": "claro", "value": "#FFFFFF" }
        - Rename: { "name": "old-name", "newName": "new-name" }
        - Change value + rename: { "name": "claro", "newName": "light", "value": "#FFF" }
        - Add new token (if name doesn't exist): { "name": "new-token", "type": "color", "value": "#000" }

      tokensToRemove: array of token name strings to delete from the set.

      At least one of tokensToModify or tokensToRemove must be provided.
    `,
    inputSchema: modifyTokensSetSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.MODIFY_TOKENS_SET, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to modify tokens set: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
  {
    id: 'apply-tokens',
    name: 'ApplyTokensTool',
    description: `
      Applies design tokens to one or more shapes, boards or components.
      You need shape IDs (from get-current-page or get-selected-shapes).

      Each assignment is a plain OBJECT mapping a token name to a shape attribute:
        { "tokenName": "brand.primary", "attr": "fill" }

      Common attribute mappings by token type:
        - color tokens  → "fill" (background), "stroke-color" (border color)
        - spacing tokens → "p1"-"p4" (padding), "row-gap", "column-gap", "m1"-"m4" (margin)
        - sizing tokens  → "width", "height"
        - opacity tokens → "opacity"
        - border-radius  → "r1", "r2", "r3", "r4" (individual corners)
        - number tokens  → "rotation", "line-height"
        - font tokens    → "font-size", "font-family", "font-weight", "letter-spacing"
        - text tokens    → "text-case", "text-decoration"
    `,
    inputSchema: applyTokensSchema,
    function: async (input) => {
      try {
        const response = await sendMessageToPlugin(ClientQueryType.APPLY_TOKENS, input);
        return response;
      } catch (error) {
        return {
          success: false,
          message: `Failed to apply tokens: ${error.message}`,
          payload: { error: error.message },
        };
      }
    },
  },
];
