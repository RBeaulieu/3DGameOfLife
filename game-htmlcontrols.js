function gameStart()
{
	disableToL();
}

function gameStop()
{
	enableToL();
}

function gameClear()
{
	gameStop();
}

function updateSpeed(newVal)
{
	document.getElementById("mySpeedLbl").innerHTML = newVal;
}

function enableToL()
{
	document.getElementById("txtBVal").disabled = false;
	document.getElementById("txtSVal").disabled = false;
}

function disableToL()
{
	document.getElementById("txtBVal").disabled = true;
	document.getElementById("txtSVal").disabled = true;
}

function setStep(step)
{
	
}

function setPopulation(pop)
{
	
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
