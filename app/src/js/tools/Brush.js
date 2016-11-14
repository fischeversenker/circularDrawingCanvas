(function(global) {
  "use strict";

  class Brush extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
      this.pos;
    }
    enable() {
      global.log("Brush", "enable");
    }
    disable() {}

    onMouseDown(pos, e) {
      this.getHistory().saveState();
      this.drawing = true;
      this.pos = pos;
      global.cRenderer.render(global.drawingCtx, this.draw.bind(this));
    }

    onMouseMove(pos, e) {
      if (this.drawing) {
        this.pos = pos;
        global.cRenderer.render(global.drawingCtx, this.draw.bind(this));
      }
    }
    onMouseUp(pos, e) {
      this.drawing = false;
    }
    draw(ctx) {
      var size = global.options.strokeSize;
      ctx.beginPath();
      ctx.arc(
        this.pos.x - size,
        this.pos.y - size,
        size, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  global.ToolManager.registerTool(Brush);
})(CircularDrawing);