(function(global) {
  "use strict";

  var $GUI,
      FullGui;

  FullGui = {
    pages: [],
    init() {
      global.log("FullGui", "Initialize");
      $GUI = $("#full-gui");
      $(".full-gui-close", $GUI).on("click", function() {
        this.close();
      }.bind(this));
      $(document).on("keyup", function(e) {
        if (e.keyCode === 27) {
          this.close();
        }
      }.bind(this));
    },
    addPage(page) {
      if (!(page instanceof Page)) {
        console.error("page is not a Page");
      }
      this.pages.push(page);
    },
    getPageByName(name) {
      for (var i = 0; i < this.pages.length; i++) {
        if (this.pages[i].name === name) {
          return this.pages[i];
        }
      }
      //return this.pages[0] || false;
    },
    createPage(name) {
      return new Page(name);
    },
    goTo(pageOrName) {
      var page = (typeof pageOrName === "string")? this.getPageByName(pageOrName) : pageOrName;
      //@todo show load animation
      page.loadContent(function() {
        $("content", $GUI).html( page.getContent$() );
      });
    },
    close() {
      $GUI.hide();
    },
    open() {
      $GUI.show();
    }
  };
  global.Fullgui = FullGui;
  global.bind("init", FullGui.init.bind(FullGui));

  class Page {
    constructor(name) {
      this.name = name;
      this._$content;
    }
    loadContent(callBack) {
      //overwrite this function and
      //create/load your content in this._$content (as jquery object).
      //after you have to call the callback
      callBack();
    }
    getContent$() {
      return this._$content;
    }
    setContent$($content) {
      this._$content = $content;
    }
  }
  global.Fullgui.Page = Page;
})(CircularDrawing);