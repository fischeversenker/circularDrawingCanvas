(function(global) {
  "use strict";

  class Path extends global.class.Tool {
    constructor() {
      super();
      this.options.lineWidth = 1;
      this.options.furLineWidth = 1;
      this.options.style = 0;
      this.drawing = false;
      this.pathData = [];
    }
    enable() {
      global.log("Path", "enable");
    }
    disable() {}
    createGui(gui) {
      var self = this;
      gui.add(this.options, "lineWidth").min(1).max(30).name("Size");
      gui.add(this.options, "style", {Normal: 0, Fur: 1}).name("Style").onChange(function(e) {
        self.options.style = parseInt(e) || 0;
      });
    }

    onMouseDown(pos, e) {
      this.getHistory().saveState();
      this.drawing = true;
      this.pathData.push(pos.x, pos.y);
    }
    onMouseMove(pos, e) {
      if (this.drawing) {
        this.pathData.push(pos.x, pos.y);
        global.cRenderer.render(global.drawingCtx, this.renderLine.bind(this));
      }
    }
    onMouseUp(pos, e) {
      if (!this.drawing) return;
      this.drawing = false;
      this.pathData = [];
    }
    renderLine(ctx) {
      ctx.lineJoin = ctx.lineCap = 'round';
      ctx.shadowBlur = 10;
      // shadow color
      //ctx.shadowColor = 'rgb(0, 0, 0)';

      ctx.lineWidth = this.options.lineWidth;
      ctx.beginPath();
      ctx.moveTo( this.pathData[this.pathData.length - 4],
                  this.pathData[this.pathData.length - 3]);
      ctx.lineTo( this.pathData[this.pathData.length - 2],
                  this.pathData[this.pathData.length - 1]);
      ctx.stroke();
      if (this.options.style === 1) this.renderFur(ctx, this.pathData.length - 2);
    }

    renderFur(ctx, index) {
      //http://perfectionkills.com/exploring-canvas-drawing-techniques/
      //sehr zu empfehlen
      var dx,
          dy,
          d;

      ctx.lineWidth = this.options.furLineWidth;
      for (var i = 0; i < this.pathData.length; i+=2) {
        dx = this.pathData[i] - this.pathData[index];
        dy = this.pathData[i + 1] - this.pathData[index + 1];
        d = dx * dx + dy * dy;

        if (d < 2000 && Math.random() > d / 2000) {
          ctx.beginPath();
         // ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.moveTo( this.pathData[index] + (dx * 0.5), this.pathData[index + 1] + (dy * 0.5));
          ctx.lineTo( this.pathData[index] - (dx * 0.5), this.pathData[index + 1] - (dy * 0.5));
          ctx.stroke();
        }
      }
    }
  }
  global.ToolManager.registerTool(Path);
})(CircularDrawing);