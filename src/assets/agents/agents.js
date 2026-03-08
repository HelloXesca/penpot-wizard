/**
 * Agents barrel - groups all entry-point agent definitions from this folder.
 */
import { penpotWizardAgent } from './penpotWizardAgent';
import { webprojectsDirectorAgent } from './webprojectsDirectorAgent';
import { designerAgent } from './designerAgent';
import { drawerAgent } from './drawerAgent';
import { modifierAgent } from './modifierAgent';
import { componentBuilderAgent } from './componentBuilderAgent';
import { plannerAgent } from './plannerAgent';
import { prototyperAgent } from './prototyperAgent';
import { illustratorAgent } from './illustratorAgent';

export const agents = [
  penpotWizardAgent,
  webprojectsDirectorAgent,
  designerAgent,
  drawerAgent,
  modifierAgent,
  componentBuilderAgent,
  plannerAgent,
  prototyperAgent,
  illustratorAgent,
];
