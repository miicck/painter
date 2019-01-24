var painter = (function(){ // Namespace painter
	
	var container;
	var canvas;
	var context;
	var mousepath;
	var mouse_down = false;
	var brush_size = 10;
	var brush_color = [0,0,0,0];
	var set_brush_color = function(c) { brush_color = c; }
	var undo_levels = []

	bob_ross_colors = {
		"Sap green"        : [10,  52,  16,  1.0],
		"Alizarin crimson" : [78,  21,  0,   1.0],
		"Van Dyke brown"   : [32,  27,  21,  1.0],
		"Dark sienna"      : [95,  46,  31,  1.0],
		"Midnight black"   : [0,   0,   0,   1.0],
		"Prussian blue"    : [2,   30,  68,  1.0],
		"Phthalo blue"     : [12,  0,   64,  1.0],
		"Phthalo green"    : [16,  46,  60,  1.0],
		"Cadmium yellow"   : [255, 236, 0,   1.0],
		"Yellow ochre"     : [199, 155, 0,   1.0],
		"Indian yellow"    : [255, 184, 0,   1.0],
		"Bright red"       : [219, 0,   0,   1.0],
		"Titanium white"   : [255, 255, 255, 1.0]
	};

	tips = [
		"Press ctrl-z to undo",
		"Right click to set brush color from a point on the canvas",
		"Click on brush color indicator to bring up a color mixer."
	];

	brushes = {
		"simple brush"     : paint_simple,
		"fanbrush"         : paint_fanbrush,
		"knife"            : paint_knife,
		"spraycan"         : paint_spray
	};
	selected_brush = "simple brush";

	function float_to_hex(f){
		const hex_values = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
		if (f <= 0) return "00";
		if (f >= 1) return "ff";
		v1 = Math.floor(f * 15);
		v2 = Math.floor((f*15 - v1) * 15);
		ret = hex_values[v1] + hex_values[v2];
		return ret;
	}

	function in_canvas(x, y) {return x>=0 && y>=0 && x < canvas.width && y<canvas.height;}

	function paint()
	{
		var brush = brushes[selected_brush];
		brush();
	}

	function paint_fanbrush()
	{
		if (mousepath.length < 2) return;

		path = [];
		for (var i=Math.max(0, mousepath.length-brush_size); i<mousepath.length; ++i)
			path.push(mousepath[i]);

		start = path[1];
		end   = path[path.length-1];

		dx = end[0]-start[0];
		dy = end[1]-start[1];
		tot_dist = Math.floor(Math.sqrt(dx*dx+dy*dy));
		
		dist_bs_ratio = tot_dist/brush_size;
		if (dist_bs_ratio > 1) dist_bs_ratio = 1;

		bristle_size = 1.5;
		bristle_spacing = 1;
		bristle_shuffle = 2;

		for (ns = -brush_size/2; ns <= brush_size/2; ns += bristle_spacing)
		{
			rand = Math.random();
			br_sh_period = 0.5*(Math.random()+1)*bs;
			dist = 0;


			max_opacity = brush_color[3] / path.length;
			max_opacity *= Math.pow(dist_bs_ratio,2);

			rad = 2*Math.abs(ns)/bs;
			max_opacity *= (1-rad);

			max_opacity *= 2;
			if (max_opacity > 1) max_opacity = 1;

			min_stop = Math.pow(rad, 2);
			max_stop = 1;

			var bc = brush_color;
			col_trans = "rgba("+bc[0]+","+bc[1]+","+bc[2]+",0)";
			col_max = "rgba("+bc[0]+","+bc[1]+","+bc[2]+","+max_opacity+")";

			var grad = context.createLinearGradient(start[0],start[1],end[0],end[1]);
			grad.addColorStop(min_stop, col_trans);
			grad.addColorStop(0.5*(min_stop+max_stop), col_max);
			grad.addColorStop(max_stop, col_trans);
			context.strokeStyle = grad;
			context.lineWidth = bristle_size;

			context.beginPath();
			for (var i=1; i<path.length; ++i)
			{
				xf = path[i-1][0]
				yf = path[i-1][1]
				xt = path[i][0]
				yt = path[i][1]
				dx = xt-xf;
				dy = yt-yf;
				dist += Math.sqrt(dx*dx+dy*dy);
				if (dx > 0) dx = 1;
				else if (dx < 0) dx = -1;
				if (dy > 0) dy = 1;
				else if (dy < 0) dy = -1;
				bsamp = Math.sin(dist/br_sh_period);
				dxt = dy*ns + bristle_shuffle*bsamp;
				dyt = -dx*ns + bristle_shuffle*bsamp;
				context.lineTo(xt+dxt,yt+dyt);
			}
			context.stroke();
		}
	}

	function paint_knife()
	{
		if (mousepath.length < 2) return;
		var bc = brush_color;
		var col_max = "rgba("+bc[0]+","+bc[1]+","+bc[2]+","+bc[3]+")";
		var col_trans = "rgba("+bc[0]+","+bc[1]+","+bc[2]+",0)";
		context.lineWidth = brush_size;

		path = [];
		for (var i=Math.max(0, mousepath.length-brush_size); i<mousepath.length; ++i)
			path.push(mousepath[i]);

		start = path[0];
		end = path[path.length-1];

		var grad = context.createLinearGradient(start[0],start[1],end[0],end[1]);
		grad.addColorStop(0, col_max);
		grad.addColorStop(1, col_trans);
		context.strokeStyle = grad;

		context.beginPath();
		for (var i=0;i<path.length; ++i)
		{
			p = path[i];
			context.lineTo(p[0],p[1]);
		}
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

	function paint_simple()
	{
		if (mousepath.length < 2) return;

		path = get_path(mousepath[mousepath.length-2], mousepath[mousepath.length-1]);

		opacity = Math.pow(brush_color[3],4);
		if (opacity < 0.003) opacity = 0.003;
		var bc = brush_color;
		var col = "rgba("+bc[0]+","+bc[1]+","+bc[2]+","+opacity+")";
		context.fillStyle = col;

		for (var n=0; n<path.length; ++n)
		{
			context.beginPath();
			context.arc(path[n][0],path[n][1],brush_size/2,0,2*Math.PI);
			context.fill();
		}
	}
	
	function paint_spray()
	{
		if (mousepath.length < 2) return;

		path = get_path(mousepath[mousepath.length-2], mousepath[mousepath.length-1]);

		opacity = Math.pow(brush_color[3],4);
		var bc = brush_color;
		var col = "rgba("+bc[0]+","+bc[1]+","+bc[2]+","+opacity+")";
		context.fillStyle = col;

		for (var n=0; n<path.length; ++n)
			for (var i=0; i<brush_size*brush_size/64; ++i)
			{
				r = Math.random();
				r = Math.pow(r,0.7); // Power of 0.5 = uniform
				r *= brush_size/2;
				t = Math.random()*Math.PI*2;
				x = path[n][0] + r * Math.cos(t);
				y = path[n][1] + r * Math.sin(t);
				context.fillRect(x,y,1,1);
			}
	}

	function save_undo_level()
	{
		id = context.getImageData(0,0,canvas.width,canvas.height).data;
		undo_levels.push(id);
	}

	function restore_undo_level()
	{
		if (undo_levels.length == 0) return;
		id = undo_levels[undo_levels.length-1];
		undo_levels.pop();
		context.putImageData(new ImageData(id,canvas.width, canvas.height), 0, 0);
	}

	function hex_to_rgba(hex) {
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ?
		 [parseInt(result[1], 16),
		  parseInt(result[2], 16),
		  parseInt(result[3], 16),1.0]
	          : null;
	}
	
	function componentToHex(c) {
	    var hex = c.toString(16);
	    return hex.length == 1 ? "0" + hex : hex;
	}

	function rgba_to_hex(rgba) {
	    return "#" + componentToHex(rgba[0]) + componentToHex(rgba[1]) + componentToHex(rgba[2]);
	}

	return {

		create : function() {
			
			// Create the container for the painter
			container = document.createElement("div");
			container.className = "painter";
			document.body.appendChild(container);

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
					save_undo_level();
				}

				if (event.button === 2)
				{
					// Sample color from canvas
					id = context.getImageData(x,y,1,1).data;
					set_brush_color([id[0],id[1],id[2],brush_color[3]]);
				}
			}

			document.body.onmouseup = function(event){
				if (event.button === 0)
				{
					mouse_down = false;
				}
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

			document.body.onkeydown = function(event){

				// Undo
				if (event.ctrlKey)
					if (event.key == "z")
						restore_undo_level();
			}


			canvas.oncontextmenu = function(event){
				// Disable rightclick on canvas
				event.preventDefault();
			}

			canvas.onmousemove = function(event){
				// Track mouse movements
				if (!mouse_down) return;
				var rect = canvas.getBoundingClientRect();
				x = event.clientX - rect.left;
				y = event.clientY - rect.top;
				mousepath.push([x,y]);
				paint();
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
			try 
			{
				color_indicator.type = "color";
				color_indicator.oninput = function()
				{
					set_brush_color(hex_to_rgba(color_indicator.value));
				} 
				color_picker.appendChild(color_indicator);
			}
			catch(err)
			{
				console.log("This browser doensn't support color inputs!");
			}

			Object.keys(bob_ross_colors).forEach(function(key){
				color_button = document.createElement("button");
				color_button.className = "color_picker";
				var col = bob_ross_colors[key];
				col[3] = brush_color[3];
				color_button.style.background = rgba_to_hex(col);
				color_button.onclick = function() { set_brush_color(col); }
				color_picker.appendChild(color_button);

				tooltip = document.createElement("span");
				tooltip.className = "tooltip";
				tooltip.innerHTML = key;
				color_button.appendChild(tooltip);
			});

			brush_selector = document.createElement("div");
			brush_selector.className = "toolbox_brush_selector";
			toolbox.appendChild(brush_selector);

			Object.keys(brushes).forEach(function(key){
				brush_button = document.createElement("button");
				brush_button.className = "brush_button";
				brush_button.style.backgroundImage = "url('img/"+key+".png')";
				brush_button.style.backgroundSize = "32px 32px";
				brush_selector.appendChild(brush_button);

				brush_button.onclick = function() {selected_brush = key;}
				tooltip = document.createElement("span");
				tooltip.className = "tooltip";
				tooltip.innerHTML = key;
				brush_button.appendChild(tooltip);
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
				brush_color[3] = bo;
				brush_opacity_indicator.innerHTML = "Brush opacity: "+Math.round(bo*100)+"%";
			}

			brush_opacity_slider.value = 500;
			brush_opacity_slider.oninput();

			set_brush_color = function(c){
				brush_color[0] = c[0]
				brush_color[1] = c[1]
				brush_color[2] = c[2]
				color_indicator.value = rgba_to_hex(c);
			}
		}
	}

})() // End namespace painter

// Create the painter
painter.create();
