var painter = (function(){ // Namespace painter

	var container;
	var canvas;
	var context;
	var mousepath;
	var mouse_down = false;
	var brush_size = 10;

	function paint(x,y,r,g,b,a){
		context.fillStyle="rgba("+r+","+g+","+b+","+a+")";
		context.beginPath();
		context.arc(x,y,brush_size/2,0,2*Math.PI,false);
		context.fill();
	}

	function get_path(from, to){
		dx = to[0] - from[0];
		dy = to[1] - from[1];

		ret = []
		if (dx == 0 && dy == 0) return ret;


		if (dy == 0){
			dx /= Math.abs(dx);
			for (x=from[0]; x != to[0]; x += dx)
				ret.push([x,from[1]]);
			return ret;
		}

		if (dx == 0){
			dy /= Math.abs(dy);
			for (y=from[1]; y != to[1]; y += dy)
				ret.push([from[0], y]);
			return ret;
		}

		ratio = Math.abs(dy+0.0)/Math.abs(dx+0.0);
		dx /= Math.abs(dx);
		dy /= Math.abs(dy);

		if (ratio > 1){
			for (y=from[1]; y != to[1]; y += dy) {
				x = from[0] + dx*Math.abs(y-from[1])/ratio;
				x = Math.floor(x); 
				ret.push([x,y]);
			}
			return ret;
		}
		else {
			for (x=from[0]; x != to[0]; x += dx) {
				y = from[1] + dy*Math.abs(x-from[0])*ratio;
				y = Math.floor(y);
				ret.push([x,y]);
			}
			return ret;
		}
	}

	function register_mouse_move(x,y){
		if (!mouse_down) return;
		mousepath.push([x,y]);
		if (mousepath.length > 1){
			p1 = mousepath[mousepath.length-2];
			p2 = mousepath[mousepath.length-1];
			path = get_path(p1,p2);
			for (i in path)
				paint(path[i][0], path[i][1], 255, 0, 0, 0.01);
		}
	}
	
	return {

		create : function() {
			
			// Create the container for the painter
			container = document.createElement("div");
			container.className = "painter";
			document.body.append(container);

			// Create the canvas for the painter
			canvas = document.createElement("canvas");
			canvas.className = "painter";
			canvas.width = 512;
			canvas.height = 512;
			context = canvas.getContext("2d");
			context.fillStyle = "rgb("+255+","+255+","+255+")";
			context.fillRect(0,0,512,512);

			canvas.onmousedown = function(event){
				mouse_down = true;
				mousepath = [];
			}

			canvas.onmouseup = function(event){
				mouse_down = false;
			}

			canvas.onmousemove = function(event){
				// Track mouse movements
				var rect = canvas.getBoundingClientRect();
				x = event.clientX - rect.left;
				y = event.clientY - rect.top;
				register_mouse_move(x,y);
			}

			container.appendChild(canvas);

			// Create toolbox
			toolbox = document.createElement("div");
			toolbox.className = "toolbox";
			container.appendChild(toolbox);

			brush_size_slider = document.createElement("input");
			brush_size_slider.className = "toolbox_slider";
			brush_size_slider.type = "range";
			brush_size_slider.min = 0;
			brush_size_slider.max = 1000;
			toolbox.appendChild(brush_size_slider);
			
			brush_size_indicator = document.createElement("div");
			toolbox.appendChild(brush_size_indicator);

			brush_size_slider.oninput = function(event){
				bs = brush_size_slider.value;
				bs /= 1000;
				bs = 256 * bs * bs;
				if (bs < 1) bs = 1;
				bs = Math.floor(bs);
				brush_size = bs;
				brush_size_indicator.innerHTML = "Brush size: "+bs+" px";
			}
			brush_size_slider.value = 10;
		}
	}

})() // End namespace painter

// Create the painter
painter.create();
