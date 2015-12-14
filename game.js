"use strict";

var lifeBuffer = [];
var currStep = [];
var currChangeSet = {};
var bSet = {};
var sSet = {};
var size = 20;
var bufferStep;
var bufferLimit = 10;
var myWorker;
var isWorking;

function main()
{
	myWorker = new Worker('game-worker.js');
	myWorker.onmessage = function(event) {
		bufferStep++;
		isWorking = false;
	}
	
	gameInit();
	drawInit();
	
	generateNextStep(); // First life call
	draw(); // First draw call
}

function gameInit()
{
	isWorking = false;
	
	var checkAllChangeSet = {};
	
	for(var z = 0; z < size; z++)
	{
		currStep[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			currStep[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				currStep[z][y][x] = 1;
				currChangeSet[x.toString() + ' ' + y.toString() + ' ' + z.toString()] = true;
			}
		}
	}
	
	checkAllChangeSet = currChangeSet;
		
	currStep[10][10][11] = 1;
	currStep[10][10][9] = 1;
	currStep[10][11][10] = 1;
	currStep[10][9][10] = 1;
	currStep[10][10][10] = 1;

	bSet["1"] = true;
	bSet["2"] = true;
	bSet["3"] = true;
	sSet["5"] = true;
	sSet["7"] = true;
	sSet["9"] = true;
}

function generateNextStep()
{
	if(!isWorking)
	{
		myWorker.postMessage([JSON.stringify(currStep), JSON.stringify(currChangeSet), JSON.stringify(bSet), JSON.stringify(sSet), size]);
		isWorking = true;
	}
	setTimeout(generateNextStep, 100);
}
