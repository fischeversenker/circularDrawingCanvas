(function(global) {
  "use strict";
  var gui,
      toolGui,
      bgFolder,
      toolFolder,
      fgFolder,
      toolsController = [];

  function reConfigurate() {
    global.trigger("optionsChanged");
  }
  global.options.generateRandomPoints = false;
  global.Gui = {
    init() {
      global.log("Gui", "Initialize");
      gui = new dat.GUI();
      bgFolder = gui.addFolder('Background');
      fgFolder = gui.addFolder('Foreground');
      gui.remember(global.options);
      this.initBgFolder();
      this.initFgFolder();
      this.initNewsFolder();
      this.initToolGui();
    },
    onChangeTool(tool) {
      //@fixme remove elements from toolFolder
      if (!toolGui) return;

      this._removeAllControllers(toolGui, ["selectedTool"]);
      // var controllers = toolGui.__controllers.slice();
      // for(var i = 0; i < controllers.length; i++) {
      //   if (controllers[i].property === "selectedTool") continue;
      //   toolGui.remove(controllers[i]);
      // }
      tool.createGui(toolGui);
    },
    initBgFolder() {
      bgFolder.add(global.options, 'spineCount').onChange(reConfigurate);
      bgFolder.add(global.options, 'offsetX', -(global.size.x / 2), (global.size.x / 2)).onChange(reConfigurate);
      bgFolder.add(global.options, 'offsetY', -(global.size.y / 2), (global.size.y / 2)).onChange(reConfigurate);
      bgFolder.add(global.options, 'drawSections').onFinishChange(reConfigurate);
      bgFolder.addColor(global.options, 'backgroundColor');
      //bgFolder.open();
    },
    initFgFolder() {
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
      //random points
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
      //timelapse
      fgFolder.add(global.options, 'saveEvery', 50, 1000);
      fgFolder.add(global.options, 'saveAsTimelapse');
      //fgFolder.open();
      //download button
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
        //$link.get(0).href = drawingCanvas.toDataURL('image/png');
        var filename = global.options.generateRandomPoints ? global.options.randomPointIntervalId + "-" + global.options.randomPointsCount + ".png" : "MyImage.png";
        global.drawingCtx.canvas.toBlob(function(blob) {
          saveAs(blob, filename);
        });
        // $link.get(0).download = filename;
      });
      $donwloadParent.html($link);

      gui.add({
        clear: function(){
          global.history.saveState();
          global.options.randomPointsCount = 0;
          reConfigurate();
          global.drawingCtx.clearRect(0, 0, global.drawingCtx.canvas.width, global.drawingCtx.canvas.height);
        },
      },'clear');

    },

    initNewsFolder() {
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
    },
    initToolGui() {
      //load tool names in the right format
      var toolNames = global.ToolManager.getToolNames();
      var tools = {};
      for(var i = 0; i < toolNames.length; i++) {
        tools[toolNames[i]] = i;
      }
      //add gui
      toolGui = new dat.GUI();
      toolGui.add(global.options, "selectedTool", tools).onChange(function(a) {
        global.options.selectedTool = parseInt(a);
        reConfigurate()
      });
    },
    /**
     *
     * @param dat.GUI parent
     * @param {array<string>} except list of controller propertie names
     * @private
     */
    _removeAllControllers(parent, except) {
      except = except || [];
      var controllers = parent.__controllers.slice();
      for(var i = 0; i < controllers.length; i++) {
        if (except.indexOf(controllers[i].property) != -1) continue;
        toolGui.remove(controllers[i]);
      }
    }
  };
  global.bind("init", global.Gui.init.bind(global.Gui));
  global.bind("onChangeTool", global.Gui.onChangeTool.bind(global.Gui));
})(CircularDrawing);