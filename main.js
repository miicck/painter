var painter = (function(){ // Namespace painter
	
	var container;
	var canvas;
	var context;
	var mousepath;
	var mouse_down = false;
	var brush_size = 10;
	var brush_color = "#000000"
	var brush_opacity = 0.01;
	var set_brush_color = function(c) { brush_color = c; }

	bob_ross_colors = {
		"Sap green"        : "#0A3410",
		"Alizarin crimson" : "#4E1500",
		"Van Dyke brown"   : "#221B15",
		"Dark sienna"      : "#5F2E1F",
		"Midnight black"   : "#000000",
		"Prussian blue"    : "#021E44",
		"Phthalo blue"     : "#0C0040",
		"Phthalo green"    : "#102E3C",
		"Cadmium yellow"   : "#FFEC00",
		"Yellow ochre"     : "#C79B00",
		"Indian yellow"    : "#FFB800",
		"Bright red"       : "#DB0000",
		"Titanium white"   : "#FFFFFF"
	};
	hex_values = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];

	function float_to_hex(f){
		v1 = Math.floor(f * 15);
		v2 = Math.floor((f*15 - v1) * 15);
		ret = hex_values[v1] + hex_values[v2];
		return ret;
	}

	function in_canvas(x, y) {return x>=0 && y>=0 && x < canvas.width && y<canvas.height;}

	function paint(x,y){
		if (!in_canvas(x,y)) return;
		context.beginPath();
		context.arc(x,y,brush_size/2,0,2*Math.PI,false);
		context.fill();
	}

	function paint_from_to(xf,yf,xt,yt){
		if (!in_canvas(xf,yf)) return;
		if (!in_canvas(xt,yt)) return;

		context.strokeStyle = brush_color + float_to_hex(brush_opacity);
		context.beginPath();
		context.moveTo(xf, yf);
		context.lineTo(xt, yt);
		context.stroke();
	}

	function get_path(from, to){
		// Returns a path linking two points
		// on the canva sith a straight line
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
			
			for (i=1; i<path.length; ++i)
				paint_from_to(path[i-1][0], path[i-1][1], path[i][0], path[i][1]);

			if (false)
				for (i in path)
					paint(path[i][0], path[i][1]);
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
			canvas.width = 800;
			canvas.height = canvas.width;
			context = canvas.getContext("2d");
			context.fillStyle = "rgba("+255+","+255+","+255+","+255+")";
			context.fillRect(0,0,canvas.width,canvas.height);

			document.body.onmousedown = function(event){
				mousepath = [];

				var rect = canvas.getBoundingClientRect();
				x = event.clientX - rect.left;
				y = event.clientY - rect.top;

				if (event.button === 0)
				{
					mouse_down = true;
					paint(x,y);
				}

				if (event.button === 2)
				{
					// Sample color from canvas
					id = context.getImageData(x,y,1,1).data;
					console.log(id);
					sampled_color = "#"+
						float_to_hex(id[0]/255.0)+
						float_to_hex(id[1]/255.0)+
						float_to_hex(id[2]/255.0);
					set_brush_color(sampled_color);
				}
			}

			document.body.onmouseup = function(event){
				if (event.button === 0)
					mouse_down = false;
			}

			document.body.onmousemove = function(event){

				// If there are no buttons pressed when the mouse
				// is moveing, ensure that mouse_down is set to false
				// so we dont accidentally draw lines across the canvas
				if (event.buttons === 0)
				{
					mousepath = [];
					mouse_down = false;
				}
			}


			canvas.oncontextmenu = function(event){
				// Disable rightclick on canvas
				event.preventDefault();
			}

			canvas.onmousemove = function(event){
				// Track mouse movements
				var rect = canvas.getBoundingClientRect();
				x = event.clientX - rect.left;
				y = event.clientY - rect.top;
				register_mouse_move(x,y);
			}

			container.appendChild(canvas);
			container.style.width = canvas.width;

			// Create toolbox
			toolbox = document.createElement("div");
			toolbox.className = "toolbox";
			container.appendChild(toolbox);

			color_picker = document.createElement("div");
			color_picker.className = "toolbox_color_picker";
			toolbox.appendChild(color_picker);

			color_indicator = document.createElement("input");
			color_indicator.className = "color_indicator";
			color_indicator.title = "Pick a color";
			color_indicator.type = "color";
			color_indicator.oninput = function(){
				set_brush_color(color_indicator.value);
			} 
			color_picker.appendChild(color_indicator);

			Object.keys(bob_ross_colors).forEach(function(key){
				color_button = document.createElement("button");
				color_button.className = "color_picker";
				color_button.style.background = bob_ross_colors[key];
				color_button.onclick = function() {
					set_brush_color(bob_ross_colors[key]);
				}
				color_picker.appendChild(color_button);

				tooltip = document.createElement("span");
				tooltip.className = "tooltip";
				tooltip.innerHTML = key;
				color_button.appendChild(tooltip);
			});


			brush_size_indicator = document.createElement("div");
			brush_size_indicator.className = "toolbox_label";
			toolbox.appendChild(brush_size_indicator);

			brush_size_slider = document.createElement("input");
			brush_size_slider.className = "toolbox_slider";
			brush_size_slider.type = "range";
			brush_size_slider.min = 0;
			brush_size_slider.max = 1000;
			toolbox.appendChild(brush_size_slider);

			brush_size_slider.oninput = function(event){
				bs = brush_size_slider.value;
				bs /= 1000;
				bs = 256 * bs * bs;
				if (bs < 1) bs = 1;
				bs = Math.floor(bs);
				brush_size = bs;
				brush_size_indicator.innerHTML = "Brush size: "+bs+" px";
			}

			brush_size_slider.value = 500;
			brush_size_slider.oninput();
			toolbox.appendChild(document.createElement("br"));

			brush_opacity_indicator = document.createElement("div");
			brush_opacity_indicator.className = "toolbox_label";
			toolbox.appendChild(brush_opacity_indicator);

			brush_opacity_slider = document.createElement("input");
			brush_opacity_slider.className = "toolbox_slider";
			brush_opacity_slider.type = "range";
			brush_opacity_slider.min = 0;
			brush_opacity_slider.max = 1000;
			toolbox.appendChild(brush_opacity_slider);

			brush_opacity_slider.oninput = function(event){
				bo = brush_opacity_slider.value / 1000;
				brush_opacity = bo;
				brush_opacity_indicator.innerHTML = "Brush opacity: "+Math.round(bo*100)+"%";
			}

			brush_opacity_slider.value = 100;
			brush_opacity_slider.oninput();

			set_brush_color = function(c){
				brush_color = c;
				color_indicator.value = brush_color;
			}
		}
	}

})() // End namespace painter

// Create the painter
painter.create();
