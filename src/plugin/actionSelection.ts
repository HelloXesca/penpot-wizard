import type { Shape } from '@penpot/plugin-types';

/**
//NOTE: ACTION-ONLY selection helper
 * - Use these helpers only when performing actions that mutate selected shapes.
 * - Do NOT import readSelectionInfo() or call this module from UI/agent code. UI/agents
 *   should always use the GET_SELECTION_INFO endpoint exposed via `mainHandlers.ts`.
 * - Action operations should be routed through plugin endpoints in `mainHandlers`.
 *   Those endpoints are the only safe place that should call `getSelectionForAction()`
 *   because they are executed in the plugin context and avoid selection race-conditions.
 * - This file tracks the last selection IDs (updated by `updateCurrentSelection`) and
 *   provides helpers for action code (resize/fill/image placement/etc.).
 */


// Global variable to track current selection IDs for action operations
export let currentSelectionIds: string[] = [];

// Update the current selection IDs (called by plugin.ts when selection changes)
export function updateCurrentSelection(ids: string[]) {
  currentSelectionIds = ids;
  // Small help for debugging — plugin.ts updates selection there
  console.debug('Selection updated (actionSelection):', ids);
}

// Returns the Penpot selection array for action-only use.
// This helper may only be called by plugin endpoints which actually mutate shapes.
export function getSelectionForAction(): Shape[] {
  try {
    const directSel = (penpot as unknown as { selection: Shape[] }).selection;
    if (directSel && Array.isArray(directSel) && directSel.length > 0) {
      return directSel;
    }
  } catch (error) {
    console.warn('Error accessing direct selection for action:', error);
  }

  return [];
}

export function hasValidSelection(): boolean {
  try {
    const selection = (penpot as unknown as { selection: Shape[] }).selection;
    return selection && Array.isArray(selection) && selection.length > 0;
  } catch (error) {
    console.warn('Error checking selection validity:', error);
    return false;
  }
}
