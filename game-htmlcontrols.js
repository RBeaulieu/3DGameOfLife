function setEyePos(eyeX, eyeY, eyeZ)
{
	var myCamX = document.getElementById('myCamX');
	var myCamY = document.getElementById('myCamY');
	var myCamZ = document.getElementById('myCamZ');
	
	myCamX.innerHTML = (eyeX.toFixed(1)).toString();
	myCamY.innerHTML = (eyeY.toFixed(1)).toString();
	myCamZ.innerHTML = (eyeZ.toFixed(1)).toString();
}

function setRefPos(refX, refY, refZ)
{
	var myLookX = document.getElementById('myLookX');
	var myLookY = document.getElementById('myLookY');
	var myLookZ = document.getElementById('myLookZ');
	
	myLookX.innerHTML = (refX.toFixed(1)).toString();
	myLookY.innerHTML = (refY.toFixed(1)).toString();
	myLookZ.innerHTML = (refZ.toFixed(1)).toString();
}