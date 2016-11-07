(function($) {
  "use strict";

  $(function() {

    var bgCanvas = $("#drawer").get(0);
    var bgCtx = bgCanvas.getContext("2d");
    var drawingCanvas = $("<canvas/>").insertAfter($(bgCanvas)).get(0);
    var drawingCtx = drawingCanvas.getContext("2d");

    var running = false,
        center;

    var options = {
      spineCount:       8,
      spineColor:       "#ffffff",
      backgroundColor:  "#000000",
    };

    bgCanvas.width  = $(window).width();
    bgCanvas.height = $(window).height();
    drawingCanvas.width  = $(window).width();
    drawingCanvas.height = $(window).height();

    $(window).resize(function() {
      bgCanvas.width  = $(window).width();
      bgCanvas.height = $(window).height();
      drawingCanvas.width  = $(window).width();
      drawingCanvas.height = $(window).height();
      center.x = bgCanvas.width / 2;
      center.y = bgCanvas.height / 2;
    });

    center = new Victor(bgCanvas.width / 2, bgCanvas.height / 2);

    running = true;
    draw();


    function draw() {
      // if(running) window.requestAnimFrame(draw);

      // clear bgCanvas
      bgCtx.fillStyle = options.backgroundColor;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

      // draw spines
      drawSpines();
    }

    function drawSpines() {
      var endPoint;

      for(var i = 0; i < options.spineCount; i++){
        bgCtx.beginPath();
        bgCtx.lineWidth = "1";
        bgCtx.strokeStyle = options.spineColor;
        bgCtx.moveTo(center.x, center.y);
        // logic for spines missing
        endPoint = getEndPoint(i);
        bgCtx.lineTo(endPoint.x, endPoint.y);
        bgCtx.stroke();
      }

      function getEndPoint(i) {
        var eP = new Victor(0, 0);
        var radOffset = ((360 / options.spineCount) * i).toRad();
        var cosRadOffset = Math.cos(radOffset);
        console.log("Offset:\n\t%f [deg]\n\t%f [rad]", radOffset.toDeg(), radOffset);
        // cos a = b / c
        // c = b / cos a

        // calulcate distance to endPoint
        var distance = new Victor(0, 0);
        var distanceToXAxis = (cosRadOffset !== 0) ? (center.y / cosRadOffset) : bgCanvas.height;
        var distanceToYAxis = (cosRadOffset !== 0) ? (center.x / cosRadOffset) : bgCanvas.width;
        console.log(distanceToXAxis, distanceToYAxis);

        // prevector
        // distance.x = (Math.abs(distanceToXAxis) < bgCanvas.height / 2) ? distanceToXAxis : (bgCanvas.width  / 2);
        // distance.y = (Math.abs(distanceToYAxis) < bgCanvas.width  / 2) ? distanceToYAxis : (bgCanvas.height / 2);

        console.log("distance: ", distance.x, distance.y);

        // TODO calculate position of endpoint using angle and distance

        return eP;
      }


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
