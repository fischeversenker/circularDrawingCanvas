(function($) {

  $(function() {
    var canvas = $("#drawer").get(0);
    var ctx = canvas.getContext("2d");
    var running = false;
    canvas.width  = $(window).width();
    canvas.height = $(window).height();

    var center = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 4,
    };
    var options = {
      spines: 8,
      spineColor: "#ffffff",
    };

    running = true;
    draw();


    function draw() {
      if(running) window.requestAnimationFrame(draw);
      // clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // draw center
      drawSpines();
    }

    function drawSpines() {
      for(var i = 0; i < options.spines; i++){
        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.strokeStyle = options.spineColor;
        ctx.moveTo(center.x, center.y);
        // logic for spines missing
        ctx.lineTo(250,75 * i);
        ctx.stroke();
      }
    }

  });

})($);
