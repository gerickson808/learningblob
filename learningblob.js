var canvas = document.getElementById('canvas');
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
var h = canvas.height,
		w = canvas.width;
var circle = [];
var i = 0;
var gravity = 1;
var wind = 0;
var gameSpeed = 10;
var hurdles = [];
var points = 0;

document.getElementById('canvas').onmousedown = function(){
  return false;
};

canvas = oCanvas.create({
	canvas: 'canvas',
	background:'#3cf',
	clearEachFrame: true,
	drawEachFrame: true,
	fps:60,
	disableScrolling:true
});

var ground = canvas.display.rectangle({
	x:-10,
	y: (7 * h)/8,
	zIndex:"front",
	height:(2*h)/8,
	width:1.5*w,
	fill:"#663300",
	stroke: "inside 10px #0A0"
});
canvas.addChild(ground);


var hero = canvas.display.arc({
		x:canvas.width/10,
		y:ground.y-16,
		velX:0,
		velY:0,
		radius:16,
		start:0,
		end:360,
		fill:'#c00',
	});
	var eye = canvas.display.arc({
		x:hero.radius/2,
		y:-hero.radius/2,
		radius:hero.radius/4,
		start:20,
		end:340,
		fill:'#000',
		pieSection:true
	});
	var mouth = canvas.display.arc({
		x:7*hero.radius/8,
		y:-hero.radius/3,
		radius:7*hero.radius/8,
		start:90,
		end:140,
		fill:'#000'
	});
	hero.addChild(eye);
	hero.addChild(mouth);
	console.log(hero);
	canvas.addChild(hero);

var groundHeight = h - ground.height / 2;
var heroFloor = groundHeight - hero.radius;

canvas.bind("keydown", function(e){
 if(e.which === 87) jump("big");
if(e.which === 83) jump("little");
});

function createHurdle(){
		var size = random(2) * 40;
		var hurdle = canvas.display.arc({
		x:w + size,
		y:groundHeight,
		velX:-gameSpeed,
		velY:0,
		radius:size,
		start:0,
		end:360,
		fill:'#030',
		pastHero:false
	});
		hurdles.push(hurdle);
		canvas.addChild(hurdle);
		hurdle.zIndex = "back";
}

function generateHurdlesGenerator(){
	var frame = 0;
	return function(){
		frame++;
		if(frame > 30){
			if(random(10) === 6){
				createHurdle();
				frame = 0;
			}
		}
	};
}

var generateHurdles = generateHurdlesGenerator();

checkCollisions = function(objToCheck) {

		if(objToCheck.x < w/2){				
		  var centerA = { x: hero.x+(hero.radius/2), y: hero.y+(hero.radius/2) };
		  var centerB = { x:objToCheck.x+(objToCheck.radius/2), y: objToCheck.y+(objToCheck.radius/2) };
		  var distance = Math.sqrt(((centerB.x-centerA.x)*(centerB.x-centerA.x) + (centerB.y-centerA.y)*(centerB.y-centerA.y)));

		  if(distance < (hero.radius+objToCheck.radius)) {
		      console.log("touched that fucker");
		  }
		}
};

function random(num){
	return Math.floor((Math.random() * num)+1);
}

function jump(size){
	if(hero.y < heroFloor) return;
	if(size === "big")hero.velY = -17;
	else hero.velY = -12;
}

function moveHero(){
		if (hero.y <= heroFloor){
			hero.x += hero.velX;
			hero.y += hero.velY;
			hero.rotate(12);
		}
		else {
			hero.y = heroFloor;
			hero.velY = 0;
		}
}

function moveHurdles(){
	hurdles.forEach(function(hurdle){
		if (hurdle.x > 0 - hurdle.radius){
			hurdle.x += hurdle.velX;
		}
		else {
			canvas.removeChild(hurdle);
			hurdles.shift();
		}
		checkCollisions(hurdle);
		if(hurdle.x < hero.x - hero.radius && hurdle.x > hero.x - hero.radius - 10) points++;
	});
	console.log(points);
}

function applyGravity(grav){
	if(hero.y < heroFloor) hero.velY += grav;
}

// setInterval(function(){
// 	applyGravity(gravity);
// 	moveHero();
// 	generateHurdles();
// 	moveHurdles();
// },40);

function runBrain() {
	var state = getState();
	var action = brain.forward(state);
	var reward = getReward(action, state);
	brain.backward(reward);

	// do action
	
}

canvas.setLoop(function(){
	applyGravity(gravity);
	moveHero();
	generateHurdles();
	moveHurdles();
}).start();
