(function() {
	"use strict";

	class History {
		constructor(ctx, cap = 1000) {
			this.undoStack = [];
			this.redoStack = [];
			this.ctx = ctx;
			this.cap = cap;
		}
		saveState(stack, redoable = false) {
			if (!redoable) {
				this.redoStack = [];
			}
			var stack = (stack || this.undoStack);
			stack.push(this.ctx.canvas.toDataURL());
			while (stack.length > this.cap)
				stack.shift();
		}
		undo() {
			return this.restoreState(this.undoStack, this.redoStack);
		}
		redo() {
			return this.restoreState(this.redoStack, this.undoStack);
		}
		restoreState(from, to) {
			if (from.length) {
				this.saveState(to, true);
				var restoreImg = from.pop();
				var self = this;
				var img = new Image();
				img.onload = function () {
					var w = self.ctx.canvas.width,
						h = self.ctx.canvas.scrollHeight;

					self.ctx.clearRect(0, 0, w, h);
					self.ctx.drawImage(img, 0, 0, w, h, 0, 0, w, h);
				}
				img.src = restoreImg;
				return true;
			}
			return false;
		}
		clearHistory() {
			this.undoStack = [];
			this.redoStack = [];
		}
	}

	window.cHistory = History;
})();