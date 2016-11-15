(function(global) {
  "use strict";

  class Brush extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
      this.pos;
      this.options.size = 2;
    }
    enable() {
      global.log("Brush", "enable");
    }
    disable() {}
    createGui(gui) {
      gui.add(this.options, "size").min(1).max(50);
    }

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
      var size = this.options.size;
      ctx.beginPath();
      ctx.arc(
        this.pos.x,
        this.pos.y,
        size, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  global.ToolManager.registerTool(Brush);
})(CircularDrawing);