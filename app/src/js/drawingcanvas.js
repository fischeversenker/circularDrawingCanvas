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
  global.size = new Victor();
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
    selectedTool:     0,
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
  var running = false;

  // etc
  var sectors = [],
      sectorAngle;


  $(function init() {
    global.size.x = $(window).width();
    global.size.y = $(window).height();
    // UI Elements
    $drawer = $("#drawer");

    bgCanvas = $("<canvas />").appendTo($drawer).get(0);
    bgCtx = bgCanvas.getContext("2d");
    drawingCanvas = $("<canvas/>").appendTo($drawer).get(0);
    drawingCtx = drawingCanvas.getContext("2d");
    toolsCanvas = $("<canvas/>").appendTo($drawer).get(0);
    toolsCtx = toolsCanvas.getContext("2d");
    bgCanvas.width = global.size.x;
    bgCanvas.height = global.size.y;
    drawingCanvas.width = global.size.x;
    drawingCanvas.height = global.size.y;
    toolsCanvas.width = global.size.x;
    toolsCanvas.height = global.size.y;

    global.overlayCtx = toolsCtx;
    global.drawingCtx = drawingCtx;

    global.history = new cHistory(drawingCtx);

    global.center = new Victor(bgCanvas.width / 2, bgCanvas.height / 2);

    //registerDatGuiElements();
    makeColorArray(1);

    global.ToolManager.init(toolsCanvas);
    global.cRenderer.init();

    global.trigger('init');
    run();
  });

  function run() {
    global.trigger('optionsChanged');
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

  global.bind("optionsChanged", function() {
    global.ToolManager.changeTool(global.options.selectedTool);
    resetSectors();
  });
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
    constructor() {
      this.options = {};
    }
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
    createGui(datGuiParent) {}
    enable() {}
    disable() {}
    clearOverlay() {
      global.overlayCtx.clearRect(0, 0, global.overlayCtx.canvas.width, global.overlayCtx.canvas.height);
    }
  }
  global.class.Tool = Tool;
  return global;
})({});

