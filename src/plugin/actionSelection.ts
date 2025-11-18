import type { Shape } from '@penpot/plugin-types';

/**
 * ACTION-ONLY selection helper
 * - Use these helpers only when performing actions that mutate selected shapes.
 * - Do NOT import readSelectionInfo() here — that helper is read-only and must not be used to perform mutations.
 *   This separation avoids selection-related crashes.
 */
export let currentSelectionIds: string[] = [];

export function updateCurrentSelection(ids: string[]) {
  currentSelectionIds = ids;
  console.log('Selection updated to (actionSelection):', ids);
}

export function getSelectionForAction(): Shape[] {
  console.log('🔍 getSelectionForAction called - safe for action-performing tools\n only (actionSelection)');
  try {
    const directSel = (penpot as unknown as { selection: Shape[] }).selection;
    if (directSel && Array.isArray(directSel) && directSel.length > 0) {
      console.log(`✅ Found ${directSel.length} shapes for action`);
      return directSel;
    }
  } catch (error) {
    console.warn('❌ Selection access failed:', error);
  }

  console.log('❌ No selection available for action');
  return [];
}

export function hasValidSelection(): boolean {
  try {
    const selection = (penpot as unknown as { selection: Shape[] }).selection;
    return selection && Array.isArray(selection) && selection.length > 0;
  } catch (error) {
    console.warn('❌ Error checking selection validity:', error);
    return false;
  }

}
