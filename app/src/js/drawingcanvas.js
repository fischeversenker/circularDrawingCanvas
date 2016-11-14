var CircularDrawing = (function (global) {
  "use strict";
  MicroEvent.mixin(global);
  global.DEVELOPMENT = true;
  global.log = function(who, ...args) {
    if (global.DEVELOPMENT)
      console.log("%c " + who + "->", "background: #222; color: #bada55", ...args);
  };
  global.class = {};
  global.history = null;
  global.center = new Victor();
  global.options = {
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
  // UI Elements
  var $drawer;
  var bgCanvas;
  var bgCtx;
  var drawingCanvas;
  var drawingCtx;
  var toolsCanvas;
  var toolsCtx;

  // states
  var running = false,
      touching = false;

  // etc
  var sectors = [],
      sectorAngle,
      gui;





  $(function init() {
    // UI Elements
    $drawer = $("#drawer");

    bgCanvas = $("<canvas />").appendTo($drawer).get(0);
    bgCtx = bgCanvas.getContext("2d");
    drawingCanvas = $("<canvas/>").appendTo($drawer).get(0);
    drawingCtx = drawingCanvas.getContext("2d");
    toolsCanvas = $("<canvas/>").appendTo($drawer).get(0);
    toolsCtx = toolsCanvas.getContext("2d");

    bgCanvas.width = $(window).width();
    bgCanvas.height = $(window).height();
    drawingCanvas.width = $(window).width();
    drawingCanvas.height = $(window).height();
    toolsCanvas.width = $(window).width();
    toolsCanvas.height = $(window).height();

    global.overlayCtx = toolsCtx;
    global.drawingCtx = drawingCtx;

    global.history = new cHistory(drawingCtx);

    global.center = new Victor(bgCanvas.width / 2, bgCanvas.height / 2);

    registerEventListeners();
    registerDatGuiElements();
    makeColorArray(1);

    global.ToolManager.init(toolsCanvas);
    global.cRenderer.init();
    global.ToolManager.changeTool("Brush");

    global.trigger('init', new Date());
    run();
  });

  function run() {
    resetSectors();
    running = true;
  }
  function makeColorArray(m) {
    //generate color array
    switch (m) {
      case 0:
        //random colors
        for (var i = 0; i < 40; i++) {
          global.options.sectorColors.push("#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16));
        }
        break;
      case 1:
        var firstColor = "#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16);
        var secColor = "#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16);
        for (i = 0; i < 40; i++) {
          if (i < 6) {
            global.options.sectorColors.push(firstColor);
          } else {
            global.options.sectorColors.push(secColor);
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
    global.options.randomPointsCount++;
    return point;
  }
  function registerEventListeners() {
    // maybe add touch support?
    // $(drawingCanvas).on('mousedown', function(e) {
    //   if(running) {
    //     global.history.saveState();
    //     touching = true;
    //     if(!options.eraseMode) {
    //       drawStrokeAt(new Victor(e.offsetX, e.offsetY));
    //     } else {
    //       eraseAt(new Victor(e.offsetX, e.offsetY));
    //     }
    //   }
    // });
    // $(drawingCanvas).on('mousemove', function(e) {
    //   if(running && touching) {
    //     e.preventDefault();
    //     if(!options.eraseMode) {
    //       drawStrokeAt(new Victor(e.offsetX, e.offsetY));
    //     } else {
    //       eraseAt(new Victor(e.offsetX, e.offsetY));
    //     }
    //   }
    //   if(options.eraseMode) {
    //     $("#erase-preview").css({
    //       top: e.offsetY - options.eraseRadius,
    //       left: e.offsetX - options.eraseRadius,
    //       width: options.eraseRadius * 2,
    //       height: options.eraseRadius * 2,
    //     });
    //   }
    // });
    // $(window).on('mouseup', function(e) {
    //   touching = false;
    // });

    //bind keypress for ctrl->z and ctrl->y
    $(document).on("keypress", function (e) {
      if (e.ctrlKey && e.keyCode == 26)
        global.history.undo();
      else if (e.ctrlKey && e.keyCode == 25)
        global.history.redo();
    });

    //download handler
    $(window).resize(function () {
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
    gui.remember(global.options);
    var bgFolder = gui.addFolder('Background');
    var fgFolder = gui.addFolder('Foreground');
    bgFolder.add(global.options, 'spineCount').onChange(function () {
      resetSectors();
    });
    bgFolder.add(global.options, 'offsetX', -(bgCanvas.width / 2), (bgCanvas.width / 2)).onChange(function () {
      resetSectors();
    });
    bgFolder.add(global.options, 'offsetY', -(bgCanvas.height / 2), (bgCanvas.height / 2)).onChange(function () {
      resetSectors();
    });
    bgFolder.add(global.options, 'drawSections').onFinishChange(function () {
      resetSectors();
    });
    bgFolder.addColor(global.options, 'backgroundColor');
    bgFolder.open();

    fgFolder.add(global.options, 'strokeSize', 1, 10);
    fgFolder.addColor(global.options, 'strokeColor');
    fgFolder.add(global.options, 'renderStyle', {
                  HsL: 0,
                  Hsl: 1,
                  ColorArray: 2,
                  perSection: 3,
                  relative2mouse: 4,
                  StrokeColor: 5,
                  SaturationChange: 6} )
      .onFinishChange(function() {
        global.options.renderStyle = parseInt(global.options.renderStyle);
      });
    fgFolder.add(global.options, 'colorRadius', 50, 250);
    fgFolder.add({opacity: 1}, 'opacity', 0.0, 1.0).onChange(function(v) {
        $(drawingCanvas).css('opacity', v);
      });
      fgFolder.add(global.options, 'eraseMode').onChange(function(v) {
        if($("#erase-preview").length === 0){
          $("<div id='erase-preview' />").appendTo($drawer);
        }
        if(v) $("#erase-preview").show();
        else $("#erase-preview").hide();
      });
      fgFolder.add(global.options, 'eraseRadius', 1, 100);
      fgFolder.add(global.options, 'randomPointInterval', 1, 2000);
      fgFolder.add(global.options, 'generateRandomPoints').listen().onFinishChange(function(v){
        if(v){
          global.options.randomPointIntervalId = window.setInterval(function(){
            if(global.options.saveAsTimelapse &&
              global.options.randomPointsCount > 0 &&
               Math.floor(global.options.randomPointsCount % global.options.saveEvery) === 0) {
              // clicks the download button every options.saveEvery random points
              $('body > div.dg.ac > div > ul > li:nth-child(4) > div > span > a').click();
            }
            drawStrokeAt(generateRandomPoint());
          }, global.options.randomPointInterval);
        } else {
          if(global.options.randomPointIntervalId > -1) {
            clearInterval(global.options.randomPointIntervalId);
          }
        }
      });
    global.options.generateRandomPoints = false;
      fgFolder.add(global.options, 'saveEvery', 50, 1000);
      fgFolder.add(global.options, 'saveAsTimelapse');
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
        var filename = global.options.generateRandomPoints ? global.options.randomPointIntervalId + "-" + global.options.randomPointsCount + ".png" : "MyImage.png";
        drawingCanvas.toBlob(function(blob) {
          saveAs(blob, filename);
        });
          // $link.get(0).download = filename;
      });
      $donwloadParent.html($link);

      gui.add({
        clear: function(){
          resetSectors();
          global.options.randomPointsCount = 0;
          drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        },
      },'clear');

    var newsFolder = gui.addFolder('News');
    newsFolder.add({
      Undo: function () {
        global.history.undo();
      }
    }, "Undo");
    newsFolder.add({
      Redo: function () {
        global.history.redo();
      }
    }, "Redo");
  }
  function resetSectors() {
    bgCtx.fillStyle = global.options.backgroundColor;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    if (!global.options.drawSections) return;
    bgCtx.fillStyle = global.options.spineColor;

    sectors = [];
    global.center.x = (bgCanvas.width / 2) + global.options.offsetX;
    global.center.y = (bgCanvas.height / 2) + global.options.offsetY;
    sectorAngle = (360 / global.options.spineCount).toRad();

    console.time("creating and adding sectors");
    for (var i = 0; i < global.options.spineCount; i++) {
      var sector = new Sector(i);
      sector.drawSpine();
      sectors.push(sector);
    }
    console.timeEnd("creating and adding sectors");
  }
  function getEndPoint(startPoint, i) {
    var eP = startPoint.clone();
    var radAngle = ((Math.PI * 2 / global.options.spineCount) * i);
    eP.x = Math.cos(radAngle) * 999999;
    eP.y = Math.sin(radAngle) * 999999;
    return eP;
  }

  // angles in radians
  function Sector(id) {
    var endPoint = getEndPoint(global.center, id);

    function _drawSpine() {
      if (!global.options.drawSections) return;
      bgCtx.beginPath();
      bgCtx.lineWidth = "1";
      bgCtx.strokeStyle = global.options.spineColor;
      bgCtx.moveTo(global.center.x, global.center.y);
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

  class Tool {
    constructor() {}
    getContext(type) {
      switch(type) {
        case "tool":
          return toolsCtx;
        case "draw":
          return drawingCtx;
      }
    }

    getHistory() {
      return global.history;
    }
    enable() {}
    disable() {}
  }
  global.class.Tool = Tool;
  return global;
})({});

