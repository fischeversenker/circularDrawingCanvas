(function(global) {
  "use strict";

  class Line extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
      this.start = new Victor(0, 0);
      this.end = new Victor(0, 0);
    }
    enable() {}
    disable() {}

    onMouseDown(pos, e) {
      this.getHistory().saveState();
      this.drawing = true;
      this.start = pos.clone();
      this.end = pos;
      this.updateOverlay();
    }
    onMouseMove(pos, e) {
      if (this.drawing) {
        this.end = pos;
        this.updateOverlay();
      }
    }
    onMouseUp(pos, e) {
      this.drawing = false;
      global.cRenderer.render(global.drawingCtx, this.renderLine.bind(this));
      this.clearOverlay();
    }
    updateOverlay() {
      this.clearOverlay();
      global.cRenderer.render(global.overlayCtx, this.renderLine.bind(this));
    }
    clearOverlay() {
      global.overlayCtx.clearRect(0, 0, global.overlayCtx.canvas.width, global.overlayCtx.canvas.height);
    }
    renderLine(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.start.x, this.start.y);
      ctx.lineTo(this.end.x, this.end.y);
      ctx.stroke();
    }
  }
  global.ToolManager.registerTool(Line);
})(CircularDrawing);