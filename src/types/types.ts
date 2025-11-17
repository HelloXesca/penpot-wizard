import { AnyOrama } from '@orama/orama';
import { Experimental_Agent as Agent, Tool, ToolSet, JSONSchema7 } from 'ai';
import { ZodType } from 'zod';
import type { Shape, ImageData as PenpotImageData } from '@penpot/plugin-types';
import { PenpotShapeProperties } from './shapeTypes';

/**
 * Message types for communication between Penpot plugin and app
 */
export enum MessageSourceName {
  Plugin = 'penpotWizardPlugin',
  Client = 'penpotWizardClient',
}

export enum PluginMessageType {
  THEME_CHANGE = 'THEME_CHANGE',
}

// Enum for messages sent from the Penpot app to the plugin
export enum ClientQueryType {
  GET_USER_DATA = 'GET_USER_DATA',
  GET_PROJECT_DATA = 'GET_PROJECT_DATA',
  GET_AVAILABLE_FONTS = 'GET_AVAILABLE_FONTS',
  GET_CURRENT_PAGE = 'GET_CURRENT_PAGE',
  DRAW_SHAPE = 'DRAW_SHAPE',
  ADD_IMAGE = 'ADD_IMAGE',
  GET_SELECTION_INFO = 'GET_SELECTION_INFO',
}

export enum PenpotShapeType {
  RECTANGLE = 'rectangle',
  ELLIPSE = 'ellipse',
  PATH = 'path',
  TEXT = 'text',
  BOARD = 'board',
}

export interface ClientMessage {
  source: MessageSourceName.Client;
  type: ClientQueryType;
  messageId: string;
  payload?: DrawShapeQueryPayload | AddImageQueryPayload;
}

export interface DrawShapeQueryPayload {
  shapeType: PenpotShapeType;
  params: PenpotShapeProperties;
};

export interface AddImageQueryPayload {
  name: string;
  data: Uint8Array;
  mimeType: string;
}

export type GetSelectionInfoQueryPayload = Record<string, never>;

export interface SelectionInfoItem {
  id: string;
  name?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export interface GetSelectionInfoResponsePayload {
  selectionCount: number;
  selectedObjects: SelectionInfoItem[];
}

export type ClientQueryPayload = DrawShapeQueryPayload | AddImageQueryPayload;
export interface PluginMessage {
  source: MessageSourceName.Plugin;
  type: PluginMessageType | ClientQueryType;
  messageId: string;
  message: string;
}
export interface PluginResponseMessage extends PluginMessage {
  success: boolean;
  payload?: PluginResponsePayload;
}

export interface DrawShapeResponsePayload {
  shape: Shape;
}
export interface AddImagePayload {
  newImageData: PenpotImageData;
}
export interface GetUserDataPayload {
  name: string;
  id: string;
}
export interface GetProjectDataPayload {
  name: string;
  id: string;
  pages: {
    name: string;
    id: string;
  }[];
}

export interface GetAvailableFontsPayload {
  fonts: string[];
}

export interface GetCurrentPagePayload {
  name: string;
  id: string;
  shapes: Shape[];
}

export type PluginResponsePayload = GetUserDataPayload | GetProjectDataPayload | GetAvailableFontsPayload | GetCurrentPagePayload | DrawShapeResponsePayload | AddImagePayload | GetSelectionInfoResponsePayload;

// Theme type definition
export type Theme = 'light' | 'dark';
export interface ToolBase {
  id: string;
  name: string;
  description: string;
  isUserCreated?: boolean;
  type?: string
}

export interface FunctionTool extends ToolBase {
  inputSchema: ZodType; // Zod schema para validar inputs
  function: Tool['execute']; // Función para tools tipo FUNCTION
  instance?: Tool; // AI SDK tool instance
}

export interface RagTool extends ToolBase {
  ragContentFile: string;
  dbInstance?: AnyOrama; // Database instance for RAG operations
  instance?: Tool; // AI SDK tool instance
}

export interface SpecializedAgent extends ToolBase {
  system: string; // System prompt for the agent
  outputSchema?: ZodType | JSONSchema7; // Zod schema for output validation
  inputSchema?: ZodType | JSONSchema7; // Zod schema for input validation
  toolIds?: string[]; // IDs of tools this agent can use
  specializedAgentIds?: string[]; // IDs of other specialized agents it can call
  imageGenerationAgentIds?: string[]; // IDs of image generation agents it can call
  agentInstance?: Agent<ToolSet, unknown, unknown>;
  instance?: Tool; // AI SDK tool instance
}

export interface ImageGenerationAgent extends ToolBase {
  system: string; // System prompt for the agent
  instance?: Tool; // AI SDK tool instance
}

export interface DirectorAgent extends ToolBase {
  system: string;
  toolIds?: string[]; // IDs de las tools que puede usar
  specializedAgentIds?: string[]; // IDs of specialized agents this agent can use
  imageGenerationAgentIds?: string[]; // IDs of image generation agents this agent can use
  instance?: Agent<ToolSet, unknown, unknown>;
}

/**
 * Message and Conversation types
 */

// Tool call tracking in messages
export interface AgentToolCall {
  toolCallId: string;
  toolName: string;
  state: 'started' | 'success' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
  toolCalls?: AgentToolCall[]; // For specialized agents that use other tools
}

// Message interface (used in both V1 and V2)
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: AgentToolCall[];
  hidden?: boolean;
}

// Full conversation with messages (used in V1)
export interface Conversation {
  id: string;
  directorAgentId: string;
  messages: Message[];
  summary: string | null;
  createdAt: Date;
}

// Conversation metadata without messages (used in V2)
// This allows loading conversation list without loading all messages
export interface ConversationMetadata {
  id: string;
  directorAgentId: string;
  summary: string | null;
  createdAt: Date;
  messageCount: number; // Useful to know if conversation has messages
}

// Streaming message (used in V2)
// Represents a message currently being streamed from the AI
export interface StreamingMessage {
  id: string;
  role: 'assistant';
  content: string;
  isStreaming: boolean;
  toolCalls?: AgentToolCall[];
  error?: string;
}

