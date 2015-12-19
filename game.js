// Cool types of life
/*	
	bSet["5"] = true;
	bSet["7"] = true;
	sSet["6"] = true;
*/
/*
	bSet["4"] = true;
	bSet["5"] = true;
	sSet["5"] = true;
*/

// CLEAN UP AND COMMENT WHEN POSSIBLE

"use strict";

var lifeBuffer;
var nextWrite;
var nextRead;
var bufferLimit = 10;

var bSet;
var sSet;
var preset = 1;
var checkAllChangeSet;
var size = 21;
var myWorker;
var isWorking;

function main()
{	
	myWorker = new Worker('game-worker.js');
	myWorker.onmessage = function(event) {
		if(isWorking)
		{
			lifeBuffer[nextWrite] = {arr: JSON.parse(event.data[0]), chng: JSON.parse(event.data[1])}
			nextWrite++;
			nextWrite = nextWrite % bufferLimit;
			isWorking = false;
		}
		else
		{
			console.log('Discarded changes, possible reset issue');
		}
	}
	
	gameInit();
	drawInit();
	
	generateNextStep(); // First life call
	draw(); // First draw call
}

function gameInit()
{
	lifeBuffer = [];
	
	var setup = [];
	checkAllChangeSet = {};
	
	for(var z = 0; z < size; z++)
	{
		setup[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			setup[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				setup[z][y][x] = 0;
				checkAllChangeSet[x.toString() + ' ' + y.toString() + ' ' + z.toString()] = true;
			}
		}
	}
	
	setPreset(setup);

	g_currStep = setup;
	
	document.getElementById('txtBVal').value = '4,5';
	document.getElementById('txtSVal').value = '5';
	
	// Set initial step update speed
	var initialSpeed = 1000;
	document.getElementById('rngSpeed').value = initialSpeed;
	setSpeed(initialSpeed);
	
	gameStart();
	gameStop();
}

function setPreset(setup)
{
	if(preset == 1) 
	{
			//DEFAULT (BLINKER)4,5/5
			console.log('eat shit');
			setup[11][10][10] = 1;
			setup[9][10][10] = 1;
			setup[10][10][11] = 1;
			setup[10][10][9] = 1;
			setup[10][11][10] = 1;
			setup[10][9][10] = 1;
			setup[10][10][10] = 1;
	}
	else if(preset == 2)
	{
			//ACCORDION (WALL 2 WALL BLINKER)4,5/5
			setup[10][10][11] = 1;
			setup[10][10][9] = 1;
			setup[10][11][10] = 1;
			setup[10][9][10] = 1;
			setup[10][10][10] = 1;
	}
	
	//BAD REACTION (EXPLOSION)4,5/5
	/*
	setup[9][10][10] = 1;
	setup[10][10][11] = 1;
	setup[10][10][9] = 1;
	setup[10][11][10] = 1;
	setup[10][9][10] = 1;
	setup[10][10][10] = 1;

	setup[12][10][10] = 1;
	setup[12][10][11] = 1;
	setup[12][10][9] = 1;
	setup[12][11][10] = 1;
	setup[12][9][10] = 1;
	setup[13][10][10] = 1;
	*/

	//SHOCKWAVE (EXPLOSION)2,5/4,8
	/*
	setup[10][9][9] = 1;
	setup[10][9][11] = 1;
	setup[11][9][10] = 1;
	setup[9][9][10] = 1;
	setup[10][9][10] = 1;

	setup[10][11][9] = 1;
	setup[10][11][11] = 1;
	setup[11][11][10] = 1;
	setup[9][11][10] = 1;
	setup[10][11][10] = 1;
	*/
}

function gameStateInit(bInput, sInput)
{
	isWorking = false;
	nextWrite = 0;
	nextRead = 0;
	var currStepCopy = g_currStep.map(function(outerArr) { return outerArr.map(function(innerArr) { return innerArr.slice(); }) });
	lifeBuffer[0] = {arr: currStepCopy, chng: checkAllChangeSet}
	nextWrite++;
	
	bSet = {};
	sSet = {};
	
	for(var b of bInput) { bSet[b] = true; }
	for(var s of sInput) { sSet[s] = true; }
}

function generateNextStep()
{
	if(!isWorking && nextWrite != nextRead)
	{
		var prevWrite;
		if(nextWrite == 0) { prevWrite = bufferLimit - 1; }
		else { prevWrite = nextWrite - 1;}
		
		myWorker.postMessage([JSON.stringify(lifeBuffer[prevWrite].arr), JSON.stringify(lifeBuffer[prevWrite].chng), JSON.stringify(bSet), JSON.stringify(sSet), size]);
		isWorking = true;
	}
	setTimeout(generateNextStep, 100);
}

// POTENTIALLY UNSAFE, FIX SOON
function getGameStep()
{
	var temp = lifeBuffer[nextRead].arr;
	nextRead++;
	nextRead = nextRead % bufferLimit;
	return temp;
}