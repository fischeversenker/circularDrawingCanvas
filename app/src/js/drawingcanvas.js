(function($) {
  "use strict";

  $(function() {
    var DEVELOPMENT = false;

    var bgCanvas = $("<canvas />").appendTo($("#drawer")).get(0);
    var bgCtx = bgCanvas.getContext("2d");
    var drawingCanvas = $("<canvas/>").insertAfter($(bgCanvas)).get(0);
    var drawingCtx = drawingCanvas.getContext("2d");

    var $resetDrawerButton  = $("#reset-drawer-button");
    $resetDrawerButton.on('click', function() {
      resetSectors();
    });

    var $drawer = $("#drawer");

    var running = false,
        center;

    var drawing = false,
        sectorAngle;

    var options = {
      spineCount:       64,
      spineColor:       "#ffffff",
      strokeColor:      "#ffffff",
      strokeSize:       2,
      backgroundColor:  "#000000",
      sectorColors:     [],
      drawSections:     true,
      renderStyle:      0
    };

    var sectors = [];




    //generate color array
    switch(0) {
      case 0:
        //random colors
        for(var i = 0; i < 40; i++) {
          options.sectorColors.push("#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16) );
        }
        break;
      case 1:
        var firstColor = "#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16);
        var secColor = "#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16);
        for(i = 0; i < 40; i++) {
          if (i < 6) {
            options.sectorColors.push(firstColor);
          } else {
            options.sectorColors.push(secColor);
          }
        }
        break;
      case 2:
        break;
    }

    var gui = new dat.GUI();
    gui.add(options, 'spineCount').onFinishChange(function(newVal) {
      options.spineCount = newVal;
      resetSectors();
    });
    gui.add(options, 'strokeSize', 1, 10);
    gui.add(options, 'drawSections').onFinishChange(function() {
      resetSectors();
    });
    gui.addColor(options, 'strokeColor');
    gui.addColor(options, 'backgroundColor');
    gui.add(options, 'renderStyle', { HsL: 0, Hsl: 1, ColorArray: 2, StrokeColor: 3, UniColorSector: 4 } ).onFinishChange(function() {
      options.renderStyle = parseInt(options.renderStyle);
    });
    gui.add({
      download: function(){
        this.href = drawingCanvas.toDataURL('image/jpeg');
        this.download = "MyImage.jpg";
      },
    },'download');
    gui.add({
      clear: function(){
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      },
    },'clear');


    bgCanvas.width  = $(window).width();
    bgCanvas.height = $(window).height();
    drawingCanvas.width  = $(window).width();
    drawingCanvas.height = $(window).height();

    //download handler
    $(window).resize(function() {
      // if(DEVELOPMENT) return;
      // bgCanvas.width  = $(window).width();
      // bgCanvas.height = $(window).height();
      // drawingCanvas.width  = $(window).width();
      // drawingCanvas.height = $(window).height();
      // center.x = bgCanvas.width / 2;
      // center.y = bgCanvas.height / 2;
      // run();
    });

    // maybe add touch support?
    $(drawingCanvas).on('mousedown', function(e) {
      if(running) {
        drawing = true;
        drawStrokeAt(new Victor(e.offsetX, e.offsetY));
      }
    });
    $(drawingCanvas).on('mousemove', function(e) {
      if(running && drawing) {
        e.preventDefault();
        drawStrokeAt(new Victor(e.offsetX, e.offsetY));
      }
    });
    $(drawingCanvas).on('mouseup', function(e) {
      drawing = false;
    });

    run();

    function run() {
      center = new Victor(200, 200);//bgCanvas.width / 2, bgCanvas.height / 2);
      resetSectors();
      running = true;
    }

    function resetSectors() {
      bgCtx.fillStyle = options.backgroundColor;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      if (!options.drawSections) return;
      bgCtx.fillStyle = options.spineColor;

      sectors = [];
      sectorAngle = (360 / options.spineCount).toRad();

      console.time("creating and adding sectors");
      for(var i = 0; i < options.spineCount; i++){
        var sector = new Sector(i);
        sector.drawSpine();
        sectors.push(sector);
      }
      console.timeEnd("creating and adding sectors");
    }

    function drawStrokeAt(origPos) {

      var relPos = origPos.clone().subtract(center);
      var angleOffset = (Math.atan2(relPos.y, relPos.x) + Math.PI);

      var pos,
          sector,
          sectorOverId = ((angleOffset / (Math.PI * 2)) * options.spineCount),
          sectorOver = sectors[Math.floor(sectorOverId)];

      for(var i = 0; i < options.spineCount; i++){
        sector  = sectors[i];
        pos = origPos.clone().subtract(center);
        pos.rotate((sectorAngle * sector.getId()));

        // diff drawing methods
        var hue = (sector.getId() / options.spineCount) * 360;
        var v = Math.min(100, Math.sqrt(Math.pow(pos.x, 2) + Math.pow(pos.y, 2)) / 4);
        switch(options.renderStyle) {
          case 0:
            v = 20;
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ v +'%)';
            break;
          case 1:
            drawingCtx.fillStyle = 'hsl('+ hue +', 100%, 50%)';
            break;
          case 2:
            drawingCtx.fillStyle = options.sectorColors[sector.getId()];
            break;
          case 4:
            hue = (sectorOver.getId() / options.spineCount) * 360;
            v = 20;
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ v +'%)';
            break;
          default:
            drawingCtx.fillStyle = options.strokeColor;
        }

        pos.add(center);
        drawingCtx.fillRect(pos.x - options.strokeSize, pos.y - options.strokeSize, options.strokeSize, options.strokeSize);
      }
    }

    function getEndPoint2(startPoint, i) {
      var eP = startPoint.clone();
      var radAngle = ((Math.PI * 2 / options.spineCount) * i);

      eP.x = Math.cos(radAngle) * 999999;
      eP.y = Math.sin(radAngle) * 999999;
      eP.add(startPoint);
      return eP;
    }
    // pseudo class Sector who has a function to draw in it independently of orientation
    // takes draw anweisung as if it was the first sector
    // angles in radians
    function Sector(id) {
      var endPoint = getEndPoint2(center, id);

      function _drawSpine() {
        if (!options.drawSections) return;
        bgCtx.beginPath();
        bgCtx.lineWidth = "1";
        bgCtx.strokeStyle = options.spineColor;
        bgCtx.moveTo(center.x, center.y);
        // logic for spines missing
        bgCtx.lineTo(endPoint.x, endPoint.y);
        bgCtx.stroke();
      }
      function _isInSector(pos) {
        return; // boolean if pos is in this sector
      }
      function _getId() {
        return id;
      }

      return {
        drawSpine: _drawSpine,
        isInSector: _isInSector,
        getId: _getId,
      };

    }


  });
})($);

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  };
}

/** Converts radians to numeric (signed) degrees */
if (typeof(Number.prototype.toDeg) === "undefined") {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  };
}

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();
