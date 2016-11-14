(function(global) {
  "use strict";
  var options = global.options;
  global.cRenderer = {
    init() {
      global.log("cRenderer", "Initialize");
    },
    render(ctx, drawFn) {
      var sectorAngle = (360 / options.spineCount).toRad(),
        sector,
        color = "red";

      ctx.save();
      ctx.translate(global.center.x, global.center.y);
      for(sector = 0; sector < options.spineCount; sector++){
        color = this._getColor(sector);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        ctx.rotate(sectorAngle);
        drawFn(ctx);
      }
      ctx.restore();
    },
    _getColor(i) {
      var hue = global.mouse.angle * (180 / Math.PI);//  ((angleOffset + sectorAngle * i) / (Math.PI * 2)) * 360;
      var v = Math.min(100, Math.sqrt(Math.pow(global.mouse.pos.x, 2) + Math.pow(global.mouse.pos.y, 2)) / 4);

      switch(options.renderStyle) {
        case 0:
          return 'hsl('+ hue +', '+'100%, '+ v +'%)';
          break;
        case 1:
          return 'hsl('+ hue +', 100%, 50%)';
          break;
        case 2:
          //fixme needs the sector id
          return options.sectorColors[1];
          break;
        case 3:
          //fixme needs the sector id
          var sectorAngle = 360 / options.spineCount;
          hue = (Math.floor( (global.mouse.angle + sectorAngle * i) / sectorAngle) * sectorAngle).toDeg();
          v = 50;
          return 'hsl('+ hue +', '+'100%, '+ v +'%)';
          break;
        case 4:
          //fixme needs the sector id
          hue = (1 / (options.spineCount-1)) * 360;
          v = 50;
          return 'hsl('+ hue +', '+'100%, '+ v +'%)';
          break;
        case 5:
          return options.strokeColor;
          break;
      }
    }
  };
})(CircularDrawing);