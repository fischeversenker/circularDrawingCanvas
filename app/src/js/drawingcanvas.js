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
        touching = false,
        history = new cHistory(drawingCtx);

    // etc
    var center,
        sectors = [],
        sectorAngle,
        gui;

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
      offsetY:          0,
      eraseMode:        false,
      eraseRadius:      50,
      colorRadius:      150,
      generateRandomPoints: false,
      randomPointInterval: 200,
      randomPointIntervalId: -1,
      randomPointsCount: 0,
      saveEvery: 30,
      saveAsTimelapse: false,
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

    function makeColorArray(m) {
        //generate color array
        switch(m) {
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

    function generateRandomPoint(){
      var point = new Victor(0,0);
      point.x = Math.random()*drawingCanvas.width;
      point.y = Math.random()*drawingCanvas.height;
      options.randomPointsCount++;
      return point;
    }

    function registerEventListeners() {

        // maybe add touch support?
        $(drawingCanvas).on('mousedown', function(e) {
          if(running) {
            history.saveState();
            touching = true;
            gui.close();
            if(!options.eraseMode) {
              drawStrokeAt(new Victor(e.offsetX, e.offsetY));
            } else {
              eraseAt(new Victor(e.offsetX, e.offsetY));
            }
          }
        });
        $(drawingCanvas).on('mousemove', function(e) {
          if(running && touching) {
            e.preventDefault();
            if(!options.eraseMode) {
              drawStrokeAt(new Victor(e.offsetX, e.offsetY));
            } else {
              eraseAt(new Victor(e.offsetX, e.offsetY));
            }
          }
          if(options.eraseMode) {
            $("#erase-preview").css({
              top: e.offsetY - options.eraseRadius,
              left: e.offsetX - options.eraseRadius,
              width: options.eraseRadius * 2,
              height: options.eraseRadius * 2,
            });
          }
        });
        $(window).on('mouseup', function(e) {
          touching = false;
          gui.open();
        });

        //bind keypress for ctrl->z and ctrl->y
        $(document).on("keypress", function(e) {
            if (e.ctrlKey && e.keyCode == 26)
                history.undo();
            else if (e.ctrlKey && e.keyCode == 25)
                history.redo();
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

      gui = new dat.GUI();
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
                                        StrokeColor: 5,
                                        SaturationChange: 6} ).onFinishChange(function() {
        options.renderStyle = parseInt(options.renderStyle);
      });
      fgFolder.add(options, 'colorRadius', 50, 250);
      fgFolder.add({opacity: 1}, 'opacity', 0.0, 1.0).onChange(function(v) {
        $(drawingCanvas).css('opacity', v);
      });
      fgFolder.add(options, 'eraseMode').onChange(function(v) {
        if($("#erase-preview").length === 0){
          $("<div id='erase-preview' />").appendTo($drawer);
        }
        if(v) $("#erase-preview").show();
        else $("#erase-preview").hide();
      });
      fgFolder.add(options, 'eraseRadius', 1, 100);
      fgFolder.add(options, 'randomPointInterval', 1, 2000);
      fgFolder.add(options, 'generateRandomPoints').listen().onFinishChange(function(v){
        if(v){
          options.randomPointIntervalId = window.setInterval(function(){
            if(options.saveAsTimelapse &&
               options.randomPointsCount > 0 &&
               Math.floor(options.randomPointsCount % options.saveEvery) === 0) {
              // clicks the download button every options.saveEvery random points
              $('body > div.dg.ac > div > ul > li:nth-child(4) > div > span > a').click();
            }
            drawStrokeAt(generateRandomPoint());
          }, options.randomPointInterval);
        } else {
          if(options.randomPointIntervalId > -1) {
            clearInterval(options.randomPointIntervalId);
          }
        }
      });
      options.generateRandomPoints = false;
      fgFolder.add(options, 'saveEvery', 50, 1000);
      fgFolder.add(options, 'saveAsTimelapse');
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
      $link.on("click", function(e) {
        $link.get(0).href = drawingCanvas.toDataURL('image/png');
        var filename = options.generateRandomPoints ? options.randomPointIntervalId + "-" + options.randomPointsCount + ".png" : "MyImage.png";
        drawingCanvas.toBlob(function(blob) {
          saveAs(blob, filename);
        });
          // $link.get(0).download = filename;
      });
      $donwloadParent.html($link);

      gui.add({
        clear: function(){
          resetSectors();
          options.randomPointsCount = 0;
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        },
      },'clear');

      var newsFolder = gui.addFolder('News');
      newsFolder.add({ Undo:function() {
          history.undo();
      }}, "Undo");
      newsFolder.add({ Redo:function() {
          history.redo();
      }}, "Redo");
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

    function eraseAt(pos) {
      var relPos;
      for(var i = 0; i < options.spineCount; i++){
        relPos = pos.clone().subtract(center);
        relPos.rotate(sectorAngle * i);
        relPos.add(center);
        drawingCtx.clearRect(relPos.x - options.eraseRadius, relPos.y - options.eraseRadius, options.eraseRadius * 2, options.eraseRadius * 2);
      }
    }

    function drawStrokeAt(origPos) {

      // to remember which sector we are in
      var relPos = origPos.clone().subtract(center);
      var angleOffset = (Math.atan2(relPos.y, relPos.x) + Math.PI);

      var pos, hue, l, s,
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
        var diagonalVic = new Victor($(window).width(), $(window).height());
        var diag = diagonalVic.length();
        l = Math.min(100, pos.length() / 4);
        switch(options.renderStyle) {
          case 0:
            drawingCtx.fillStyle = 'hsl('+ hue +', '+ '100%, '+ l + '%)';
            break;
          case 1:
            drawingCtx.fillStyle = 'hsl('+ hue +', 100%, 50%)';
            break;
          case 2:
            drawingCtx.fillStyle = options.sectorColors[sectorId];
            break;
          case 3:
            hue = Math.floor( angleOffset.toDeg() / sectorAngleDeg) * sectorAngleDeg;
            l = 50;
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ l +'%)';
            break;
          case 4:
            hue = (sectorId / (options.spineCount-1)) * 360;
            l = 50;
            drawingCtx.fillStyle = 'hsl('+ hue +', '+'100%, '+ l +'%)';
            break;
          case 5:
            drawingCtx.fillStyle = options.strokeColor;
            break;
          case 6:
            l = Math.min(100, options.colorRadius * pos.length() / (diag / 2));
            // l = 100 * pos.length() / (diag / 2);
            drawingCtx.fillStyle = 'hsl('+ hue +', ' + '100%, '+ l + '%)';
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
