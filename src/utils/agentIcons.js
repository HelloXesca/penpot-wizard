import { createElement } from 'react';
import {
  SparklesIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  AdjustmentsHorizontalIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

export const AGENT_ICON_MAP = {
  SparklesIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  AdjustmentsHorizontalIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
};

export const DEFAULT_AGENT_ICON = UserCircleIcon;

/**
 * Returns the React component for an agent's icon
 * @param {string} iconName - Icon name (e.g. 'SparklesIcon')
 * @returns {React.Component}
 */
export function getAgentIconComponent(iconName) {
  return AGENT_ICON_MAP[iconName] || DEFAULT_AGENT_ICON;
}

/**
 * Renders an agent icon by name. Use this instead of getAgentIconComponent
 * to avoid creating components during render.
 */
export function AgentIcon({ iconName, ...props }) {
  return createElement(AGENT_ICON_MAP[iconName] || DEFAULT_AGENT_ICON, props);
}
