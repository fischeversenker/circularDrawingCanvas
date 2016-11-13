(function(global) {
  "use strict";

  class Brush extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
    }
    enable() {}
    disable() {}

    onMouseDown(e) {
      this.getHistory().saveState();
      this.drawing = true;
      global.drawStrokeAt(new Victor(e.offsetX, e.offsetY));
    }

    onMouseMove(e) {
      if (this.drawing) {
        global.drawStrokeAt(new Victor(e.offsetX, e.offsetY));
      }
    }

    onMouseUp(e) {
      this.drawing = false;
    }
  }
  global.ToolManager.registerTool(Brush);
})(CircularDrawing);