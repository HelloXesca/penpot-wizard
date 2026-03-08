import { functionTools } from './functionTools';
import { imageTools } from './imageTools';
import { toolsCreateShapes } from './toolsCreateShapes';
import { toolsModifyShapes } from './toolsModifyShapes';
import { toolsCompoundShapes } from './toolsCompoundShapes';
import { toolsLayoutShapes } from './toolsLayoutShapes';
import { toolsInteractions } from './toolsInteractions';
import { toolsFlows } from './toolsFlows';
import { toolsReorderShapes } from './toolsReorderShapes';
import { toolsTokens } from './toolsTokens';
import { ragTools } from './ragTools';
import { iconsTool } from './iconsTool';
import { agentsTools } from './agentsTools';

export const tools = [
  ...functionTools,
  ...imageTools,
  ...toolsCreateShapes,
  ...toolsModifyShapes,
  ...toolsCompoundShapes,
  ...toolsLayoutShapes,
  ...toolsInteractions,
  ...toolsFlows,
  ...toolsReorderShapes,
  ...toolsTokens,
  ...ragTools,
  ...iconsTool,
  ...agentsTools,
];
