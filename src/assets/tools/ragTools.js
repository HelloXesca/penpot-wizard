import { z } from 'zod';
import { initializeOramaDb, searchOramaDb } from '@/utils/ragUtils';
import { ToolResponse } from '@/types/types';

const penpotUserGuideRag = {
  id: 'penpot-user-guide-rag',
  name: 'PenpotUserGuideRagTool',
  inputSchema: z.object({
    query: z.string().describe('The search query to find relevant information in the penpot documentation'),
  }),
  description: `
    Always use this tool to resolve questions related to Penpot usage or its technical and user documentation.
    This tool allows you to search the Penpot technical documentation and user guide.
    Always use this tool to resolve questions related to the interface, tools, and design concepts of Penpot.
    This tool can find specific information about Penpot features, components, and usage instructions.

    IMPORTANT: All queries to this tool must be in English.

    QUERY CONSTRUCTION RULES:
    - ALWAYS expand user queries with specific Penpot technical terms
    - Include multiple relevant concepts from the available list below
    - Use the format: "[user intent] + [specific tool] + [method] + [technical terms]"
    - Never use generic queries - always include Penpot-specific terminology

    QUERY TRANSFORMATION EXAMPLES:
    ❌ Bad: "how to draw triangle"
    ✅ Good: "how to draw triangle using path tool bezier curves nodes vector shapes"

    ❌ Bad: "create button"  
    ✅ Good: "how to create button component rectangle styling flex layout"

    ❌ Bad: "center elements"
    ✅ Good: "how to align center distribute layers flex layout grid positioning"

    MANDATORY TECHNICAL TERMS TO INCLUDE:
    - For shapes: "path tool", "bezier", "nodes", "vector shapes", "boolean operations"
    - For design: "components", "layers", "styling", "flex layout", "grid layout"
    - For interactions: "prototyping", "triggers", "actions", "flows", "overlays"

    Available concepts in the Penpot user-guide:

    **Core Objects & Tools:**
    - Boards: Containers for designs, can be resized, clipped, used as screens
    - Rectangles & Ellipses: Basic geometric shapes (shortcuts: R, E)
    - Text: Text layers with typography options, alignment, sizing
    - Paths (Bezier): Vector paths with nodes, curves, editing capabilities (shortcut: P), valid to draw complex shapes like stars, polygons, etc.
    - Curves (Freehand): Freehand drawing tool (shortcut: Shift+C)
    - Images: Import, aspect ratio control, positioning

    **Layer Management:**
    - Pages: Organize layers into separate sections
    - Layers Panel: View, select, hide, lock layers
    - Groups: Combine layers for simultaneous operations
    - Masks: Clipping layers to show only parts of other layers
    - Boolean Operations: Union, difference, intersection, exclusion, flatten
    - Constraints: Control how layers behave when resizing containers

    **Styling & Visual Effects:**
    - Color Fills: Custom colors, gradients (linear/radial), images, opacity
    - Strokes: Color, width, position, style (solid/dotted/dashed), caps/arrows
    - Border Radius: Customize rectangle/image corners
    - Shadows: Drop/inner shadows with position, blur, spread
    - Blur: Apply blur effects to objects
    - Blend Modes: Normal, multiply, screen, overlay, etc.
    - Opacity: Overall layer transparency

    **Layouts & Positioning:**
    - Flex Layout: CSS Flexbox-based flexible layouts
    - Grid Layout: CSS Grid-based 2D layouts with rows/columns
    - Alignment: Align and distribute layers
    - Positioning: Static, absolute positioning
    - Z-index: Layer stacking order

    **Components & Libraries:**
    - Components: Reusable objects with main/copy relationships
    - Component Variants: Group similar components with properties
    - Asset Libraries: Store components, colors, typography
    - Shared Libraries: Publish and connect libraries across files

    **Prototyping & Interactions:**
    - Prototype Mode: Connect boards for interactive prototypes
    - Triggers: On click, mouse enter/leave, after delay
    - Actions: Navigate, open/toggle/close overlays, previous screen, open URL
    - Animations: Dissolve, slide, push transitions
    - Flows: Multiple starting points for different user journeys

    **Advanced Features:**
    - Custom Fonts: Install and use custom typography
    - Design Tokens: Manage consistent design values
    - Exporting: Export designs in various formats
    - Inspect Mode: Get CSS properties and code
    - View Mode: Present and share prototypes
    - Teams: Collaborative features

    REMEMBER: Penpot doesn't have specific tools for every shape. Always search for alternative methods using existing tools like Path tool, Boolean operations, or combining basic shapes.
  `,
  function: async ({ query }) => {
    try {
      const dbInstance = await initializeOramaDb('penpotRagToolContents.zip', 'orama');
      const results = await searchOramaDb(query, {
        dbInstance,
        limit: 10,
        similarity: 0.85,
        embeddingModel: 'orama',
      });
      const payload = { results: results || [], query };
      return {
        ...ToolResponse,
        success: true,
        message: `Found ${results.length || 'no'} relevant sections in the database.`,
        payload,
      };
    } catch (error) {
      return {
        ...ToolResponse,
        success: false,
        message: 'Sorry, I encountered an error while searching the database. Please try again.',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          query,
        },
      };
    }
  },
};

const designStylesRag = {
  id: 'design-styles-rag',
  name: 'DesignStylesRagTool',
  inputSchema: z.object({
    query: z.string().describe('The search query to find relevant information in the design styles catalog'),
  }),
  description: `
    Use this tool to resolve queries about design styles.
    Always use this tool when you need to resolve questions related to design styles.
    This tool has access to a design styles catalog.
    Always use this tool when you need to provide advice related to design styles.
    
    CATALOG QUERY:
    - Use when the agent needs a list of all styles.
    - Example: "what design styles are available"

    STYLE-SPECIFIC QUERIES:
    - Format: "<style name> + <chunk name>"
    - Chunk names and content:
      - intent: definition + intentAndUse + keywords
      - palettes: color palettes and example colors
      - rules: design rules/principles
      - typography: font families and type guidance
      - layout: layout and component structure
      - accessibility: accessibility considerations
      - icon-libraries: recommended icon sets (ids from iconsRAGv3)
      - imagery: illustration and imagery guidance
  `,
  function: async ({ query }) => {
    try {
      const dbInstance = await initializeOramaDb('designRagToolContents.zip', 'orama');
      const results = await searchOramaDb(query, {
        dbInstance,
        limit: 6,
        similarity: 0.3,
        embeddingModel: 'orama',
      });
      return {
        ...ToolResponse,
        success: true,
        message: `Found ${results.length || 'no'} relevant sections in the database.`,
        payload: { results: results || [], query },
      };
    } catch (error) {
      return {
        ...ToolResponse,
        success: false,
        message: 'Sorry, I encountered an error while searching the database. Please try again.',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown error',
          query,
        },
      };
    }
  },
};

export const ragTools = [penpotUserGuideRag, designStylesRag];
