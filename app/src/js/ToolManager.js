(function(global) {
  "use strict";

  global.mouse = {};
  global.mouse.pos = new Victor(0, 0);
  global.mouse.angle = 0;
  global.mouse.distance = 0;
  global.ToolManager = {
    _tools: [],
    _toolHash: [],
    _activeTool: null,
    _activeToolIndex: -1,

    init(toolsCanvas) {
      global.log("ToolManager", "Initialize");
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
        if (toolClass.prototype instanceof global.class.Tool) {
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
      global.mouse.pos.subtract(global.center);
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
})(CircularDrawing);