var canvas = document.getElementById('canvas');
var canvasOffset = 200;
canvas.height = window.innerHeight - canvasOffset;
canvas.width = window.innerWidth;
canvas.top = canvasOffset;
var h = canvas.height,
    w = canvas.width;
var circle = [];
var i = 0;
var gravity = 1;
var wind = 0;
var gameSpeed = 10;
var hurdles = [];
var clouds = [];
var points = 0;
var colliding = false;
var overHurdle = false;
var brain = new deepqlearn.Brain(2, 2, myOpt);
var fast,real, nearestHurdle, pointsToGet;
var cleared = false;

var reward_graph = new cnnvis.Graph();



function loadNinja() {
    brain.value_net.fromJSON(ninjabrain);
}
function loadSmart() {
    brain.value_net.fromJSON(smartbrain);
}
function loadSimple() {
    brain.value_net.fromJSON(simplebrain);
}

document.getElementById('canvas').onmousedown = function() {
    return false;
};

canvas = oCanvas.create({
	canvas: 'canvas',
	background:'#3cf',
	clearEachFrame: true,
	drawEachFrame: true,
	fps:120,
	disableScrolling:true
});

var ground = canvas.display.rectangle({
    x: -10,
    y: (7 * h) / 8,
    zIndex: "front",
    height: (2 * h) / 8,
    width: 1.5 * w,
    fill: "#663300",
    stroke: "inside 10px #0A0"
});
canvas.addChild(ground);


var hero = canvas.display.arc({
    x: canvas.width / 10,
    y: ground.y - 16,
    velX: 0,
    velY: 0,
    radius: 16,
    start: 0,
    end: 360,
    fill: '#c00',
});
var eye = canvas.display.arc({
    x: hero.radius / 2,
    y: -hero.radius / 2,
    radius: hero.radius / 4,
    start: 20,
    end: 340,
    fill: '#000',
    pieSection: true
});
var mouth = canvas.display.arc({
    x: 7 * hero.radius / 8,
    y: -hero.radius / 3,
    radius: 7 * hero.radius / 8,
    start: 90,
    end: 140,
    fill: '#000'
});
hero.addChild(eye);
hero.addChild(mouth);
canvas.addChild(hero);

var groundHeight = h - ground.height / 2;
var heroFloor = groundHeight - hero.radius;

canvas.bind("keydown", function(e) {
    if (e.which === 87) jump("big");
    if (e.which === 83) jump("little");
});

function createHurdle() {
    var size = random(2) * 40;
    var hurdle = canvas.display.arc({
        x: w + size,
        y: groundHeight,
        velX: -gameSpeed,
        velY: 0,
        radius: 80,
        start: 0,
        end: 360,
        fill: '#030',
        pastHero: false,
        hit: false
    });
    hurdles.push(hurdle);
    canvas.addChild(hurdle);
    hurdle.zIndex = "back";
}

// start with easy settings
var frameCutoff = 50;
var hurdleProb = 30;

function setEasy() {
    frameCutoff = 50;
    hurdleProb = 30;
}

function setMedium() {
    frameCutoff = 40;
    hurdleProb = 20;
}

function setHard(argument) {
    frameCutoff = 30;
    hurdleProb = 10;
}

function generateHurdlesGenerator() {
    var frame = 0;
    return function() {
        frame++;
        if (frame > frameCutoff) {
            if (random(hurdleProb) === 6) {
                createHurdle();
                frame = 0;
            }
        }
    };
}

var generateHurdles = generateHurdlesGenerator();


checkCollisions = function(objToCheck) {		
			if(!objToCheck) return;
		  var centerA = { x: hero.x, y: hero.y };
		  var centerB = { x:objToCheck.x, y: objToCheck.y };
		  var distance = Math.sqrt(((centerB.x-centerA.x)*(centerB.x-centerA.x) + (centerB.y-centerA.y)*(centerB.y-centerA.y)));

    if (distance < (hero.radius + objToCheck.radius)) {
        // if (!colliding) pointsToGet = -4;
        pointsToGet = -0.5;
        colliding = true;
        objToCheck.hit = true;

    } else {
        colliding = false;
    }
};


checkIfOverHurdle = function(hurdle){
	if(colliding || !hurdle) return;
	var heroCenter = hero.x;
	var heroLeft = hero.x - hero.radius;
	var heroRight = hero.x + hero.radius;
	var hurdleCenter = hurdle.x;
	var hurdleLeft = hurdle.x - hurdle.radius;
	var hurdleRight = hurdle.x + hurdle.radius;
	if ((heroLeft < hurdleRight && heroLeft > hurdleLeft) || (heroRight < hurdleRight && heroRight > hurdleLeft)){
		overHurdle = true;
	}else overHurdle = false;

};

function random(num) {
    return Math.floor((Math.random() * num) + 1);
}

function jump(size) {
    if (hero.y < heroFloor) return;
    // if(size === "big")hero.velY = -17;
    // else hero.velY = -12;
    hero.velY = -14.5;
}

function moveHero(){
		if (hero.y <= heroFloor){
			hero.x += hero.velX;
			hero.y += hero.velY;
			hero.rotate(12.5);
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
		if(hurdle.x < hero.x - hero.radius && hurdle.x > hero.x - hero.radius - 10 && hurdle.hit === false) {
			points++;
			cleared = true;
		}
	});
}

function applyGravity(grav) {
    if (hero.y < heroFloor) hero.velY += grav;
}

function getState() {
    // isJumping, distnace from next obstacle, obstacle type
    var leastDistance = w,
        obsType;
    hurdles.forEach(function(hurdle) {
        var distance = hurdle.x - hero.x;
        if (hurdle.x > hero.x && distance < leastDistance) {
            leastDistance = distance;
            nearestHurdle = hurdle;
        }
    });
    // if(nearestHurdle) obsType = nearestHurdle.size == 80 ? 1 : 0;
    // else obsType = 0;
    var isJumping = hero.y < heroFloor ? 1 : 0;
    leastDistance = leastDistance / w || w;
    checkCollisions(nearestHurdle);
    checkIfOverHurdle(nearestHurdle);

    // return [isJumping, leastDistance, obsType];
    return [isJumping, leastDistance];

}

function getReward(action, state) {
	// body...
	if(!pointsToGet) pointsToGet = 0;
	if(state[0]===0 && !colliding) pointsToGet = 0.05;
	if(state[0]===1 && !overHurdle && !colliding) pointsToGet = -0.2;
	if(state[0]===1 && overHurdle && !colliding) pointsToGet = 0.8;
	// if(cleared) pointsToGet = 10;
	var reward = pointsToGet;
	pointsToGet = 0;
	cleared = false;
	return reward;
}

function toggleLearning() {

    if (brain.learning) {
        console.log('Learning turned off');
        brain.learning = false;
        brain.epsilon_test_time = 0.0;
    } else {
        console.log('Learning turned on');

        brain.learning = true;
        brain.epsilon_test_time = 0.01;
    }
}

function saveBrain() {
    var net = brain.value_net.toJSON();
    console.log(JSON.stringify(net));
}

function loadBrain() {
	var brainToLoad = eval("(" + document.getElementById('brains').value + ')');
	brain.value_net.fromJSON(brainToLoad);
}


function realTime(){
	clearInterval(fast);
	canvas.setLoop().stop();

	canvas.setLoop(function(){
		applyGravity(gravity);
		moveHero();
		generateHurdles();
		moveHurdles();
		generateClouds();
		moveClouds();
		runBrain();
		draw_stats();
	}).start();
}

function fastLearning(){
	canvas.setLoop().stop();
	clearInterval(fast);

	fast = setInterval(function(){
	applyGravity(gravity);
	moveHero();
	generateHurdles();
	moveHurdles();
	runBrain();
},0);
}

function runBrain() {
	var state = getState();
	var action = brain.forward(state);
	var reward = getReward(action, state);
	// console.log("state: ",state,"\naction: ",action,"\nreward: ",reward);
	// console.log(state);
	brain.backward(reward);

	// do action
	// switch (action){
	// 	case 1:
	// 		jump("big");
	// 		break;
	// 	case 2:
	// 		jump("small");
	// 		break;
	if (action === 1 ) jump();
	
	brain.visSelf(document.getElementById('info'));
}

function draw_stats() {
    var canvas = document.getElementById("vis_canvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width;
    var H = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var b = brain;
    var netin = b.last_input_array;
    ctx.strokeStyle = "rgb(0,0,0)";
    //ctx.font="12px Verdana";
    //ctx.fillText("Current state:",10,10);
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (var k = 0, n = netin.length; k < n; k++) {
        ctx.moveTo(10 + k * 12, 120);
        ctx.lineTo(10 + k * 12, 120 - netin[k] * 100);
    }
    ctx.stroke();

}



var simplebrain = {"layers":[{"out_depth":6,"out_sx":1,"out_sy":1,"layer_type":"input"},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"fc","num_inputs":6,"l1_decay_mul":0,"l2_decay_mul":1,"filters":[{"sx":1,"sy":1,"depth":6,"w":{"0":-0.15557077947773656,"1":0.11508388364665728,"2":-0.12770636137304417,"3":0.42661694358298996,"4":0.08971893794908133,"5":0.08243771465497225}},{"sx":1,"sy":1,"depth":6,"w":{"0":-0.18054901273566704,"1":-0.2790649729335071,"2":-0.09398237362797197,"3":0.6498568943507281,"4":0.16249425550416813,"5":0.16474520778039883}}],"biases":{"sx":1,"sy":1,"depth":2,"w":{"0":0.11888617376414806,"1":-0.018588838935209438}}},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"regression","num_inputs":2}]};
var smartbrain = {"layers":[{"out_depth":6,"out_sx":1,"out_sy":1,"layer_type":"input"},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"fc","num_inputs":6,"l1_decay_mul":0,"l2_decay_mul":1,"filters":[{"sx":1,"sy":1,"depth":6,"w":{"0":-0.3112598636012905,"1":0.4285562269992439,"2":0.08318044170873752,"3":-0.040108572834743166,"4":0.004598174935621053,"5":0.014488128997299914}},{"sx":1,"sy":1,"depth":6,"w":{"0":-0.21688240338879128,"1":-0.43257451890866017,"2":-0.0030226106445853506,"3":0.3329125727776427,"4":0.04588569057706903,"5":-0.006983542572444009}}],"biases":{"sx":1,"sy":1,"depth":2,"w":{"0":-0.15844653104175807,"1":-0.18196947704521538}}},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"regression","num_inputs":2}]};
var ninjabrain = {"layers":[{"out_depth":6,"out_sx":1,"out_sy":1,"layer_type":"input"},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"fc","num_inputs":6,"l1_decay_mul":0,"l2_decay_mul":1,"filters":[{"sx":1,"sy":1,"depth":6,"w":{"0":-0.274687125761134,"1":0.33698267253778713,"2":0.11035176797066769,"3":-0.12540480901180634,"4":0.008777248980376457,"5":0.017844310903739804}},{"sx":1,"sy":1,"depth":6,"w":{"0":-0.18373299586845926,"1":-0.4349861340129164,"2":0.027501721151774974,"3":0.3290130935957458,"4":0.04287485009924651,"5":0.0013962164913292436}}],"biases":{"sx":1,"sy":1,"depth":2,"w":{"0":-0.15467030298522969,"1":-0.1792665633743678}}},{"out_depth":2,"out_sx":1,"out_sy":1,"layer_type":"regression","num_inputs":2}]};
