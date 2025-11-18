# Penpot Wizard

An AI-powered chat assistant plugin for Penpot that uses a sophisticated multi-agent architecture to help users with design tasks, provide guidance, and create designs directly in their projects.

## Table of Contents

- [What is Penpot Wizard?](#what-is-penpot-wizard)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Core Concepts](#core-concepts)
  - [Director Agents](#director-agents)
  - [Specialized Agents](#specialized-agents)
  - [Tools](#tools)
- [Getting Started](#getting-started)
- [Creating Custom Agents](#creating-custom-agents)
  - [Creating a Director Agent](#creating-a-director-agent)
  - [Creating a Specialized Agent](#creating-a-specialized-agent)
- [Creating Custom Tools](#creating-custom-tools)
  - [Creating Function Tools](#creating-function-tools)
  - [Creating RAG Tools](#creating-rag-tools)
  - [Creating Drawing Tools](#creating-drawing-tools)
- [Plugin Communication System](#plugin-communication-system)
- [Development Setup](#development-setup)
- [File Structure](#file-structure)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

## What is Penpot Wizard?

Penpot Wizard is a plugin for [Penpot](https://penpot.app) that brings AI-powered assistance directly into your design workflow. It features:

- **Multi-Agent Architecture**: Director agents orchestrate specialized agents for different tasks
- **AI Integration**: Supports OpenAI and OpenRouter language models
- **RAG System**: Retrieval-Augmented Generation for searching Penpot documentation
- **Direct Drawing**: AI can create shapes, paths, and text directly in your Penpot projects
- **Conversational Interface**: Natural language chat interface with streaming responses
- **Persistent Conversations**: Save and resume conversations across sessions

## Features

### 🤖 Multi-Agent System
- **Director Agents**: High-level orchestrators that handle user interactions
- **Specialized Agents**: Focused sub-agents for specific tasks (UI design, drawing, etc.)
- **Tool Composition**: Agents can use multiple tools and call other agents

### 🎨 Design Capabilities
- Get design advice and UI/UX recommendations
- Create shapes directly in Penpot (rectangles, ellipses, paths, text)
- Access Penpot project and user data
- Search Penpot documentation with RAG

### 💬 Chat Interface
- Streaming responses for real-time feedback
- Conversation history with summaries
- Multiple conversations per agent
- Cancel streaming operations

### 🔧 Extensible Architecture
- Easy to add new agents
- Simple tool creation system
- Plugin-based communication with Penpot

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Penpot Application                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Plugin (plugin.ts)                   │  │
│  │  - Runs in Penpot context                            │  │
│  │  - Access to Penpot API                              │  │
│  │  - Handles shape creation                            │  │
│  │  - Provides project/user data                        │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │ postMessage                            │
│                     │ (bidirectional)                        │
│  ┌──────────────────▼────────────────────────────────────┐  │
│  │              UI (React App in iframe)                 │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │           Director Agent                      │   │  │
│  │  │  - Main orchestrator                         │   │  │
│  │  │  - Handles user messages                     │   │  │
│  │  │  - Coordinates tools & agents                │   │  │
│  │  └───┬──────────────────────────────────────────┘   │  │
│  │      │                                               │  │
│  │      │ Uses                                          │  │
│  │      │                                               │  │
│  │  ┌───▼────────────┬─────────────┬─────────────┐    │  │
│  │  │ Specialized    │   Tools      │ RAG Tools   │    │  │
│  │  │ Agents         │              │             │    │  │
│  │  │ - UI Design    │ - Get Data   │ - Search    │    │  │
│  │  │ - Drawing      │ - Draw       │   Docs      │    │  │
│  │  └────────────────┴──────────────┴─────────────┘    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

State Management (nanostores):
├── Director Agents Store (agent instances)
├── Specialized Agents Store (wrapped as tools)
├── Tools Store (function, RAG, drawing tools)
├── Settings Store (API keys, models)
├── Conversations Store (metadata, messages)
└── Streaming Store (real-time updates)
```

### Component Interaction Flow

1. **User sends message** → Active conversation store
2. **Director Agent receives message** → Processes with AI SDK
3. **Agent decides to use tools** → Calls specialized agents or tools
4. **Tools execute** → May send messages to plugin via postMessage
5. **Plugin responds** → Returns data/confirmation to UI
6. **Agent generates response** → Streams back to user
7. **UI updates** → Shows streaming response in real-time

## Core Concepts

### Director Agents

Director Agents are the main orchestrators of the system. They:

- **Handle direct user interaction** via the chat interface
- **Coordinate multiple tools and specialized agents**
- **Maintain conversation context**
- **Stream responses** to the UI

**When to create a Director Agent:**
- You want a new top-level assistant personality
- You need a different orchestration strategy
- You want to combine tools/agents in a unique way

**Director Agent Structure:**

```typescript
interface DirectorAgent {
  id: string;                          // Unique identifier
  name: string;                        // Display name
  description: string;                 // What this agent does
  system: string;                      // System prompt (personality, instructions)
  toolIds?: string[];                  // IDs of tools this agent can use
  specializedAgentIds?: string[];      // IDs of specialized agents it can call
  instance?: Agent<any, any, any>;     // AI SDK Agent instance (auto-created)
}
```

### Specialized Agents

Specialized Agents are sub-agents focused on specific tasks. They:

- **Are wrapped as tools** so director agents can call them
- **Have their own system prompts** and capabilities
- **Can use tools themselves** (composition)
- **Return structured outputs** (via Zod schemas)

**When to create a Specialized Agent:**
- You need focused expertise in a specific domain
- You want reusable sub-tasks across multiple directors
- You need structured output for specific operations

**Key Difference from Directors:**
- Specialized agents are **called as tools** by director agents
- They receive a `query` parameter and return a result
- They don't have direct access to the chat interface

**Specialized Agent Structure:**

```typescript
interface SpecializedAgent {
  id: string;                          // Unique identifier (must be kebab-case)
  name: string;                        // Tool name for AI
  description: string;                 // When to use this agent
  system: string;                      // System prompt
  outputSchema?: z.ZodObject<any>;     // Zod schema for structured output
  toolIds?: string[];                  // Tools this agent can use
  specializedAgentIds?: string[];      // Other agents it can call
  instance?: any;                      // Tool instance (auto-created)
}
```

### Tools

Tools are the atomic capabilities that agents can use. There are three types:

#### 1. Function Tools

Execute JavaScript functions with defined inputs/outputs.

**Examples:**
- `get-user-data`: Retrieves current Penpot user information
- `get-project-data`: Gets project structure, pages, shapes, fonts

**Use cases:**
- Accessing Penpot data
- Performing calculations
- External API calls
- Data transformations

#### 2. RAG Tools

Search vector databases for relevant information using embeddings.

**Examples:**
- `penpot-user-guide-rag`: Searches Penpot documentation

**Use cases:**
- Documentation search
- Knowledge base queries
- Context retrieval for answers

#### 3. Drawing Tools

Create visual elements directly in Penpot projects.

**Examples:**
- `rectangle-maker`: Creates rectangles
- `ellipse-maker`: Creates ellipses
- `path-maker`: Creates complex paths with bezier curves
- `text-maker`: Creates text elements

**Use cases:**
- Visual design generation
- Shape creation from descriptions
- Automated layout creation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenAI API key or OpenRouter API key
- Penpot account (for testing the plugin)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd penpot-wizard
```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**

For web development (without Penpot):
```bash
npm run dev
```

For Penpot plugin development:
```bash
npm run dev:penpot
```

This will:
- Build the plugin file (`plugin.js`)
- Watch for changes and rebuild automatically
- Serve the UI at `http://localhost:5174`

4. **Load the plugin in Penpot**

- Open Penpot
- Go to a project
- Menu → Plugins → Manage plugins
- Install from file
- Select the `dist` folder from this project

5. **Configure API Keys**

- Click the settings icon in the plugin
- Enter your OpenAI API key or OpenRouter API key
- Click "Check API Keys"
- Select a model from the dropdown

## Creating Custom Agents

### Creating a Director Agent

Director agents are defined in `src/assets/directorAgents.ts`.

**Step-by-step:**

1. **Open** `src/assets/directorAgents.ts`

2. **Add your agent** to the `directorAgents` array:

```typescript
export const directorAgents: DirectorAgent[] = [
  {
    id: "my-custom-agent",
    name: "My Custom Agent",
    description: "A custom agent for specific tasks",
    system: `
      <who_you_are>
        You are a specialized assistant focused on [your domain].
      </who_you_are>
      
      <your_tasks>
        - Task 1: [Description]
        - Task 2: [Description]
        - Task 3: [Description]
      </your_tasks>
      
      <language_rules>
        Use professional language at all times.
        Always answer in the same language as the user's message.
      </language_rules>
    `,
    toolIds: ["get-user-data", "get-project-data"],  // Tools this agent can use
    specializedAgentIds: ["ui-design-specialist"]     // Specialized agents it can call
  },
  // ... other agents
];
```

3. **Save the file** - The agent will be automatically initialized on next reload

**System Prompt Best Practices:**

- **Structure with XML tags** for clarity (`<who_you_are>`, `<your_tasks>`, etc.)
- **Be specific** about capabilities and limitations
- **Define behavior** for edge cases
- **Specify language handling** (multilingual support)
- **List available tools** if you want the agent to be aware of them
- **Keep it concise** but comprehensive

**Example: Code Review Agent**

```typescript
{
  id: "code-reviewer",
  name: "Code Review Assistant",
  description: "Reviews code and provides feedback on best practices",
  system: `
    <who_you_are>
      You are an expert code reviewer with deep knowledge of software engineering best practices,
      design patterns, and code quality standards.
    </who_you_are>
    
    <your_tasks>
      - Review code for bugs, security issues, and performance problems
      - Suggest improvements following SOLID principles
      - Provide constructive feedback with examples
      - Explain the reasoning behind your suggestions
    </your_tasks>
    
    <approach>
      1. Analyze the code structure and logic
      2. Identify potential issues
      3. Suggest specific improvements
      4. Provide code examples when helpful
    </approach>
    
    <language_rules>
      Always answer in the same language as the user's message.
      Use professional, constructive tone.
    </language_rules>
  `,
  toolIds: ["get-project-data"],  // Can inspect project structure
  specializedAgentIds: []
}
```

### Creating a Specialized Agent

Specialized agents are defined in `src/assets/specializedAgents.ts`.

**Step-by-step:**

1. **Open** `src/assets/specializedAgents.ts`

2. **Add your agent** to the `specializedAgents` array:

```typescript
import { z } from 'zod';

export const specializedAgents: SpecializedAgent[] = [
  {
    id: "my-specialist",  // kebab-case, will be used as tool ID
    name: "mySpecialist",  // camelCase, tool name for AI
    description: `
      Use this tool when the user needs [specific capability].
      This specialized agent will:
      - Capability 1
      - Capability 2
      - Capability 3
      
      Call this tool when:
      - Condition 1
      - Condition 2
    `,
    system: `
      <who_you_are>
        You are a specialized agent focused on [specific domain].
      </who_you_are>
      
      <your_role>
        - You do NOT provide general advice
        - You ONLY perform [specific tasks]
        - You execute immediately using available tools
      </your_role>
      
      <how_to_respond>
        1. Analyze the query
        2. Use appropriate tools
        3. Return structured output
      </how_to_respond>
    `,
    outputSchema: z.object({
      result: z.string().describe('The main result of the operation'),
      details: z.string().describe('Additional details or explanation'),
      success: z.boolean().describe('Whether the operation succeeded')
    }),
    toolIds: ["tool-1", "tool-2"],  // Tools this specialist can use
    specializedAgentIds: []  // Avoid circular dependencies
  },
  // ... other specialized agents
];
```

3. **Use in Director Agent:**

```typescript
// In directorAgents.ts
{
  id: "main-agent",
  // ...
  specializedAgentIds: ["my-specialist"]  // Now available to this director
}
```

**Output Schema Guidelines:**

- **Define clear structure** for what the agent returns
- **Use descriptive field names** and descriptions
- **Make fields optional** only when necessary
- **Validate with Zod** for type safety

**Example: Image Optimizer Specialist**

```typescript
{
  id: "image-optimizer",
  name: "imageOptimizer",
  description: `
    Use this tool to optimize images in the Penpot project.
    This agent will:
    - Analyze image sizes and formats
    - Suggest compression techniques
    - Recommend appropriate dimensions
    - Provide optimization strategies
    
    Call when:
    - User asks about image performance
    - Images need optimization
    - File size is a concern
  `,
  system: `
    <who_you_are>
      You are an image optimization specialist with expertise in web performance,
      compression algorithms, and modern image formats.
    </who_you_are>
    
    <your_role>
      - Analyze images in the project
      - Calculate optimal dimensions and compression
      - Recommend modern formats (WebP, AVIF)
      - Provide actionable optimization steps
    </your_role>
    
    <how_to_respond>
      1. Get project data to analyze images
      2. Calculate size savings
      3. Return structured recommendations
    </how_to_respond>
  `,
  outputSchema: z.object({
    currentSize: z.number().describe('Current total size in KB'),
    optimizedSize: z.number().describe('Estimated size after optimization in KB'),
    savings: z.number().describe('Percentage of size reduction'),
    recommendations: z.array(z.object({
      image: z.string().describe('Image identifier'),
      action: z.string().describe('Recommended action'),
      reason: z.string().describe('Why this optimization helps')
    })).describe('List of specific recommendations')
  }),
  toolIds: ["get-project-data"],
  specializedAgentIds: []
}
```

## Creating Custom Tools

### Creating Function Tools

Function tools execute JavaScript code with defined inputs and outputs.

**Location:** `src/assets/functionTools.ts`

**Step-by-step:**

1. **Define the tool structure:**

```typescript
import { FunctionTool } from '@/types/types';
import { z } from 'zod';
import { sendMessageToPlugin } from '@/utils/pluginUtils';

export const functionTools: FunctionTool[] = [
  {
    id: "my-custom-tool",
    name: "myCustomTool",
    description: `
      Use this tool to [what it does].
      
      This tool can:
      - Feature 1
      - Feature 2
      - Feature 3
    `,
    inputSchema: z.object({
      param1: z.string().describe('Description of param1'),
      param2: z.number().describe('Description of param2'),
      param3: z.boolean().optional().describe('Optional param3')
    }),
    function: async ({ param1, param2, param3 }) => {
      // Your implementation here
      console.log('Tool called with:', { param1, param2, param3 });
      
      // Return result
      return {
        success: true,
        message: 'Operation completed',
        data: { /* your data */ }
      };
    }
  },
  // ... other tools
];
```

2. **For tools that need plugin access:**

```typescript
{
  id: "penpot-action-tool",
  name: "penpotActionTool",
  description: "Performs an action in Penpot",
  inputSchema: z.object({
    action: z.string().describe('The action to perform')
  }),
  function: async ({ action }) => {
    // Send message to plugin
    const response = await sendMessageToPlugin(
      ClientQueryType.YOUR_NEW_QUERY,
      { action }
    );
    return response;
  }
}
```

3. **Add to plugin if needed** (`src/plugin/plugin.ts`):

```typescript
case ClientQueryType.YOUR_NEW_QUERY:
  const { action } = payload;
  
  // Perform action with Penpot API
  // penpot.doSomething(action);
  
  responsePayload.success = true;
  responsePayload.description = 'Action completed';
  responsePayload.data = { /* result */ };
  break;
```

**Example: Color Palette Generator**

```typescript
{
  id: "color-palette-generator",
  name: "colorPaletteGenerator",
  description: `
    Generates a color palette based on a base color.
    Returns a harmonious palette with primary, secondary, and accent colors.
  `,
  inputSchema: z.object({
    baseColor: z.string().describe('Base color in hex format (e.g., #3B82F6)'),
    paletteType: z.enum(['complementary', 'analogous', 'triadic', 'monochromatic'])
      .describe('Type of color harmony to generate')
  }),
  function: async ({ baseColor, paletteType }) => {
    // Helper function to convert hex to HSL
    const hexToHSL = (hex: string) => {
      // Implementation...
      return { h: 0, s: 0, l: 0 };
    };
    
    // Helper function to convert HSL to hex
    const hslToHex = (h: number, s: number, l: number) => {
      // Implementation...
      return '#000000';
    };
    
    const { h, s, l } = hexToHSL(baseColor);
    let palette: string[] = [baseColor];
    
    switch (paletteType) {
      case 'complementary':
        palette.push(hslToHex((h + 180) % 360, s, l));
        break;
      case 'analogous':
        palette.push(
          hslToHex((h + 30) % 360, s, l),
          hslToHex((h - 30) % 360, s, l)
        );
        break;
      case 'triadic':
        palette.push(
          hslToHex((h + 120) % 360, s, l),
          hslToHex((h + 240) % 360, s, l)
        );
        break;
      case 'monochromatic':
        palette.push(
          hslToHex(h, s, l * 0.7),
          hslToHex(h, s, l * 1.3)
        );
        break;
    }
    
    return {
      success: true,
      message: `Generated ${paletteType} color palette`,
      palette,
      baseColor
    };
  }
}
```

### Creating RAG Tools

RAG (Retrieval-Augmented Generation) tools search vector databases for relevant information.

**Location:** `src/assets/ragTools.ts`

**Prerequisites:**
1. A compressed database file (`.zip` with Orama database)
2. Place it in the `public/` folder
3. The database should contain embedded documents

**Step-by-step:**

1. **Define the RAG tool:**

```typescript
import { RagTool } from '@/types/types';

export const ragTools: RagTool[] = [
  {
    id: "my-knowledge-base-rag",
    name: "myKnowledgeBaseRag",
    ragContentFile: 'my-knowledge-base.zip',  // File in public/ folder
    description: `
      Use this tool to search [your knowledge base topic].
      
      IMPORTANT: All queries to this tool must be in English.
      
      QUERY CONSTRUCTION RULES:
      - Expand user queries with specific technical terms
      - Include multiple relevant concepts
      - Use format: "[user intent] + [specific terms] + [context]"
      
      Available topics:
      - Topic 1: [description]
      - Topic 2: [description]
      - Topic 3: [description]
      
      Example queries:
      ❌ Bad: "how to do X"
      ✅ Good: "how to do X using [specific feature] with [relevant context]"
    `,
  },
  // ... other RAG tools
];
```

2. **The tool is automatically initialized** with:
   - Database loading from the zip file
   - Embedding generation via OpenAI
   - Vector search capabilities

**Query Optimization Tips:**

- **Be specific**: Include relevant technical terms
- **Expand queries**: Add context and related concepts
- **Use English**: RAG tools typically work best with English queries
- **Test queries**: Verify search quality with various phrasings

**Example: API Documentation RAG**

```typescript
{
  id: "api-docs-rag",
  name: "apiDocsRag",
  ragContentFile: 'api-documentation.zip',
  description: `
    Use this tool to search the project's API documentation.
    
    IMPORTANT: All queries must be in English.
    
    QUERY CONSTRUCTION:
    - Always include the API endpoint or method name
    - Add HTTP method (GET, POST, PUT, DELETE) when relevant
    - Include parameter names or response fields
    
    Available documentation:
    - REST API endpoints
    - Authentication methods
    - Request/response schemas
    - Error codes and handling
    - Rate limiting information
    - Webhook configurations
    
    QUERY EXAMPLES:
    ❌ Bad: "user endpoint"
    ✅ Good: "GET user endpoint authentication parameters response schema"
    
    ❌ Bad: "create resource"
    ✅ Good: "POST create resource request body validation error handling"
    
    ❌ Bad: "webhook"
    ✅ Good: "webhook configuration event types payload structure signature verification"
  `
}
```

**Creating the Database File:**

The database file should be created using the Orama persistence plugin. Here's an example process:

```typescript
// This is typically done in a separate script
import { create, insert, save } from '@orama/orama';
import { persist } from '@orama/plugin-data-persistence';
import { createGzip } from 'zlib';
import { writeFileSync } from 'fs';

// 1. Create Orama database
const db = await create({
  schema: {
    id: 'string',
    heading: 'string',
    summary: 'string',
    text: 'string',
    url: 'string',
    sourcePath: 'string',
    breadcrumbs: 'string',
    embedding: 'vector[1536]',  // OpenAI ada-002 dimension
    hasCode: 'boolean',
    codeLangs: 'string'
  }
});

// 2. Insert your documents with embeddings
await insert(db, {
  id: '1',
  heading: 'Getting Started',
  summary: 'Introduction to the API',
  text: 'Full content here...',
  url: 'https://docs.example.com/getting-started',
  sourcePath: '/docs/getting-started.md',
  breadcrumbs: JSON.stringify(['Documentation', 'Getting Started']),
  embedding: await generateEmbedding('Full content here...'),
  hasCode: true,
  codeLangs: JSON.stringify(['javascript', 'typescript'])
});

// 3. Persist and compress
const rawData = await persist(db, 'binary');
const jsonData = JSON.stringify(rawData);
const compressed = createGzip();
// ... compression logic
writeFileSync('public/api-documentation.zip', compressed);
```

### Creating Drawing Tools

Drawing tools create visual elements in Penpot projects.

**Location:** `src/assets/drawingTools.ts`

**Step-by-step:**

1. **Define shape properties** (already available in the file):

```typescript
const penpotShapeProperties = z.object({
  parentId: z.string().optional().describe('The id of the parent shape'),
  x: z.number().describe('The x position'),
  y: z.number().describe('The y position'),
  width: z.number().describe('The width'),
  height: z.number().describe('The height'),
  borderRadius: z.number().optional().describe('The border radius'),
  // ... more properties
  opacity: z.number().optional().describe('The opacity'),
  blendMode: z.enum(blendModes).optional().describe('The blend mode'),
  color: z.string().optional().describe('The color in hex format'),
});
```

2. **Create your drawing tool:**

```typescript
export const drawingTools: FunctionTool[] = [
  // ... existing tools
  {
    id: "my-shape-maker",
    name: "myShapeMaker",
    description: `
      Use this tool to create [your custom shape].
      
      This tool can create:
      - Description of what it creates
      - Special features
      - Use cases
    `,
    inputSchema: penpotShapeProperties.extend({
      // Add shape-specific properties
      customProp: z.string().describe('A custom property')
    }),
    function: async (shapeProperties) => {
      console.log('Creating shape with:', shapeProperties);
      
      const response = await sendMessageToPlugin(ClientQueryType.DRAW_SHAPE, {
        shapeType: PenpotShapeType.YOUR_SHAPE_TYPE,
        params: shapeProperties,
      });
      
      return response;
    },
  }
];
```

3. **Handle in plugin** if needed (`src/plugin/plugin.ts`):

The plugin already handles basic shapes. For custom shapes, you might need to extend the handler:

```typescript
case PenpotShapeType.YOUR_SHAPE_TYPE:
  // Create custom shape using Penpot API
  newShape = penpot.createPath();
  // Configure the shape...
  break;
```

**Path Commands for Complex Shapes:**

For creating complex shapes with the path tool, use path commands. See `docs/PATH_COMMANDS_GUIDE.md` for details.

**Example: Star Maker Tool**

```typescript
{
  id: "star-maker",
  name: "starMaker",
  description: `
    Use this tool to draw a star shape.
    You can specify the number of points, outer and inner radius.
  `,
  inputSchema: penpotShapeProperties.extend({
    points: z.number().min(3).max(20).describe('Number of star points (3-20)'),
    outerRadius: z.number().describe('Outer radius of the star'),
    innerRadius: z.number().describe('Inner radius of the star'),
    content: z.array(z.object({
      command: z.enum(['M', 'move-to', 'Z', 'close-path', 'L', 'line-to']),
      params: z.object({
        x: z.number().optional(),
        y: z.number().optional(),
      }).optional()
    })).optional().describe('Auto-generated path commands')
  }),
  function: async (shapeProperties) => {
    const { points, outerRadius, innerRadius, x, y, ...rest } = shapeProperties;
    
    // Generate star path commands
    const commands: any[] = [];
    const angleStep = (Math.PI * 2) / points;
    
    for (let i = 0; i < points; i++) {
      // Outer point
      const outerAngle = i * angleStep - Math.PI / 2;
      const outerX = x + Math.cos(outerAngle) * outerRadius;
      const outerY = y + Math.sin(outerAngle) * outerRadius;
      
      if (i === 0) {
        commands.push({ command: 'M', params: { x: outerX, y: outerY } });
      } else {
        commands.push({ command: 'L', params: { x: outerX, y: outerY } });
      }
      
      // Inner point
      const innerAngle = (i + 0.5) * angleStep - Math.PI / 2;
      const innerX = x + Math.cos(innerAngle) * innerRadius;
      const innerY = y + Math.sin(innerAngle) * innerRadius;
      
      commands.push({ command: 'L', params: { x: innerX, y: innerY } });
    }
    
    commands.push({ command: 'Z' });
    
    // Create the star using path tool
    const response = await sendMessageToPlugin(ClientQueryType.DRAW_SHAPE, {
      shapeType: PenpotShapeType.PATH,
      params: {
        ...rest,
        x: 0,
        y: 0,
        width: outerRadius * 2,
        height: outerRadius * 2,
        content: commands
      },
    });
    
    return response;
  }
}
```

**Path Command Reference:**

Available commands for `path-maker`:
- `M` / `move-to`: Move to a point
- `L` / `line-to`: Draw line to point
- `H` / `line-to-horizontal`: Horizontal line
- `V` / `line-to-vertical`: Vertical line
- `C` / `curve-to`: Cubic Bézier curve
- `S` / `smooth-curve-to`: Smooth cubic Bézier
- `Q` / `quadratic-bezier-curve-to`: Quadratic Bézier
- `T` / `smooth-quadratic-bezier-curve-to`: Smooth quadratic Bézier
- `A` / `elliptical-arc`: Elliptical arc
- `Z` / `close-path`: Close the path

See `docs/PATH_COMMANDS_GUIDE.md` for detailed examples.

## Plugin Communication System

The plugin uses a bidirectional message system between the Penpot plugin context and the UI.

### Message Flow

```
UI (React)                 Plugin (Penpot)
    │                           │
    │  1. Send Query            │
    │──────────────────────────>│
    │   ClientQueryMessage      │
    │                           │
    │                      2. Process
    │                      (Use Penpot API)
    │                           │
    │  3. Send Response         │
    │<──────────────────────────│
    │   PluginResponseMessage   │
    │                           │
```

### Adding New Plugin Capabilities

**1. Define message types** (`src/types/types.ts`):

```typescript
export enum ClientQueryType {
  // ... existing types
  YOUR_NEW_QUERY = 'YOUR_NEW_QUERY',
}

export enum PluginResponseType {
  // ... existing types
  YOUR_NEW_RESPONSE = 'YOUR_NEW_RESPONSE',
}
```

**2. Handle in plugin** (`src/plugin/plugin.ts`):

```typescript
penpot.ui.onMessage((message: any) => {
  const { type, callId, payload, source } = message;
  
  // ... existing code
  
  switch (type) {
    // ... existing cases
    
    case ClientQueryType.YOUR_NEW_QUERY:
      try {
        // Use Penpot API
        const result = penpot.doSomething(payload.param);
        
        responsePayload.success = true;
        responsePayload.description = 'Operation successful';
        responsePayload.data = result;
      } catch (error) {
        responsePayload.success = false;
        responsePayload.description = `Error: ${error}`;
      }
      break;
  }
  
  sendResponseToClient(callId, type, responsePayload);
});
```

**3. Create tool in UI** (`src/assets/functionTools.ts`):

```typescript
{
  id: "your-new-tool",
  name: "yourNewTool",
  description: "What this tool does",
  inputSchema: z.object({
    param: z.string().describe('Parameter description')
  }),
  function: async ({ param }) => {
    const response = await sendMessageToPlugin(
      ClientQueryType.YOUR_NEW_QUERY,
      { param }
    );
    return response;
  }
}
```

### Selection safety (read-only vs action-only)

We use a small selection safety system to avoid Penpot selection-related crashes and keep agent tools safe:
- read-only helper `readSelectionInfo()` — returns serialized selection properties and is safe for UI/agents to call (GET_SELECTION_INFO endpoint).
- action-only helper `actionSelection.getSelectionForAction()` — used only inside plugin action handlers when mutating shapes; UI code should never import this directly.
- The plugin exposes read endpoints (GET_SELECTION_INFO) for UI and read-only workflows and action endpoints (RESIZE, APPLY_FILL, etc.) for mutations; tools should follow "read-first, act-later" so the UI can show dimensions before the plugin performs any change.

This separation prevents JavaFX selection race conditions and makes it safe for AI tools to query selection data without causing side effects.

### Available Plugin APIs

The plugin has access to the full Penpot Plugin API:

```typescript
// Current context
penpot.currentUser      // User information
penpot.currentFile      // File/project data
penpot.currentPage      // Active page
penpot.theme           // Current theme (light/dark)
penpot.fonts           // Available fonts

// Shape creation
penpot.createRectangle()
penpot.createEllipse()
penpot.createPath()
penpot.createText(text)
penpot.createBoard()

// Selection
penpot.selection       // Current selection

// Events
penpot.on('themechange', callback)
penpot.on('selectionchange', callback)
```

See [Penpot Plugin API documentation](https://help.penpot.app/technical-guide/plugins/) for complete reference.

## Development Setup

### Project Structure

```
penpot-wizard/
├── src/
│   ├── assets/                 # Agent and tool definitions
│   │   ├── directorAgents.ts
│   │   ├── specializedAgents.ts
│   │   ├── functionTools.ts
│   │   ├── ragTools.ts
│   │   └── drawingTools.ts
│   ├── components/             # React components
│   │   ├── Chat/
│   │   ├── LeftSidebar/
│   │   └── SettingsForm/
│   ├── plugin/                 # Plugin code (runs in Penpot)
│   │   ├── plugin.ts
│   │   └── utils.ts
│   ├── stores/                 # State management (nanostores)
│   │   ├── directorAgentsStore.ts
│   │   ├── specializedAgentsStore.ts
│   │   ├── toolsStore.ts
│   │   ├── settingsStore.ts
│   │   ├── conversationsMetadataStore.ts
│   │   ├── activeConversationStore.ts
│   │   └── streamingMessageStore.ts
│   ├── types/                  # TypeScript types
│   │   └── types.ts
│   └── utils/                  # Utility functions
│       ├── modelUtils.ts
│       ├── pluginUtils.ts
│       ├── ragUtils.ts
│       └── messagesStorageUtils.ts
├── public/                     # Static assets
│   ├── manifest.json
│   ├── icon.svg
│   └── penpotRagToolContents.zip
├── dist/                       # Build output
├── docs/                       # Documentation
│   └── PATH_COMMANDS_GUIDE.md
└── package.json
```

### Build Commands

```bash
# Development mode (UI only, browser)
npm run dev

# Development mode (Penpot plugin, with watch)
npm run dev:penpot

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint
```

### Build Process

The project has two build configurations:

**1. Plugin Build** (`vite.config.plugin.ts`):
- Entry: `src/plugin/plugin.ts`
- Output: `dist/plugin.js`
- Format: IIFE (runs in Penpot context)

**2. UI Build** (`vite.config.js`):
- Entry: `src/main.jsx`
- Output: `dist/index.html` + assets
- Format: ES modules
- Runs in iframe

### Environment Variables

No environment variables are needed. API keys are stored in browser localStorage via the settings UI.

### Testing

The project includes Vitest for testing:

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test src/utils/messagesUtils.test.ts
```

### Adding Dependencies

```bash
# Add a runtime dependency
npm install package-name

# Add a dev dependency
npm install -D package-name
```

**Important dependencies:**
- `ai` - Vercel AI SDK for agent orchestration
- `@ai-sdk/openai` - OpenAI provider
- `@openrouter/ai-sdk-provider` - OpenRouter provider
- `@orama/orama` - Vector database for RAG
- `nanostores` - State management
- `@nanostores/react` - React bindings for nanostores
- `@penpot/plugin-types` - Penpot plugin type definitions
- `zod` - Schema validation
- `react` / `react-dom` - UI framework

## File Structure

### Key Files and Their Purpose

| File | Purpose |
|------|---------|
| `src/assets/directorAgents.ts` | Define director agents |
| `src/assets/specializedAgents.ts` | Define specialized agents |
| `src/assets/functionTools.ts` | Define function tools |
| `src/assets/ragTools.ts` | Define RAG tools |
| `src/assets/drawingTools.ts` | Define drawing tools |
| `src/stores/directorAgentsStore.ts` | Director agent initialization and state |
| `src/stores/specializedAgentsStore.ts` | Specialized agent initialization |
| `src/stores/toolsStore.ts` | Tool initialization (Function, RAG, Drawing) |
| `src/stores/settingsStore.ts` | API keys, models, validation |
| `src/stores/conversationActionsStore.ts` | Conversation orchestration |
| `src/stores/activeConversationStore.ts` | Active conversation state |
| `src/stores/conversationsMetadataStore.ts` | Conversation metadata (lightweight) |
| `src/stores/streamingMessageStore.ts` | Streaming response state |
| `src/plugin/plugin.ts` | Plugin entry point (Penpot context) |
| `src/plugin/utils.ts` | Path command utilities |
| `src/utils/pluginUtils.ts` | Plugin communication helpers |
| `src/utils/ragUtils.ts` | RAG database utilities |
| `src/utils/modelUtils.ts` | Model instance creation |
| `src/utils/messagesStorageUtils.ts` | LocalStorage message persistence |
| `src/types/types.ts` | TypeScript type definitions |
| `src/main.jsx` | UI entry point |
| `src/App.jsx` | Main app component |
| `public/manifest.json` | Plugin manifest |

### Store Architecture

The application uses **nanostores** for state management with a clear separation of concerns:

**Settings Stores:**
- `settingsStore.ts` - API keys, model selection, validation

**Agent Stores:**
- `directorAgentsStore.ts` - Director agent instances
- `specializedAgentsStore.ts` - Specialized agent instances (wrapped as tools)
- `toolsStore.ts` - Function, RAG, and Drawing tool instances

**Conversation Stores (V2 Architecture):**
- `conversationsMetadataStore.ts` - Lightweight metadata for all conversations
- `activeConversationStore.ts` - Messages for the currently active conversation only
- `streamingMessageStore.ts` - Real-time streaming message state
- `conversationActionsStore.ts` - Orchestrates all conversation operations

**Other Stores:**
- `penpotStore.ts` - Penpot theme and plugin state

### Initialization Flow

```
1. User opens plugin
   ↓
2. main.jsx loads stores
   ↓
3. settingsStore checks for API keys
   ↓
4. If $isConnected becomes true:
   ↓
5. initializeTools() - Creates tool instances
   ↓
6. initializeSpecializedAgents() - Wraps agents as tools
   ↓
7. initializeDirectorAgents() - Creates director agents with tools
   ↓
8. User can start chatting
```

## Best Practices

### Agent Design

**DO:**
- ✅ Keep director agents focused on orchestration
- ✅ Create specialized agents for domain-specific tasks
- ✅ Use clear, structured system prompts with XML tags
- ✅ Specify exact capabilities and limitations
- ✅ Test agents with various input scenarios
- ✅ Use Zod schemas for structured outputs

**DON'T:**
- ❌ Create specialized agents that are too general
- ❌ Give specialized agents direct chat interface access
- ❌ Forget to specify language handling in system prompts
- ❌ Create circular dependencies between agents
- ❌ Make system prompts too vague or too long

### Tool Composition

**DO:**
- ✅ Create atomic tools that do one thing well
- ✅ Compose tools into specialized agents
- ✅ Document tool parameters clearly
- ✅ Return consistent result formats
- ✅ Handle errors gracefully with descriptive messages
- ✅ Log tool calls for debugging

**DON'T:**
- ❌ Create tools with too many responsibilities
- ❌ Return inconsistent data structures
- ❌ Ignore error cases
- ❌ Forget input validation with Zod
- ❌ Make tools dependent on external state

### System Prompt Engineering

**Structure Template:**

```
<who_you_are>
  Clear identity and expertise
</who_you_are>

<your_tasks>
  Specific responsibilities
</your_tasks>

<your_approach>
  How you solve problems
</your_approach>

<output_guidelines>
  How to format responses
</output_guidelines>

<language_rules>
  Multilingual support rules
</language_rules>

<what_to_avoid>
  Explicit limitations
</what_to_avoid>
```

**Tips:**
- Be specific about tools available
- Include examples of good/bad outputs
- Specify edge case handling
- Define tone and personality
- Keep prompts under 1000 tokens when possible

### Performance Optimization

**State Management:**
- Only active conversation messages are kept in memory
- Conversation metadata is lightweight (no messages)
- Streaming messages are separate from history
- Use persistent atoms for settings

**RAG Optimization:**
- Compress database files with gzip
- Use specific, expanded queries
- Limit search results (default: 10)
- Cache database instances

**UI Performance:**
- Use React.memo for message components
- Implement virtual scrolling for long conversations
- Debounce input fields
- Lazy load conversation messages

### Security Considerations

**API Keys:**
- Stored in browser localStorage only
- Never sent to backend (client-side only)
- Use `dangerouslyAllowBrowser: true` flag (acceptable for plugins)
- Users control their own keys

**Plugin Isolation:**
- Plugin runs in Penpot's sandboxed environment
- Communication via postMessage only
- No direct DOM access between contexts

**Input Validation:**
- Always use Zod schemas
- Validate all plugin messages
- Sanitize user inputs before processing

## Troubleshooting

### Common Issues

#### "Not connected" Error

**Symptom:** Agents don't initialize, settings show "not connected"

**Solutions:**
1. Check API key is entered correctly
2. Click "Check API Keys" button
3. Verify API key has credits/is active
4. Check browser console for validation errors
5. Try a different model if one model fails

#### Streaming Stops/Freezes

**Symptom:** Response starts but stops mid-stream

**Solutions:**
1. Check network connection
2. Verify API credits/rate limits
3. Look for errors in browser console
4. Try reloading the plugin
5. Check if model is overloaded (OpenRouter status)

#### Tool Not Available to Agent

**Symptom:** Agent says it can't use a tool you added

**Solutions:**
1. Verify tool ID is in agent's `toolIds` array
2. Check tool is properly exported in tools file
3. Reload plugin to reinitialize tools
4. Check browser console for initialization errors
5. Verify tool ID follows kebab-case format

#### RAG Tool Returns No Results

**Symptom:** RAG search returns empty results

**Solutions:**
1. Check database file exists in `public/` folder
2. Verify file is referenced correctly in ragTools
3. Use more specific, expanded queries
4. Check if database has embeddings
5. Verify OpenAI API key for embeddings

#### Path Drawing Errors

**Symptom:** "Value not valid" error when drawing paths

**Solutions:**
1. Use `pathCommandsToSvgString()` to convert commands
2. Ensure `close-path` has no parameters
3. Check all commands have required params
4. Verify path coordinates are numbers
5. See `docs/PATH_COMMANDS_GUIDE.md`

#### Plugin Not Loading in Penpot

**Symptom:** Plugin doesn't appear or fails to load

**Solutions:**
1. Rebuild with `npm run build`
2. Check `dist/` folder has all files
3. Verify `manifest.json` is correct
4. Try removing and re-adding plugin in Penpot
5. Check browser console in plugin iframe

### Debugging Tips

**Enable Detailed Logging:**

```typescript
// In stores or tools
console.log('Tool called:', toolId, params);
console.log('Agent response:', response);
console.log('Plugin message:', message);
```

**Check Store State:**

```javascript
// In browser console
import { $toolsData } from './stores/toolsStore';
console.log($toolsData.get());
```

**Test Tools Independently:**

```typescript
// Create a test function
async function testTool() {
  const tool = getToolById('my-tool');
  const result = await tool.function({ param: 'test' });
  console.log('Result:', result);
}
```

**Monitor Plugin Communication:**

```typescript
// In src/utils/pluginUtils.ts
console.log('Sending to plugin:', queryMessage);
console.log('Received from plugin:', payload);
```

**Verify Agent Initialization:**

```typescript
// In browser console (after plugin loads)
import { $directorAgentsData } from './stores/directorAgentsStore';
console.log($directorAgentsData.get());
// Check if .instance is defined for each agent
```

## Documentation

Comprehensive documentation is available in the `/docs` folder:

### Core Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture overview
  - Three-layer architecture
  - Multi-agent system design
  - Data flow diagrams
  - Key design decisions

- **[CODE_STRUCTURE.md](./docs/CODE_STRUCTURE.md)** - File organization and structure
  - Directory overview
  - Module responsibilities
  - Import conventions
  - Naming conventions

- **[STATE_MANAGEMENT.md](./docs/STATE_MANAGEMENT.md)** - State management with nanostores
  - Store architecture
  - Settings, agents, and conversation stores
  - V2 conversation architecture
  - Best practices

### System-Specific Documentation

- **[AGENT_SYSTEM.md](./docs/AGENT_SYSTEM.md)** - Multi-agent system details
  - Director, coordinator, and specialized agents
  - Agent communication
  - Creating custom agents
  - System prompt engineering

- **[TOOLS_SYSTEM.md](./docs/TOOLS_SYSTEM.md)** - Tools creation and usage
  - Function tools, RAG tools, drawing tools
  - Creating custom tools
  - Tool best practices
  - Stacking order for drawing

- **[PLUGIN_COMMUNICATION.md](./docs/PLUGIN_COMMUNICATION.md)** - Plugin integration
  - postMessage protocol
  - Plugin handlers
  - Adding new operations
  - Debugging tips

### Development Documentation

- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development setup and workflow
  - Setup instructions
  - Build system
  - Testing
  - Debugging
  - Common tasks

- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Contribution guidelines
  - Code of conduct
  - Development workflow
  - Code style
  - Pull request process
  - Bug reporting

### Additional Guides

- **[PATH_COMMANDS_GUIDE.md](./docs/PATH_COMMANDS_GUIDE.md)** - Drawing path commands reference
  - Path command syntax
  - Examples for common shapes
  - Bezier curves and arcs

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Code style guidelines
- Testing requirements
- Pull request process

Quick start:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development setup.

## Resources

### External Documentation

- [Penpot Plugin API Documentation](https://help.penpot.app/technical-guide/plugins/)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [nanostores Documentation](https://github.com/nanostores/nanostores)
- [Orama Documentation](https://docs.oramasearch.com/)
- [Zod Documentation](https://zod.dev/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues, questions, or contributions:
- **Issues**: [Open an issue](link-to-issues)
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the `/docs` folder
- **Contact**: [Your contact info]

---

Built with ❤️ for the Penpot community
