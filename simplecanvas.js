/**
 * Simple script to simplify the creation
 * of interactive canvas elements
 * 
 * @author Kevin Ingalls
 * @version 0.0.1
 */

// Mouse Position

let mouseX = 0;
let mouseY = 0;

let mouseDownX = 0;
let mouseDownY = 0;
let mouseDown = false;

let keysPressed = [];

function moveHandler(e) {
	mouseX = e.clientX;
	mouseY = e.clientY;
	if (mouseDown) {
		mouseDownX = mouseX;
		mouseDownY = mouseY;
	}
}

function mouseDownHandler(e) {
	mouseDownX = e.clientX;
	mouseDownY = e.clientY;
	mouseDown = true;
}

function mouseUpHandler(e) {
	mouseDown = false;
}

if (document.attachEvent) {
	document.attachEvent('onmousedown', mouseDownHandler);
	document.attachEvent('onmouseup', mouseUpHandler);
	document.attachEvent('mousemove', moveHandler);
} else {
	document.addEventListener('mousedown', mouseDownHandler);
	document.addEventListener('mouseup', mouseUpHandler);
	document.addEventListener('mousemove', moveHandler);
}

// helpful utilities

function rangeMap(value, minFrom, maxFrom, minTo, maxTo) {
	return (value - minFrom) / (maxFrom - minFrom) * (maxTo - minTo) + minTo;
}

class Point {
	constructor(x, y, z) {
		if (x == undefined) {
			this.x = 0;
			this.y = 0;
		} else if (y != undefined) {
			this.x = x ? x : 0;
			this.y = y ? y : 0;
		} else {
			this.x = x.x;
			this.y = x.y;
			if (x.z != undefined) {
				this.z = x.z;
			}
		}
		if (z != undefined) {
			this.z = z;
		}
	}

	static distance(a, b) {
		if (a.z == undefined && b.z == undefined) {
			return Math.hypot((a.x - b.x), (a.y - b.y));
		} else if (a.z != undefined) {
			return Math.hypot((a.x - b.x), (a.y - b.y), a.z);
		} else {
			return Math.hypot((a.x - b.x), (a.y - b.y), (a.z - b.z));
		}
	}

	static heading(a, b) {
		return Math.atan2(a.y - b.y, a.x - b.x);
	}

	static heading3d(a, b) {
		// Probably broken
		let dist = Point.distance(a, b);
		let phi = Math.asin((a.z - b.z) / dist);
		let theta = Math.atan2((a.y - b.y) / (a.x - b.x));
	}

	rotate3d(angle, center) {
		// probably broken

		// rotate 3 times.

		center = center ? center : new Point(0, 0, 0);

		let tmpRot = new Point(0, 0, 0);
		let tmpCnt = new Point(0, 0, 0);

		// z rotation
		tmpRot.x = this.x;
		tmpRot.y = this.y;

		tmpCnt.x = center.x;
		tmpCnt.y = center.y;

		tmpRot.rotate(angle.z, tmpCnt);

		this.x = tmpRot.x;
		this.y = tmpRot.y;

		// x rotation
		// z is x
		tmpRot.x = this.z;
		tmpRot.y = this.y;

		tmpCnt.x = center.z;
		tmpCnt.y = center.y;

		tmpRot.rotate(angle.x, tmpCnt);

		this.z = tmpRot.x;
		this.y = tmpRot.y;

		// y rotation
		// z is y
		tmpRot.x = this.x;
		tmpRot.y = this.z;

		tmpCnt.x = center.x;
		tmpCnt.y = center.z;

		tmpRot.rotate(angle.y, tmpCnt);

		this.x = tmpRot.x;
		this.z = tmpRot.y;
	}

	rotate(angle, center) {
		center = center ? center : new Point(0, 0);
		if (center.z != undefined) {
			center = new Point(center.x, center.y);
		}
		let r = Point.distance(new Point(this.x, this.y), center);
		let dir = Point.heading(this, center);

		this.x = center.x + Math.cos(angle + dir) * r;
		this.y = center.y + Math.sin(angle + dir) * r;
	}

	static mult(point, mag) {
		if (point.z == undefined) {
			return new Point(point.x * mag, point.y * mag, point.z * mag);
		} else {
			return new Point(point.x * mag, point.y * mag, point.z * mag);
		}
	}

	static normalize(point) {
		let len = Math.hypot(point.x, point.y);
		return Point.mult(point, 1 / len);
	}
}

// game class
class SimpleCanvas {
	constructor(id, context) {
		context = context ? context : "2d";
		this.canvas = document.getElementById(id);
		this.size = new Point(this.canvas.width, this.canvas.height);
		let r = this.canvas.getBoundingClientRect();
		this.pos = new Point(r.left, r.top);
		this.ctx = this.canvas.getContext(context);
		this.fill = false;
		this.fps = 30;
		this.updateRate = 60;
		this.scale = new Point(1, 1);
		this.shape = null;
		this.ctx.lineCap = "round";
		this.play = false;
		this.canvasData = this.ctx.getImageData(0, 0, this.size.x, this.size.y);
	}

	hovering() {
		let m = this.getMousePos();
		if (m.x >= 0 && m.y >= 0 &&
			m.x <= this.size.x &&
			m.y <= this.size.y) {
			return true;
		}
		return false;
	}

	translate(x, y) {
		this.ctx.translate(x, y);
	}

	scale(x, y) {
		this.ctx.scale(x, y);
	}

	simpleScale(s) {
		this.scale.x *= s.x;
		this.scale.y *= s.y;
	}

	setSimpleScale(s) {
		this.scale.x = s.x;
		this.scale.y = s.y;
	}

	beginShape() {
		this.shape = [];
	}

	vertex(p) {
		if (this.shape == null) {
			console.log("Error: must begin shape");
			return false;
		}
		this.shape.push(p);
	}

	endShape() {
		if (this.shape == null) {
			console.log("Error: must begin shape");
			return false;
		}
		if (this.shape.length <= 0) {
			return;
		}
		this.ctx.beginPath();
		this.ctx.moveTo(this.scale.x * this.shape[0].x, this.scale.y * this.shape[0].y);
		for (let p of this.shape) {
			this.ctx.lineTo(this.scale.x * p.x, this.scale.y * p.y);
		}
		if (this.fill) {
			this.ctx.fill();
		} else {
			this.ctx.stroke();
		}

		this.shape = null;
	}

	resetSimpleScale() {
		this.scale.x = 1;
		this.scale.y = 1;
	}

	resetTranslation() {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	getMouseDownPos() {
		return new Point(mouseDownX - this.pos.x, mouseDownY - this.pos.y);
	}

	getMousePos() {
		// mouse position minus start of canvas position
		return new Point(mouseX - this.pos.x, mouseY - this.pos.y);
	}

	point(p) {
		this.ctx.beginPath();
		let tmpEnd = this.ctx.lineCap;
		this.ctx.lineCap = "round";
		this.line(p, p);
		this.ctx.lineCap = tmpEnd;
	}

	rect(position, size) {
		if (this.fill) {
			this.ctx.fillRect(this.scale.x * position.x, this.scale.x * position.y, this.scale.x * size.x, this.scale.y * size.y);
		} else {
			this.ctx.strokeRect(this.scale.x * position.x, this.scale.y * position.y, this.scale.x * size.x, this.scale.y * size.y);
		}
	}

	line(p1, p2) {
		this.ctx.beginPath();
		this.ctx.moveTo(this.scale.x * p1.x, this.scale.y * p1.y);
		this.ctx.lineTo(this.scale.x * p2.x, this.scale.y * p2.y);
		this.ctx.stroke();
	}

	tri(p1, p2, p3) {
		this.ctx.beginPath();
		this.ctx.moveTo(scale.x * p1.x, scale.y * p1.y);
		this.ctx.lineTo(scale.x * p2.x, scale.y * p2.y);
		this.ctx.lineTo(scale.x * p3.x, scale.y * p3.y);
		if (this.fill) {
			this.ctx.fill();
		} else {
			this.ctx.closePath();
		}
	}

	background(color) {
		let temp = this.ctx.fillStyle;
		this.ctx.fillStyle = color;
		this.ctx.clearRect(0, 0, this.size.x, this.size.y);
		this.ctx.fillRect(0, 0, this.size.x, this.size.y);
		this.ctx.fillStyle = temp;
	}

	fillColor(color) {
		this.ctx.fillStyle = color;
	}

	strokeWeight(size) {
		this.ctx.lineWidth = size;
	}

	strokeColor(color) {
		this.ctx.strokeStyle = color;
	}

	start() {
		this.setup();
		updateGame(this);
		renderGame(this);
	}

	// only updated once per render
	drawPixel(x, y, r, g, b, a) {
		let index = (x + y * this.size.x) * 4;
		this.canvasData.data[index] = r;
		this.canvasData.data[index + 1] = g;
		this.canvasData.data[index + 2] = b;
		this.canvasData.data[index + 3] = a;
	}

	getPixels() {
		this.canvasData = this.ctx.getImageData(0, 0, this.size.x, this.size.y);
	}

	setPixels() {
		this.ctx.putImageData(this.canvasData, 0, 0);
	}

	updateInputs() {
		let r = this.canvas.getBoundingClientRect();
		this.pos = new Point(r.left, r.top);
	}

	updatePlay() {}

}

function renderGame(self) {
	self.updatePlay();
	if (self.play) {
		self.resetTranslation();
		self.render();
	}
	setTimeout(renderGame, 1000 / self.fps, self);
}

function updateGame(self) {
	self.updatePlay();
	if (self.play) {
		self.updateInputs();
		self.update();
	}
	setTimeout(updateGame, 1000 / self.updateRate, self);
}