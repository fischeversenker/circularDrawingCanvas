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
      spineCount:       4,
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

    center = {
      x: bgCanvas.width / 2,
      y: bgCanvas.height / 2,
      radius: 4,
    };


    running = true;
    draw();


    function draw() {
      // if(running) window.requestAnimFrame(draw);

      // clear bgCanvas
      bgCtx.fillStyle = options.backgroundColor;
      bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

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
        var eP = {x: null, y: null};
        var degOffset = (360 / options.spineCount) * i;
        console.log(degOffset);


        eP.x = center.x + i * 360 / options.spineCount;
        eP.y = 0 + i;
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
