import { z } from 'zod';
import { tokenAssignmentSchema } from './tokensTypes';

import {
  Blur,
  Fill,
  FlexLayoutProperties,
  GridLayoutProperties,
  LayoutCellProperties,
  LayoutChildProperties,
  PathCommand,
  Shadow,
  Stroke,
  blendModeValues,
  removableProperties,
} from './shapeTypesSupport';

export const ShapeBase = z.object({
  name: z.string(),
  parentId: z.uuid().describe('Parent board, group, or component id, do not use the name of the shape'),
  parentIndex: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  borderRadius: z.number(),
  borderRadiusTopLeft: z.number(),
  borderRadiusTopRight: z.number(),
  borderRadiusBottomRight: z.number(),
  borderRadiusBottomLeft: z.number(),
  opacity: z.number(),
  blendMode: z.enum(blendModeValues),
  shadows: z.array(Shadow),
  blur: Blur,
  parentX: z.number(),
  parentY: z.number(),
  flipX: z.boolean(),
  flipY: z.boolean(),
  rotation: z.number(),
  fills: z.array(Fill),
  strokes: z.array(Stroke),
  layoutChild: LayoutChildProperties,
  layoutCell: LayoutCellProperties,
  tokens: z.array(tokenAssignmentSchema),
});

export const Text = ShapeBase.extend({
  characters: z.string(),
  growType: z.enum(['fixed', 'auto-width', 'auto-height']),
  fontFamily: z.string(),
  fontSize: z.number(),
  fontWeight: z.number(),
  fontStyle: z.enum(['normal', 'italic', 'mixed']),
  lineHeight: z.number().default(1).describe('separation between lines of text, in pixels, normally is 1, more than 10 is too much'),
  letterSpacing: z.number(),
  textTransform: z.enum(['uppercase', 'capitalize', 'lowercase', 'mixed']),
  textDecoration: z.enum(['underline', 'line-through', 'mixed']),
  direction: z.enum(['ltr', 'rtl', 'mixed']),
  align: z.enum(['left', 'center', 'right', 'justify', 'mixed']),
  verticalAlign: z.enum(['top', 'center', 'bottom']),
});

export const Path = ShapeBase.partial().extend({
  content: z.array(PathCommand),
});

export const Board = ShapeBase.extend({
  flex: FlexLayoutProperties,
  grid: GridLayoutProperties,
  clipContent: z.boolean(),
  boardHorizontalSizing: z.enum(['auto', 'fix']),
  boardVerticalSizing: z.enum(['auto', 'fix']),
});

export const createRectangleSchema = ShapeBase.partial();
export const createEllipseSchema = ShapeBase.partial();
export const createTextSchema = Text.partial();
export const createBoardSchema = Board.partial();
export const createPathSchema = Path;

const modifyShapeBaseSchema = z.object({
  shapeId: z.uuid().describe('Shape id to modify, do not use the shape name'),
  propertiesToRemove: z.array(z.enum(removableProperties)).optional()
    .describe(
      `Property names to remove. Allowed: ${removableProperties.join(', ')}. grid and flex apply only to boards. interactions removes all prototype interactions from the shape.`
    ),
});

export const modifyRectangleSchema = modifyShapeBaseSchema.extend({
  propertiesToModify: ShapeBase.partial().optional()
});
export const modifyEllipseSchema = modifyShapeBaseSchema.extend({
  propertiesToModify: ShapeBase.partial().optional()
});
export const modifyTextSchema = modifyShapeBaseSchema.extend({
  propertiesToModify: Text.partial().optional()
});
export const modifyBoardSchema = modifyShapeBaseSchema.extend({
  propertiesToModify: Board.partial().optional()
});
export const modifyPathSchema = modifyShapeBaseSchema.extend({
  propertiesToModify: Path.partial().optional()
});
export const modifyBooleanSchema = modifyShapeBaseSchema.extend({
  propertiesToModify: ShapeBase.partial().optional()
});

export const groupShapesSchema = z.object({
  ...ShapeBase.partial().shape,
  shapeIds: z.array(z.uuid()).describe('Shape ids to group, do not use the shapes names')
});
export const ungroupSchema = z.object({
  groupId: z.uuid().describe('Group id to ungroup, do not use the group name'),
});
export const convertShapesToBoardSchema = z.object({
  name: z.string(),
  shapeIds: z.array(z.uuid()).min(1).describe('Shape ids to convert to board, do not use the shapes names'),
});

export const createBooleanSchema = z.object({
  boolType: z.enum(['union', 'difference', 'exclude', 'intersection']),
  shapeIds: z.array(z.uuid()).min(2).describe('Shape ids to create boolean, do not use the shapes names'),
}).merge(ShapeBase.partial());

export const alignShapesSchema = z
  .object({
    shapeIds: z.array(z.uuid()).min(2).describe('Shape ids to align, do not use the shapes names'),
    axis: z.enum(['horizontal', 'vertical']),
    direction: z.enum(['left', 'center', 'right', 'top', 'bottom']),
  })
  .refine(
    (input) => {
      if (input.axis === 'horizontal') {
        return ['left', 'center', 'right'].includes(input.direction);
      }
      return ['top', 'center', 'bottom'].includes(input.direction);
    },
    { message: 'Horizontal axis requires left/center/right; vertical requires top/center/bottom' }
  );

export const distributeShapesSchema = z.object({
  shapeIds: z.array(z.uuid()).min(2).describe('Shape ids to distribute, do not use the shapes names'),
  axis: z.enum(['horizontal', 'vertical']),
});

const triggerSchema = z.enum(['click', 'mouse-enter', 'mouse-leave', 'after-delay']);

const animationSchema = z
  .object({
    type: z.enum(['dissolve', 'slide', 'push']),
    duration: z.number(),
    easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).optional(),
    way: z.enum(['in', 'out']).optional(),
    direction: z.enum(['right', 'left', 'up', 'down']).optional(),
    offsetEffect: z.boolean().optional(),
  })
  .optional();

const baseInteractionRefine = (schema) =>
  schema.refine(
    (input) => {
      if (input.trigger === 'after-delay') {
        return typeof input.delay === 'number' && input.delay >= 0;
      }
      return true;
    },
    { message: 'delay (ms, >= 0) is required when trigger is after-delay' }
  );

const baseInteractionFields = {
  shapeId: z.uuid().describe('Shape id to add interaction'),
  trigger: triggerSchema,
  delay: z.number().int().min(0).optional(),
};

export const addNavigateToInteractionSchema = baseInteractionRefine(
  z.object({
    ...baseInteractionFields,
    destinationBoardId: z.uuid().describe('Destination board id, do not use the name of the board'),
    preserveScrollPosition: z.boolean().optional(),
    animation: animationSchema,
  })
);

export const addCloseOverlayInteractionSchema = baseInteractionRefine(
  z.object({
    ...baseInteractionFields,
    destinationBoardId: z.uuid().optional().describe('Destination board id, do not use the name of the board'),
    animation: animationSchema.optional(),
  })
);

export const addPreviousScreenInteractionSchema = baseInteractionRefine(
  z.object({
    ...baseInteractionFields,
  })
);

export const addOpenUrlInteractionSchema = baseInteractionRefine(
  z.object({
    ...baseInteractionFields,
    url: z.string().url(),
  })
);

export const addOverlayInteractionSchema = baseInteractionRefine(
  z.object({
    ...baseInteractionFields,
    destinationBoardId: z.uuid().describe('Destination board id, do not use the name of the board'),
    relativeToShapeId: z.uuid().optional().describe('Shape id to relative to, do not use the shape name'),
    position: z
      .enum([
        'manual',
        'center',
        'top-left',
        'top-right',
        'top-center',
        'bottom-left',
        'bottom-right',
        'bottom-center',
      ])
      .default('center'),
    closeWhenClickOutside: z.boolean().optional(),
    addBackgroundOverlay: z.boolean().optional(),
    animation: animationSchema,
    manualPositionLocation: z
      .object({
        x: z.number(),
        y: z.number(),
      })
      .optional(),
  })
);

export const createFlowSchema = z.object({
  name: z.string().min(1),
  boardId: z.uuid().describe('Board id to create flow, do not use the name of the board'),
});

export const removeFlowSchema = z.object({
  flowName: z.string().min(1),
});

const textRangePropsSchema = Text.omit({ characters: true }).partial();

export const modifyTextRangeSchema = z.object({
  shapeId: z.uuid().describe('Shape id to modify text range, do not use the shape name'),
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  props: textRangePropsSchema,
});

export const rotateShapeSchema = z.object({
  shapeId: z.uuid().describe('Shape id to rotate, do not use the shape name'),
  angle: z.number(),
  center: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable()
    .optional(),
});

export const cloneShapeSchema = z.object({
  shapeId: z.uuid().describe('Shape id to clone, do not use the shape name'),
  parentId: z.uuid().optional().describe('Parent board, group, or component id, do not use the name of the shape'),
  parentIndex: z.number().optional(),
  parentX: z.number().optional(),
  parentY: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const deleteShapeSchema = z.object({
  shapeId: z.uuid().describe('Shape id to delete, do not use the shape name'),
});

export const reorderShapeSchema = z.object({
  shapeId: z.uuid().describe('Shape id to reorder, do not use the shape name'),
});
