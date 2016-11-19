(function(global) {
  "use strict";

  class Eraser extends global.class.Tool {
    constructor() {
      super();
      this.drawing = false;
      this.pos;
      this.options.size = 10;
      this.options.angle = 0;
      this.options.alpha = 1;
      this.options.alphaExpo = 1;
      this.options.shape = 0;
    }
    enable() {}
    disable() {}
    createGui(gui) {
      gui.add(this.options, "size").min(1).max(50);
      gui.add(this.options, "angle").min(0).max(360);
      gui.add(this.options, "alpha").min(0.1).max(1).step(0.05).onChange(function(value) {
        this.options.alphaExpo = value * value;
      }.bind(this));
      gui.add(this.options, "shape", {Circle:0, Rect:1}).onChange(function(value) {
        this.options.shape = parseInt(value) || 0;
      }.bind(this));
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
      ctx.save();

      switch(this.options.shape) {
        case 0:
          ctx.beginPath();
          ctx.fillStyle = 'rgba(0,0,0,'+this.options.alphaExpo+')';
          ctx.globalCompositeOperation = 'destination-out';
          ctx.arc(
            this.pos.x,
            this.pos.y,
            size, 0, 2 * Math.PI);
          ctx.fill();
          break;
        case 1:
          ctx.translate(this.pos.x, this.pos.y);
          ctx.rotate(this.options.angle);
          var hSize = size / 2;
          ctx.clearRect(-hSize, -hSize, size, size);
          break;
      }
      ctx.restore();
    }
  }
  global.ToolManager.registerTool(Eraser);
})(CircularDrawing);