// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;
// Movement speed
var moveSpeed = 0.1;
// Eye coordinates
var eyeX = 3.0, eyeY = 3.0, eyeZ = 7.00;
// Reference coordinates
var centerX = 0.0, centerY = 0.0, centerZ = 0.0;
// Up coordinates
var upX = 0.0, upY = 1.0, upZ = 0.0;


function drawInit() {
	// Retrieve <canvas> element
	var canvas = document.getElementById('myWebGLCanvas');
	
	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log('*** Error: Failed to get the rendering context for WebGL');
		return;
	}
	
	// Retrieve vertex shader and fragment shader from HTML page
	getShader(gl, 'shader-vs');
	getShader(gl, 'shader-fs');
	
	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('*** Error: Failed to intialize shaders.');
		return;
	}
	
	// Set vertex information
	var n = initVertexBuffers(gl);
	if (n < 0) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	// Specify the color for clearing <canvas>
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	// Enable depth testing
	gl.enable(gl.DEPTH_TEST);
	
	/*// Get the storage location of u_MvpMatrix
	var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MVPMatrix');
	if (!u_MvpMatrix) {
		console.log('Failed to get the storage location of u_MVPMatrix');
		return;
	}*/
	
	start(gl, n);
}

function getShader(gl, scriptId)
{
	// Retrieve shader by HTML ID
	var shaderScript = document.getElementById(scriptId);
    if (!shaderScript) {
        console.log('*** Error: unknown script element ' + scriptId);
    }
	
	// Set shader to appropriate source container
	if (shaderScript.type == 'x-shader/x-vertex') { VSHADER_SOURCE = shaderScript.text; }
	else if (shaderScript.type == 'x-shader/x-fragment') { FSHADER_SOURCE = shaderScript.text; } 
	else { console.log('*** Error: shader type not set'); }
}

function start(gl, n) {
	// Get the storage location of u_MVPMatrix
	var u_MVPMatrix = gl.getUniformLocation(gl.program, 'u_MVPMatrix');
	if (!u_MVPMatrix) {
		console.log('Failed to get the storage location of u_MVPMatrix');
		return;
	}
	
	// Create the MVP Matrix
	var MVPMatrix = new Matrix4();
	
	// Register the event handler to be called on key press
	document.onkeydown = function(ev){ keyDown(ev, gl, n, u_MVPMatrix, MVPMatrix); };
	
	draw(gl, n, u_MVPMatrix, MVPMatrix);   // Draw
}
	
function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([     // Colors
    0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front(blue)
    0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
    0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
  ]);

  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) 
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function keyDown(ev, gl, n, u_ViewMatrix, viewMatrix) {
	if(ev.keyCode == 37) { centerX -= moveSpeed; } // The right arrow key was pressed
	else if(ev.keyCode == 38) { centerY += moveSpeed; } // The up arrow key was pressed
	else if(ev.keyCode == 39) { centerX += moveSpeed; } // The left arrow key was pressed
	else if(ev.keyCode == 40) { centerY -= moveSpeed; } // The down arrow key was pressed
	else if(ev.keyCode == 65) { eyeX -= moveSpeed; centerX -= moveSpeed; } // The A key was pressed
	else if(ev.keyCode == 68) { eyeX += moveSpeed; centerX += moveSpeed; } // The D key was pressed
	else if(ev.keyCode == 83) { // The S key was pressed
		eyeZ -= moveSpeed;
		centerZ -= moveSpeed;
	}
	else if(ev.keyCode == 87) { // The W key was pressed
		eyeZ += moveSpeed;
		centerZ += moveSpeed;
	}
    else { return; }
    
	draw(gl, n, u_ViewMatrix, viewMatrix); // <===== MUST BE MOVED
}

function draw(gl, n, u_MVPMatrix, MVPMatrix) {
	// Set the eye point and the viewing volume
	MVPMatrix.setPerspective(30, 1, 1, 100);
	MVPMatrix.lookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ);
	
	// Pass the view projection matrix
	gl.uniformMatrix4fv(u_MVPMatrix, false, MVPMatrix.elements);
	
	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	setEyePos(eyeX, eyeY, eyeZ);
	setRefPos(centerX, centerY, centerZ);
	
	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}
