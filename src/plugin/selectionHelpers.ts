/**
 * Safe, read-only selection helper
 * - Returns a plain, serializable array of selection info for the currently selected shapes.
 * - Must NOT be used to perform any modifications.
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
    const selection = (penpot as any).selection ?? (penpot.currentPage as any)?.getSelectedShapes?.();
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
    }));

    console.log(`✅ Read info for ${info.length} selected shapes`);
    return info;
  } catch (err) {
    console.warn('❌ Error reading selection info in readSelectionInfo:', err);
    return [];
  }
}
