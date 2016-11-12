(function($) {
  "use strict";

  $(function() {
    var DEVELOPMENT = false;

    // UI Elements
    var $drawer = $("#drawer");
    var bgCanvas = $("<canvas />").appendTo($drawer).get(0);
    var bgCtx = bgCanvas.getContext("2d");
    var drawingCanvas = $("<canvas/>").appendTo($drawer).get(0);
    var drawingCtx = drawingCanvas.getContext("2d");


    // states
    var running = false,
        drawing = false;

    // etc
    var center,
        sectors = [],
        sectorAngle;

    var options = {
      spineCount:       64,
      spineColor:       "#ffffff",
      strokeColor:      "#ffffff",
      strokeSize:       2,
      backgroundColor:  "#000000",
      sectorColors:     [],
      drawSections:     true,
      renderStyle:      0,
      offsetX:          0,
      offsetY:          0
    };

    init();
    registerEventListeners();
    registerDatGuiElements();
    makeColorArray(1);
    run();

    function init() {

        bgCanvas.width  = $(window).width();
        bgCanvas.height = $(window).height();
        drawingCanvas.width  = $(window).width();
        drawingCanvas.height = $(window).height();

        center = new Victor(bgCanvas.width / 2, bgCanvas.height / 2);
    }

    function run() {
      resetSectors();
      running = true;
    }

    function makeColorArray(mode) {
        //generate color array
        switch(1) {
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
    }

    function registerEventListeners() {

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
        $(window).on('mouseup', function(e) {
          drawing = false;
        });


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
}

    function registerDatGuiElements() {

      var gui = new dat.GUI();
      gui.remember(options);
      var bgFolder = gui.addFolder('Background');
      var fgFolder = gui.addFolder('Foreground');
      bgFolder.add(options, 'spineCount').onChange(function() {
        resetSectors();
      });
      bgFolder.add(options, 'offsetX', -(bgCanvas.width / 2), (bgCanvas.width / 2)).onChange(function() {
        resetSectors();
      });
      bgFolder.add(options, 'offsetY', -(bgCanvas.height / 2), (bgCanvas.height / 2)).onChange(function() {
        resetSectors();
      });
      bgFolder.add(options, 'drawSections').onFinishChange(function() {
        resetSectors();
      });
      bgFolder.addColor(options, 'backgroundColor');
      bgFolder.open();
      fgFolder.add(options, 'strokeSize', 1, 10);
      fgFolder.addColor(options, 'strokeColor');
      fgFolder.add(options, 'renderStyle', { HsL: 0,
                                        Hsl: 1,
                                        ColorArray: 2,
                                        perSection: 3,
                                        relative2mouse: 4,
                                        StrokeColor: 5 } ).onFinishChange(function() {
        options.renderStyle = parseInt(options.renderStyle);
      });
      fgFolder.add({opacity: 1}, 'opacity', 0.0, 1.0).onChange(function(v) {
        $(drawingCanvas).css('opacity', v);
      });
      fgFolder.open();
      gui.add({
        download: function(){
          // TODO
        },
      },'download');
      //Dirty hack to replace the download button with a link
      //@todo $link needs a bit css
      var $donwloadParent = $(".dg .cr.function .property-name");
      var $link = $('<a>');
      $link.html('Download');
      $link.on("click", function() {
          $link.get(0).href = drawingCanvas.toDataURL('image/jpeg');
          $link.get(0).download = "MyImage.jpg";
      });
      $donwloadParent.html($link);

      gui.add({
        clear: function(){
          resetSectors();
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        },
      },'clear');
    }

    function resetSectors() {
      bgCtx.fillStyle = options.backgroundColor;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      if (!options.drawSections) return;
      bgCtx.fillStyle = options.spineColor;

      sectors = [];
      center.x = (bgCanvas.width / 2) + options.offsetX;
      center.y = (bgCanvas.height / 2) + options.offsetY;
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

      // to remember which sector we are in
      var relPos = origPos.clone().subtract(center);
      var angleOffset = (Math.atan2(relPos.y, relPos.x) + Math.PI);

      var pos, hue, v,
          sectorId, sector,
          sectorOverId = Math.min(options.spineCount - 1, Math.floor(((angleOffset / (Math.PI * 2)) * options.spineCount))),
          sectorOver = sectors[sectorOverId],
          sectorAngleDeg = (360 / options.spineCount);

      for(var i = 0; i < options.spineCount; i++){
        sector  = sectors[i];
        sectorId = sector.getId();
        pos = origPos.clone().subtract(center);
        pos.rotate(sectorAngle * sectorId);
        angleOffset = (Math.atan2(pos.y, pos.x) + Math.PI);

        // diff drawing methods
        hue = (angleOffset / (Math.PI * 2)) * 360;
        v = Math.min(100, Math.sqrt(Math.pow(pos.x, 2) + Math.pow(pos.y, 2)) / 4);
        switch(options.renderStyle) {
          case 0:
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ v +'%)';
            break;
          case 1:
            drawingCtx.fillStyle = 'hsl('+ hue +', 100%, 50%)';
            break;
          case 2:
            drawingCtx.fillStyle = options.sectorColors[sectorId];
            break;
          case 3:
            hue = Math.floor( angleOffset.toDeg() / sectorAngleDeg) * sectorAngleDeg;
            v = 50;
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ v +'%)';
            break;
          case 4:
            hue = (sectorId / (options.spineCount-1)) * 360;
            v = 50;
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ v +'%)';
            break;
          case 5:
            drawingCtx.fillStyle = options.strokeColor;
            break;
        }

        pos.add(center);
        drawingCtx.fillRect(pos.x - options.strokeSize, pos.y - options.strokeSize, options.strokeSize, options.strokeSize);
      }
    }

    function getEndPoint(startPoint, i) {
      var eP = startPoint.clone();
      var radAngle = ((Math.PI * 2 / options.spineCount) * i);
      eP.x = Math.cos(radAngle) * 999999;
      eP.y = Math.sin(radAngle) * 999999;
      return eP;
    }

    // angles in radians
    function Sector(id) {
      var endPoint = getEndPoint(center, id);

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
