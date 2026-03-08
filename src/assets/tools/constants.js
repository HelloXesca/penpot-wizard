export const positionAdvice = (shapeType) => `
  IMPORTANT!!
  if the ${shapeType} is inside a board, component or group always use parentX and parentY to define the position relative to the parent.
  use x, y to define the position only when the parent is the root frame.
`;

export const parentAdvice = (shapeType) => `
  REMEMBER:
  use parentId to place the ${shapeType} inside a board, group, or component.
  use parentIndex to define the index at which the ${shapeType} will be inserted in the parent, higher values appear on top of lower values.
`;

export const textPropertiesAdvice = `
  TEXT PROPERTIES:
  growType: "auto-width" = text grows horizontally from x, NOT centered in parent. "fixed" = respects width, wraps. "auto-height" = fixed width, grows vertically.
  align: "center" centers text within its own bounding box, NOT the parent board. To center text in a board of width W, use growType: "fixed" and width: W.
  Multiline: use real newlines \\n in characters (e.g. "Line 1\\nLine 2"). The tool converts escaped \\n to actual newlines.

  IMPORTANT RULES!!
  when using growType: "fixed" you should provide the width and height of the text.
`;