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
      var l = Math.min(100, Math.sqrt(Math.pow(global.mouse.pos.x, 2) + Math.pow(global.mouse.pos.y, 2)) / 4);
      var diagonalVic = new Victor($(window).width(), $(window).height());
      var diag = diagonalVic.length();

      switch(options.renderStyle) {
        case 0:
          return 'hsl('+ hue +', '+'100%, '+ l +'%)';
        case 1:
          return 'hsl('+ hue +', 100%, 50%)';
        case 2:
          //fixme needs the sector id
          return options.sectorColors[1];
        case 3:
          //fixme needs the sector id
          var sectorAngle = 360 / options.spineCount;
          hue = (Math.floor( (global.mouse.angle + sectorAngle * i) / sectorAngle) * sectorAngle).toDeg();
          l = 50;
          return 'hsl('+ hue +', '+'100%, '+ l +'%)';
        case 4:
          //fixme needs the sector id
          hue = (1 / (options.spineCount-1)) * 360;
          l = 50;
          return 'hsl('+ hue +', '+'100%, '+ l +'%)';
        case 5:
          return options.strokeColor;
        case 6:
          l = Math.min(100, options.colorRadius * global.mouse.pos.length() / (diag / 2));
          // l = 100 * pos.length() / (diag / 2);
          return 'hsl('+ hue +', ' + '100%, '+ l + '%)';
      }
    }
  };
})(CircularDrawing);