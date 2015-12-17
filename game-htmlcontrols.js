// GOTTA CLEAN THIS UP

function gameStart()
{
	disableControls();
	var bString = document.getElementById('txtBVal').value;
	var sString = document.getElementById('txtSVal').value;
	var bInput = bString.match(/(\d+)/g);
	var sInput = sString.match(/(\d+)/g);
	if(bInput !== null && sInput !== null)
	{
		gameStateInit(bInput, sInput);
		g_lastUpdate = performance.now();
		g_isStopped = false;
	}
	else if(bInput === null)
	{
		alert('Please enter comma seperated numbers for B');
		enableControls();
	}
	else if(sInput === null)
	{
		alert('Please enter comma seperated numbers for S');
		enableControls();
	}
}

function gameStop()
{
	g_isStopped = true;
	enableControls();
}

function gameReset()
{
	g_isStopped = true;
	enableControls();
	gameInit();
	g_lastUpdate = 0;
	g_stepCounter = 0;
}

function modifyLocation()
{
	var xString = document.getElementById('txtXVal').value;
	var yString = document.getElementById('txtYVal').value;
	var zString = document.getElementById('txtZVal').value;
	var xInput = xString.match(/(\d+)/g);
	var yInput = yString.match(/(\d+)/g);
	var zInput = zString.match(/(\d+)/g);
	if(xInput !== null && yInput !== null && zInput !== null)
	{
		if(xInput[0] > -1 && xInput[0] < size)
		{
			if(yInput[0] > -1 && yInput[0] < size)
			{
				if(zInput[0] > -1 && zInput[0] < size)
				{
					if(g_currStep[zInput[0]][yInput[0]][xInput[0]] == 1)
					{
						g_currStep[zInput[0]][yInput[0]][xInput[0]] = 0;
					}
					else
					{
						g_currStep[zInput[0]][yInput[0]][xInput[0]] = 1;
					}
				}
			}
		}
	}
	
	document.getElementById('txtXVal').value = '';
	document.getElementById('txtYVal').value = '';
	document.getElementById('txtZVal').value = '';
}

function setSpeed(newVal)
{
	g_updateSpeed = newVal;
	document.getElementById('lblSpeed').innerHTML = newVal + 'ms';
}

function enableControls()
{
	document.getElementById('btnStart').disabled = false;
	document.getElementById('btnStop').disabled = true;
	document.getElementById('btnModify').disabled = false;
	
	document.getElementById('txtBVal').disabled = false;
	document.getElementById('txtSVal').disabled = false;
	document.getElementById('txtXVal').disabled = false;
	document.getElementById('txtYVal').disabled = false;
	document.getElementById('txtZVal').disabled = false;
}

function disableControls()
{
	document.getElementById("btnStart").disabled = true;
	document.getElementById('btnStop').disabled = false;
	document.getElementById('btnModify').disabled = true;
	
	document.getElementById('txtBVal').disabled = true;
	document.getElementById('txtSVal').disabled = true;
	document.getElementById('txtXVal').disabled = true;
	document.getElementById('txtYVal').disabled = true;
	document.getElementById('txtZVal').disabled = true;
}