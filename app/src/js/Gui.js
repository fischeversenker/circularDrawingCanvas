(function(global) {
  "use strict";
  var UPLOAD_URL = 'http://localhost:88/upload.php',
      GALLERY_URL = 'http://localhost:88/gallery.php',
      gui,
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
      this.registerEventListeners();
      this.initFullGui();
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
        var canvas = this.finishImage();

        var filename = global.options.generateRandomPoints ? global.options.randomPointIntervalId + "-" + global.options.randomPointsCount + ".png" : "MyImage.png";
        canvas.toBlob(function(blob) {
          saveAs(blob, filename);
        });
      }.bind(this));
      $donwloadParent.html($link);

      gui.add({
        clear: function(){
          global.history.saveState();
          global.options.randomPointsCount = 0;
          reConfigurate();
          global.drawingCtx.clearRect(0, 0, global.drawingCtx.canvas.width, global.drawingCtx.canvas.height);
        },
      },'clear');
      gui.add({
        upload: function(){
          global.Fullgui.goTo("Upload");
          global.Fullgui.open();
        },
      },'upload').name("Upload");
      gui.add({
        gallery: function(){
          global.Fullgui.goTo("Gallery");
          global.Fullgui.open();
        },
      },'gallery').name("Open Gallery");
      
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
    initFullGui() {
      //create Gallery page
      var galleryPage = global.Fullgui.createPage("Gallery");
      galleryPage.loadContent = function(cb) {

        $.ajax({
          type: 'POST',
          url: GALLERY_URL,
          data: {
            from: 0,
            to: 100,
          },
          success: function(responseData, textStatus) {
            $('#full-gui').show();
            var data = JSON.parse(responseData);
            var html = '<ul class="image-list">';
            for(var i = 0; i < data.images.length; i++) {
              html += '<li>';
              html +=   '<img src="' + "images/" + data.images[i].name + '">';
              html +=   '<span>' + data.images[i].artist + '</span>';
              html += '</li>';
            }
            html += '</ul>';
            galleryPage._$content = $($.parseHTML(html)[0]);
            cb();
          },
          error: function (err) {
            console.error(err);
          }
        });
      };

      global.Fullgui.addPage(galleryPage);
      global.Fullgui.addPage(new UploadPage());
    },

    finishImage() {
      var canvas = document.createElement('canvas');
      canvas.width = global.size.x;
      canvas.height = global.size.y;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = global.options.backgroundColor;
      ctx.rect(0, 0, global.size.x, global.size.y);
      ctx.fill();
      ctx.drawImage(global.drawingCtx.canvas, 0, 0);
      return canvas;
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
    },
    registerEventListeners() {
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
    },
  };
  global.bind("init", global.Gui.init.bind(global.Gui));
  global.bind("onChangeTool", global.Gui.onChangeTool.bind(global.Gui));


  class UploadPage extends global.Fullgui.Page {
    constructor() {
      super("Upload");
      this._$canvas;
      this._$content = $($.parseHTML(`<div>
        <img class="preview"style="max-width: 600px;max-height: 300px;">
        <br>
        <input class="artistName" type="text" placeholder="your name">
        <br>
        <button class="buttonUpload">Upload</button></div>
      `));
    }

    loadContent(callBack) {
      this._$canvas = global.Gui.finishImage();

      var image = new Image();
      image.src = this._$canvas.toDataURL("image/png");
      image.onload = function() {
        $(".preview", this._$content)[0].src = image.src;
        callBack();
      }.bind(this);
      $(".buttonUpload", this._$content).on("click", function() {
        this.upload();
      }.bind(this));
    }

    upload() {
      var canvasData = this._$canvas.toDataURL("image/png"),
          artistName = $(".artistName", this._$content).val();

      artistName = (artistName === "")? (Math.random() * 16777216).toString(16): artistName;
      $.ajax({
        type: 'POST',
        url: UPLOAD_URL,
        data: {
          artist: artistName,
          imgBase64: canvasData
        },
        success: function (e) {
          global.Fullgui.goTo("Gallery");
        },
        error: function (err) {
          alert("Error: can't upload Image");
        }
      });
    }
  }
})(CircularDrawing);