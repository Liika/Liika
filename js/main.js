
function pointInPolygon(point, polygon, position1, position2) {
  // http://bl.ocks.org/mbostock/4218871
  for (var n = polygon.length, i = 0, j = n - 1, x = point[0] + position1.left, y = point[1] + position1.top, inside = false; i < n; j = i++) {
    var xi = polygon[i][0] + position2.left, yi = polygon[i][1] + position2.top,
        xj = polygon[j][0] + position2.left, yj = polygon[j][1] + position2.top;
    if ((yi > y ^ yj > y) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
$(document).ready(function(){
	var tickTime = 100; // miilleseconds
	
	var corners = [[[214,76], [382,190], [463,341], [437,427], [275,396], [105,279], [51,182]],
	[[204,155],[372,193],[381,243],[350,288],[135,348]],
	[[204,65],[266,93],[353,317],[337,390],[161,438],[154,132]]];

	var shapeLeft = [51,135,154];
	var shapeRight = [463,381,353];

	var shapeTop = [76,155,65];
	var shapeBottom = [427,348,438];

	var starts = {
		0: [[42,127, 500]],
		500: [[32,127, 1500],[27,127, 1500]],
		1000: [[22,127, 1500]]
	
	};
	var playing = false;
	var rotated =false;
	

	
	var channels = {

	};

	var instrument = 42;

	function start(msec) {
		var secStarts = starts[msec];
		

		if (secStarts) {
			_.each(secStarts,function(start){
				var note = start[0];
				var velocity = start[1]
				var endTime = start[2];
				for (var chan =0; chan < 16; chan++){
					if (!_.has(channels, chan)){
						channels[chan] = true;
						MIDI.noteOn(chan, note, 127, 0);
						MIDI.noteOff(chan, note, 127, endTime-msec);
						setTimeout(function(){
							channels[chan]=false;
						}, endTime-msec)
						break;
					}

				}
			});
		}

	}
	function setupMidi (){
		
		for(var i = 0; i < 16; i++){
			MIDI.programChange(i, instrument);
		}


		
		
		

		var time = 0;
		start(0);
		setInterval(function(){
			time += 500;
			start(time);
		}, 500);
	}
	MIDI.loadPlugin({

		soundfontUrl: "soundfont/",
		instruments: ["cello"],
		callback: setupMidi
	});
	
	$('.shape').each(function(){
		var $this = $(this);
		var otherShapes =[], $otherShapes = [];
		var myCorners;

		$('.shape').not($this).each(function(i, shape){
			var id = shape.id;
			var num = id.split('-')[1];

			otherShapes.push(corners[num]);
			$otherShapes.push($(shape));
		});
		var id = $this.attr('id');
		var num = id.split('-')[1];
		myCorners = corners[num];

		var map = $this.find('map');
		
		var revert = false;
		var lastPos;
		$this.draggable({
			handle: $this.find('img').attr('usemap'),

			revert: function(){


				return false;
			},
			start: function(){
				revert = false;

			},
			stop: function(){
				
				if(revert) {
					$this.css(lastPos);
				}
				$('.shape').each(function(i, shape){
			var $this = $(this);
			var left = $this.position().left;
			if (rotated) {
				if (left + shapeTop[i] <= cursorPos && cursorPos <= left + shapeBottom[i]) {
					$this.addClass('active');
				}
				else {
					$this.removeClass('active');
				}	
			}
			else {
				if (left + shapeLeft[i] <= cursorPos && cursorPos <= left + shapeRight[i]) {
					$this.addClass('active');
				}
				else {
					$this.removeClass('active');
				}	
			}
			
		});
				


			},
			drag: function(){

				revert = false;
				var $this = $(this);
				var myPos = $this.position();


				_.each(otherShapes, function(otherShape, i){
					if (revert) {
						return;
					}

					_.each(otherShape, function(point) {
						if (revert) {
							return;
						}
						if (pointInPolygon(point, myCorners, $otherShapes[i].position(), myPos)) {
							
							

							revert = true;
						}
					});

					if (revert) {
						return;
					}
					_.each(myCorners, function(point) {

						if(revert) {
							return;
						}

						if (pointInPolygon(point, otherShape, myPos, $otherShapes[i].position() )) {
							
							revert = true;
						}
					})
				});

				if (!revert) {
					lastPos = {top: $this.css('top'), left: $this.css('left')};
				}

			}
		});
		
	});

	$('map').on('mouseover', function(e){
		e.preventDefault();
		return false;
		
		
	})

	.on('mouseout', function(e){
		$('.shape').css('z-index', 1000);
		$(this).parent().css({border: 'none', 'z-index': 1});	
		e.preventDefault();
		return false;
	});


	var playInterval = null;
	var cursorPos = 0;
	var cursorInterval = 25;

	function tick() {
		
		cursorPos += cursorInterval;
		$('#cursor').css('left', cursorPos);

		if (cursorPos > $('body').width())
		{
			stopPlay();
		} 

		$('.shape').each(function(i, shape){
			var $this = $(this);
			var left = $this.position().left;
			if (rotated) {
				if (left + shapeTop[i] <= cursorPos && cursorPos <= left + shapeBottom[i]) {
					$this.addClass('active');
				}
				else {
					$this.removeClass('active');
				}	
			}
			else {
				if (left + shapeLeft[i] <= cursorPos && cursorPos <= left + shapeRight[i]) {
					$this.addClass('active');
				}
				else {
					$this.removeClass('active');
				}	
			}
			
		});

	}
	function play(){

		playInterval = setInterval(tick, tickTime);
		playing = true;

	}
	function pausePlay(){
		clearInterval(playInterval);

		playInterval = null;
		playing = false;
	}

	function stopPlay(){
		if (playing) {
			$('#playButton').toggleClass("fa-play fa-pause");
			pausePlay();
		}
		cursorPos = 0;
		$('#cursor').css('left', cursorPos);

	}
	$('#playButton').click(function(){
		$('#playButton').toggleClass("fa-play fa-pause");
		if (playing) {
			pausePlay();
		}
		else {
			play();
		}
	});

	$('#stopButton').click(stopPlay);

	$('#rotateButton').click(function(){
		$('#rotateButton').toggleClass('fa-rotate-left fa-rotate-right');

		$('.shape').each(function(){
			var $this = $(this);
			var position = $this.position();
			var angle;
			
		
			$this.css({top: position.left, left: position.top}).toggleClass('rotated');

			var $area = $this.find("area");
			var coords = $area.attr('coords');
			var newCoords = "";
			var splitCoords = coords.split(",");

			for (var i =0; i < splitCoords.length; i+=2){
				newCoords += splitCoords[i+1] + ',' + splitCoords[i] + ',';
			}
			newCoords = newCoords.substr(0, newCoords.length - 1);
			$area.attr('coords', newCoords);

		});


		_.each(corners, function(shapeCorner){
			_.each(shapeCorner, function(coordPair){
				var temp = coordPair[0];
				coordPair[0] = coordPair[1];
				coordPair[1] = temp;
			});
		});
		rotated = !rotated;
	});
	

	

	
	


})