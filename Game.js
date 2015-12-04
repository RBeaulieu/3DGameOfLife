"use strict";

var prevStep = [];
var currStep = [];
var prevChangeSet = {};
var currChangeSet = {}
var bSet = {};
var sSet = {};
var size = 5;
var step = 0;

function main()
{
	gameInit();
	
	//test();
	
	//generateNextStep();
	
	//console.log(currStep);
}

function gameInit()
{
	for(var z = 0; z < size; z++)
	{
		prevStep[z] = [];
		currStep[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			prevStep[z][y] = [];
			currStep[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				prevStep[z][y][x] = 0;
				currStep[z][y][x] = 0;
				currChangeSet[x.toString() + y.toString() + z.toString()] = true;
			}
		}
	}
	
	console.log(currChangeSet);
	
	currStep[2][2][3] = 1;
	currStep[2][2][1] = 1;
	currStep[2][3][2] = 1;
	currStep[2][1][2] = 1;
	currStep[2][2][2] = 1;
	
	bSet["3"] = true;
	sSet["2"] = true;
	sSet["3"] = true;
	
	drawInit(currStep);
}

function generateNextStep()
{
	console.log("------------ step " + step + "------------");
	prevStep = currStep;
	currStep = prevStep.map(function(outerArr) { return outerArr.map(function(innerArr) { return innerArr.slice(); }) });  // Makes deep copy of 3D array
	prevChangeSet = currChangeSet;
	currChangeSet = {};
	
	for(let loc in prevChangeSet) {
		var count = 0;
		var localNodes = [];
		var localNodesCount = 0;
		var x = parseInt(loc.charAt(0));
		var y = parseInt(loc.charAt(1));
		var z = parseInt(loc.charAt(2));
		
		for(var k = -1; k < 2; k++)
		{
			if((z + k) > -1 && (z + k) < size) // Check to make sure we're not checking out of bounds
			{
				for(var j = -1; j < 2; j++)
				{
					if((y + j) > -1 && (y + j) < size) // Check to make sure we're not checking out of bounds
					{
						for(var i = -1; i < 2; i++)
						{
							if((x + i) > -1 && (x + i) < size) // Check to make sure we're not checking out of bounds
							{
								if(!(k == 0 && j == 0 && i == 0) && prevStep[z + k][y + j][x + i] != 0) { count++; }
								//put location in localNodes
								localNodes[localNodesCount] = (x + i).toString() + (y + j).toString() + (z + k).toString();
							}
						}
					}
				}
			}
		}
		
		console.log("point: " + loc);
		console.log("count: " + count);
		
		if(prevStep[z][y][x] != 0)
		{
			//console.log(localNodes);
			if(sSet[count.toString()] === undefined)
			{
				currStep[z][y][x] = 0;
				for(let chng of localNodes)	{ currChangeSet[chng] = true; }
			}
		}
		else
		{
			//console.log(localNodes);
			if(bSet[count.toString()] !== undefined)
			{
				currStep[z][y][x] = 1;
				for(let chng of localNodes)	{ currChangeSet[chng] = true; }
			}			
		}
	}
	
	//console.log(currChangeSet);
	step++;
	timeout();
}

function timeout() {
	setTimeout(function(){
		if(canDraw())
		{
			drawNonCamUpdate(currStep);
		}
		else
		{
			timeout();
		}
	}, 20);
}
