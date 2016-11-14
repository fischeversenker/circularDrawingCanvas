(function(global) {
  "use strict";
  global.Gui = {
    init() {
      global.log("Gui", "Initialize");
      
    }
  };
  global.bind("init", global.Gui.init.bind(global.Gui));
})(CircularDrawing);