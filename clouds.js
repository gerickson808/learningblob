function generateClouds(){
		if(random(150)===7) createCloud();
}
	// function createCloud(){
	// 	var puffRadius=5+random(12),
	// 			cloud,
	// 			lastPuff,
	// 			currentPuff = null;
	// 	for(var i=0;i<15;i++){
	// 		if(currentPuff) lastPuff = currentPuff;
	// 		else lastPuff = {x:w, y:h/10};
	// 		currentPuff = canvas.display.arc({
	// 			x:lastPuff.x + random(2*puffRadius),
	// 			y:lastPuff.y + (-puffRadius + random(2*puffRadius)),
	// 			radius:puffRadius,
	// 			start:0,
	// 			end:360,
	// 			fill:"#ccc",
	// 			velX:-5
	// 		});
	// 		if(i===0) cloud = currentPuff;
	// 		else cloud.addChild(currentPuff);
	// 	}
	// 	console.log(cloud);
	// 	canvas.addChild(cloud);
	// 	clouds.push(cloud);
	// }

	function createCloud(){
		var cloud = canvas.display.image({
			x:w+100,
			y:random(h/5),
			origin: { x: "center", y:"center" },
			image: "./cloud.png",
			velX:-3
		});

		canvas.addChild(cloud);
		clouds.push(cloud);
	}

function moveClouds(){
	clouds.forEach(function(cloud){
		if (cloud.x > -20){
			cloud.x += cloud.velX;
		}
		else {
			canvas.removeChild(cloud);
			clouds.shift();
		}
	});
}