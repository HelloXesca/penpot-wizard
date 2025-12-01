/**
// NOTE: READ-ONLY selection helper - safely returns selection info:
 * - Returns a plain, serializable array of selection info for the currently selected shapes.
 * - READ-ONLY: Must NOT be used to perform any modifications. This helper MUST NOT be used by action-performing code.
 * - IMPORTANT: UI/asset code and director agents should call the read-only GET_SELECTION_INFO plugin endpoint
 *   rather than importing this helper directly. That keeps mutation paths centralized and avoids selection race conditions.
 * - This file intentionally does not modify or import action-performing tools.
 */
import { SelectionInfoItem } from '../types/types';

export interface SelectionInfoItemLocal {
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

export function readSelectionInfo(): SelectionInfoItem[] {
  console.log('📊 readSelectionInfo called - safe read-only selection access');

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selection = (penpot as any).selection;
    // If penpot.selection exists but is empty, prefer page.getSelectedShapes() when available.
    try {
      const pageFallback = (penpot.currentPage as any)?.getSelectedShapes?.();
      if ((!selection || !Array.isArray(selection) || selection.length === 0) && Array.isArray(pageFallback) && pageFallback.length > 0) {
        selection = pageFallback;
      }
    } catch {
      // non-fatal - fall back to selection as captured
    }
    if (!selection || !Array.isArray(selection) || selection.length === 0) {
      console.log('❌ No selection available for info reading');
      return [];
    }

    // Only read properties; do not mutate. This helper must not trigger selection mutation.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const info: SelectionInfoItem[] = (selection as any[]).map((shape: any) => ({
      id: String(shape.id ?? ''),
      name: shape.name ?? undefined,
      type: shape.type ?? 'unknown',
      x: typeof shape.x === 'number' ? shape.x : 0,
      y: typeof shape.y === 'number' ? shape.y : 0,
      width: typeof shape.width === 'number' ? shape.width : 0,
      height: typeof shape.height === 'number' ? shape.height : 0,
      rotation: typeof shape.rotation === 'number' ? shape.rotation : undefined,
      opacity: typeof shape.opacity === 'number' ? shape.opacity : undefined,
      locked: typeof shape.locked === 'boolean' ? shape.locked : undefined,
      blocked: typeof shape.blocked === 'boolean' ? shape.blocked : undefined,
      proportionLock: typeof shape.proportionLock === 'boolean' ? shape.proportionLock : 
                      typeof shape.keepAspectRatio === 'boolean' ? shape.keepAspectRatio : undefined,
      guides: shape.type === 'board' ? shape.guides : undefined,
    }));

    console.log(`✅ Read info for ${info.length} selected shapes`);
    return info;
  } catch (err) {
    console.warn('❌ Error reading selection info in readSelectionInfo:', err);
    return [];
  }
}
