(function() {
	"use strict";

	class History {
		constructor(ctx) {
			this.undoStack = [];
			this.redoStack = [];
			this.ctx = ctx;
		}
		saveState(stack, redoable = false) {
			if (!redoable) {
				this.redoStack = [];
			}
			(stack || this.undoStack).push(this.ctx.canvas.toDataURL());
		}
		undo() {
			this.restoreState(this.undoStack, this.redoStack);
		}
		redo() {
			this.restoreState(this.redoStack, this.undoStack);
		}
		restoreState(pop, push) {
			if (pop.length) {
				this.saveState(push, true);
				var restoreImg = pop.pop();
				var self = this;
				var img = new Element('img', {'src': restoreImg});
				img.onload = function () {
					var w = self.ctx.canvas.width,
						h = self.ctx.canvas.scrollHeight;

					self.ctx.clearRect(0, 0, w, h);
					self.ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
				}
			}
		}
	}

	window.cHistory = History;
})();