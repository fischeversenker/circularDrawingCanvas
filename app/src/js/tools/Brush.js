(function(global) {
  "use strict";

  class Brush extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
    }
    enable() {}
    disable() {}

    onMouseDown(pos, e) {
      console.log("brush go");
      this.getHistory().saveState();
      this.drawing = true;
      global.drawStrokeAt(new Victor(e.offsetX, e.offsetY));
    }

    onMouseMove(pos, e) {
      if (this.drawing) {
        global.drawStrokeAt(new Victor(e.offsetX, e.offsetY));
      }
    }
    onMouseUp(pos, e) {
      this.drawing = false;
    }
    draw(ctx) {
      ctx.beginPath();
      ctx.arc(
         pos.x - options.strokeSize,
         pos.y - options.strokeSize,
         options.strokeSize, 0, 2*Math.PI);
      ctx.fill();
    }
  }
  global.ToolManager.registerTool(Brush);
})(CircularDrawing);