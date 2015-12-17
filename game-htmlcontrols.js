function gameStart()
{
	g_isStopped = false;
	g_lastUpdate = performance.now();
}

function gameStop()
{
	g_isStopped = true;
}

function gameReset()
{
	g_isStopped = true;
	gameInit();
	g_currStep = lifeBuffer[0].arr;
	g_lastUpdate = 0;
	g_stepCounter = 0;
}

function setSpeed(newVal)
{
	g_updateSpeed = newVal;
	document.getElementById('mySpeed').innerHTML = newVal + 'ms';
}

function enableToL()
{
	document.getElementById('txtBVal').disabled = false;
	document.getElementById('txtSVal').disabled = false;
}

function disableToL()
{
	document.getElementById('txtBVal').disabled = true;
	document.getElementById('txtSVal').disabled = true;
}

function setStep(step)
{
	document.getElementById('myStep').innerHTML = step;
}

function setPopulation(pop)
{
	document.getElementById('myPop').innerHTML = pop;
}

function setEyePos(eyeX, eyeY, eyeZ)
{
	document.getElementById('myCamX').innerHTML = (eyeX.toFixed(1)).toString();
	document.getElementById('myCamY').innerHTML = (eyeY.toFixed(1)).toString();
	document.getElementById('myCamZ').innerHTML = (eyeZ.toFixed(1)).toString();
}

function setRefPos(refX, refY, refZ)
{
	document.getElementById('myLookX').innerHTML = (refX.toFixed(1)).toString();
	document.getElementById('myLookY').innerHTML = (refY.toFixed(1)).toString();
	document.getElementById('myLookZ').innerHTML = (refZ.toFixed(1)).toString();
}
