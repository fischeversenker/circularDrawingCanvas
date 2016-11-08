(function($) {
  "use strict";

  $(function() {
    var DEVELOPMENT = false;

    var bgCanvas = $("<canvas />").appendTo($("#drawer")).get(0);
    var bgCtx = bgCanvas.getContext("2d");
    var drawingCanvas = $("<canvas/>").insertAfter($(bgCanvas)).get(0);
    var drawingCtx = drawingCanvas.getContext("2d");

    var $drawer = $("#drawer");

    var running = false,
        center;

    var runTime = 0,
        maxRunTime = 1,
        drawing = false;

    var options = {
      spineCount:       12,
      spineColor:       "#ffffff",
      strokeColor:      "#ffffff",
      strokeSize:       2,
      backgroundColor:  "#000000",
    };

    var sectors = [];

    var $spineCountInput = $("#spine-count-input");
    $spineCountInput.val(options.spineCount);
    $spineCountInput.on('change', function() {
      options.spineCount = $(this).val();
      runTime = 0;
      resetSectors();
    });

    bgCanvas.width  = $(window).width();
    bgCanvas.height = $(window).height();
    drawingCanvas.width  = $(window).width();
    drawingCanvas.height = $(window).height();

    if(DEVELOPMENT) {
      bgCanvas.width  = $drawer.width();
      bgCanvas.height = $drawer.height();
      drawingCanvas.width  = $drawer.width();
      drawingCanvas.height = $drawer.height();
    }

    $(window).resize(function() {
      if(DEVELOPMENT) return;
      bgCanvas.width  = $(window).width();
      bgCanvas.height = $(window).height();
      drawingCanvas.width  = $(window).width();
      drawingCanvas.height = $(window).height();
      center.x = bgCanvas.width / 2;
      center.y = bgCanvas.height / 2;
      run();
    });

    $(drawingCanvas).on('mousedown', function(e) {
      if(running) {
        drawing = true;
        for(var i = 0; i < sectors.length; i++){
          sectors[i].drawStroke(new Victor(e.offsetX, e.offsetY));
        }
      }
    });
    $(drawingCanvas).on('mousemove', function(e) {
      if(running && drawing) {
        e.preventDefault();
        for(var i = 0; i < sectors.length; i++){
          sectors[i].drawStroke(new Victor(e.offsetX, e.offsetY));
        }
      }
    });
    $(drawingCanvas).on('mouseup', function(e) {
      drawing = false;
    });

    run();

    function run() {
      center = new Victor(bgCanvas.width / 2, bgCanvas.height / 2);
      resetSectors();
      running = true;
    }

    function resetSectors() {
      bgCtx.fillStyle = options.backgroundColor;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
      bgCtx.fillStyle = options.spineColor;
      var endPoint;
      var degAngle = (360 / options.spineCount);

      sectors = [];

      for(var i = 0; i < options.spineCount; i++){
        var sector = new Sector(center, degAngle, i);
        sector.drawSpine();
        sectors.push(sector);
      }
    }

    function getEndPoint(startPoint, i) {
      var eP = startPoint.clone();
      var degAngle = ((360 / options.spineCount) * i);
      var radAngle = degAngle.toRad();
      // half diagonal of canvas using pythagoras
      var maxDistance = Math.sqrt(Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2));
      var upVec = new Victor(0, -startPoint.y);
      var moveVec  = new Victor(0, 0);
      var distance = 0;
      if(Math.cos(radAngle) > 0.0001 || Math.cos(radAngle) < -0.0001) {
        distance = startPoint.y / Math.cos(radAngle);
      } else if(Math.sin(radAngle) > 0.0001 || Math.sin(radAngle) < -0.0001) {
        distance = startPoint.x / Math.sin(radAngle);
      }
      distance = Math.abs(Math.min(maxDistance, distance));
      // creating and adding direction vector to eP (cloned from startPoint) to get final endpoint of spine
      eP.add(new Victor(distance * Math.sin(radAngle), distance * Math.cos(radAngle)));
      return eP;
    }

    // pseudo class Sector who has a function to draw in it independently of orientation
    // takes draw anweisung as if it was the first sector
    // angles in radians
    function Sector(startPoint, angle, id) {

      var endPoint = getEndPoint(startPoint, id);

      // takes victor pos
      function _drawStroke(pos) {
        drawingCtx.fillStyle = options.strokeColor;
        // rotate pos by (angle * id) degrees around startPoint
        pos.subtract(startPoint);
        pos.rotate((angle * id).toRad());
        pos.add(startPoint);
        drawingCtx.fillRect(pos.x - options.strokeSize, pos.y - options.strokeSize, options.strokeSize, options.strokeSize);
      }

      function _drawSpine() {
        bgCtx.beginPath();
        bgCtx.lineWidth = "1";
        bgCtx.strokeStyle = options.spineColor;
        bgCtx.moveTo(startPoint.x, startPoint.y);
        // logic for spines missing
        bgCtx.lineTo(endPoint.x, endPoint.y);
        bgCtx.stroke();
      }

      function _isInSector(pos) {
        // TODO LOGIC
        return false;
      }

      return {
        drawStroke: _drawStroke,
        drawSpine: _drawSpine,
        isInSector: _isInSector,
        getStartAngle: function() {
          return startAngle;
        },
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
