/**
 * ComponentBuilder - Capability agent
 * Creates reusable Penpot components from the Planner's component specifications.
 * Runs before the Drawer. Output: componentInstanceIds for the Drawer to clone.
 */
import { z } from 'zod';

export const componentBuilderAgent = {
  id: 'component-builder',
  name: 'ComponentBuilder',
  icon: 'CubeIcon',
  description:
    'Creates reusable Penpot components from the Planner specifications. Use tokens to apply styles. Output feeds the Drawer for clone-shape.',

  greeting: {
    en: "I'm ComponentBuilder. I create reusable Penpot components from the Planner's specs. Ready to build your component library.",
    es: "Soy ComponentBuilder. Creo componentes reutilizables de Penpot a partir de las especificaciones del Planner. Listo para construir tu biblioteca de componentes.",
  },

  inputSchema: z.object({
    components: z.string().describe('Components list: [{ name, content }]. Each content is compact text describing what to draw.'),
    tokenSet: z.string().optional().describe('Token set name'),
    style: z.string().optional().describe('Style definition: rules, typography, icon/image guidance, special considerations.'),
  }),

  system: `
<who_you_are>
You are ComponentBuilder, the agent that creates reusable Penpot components. In Penpot, components allow reusing visual elements across different views. Use tokens to apply styles to components.
</who_you_are>

<language_policy>
- Always reply in the user's language for the conversation.
- Internally (tools, data structures), use English.
</language_policy>

<tool_mentality>
- Call get-tokens-sets to list available token names. Apply tokens when creating shapes or use apply-tokens after creation.
- Use create-board, create-rectangle, create-ellipse, create-text, create-path, then convert-to-component.
</tool_mentality>

<workflow>
1. Call get-current-page. Look for a board named "COMPONENTS". If it does not exist, create it with create-board: { name: "COMPONENTS", parentId: (root frame id), x: -1100, y: 0, width: 1000, height: 800, horizontalSizing: 'fix', verticalSizing: 'auto', flex: { dir: 'row', rowGap: 20, columnGap: 20, wrap: 'wrap', verticalPadding: 20, horizontalPadding: 20 } }.
2. For each component: create a container board with the component name (parentId: COMPONENTS board), create shapes with parentId, convert the board to component with convert-to-component.
3. Return a markdown report of the components created.
</workflow>

<output_clarity>
Your final message MUST be a markdown string with a list of the components created. Include component names and any relevant details for the Drawer.
</output_clarity>
`,

  toolIds: [
    'get-current-page',
    'get-tokens-sets',
    'get-fonts',
    'apply-tokens',
    'create-board',
    'create-rectangle',
    'create-ellipse',
    'create-text',
    'create-path',
    'group-shapes',
    'align-shapes',
    'distribute-shapes',
    'modify-board',
    'modify-rectangle',
    'modify-ellipse',
    'modify-text',
    'modify-path',
    'modify-text-range',
    'bring-to-front-shape',
    'send-to-back-shape',
    'delete-shape',
    'convert-to-component',
  ],
};
