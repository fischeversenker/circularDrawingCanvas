var CircularDrawing = (function (global) {
  "use strict";

  global.mouse = {};
  global.mouse.pos = new Victor(0, 0);
  global.mouse.angle = 0;
  global.mouse.distance = 0;
  var DEVELOPMENT = false;

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
      touching = false,
      history;

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


  var ToolManager = {
    _tools: [],
    _toolHash: [],
    _activeTool: null,
    _activeToolIndex: -1,

    init(toolsCanvas) {
      toolsCanvas.addEventListener('mousedown', this.onMouseDown.bind(this));
      toolsCanvas.addEventListener('mousemove', this.onMouseMove.bind(this));
      window.addEventListener('mouseup', this.onMouseUp.bind(this));
    },
    enable() {
      if (this._activeToolIndex > -1) {
        this._tools[this._activeToolIndex].enable();
      }
    },
    disable() {
      if (this._activeToolIndex > -1)
        this._tools[this._activeToolIndex].disable();
    },
    changeTool(toolNameOrID) {
      if (typeof toolNameOrID === "string")
        toolNameOrID = this._toolHash.indexOf(toolNameOrID);

      if (typeof toolNameOrID === "number" && toolNameOrID < this._tools.length) {
        //change tool
        this.disable();
        this._activeToolIndex = toolNameOrID;
        this._activeTool = this._tools[toolNameOrID];
        this.enable();
      }
    },
    getToolNames() {
      return this._toolHash.slice(0);
    },
    registerTool: function (toolClass) {
      var curr = toolClass.prototype;
      while (curr) {
        if (toolClass.prototype instanceof Tool) {
          this._tools.push(new toolClass());
          this._toolHash.push(toolClass.name);
          return;
        }
        curr = curr.prototype || null;
      }
      console.error("Your Tool must extend Tool");
    },
    _setMouse(x, y) {
      global.mouse.pos.x = x;
      global.mouse.pos.y = y;
      global.mouse.pos.subtract(center);
      global.mouse.angle = Math.atan2(global.mouse.pos.x, global.mouse.pos.y);
      global.mouse.distance = 0;
      return global.mouse;
    },
    onMouseDown(e) {
      if (this._activeTool && "onMouseDown" in this._activeTool)
        this._activeTool.onMouseDown(this._setMouse(e.offsetX, e.offsetY).pos, e);
    },
    onMouseMove(e) {
      if (this._activeTool && "onMouseMove" in this._activeTool)
        this._activeTool.onMouseMove(this._setMouse(e.offsetX, e.offsetY).pos, e);
    },
    onMouseUp(e) {
      if (this._activeTool && "onMouseUp" in this._activeTool)
        this._activeTool.onMouseUp(this._setMouse(e.offsetX, e.offsetY).pos, e);
    }
  };

  global.cRenderer = {

    render(ctx, drawFn) {
      var sectorAngle = (360 / options.spineCount).toRad(),
          sector,
          color = "red";

      ctx.save();
      ctx.translate(center.x, center.y);
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
      var v = Math.min(100, Math.sqrt(Math.pow(global.mouse.pos.x, 2) + Math.pow(global.mouse.pos.y, 2)) / 4);

      switch(options.renderStyle) {
        case 0:
          return 'hsl('+ hue +', '+'100%, '+ v +'%)';
          break;
        case 1:
          return 'hsl('+ hue +', 100%, 50%)';
          break;
        case 2:
          //fixme needs the sector id
          return options.sectorColors[1];
          break;
        case 3:
          //fixme needs the sector id
          var sectorAngle = 360 / options.spineCount;
          hue = (Math.floor( (global.mouse.angle + sectorAngle * i) / sectorAngle) * sectorAngle).toDeg();
          v = 50;
          return 'hsl('+ hue +', '+'100%, '+ v +'%)';
          break;
        case 4:
          //fixme needs the sector id
          hue = (1 / (options.spineCount-1)) * 360;
          v = 50;
          return 'hsl('+ hue +', '+'100%, '+ v +'%)';
          break;
        case 5:
          return options.strokeColor;
          break;
      }
    }
  }
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

    history = new cHistory(drawingCtx);

    center = new Victor(bgCanvas.width / 2, bgCanvas.height / 2);

    registerEventListeners();
    registerDatGuiElements();
    makeColorArray(1);

    ToolManager.init(toolsCanvas);
    ToolManager.changeTool("Line");

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
          options.sectorColors.push("#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16));
        }
        break;
      case 1:
        var firstColor = "#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16);
        var secColor = "#" + Math.min(16777216, Math.floor(Math.random() * 16777216 + 65536)).toString(16);
        for (i = 0; i < 40; i++) {
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
    // $(drawingCanvas).on('mousedown', function(e) {
    //   if(running) {
    //     history.saveState();
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
        history.undo();
      else if (e.ctrlKey && e.keyCode == 25)
        history.redo();
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
    gui.remember(options);
    var bgFolder = gui.addFolder('Background');
    var fgFolder = gui.addFolder('Foreground');
    bgFolder.add(options, 'spineCount').onChange(function () {
      resetSectors();
    });
    bgFolder.add(options, 'offsetX', -(bgCanvas.width / 2), (bgCanvas.width / 2)).onChange(function () {
      resetSectors();
    });
    bgFolder.add(options, 'offsetY', -(bgCanvas.height / 2), (bgCanvas.height / 2)).onChange(function () {
      resetSectors();
    });
    bgFolder.add(options, 'drawSections').onFinishChange(function () {
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
    newsFolder.add({
      Undo: function () {
        history.undo();
      }
    }, "Undo");
    newsFolder.add({
      Redo: function () {
        history.redo();
      }
    }, "Redo");
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
    for (var i = 0; i < options.spineCount; i++) {
      var sector = new Sector(i);
      sector.drawSpine();
      sectors.push(sector);
    }
    console.timeEnd("creating and adding sectors");
  }
  function eraseAt(pos) {
    var relPos;
    for (var i = 0; i < options.spineCount; i++) {
      relPos = pos.clone().subtract(center);
      relPos.rotate(sectorAngle * i);
      relPos.add(center);
      drawingCtx.clearRect(relPos.x - options.eraseRadius, relPos.y - options.eraseRadius, options.eraseRadius * 2, options.eraseRadius * 2);
    }
  }
  //deprecated
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
      return history;
    }
    enable() {}
    disable() {}
  }
  global.class = {};
  global.class.Tool = Tool;
  global.ToolManager = ToolManager;
  global.drawStrokeAt = drawStrokeAt;
  global.options = options;
  return global;
})({});

