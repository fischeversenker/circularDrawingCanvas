(function(global) {
  "use strict";

  class Line extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
      this.start = new Victor(0, 0);
      this.end = new Victor(0, 0);
      this.options.lineWidth = 2;
    }
    enable() {
      global.log("Line", "enable");
    }
    disable() {}
    createGui(gui) {
      gui.add(this.options, "lineWidth").min(1).max(30);
    }

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
      if (!this.drawing) return;
      this.drawing = false;
      global.cRenderer.render(global.drawingCtx, this.renderLine.bind(this));
      this.clearOverlay();
    }
    updateOverlay() {
      this.clearOverlay();
      global.cRenderer.render(global.overlayCtx, this.renderLine.bind(this));
    }
    renderLine(ctx) {
      ctx.save();
      ctx.lineJoin = ctx.lineCap = 'round';
      //ctx.shadowBlur = 10;
      // shadow color
      //ctx.shadowColor = 'rgb(0, 0, 0)';
      ctx.beginPath();
      ctx.lineWidth = this.options.lineWidth;
      ctx.moveTo(this.start.x, this.start.y);
      ctx.lineTo(this.end.x, this.end.y);
      ctx.stroke();
      ctx.restore();
    }
  }
  global.ToolManager.registerTool(Line);
})(CircularDrawing);