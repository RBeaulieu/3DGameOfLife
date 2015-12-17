function gameStart()
{
	disableToL()
	g_isStopped = false;
	g_lastUpdate = performance.now();
}

function gameStop()
{
	enableToL()
	g_isStopped = true;
}

function gameReset()
{
	enableToL()
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