function setEyePos(eyeX, eyeY, eyeZ) {
	var myCamX = document.getElementById('myCamX');
	var myCamY = document.getElementById('myCamY');
	var myCamZ = document.getElementById('myCamZ');
	
	myCamX.innerHTML = eyeX;
	myCamY.innerHTML = eyeY;
	myCamZ.innerHTML = eyeZ;
}

function setRefPos(refX, refY, refZ) {
	var myLookX = document.getElementById('myLookX');
	var myLookY = document.getElementById('myLookY');
	var myLookZ = document.getElementById('myLookZ');
	
	myLookX.innerHTML = refX;
	myLookY.innerHTML = refY;
	myLookZ.innerHTML = refZ;
}