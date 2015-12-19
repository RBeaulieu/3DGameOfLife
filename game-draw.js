// REORGANIZATION
var g_cubeProgram;
var g_outlineProgram;

// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;
// Instance of canvas
var g_canvas;
// Instance of HUD
var g_hud;
// Instance of WebGL context
var g_webGL;
// Instance of 2DCG
var g_2DCG;

// Draw locations
var g_currStep = [];
// Current step
var g_stepCounter;
// Population of current step
var g_population;
// Update step speed
var g_updateSpeed;
// Last update time
var g_lastUpdate;
// Game stopped boolean
var g_isStopped;

// Cube buffer that stores the vertices for the cube
var g_cubeBuffers = {};
//
var g_outlineBuffers = {};
// Model transformation matrix
var g_modelMatrix = new Matrix4();
// Model-View transformation matrix
var g_vpMatrix = new Matrix4();
// Model-View-Project transformation matrix
var g_mvpMatrix = new Matrix4();
// Normal matrix
var g_normalMatrix = new Matrix4();
// Size of outline
var g_outlineSize;
// Origin of outline
var g_outlineOrigin;

// Control set
var g_controlSet = [];
// Movement speed
var g_moveSpeed = 0.5;
// Look speed
var g_lookSpeed = 1.5;
// Eye coordinates
var g_eyeX = 30.0, g_eyeY = 31.5, g_eyeZ = 60.0;
// Reference coordinates
var g_centerX = 0.0, g_centerY = 0.0, g_centerZ = 0.0;
// angle of the xz plane
var g_yaw = 90;
// angle of the yz plane
var g_pitch = -90;
// for multiplication, turning degrees into radians
var g_pi180 = Math.PI/180;
// Delta's for Look-At Calculation (spacebar controls)
var g_dX;
var g_dY;
var g_dZ;

var g_bornTexture;
var g_surviveTexture;

function testCubes()
{
	for(var z = 0; z < size; z++)
	{
		g_currStep[z] = [];
		
		for(var y = 0; y < size; y++)
		{
			g_currStep[z][y] = [];
			
			for(var x = 0; x < size; x ++)
			{
				//if() { g_currStep[z][y][x] = 1; }
				//else if() { g_currStep[z][y][x] = 0; }
				g_currStep[z][y][x] = 1;
			}
		}
	}
}

function drawInit()
{
	// Set up test cube array (comment out if using game)
	testCubes();
	//g_currStep = lifeBuffer[0].arr;
	g_isStopped = true;
	g_lastUpdate = 0;
	g_stepCounter = 0;
	
	// Set sizes of outline representing game area
	g_outlineSize = size * 3.0 / 2.0; 
	g_outlineOrigin = g_outlineSize - 1.5;
	
	// Retrieve <canvas> elements
	g_canvas = document.getElementById('myWebGLCanvas');
	g_hud = document.getElementById('myHUDCanvas');
	
	// Get the rendering context for WebGL
	//g_webGL = getWebGLContext(g_canvas);
	// Use this version for better performance (no debug errors)
	g_webGL = getWebGLContext(g_canvas, false);
	if (!g_webGL) {
		console.log('*** Error: Failed to get the rendering context for WebGL');
		return;
	}
	
	// Get the rendering context for 2DCG
	g_2DCG = g_hud.getContext('2d');
	
	// Retrieve outline vertex shader and fragment shader from HTML page and initialize them
	getShader('outlineshader-vs');
	getShader('outlineshader-fs');
	g_outlineProgram = createProgram(g_webGL, VSHADER_SOURCE, FSHADER_SOURCE);
	if (!g_outlineProgram) {
		console.log('*** Error: Failed to intialize outline shaders.');
		return;
	}
	
	// Initialize cube shaders' attribute and uniform variables
	if(initOutlineAttribsAndUniforms() < 0) { return; }
	
	// Set vertex information
	g_outlineBuffers = initOutlineVertexBuffers();
	if (g_outlineBuffers === null) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	// Retrieve cube vertex shader and fragment shader from HTML page and initialize them
	getShader('cubeshader-vs');
	getShader('cubeshader-fs');
	g_cubeProgram = createProgram(g_webGL, VSHADER_SOURCE, FSHADER_SOURCE);
	if (!g_cubeProgram) {
		console.log('*** Error: Failed to intialize cube shaders.');
		return;
	}
	
	g_webGL.useProgram(g_cubeProgram);
	
	// Initialize cube shaders' attribute and uniform variables
	if(initCubeAttribsAndUniforms() < 0) { return; }
	
	// Set vertex information
	g_cubeBuffers = initCubeVertexBuffers();
	if (g_cubeBuffers === null) {
		console.log('*** Error: Failed to set the vertex information');
		return;
	}
	
	g_bornTexture = initTextures('textures/bCube.png');
	if (!g_bornTexture) {
		console.log('Failed to intialize the texture.');
		return;
	}
	
	g_surviveTexture = initTextures('textures/sCube.png');
	if (!g_surviveTexture) {
		console.log('Failed to intialize the texture.');
		return;
	}
	
	
	
	// Set point light color
	g_webGL.uniform3f(g_cubeProgram.u_LightColor, 1.0, 1.0, 1.0);
	// Set amount and color of ambient light
	g_webGL.uniform3f(g_cubeProgram.u_AmbientLight, 0.3, 0.3, 0.3);
	
	// Specify the color for clearing <canvas>
	g_webGL.clearColor(23.0/255.0, 27.0/255.0, 31.0/255.0, 1.0);
	// Enable depth testing
	g_webGL.enable(g_webGL.DEPTH_TEST);
	// Turn on face culling
	g_webGL.enable(g_webGL.CULL_FACE);
	// Set to cull back faces
	g_webGL.cullFace(g_webGL.BACK);
	
	// Register the event handlers to be called on key press and key release
	document.onkeydown = function(ev){ keyDown(ev); };
	document.onkeyup = function(ev){ keyUp(ev); };
}

function keyDown(ev){ g_controlSet[ev.keyCode] = 1; }

function keyUp(ev){ g_controlSet[ev.keyCode] = 0; }

function getShader(scriptId)
{
	// Retrieve shader by HTML ID
	var shaderScript = document.getElementById(scriptId);
	if (!shaderScript) { console.log('*** Error: unknown script element ' + scriptId); }
	
	// Set shader to appropriate source container
	if (shaderScript.type == 'x-shader/x-vertex') { VSHADER_SOURCE = shaderScript.text; }
	else if (shaderScript.type == 'x-shader/x-fragment') { FSHADER_SOURCE = shaderScript.text; } 
	else { console.log('*** Error: shader type not set'); }
}

function initCubeAttribsAndUniforms()
{
	// Get the storage locations of attribute and uniform variables for the cube shader
	g_cubeProgram.a_Position = g_webGL.getAttribLocation(g_cubeProgram, 'a_Position');
	if(g_cubeProgram.a_Position < 0)
	{
		console.log('*** Error: Failed to get the storage location of a_Position attribute variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.a_Normal = g_webGL.getAttribLocation(g_cubeProgram, 'a_Normal');
	if(g_cubeProgram.a_Normal < 0)
	{
		console.log('*** Error: Failed to get the storage location of a_Position attribute variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.a_TexCoord = g_webGL.getAttribLocation(g_cubeProgram, 'a_TexCoord');
	if(g_cubeProgram.a_TexCoord < 0)
	{
		console.log('*** Error: Failed to get the storage location of a_TexCoord attribute variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_Sampler = g_webGL.getUniformLocation(g_cubeProgram, 'u_Sampler');
	if(!g_cubeProgram.u_Sampler)
	{
		console.log('*** Error: Failed to get the storage location of u_Sampler uniform variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_MMatrix = g_webGL.getUniformLocation(g_cubeProgram, 'u_MMatrix');
	if(!g_cubeProgram.u_MMatrix)
	{
		console.log('*** Error: Failed to get the storage location of u_MMatrix uniform variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_MVPMatrix = g_webGL.getUniformLocation(g_cubeProgram, 'u_MVPMatrix');
	if(!g_cubeProgram.u_MVPMatrix)
	{
		console.log('*** Error: Failed to get the storage location of u_MVPMatrix uniform variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_NormalMatrix = g_webGL.getUniformLocation(g_cubeProgram, 'u_NormalMatrix');
	if(!g_cubeProgram.u_NormalMatrix)
	{
		console.log('*** Error: Failed to get the storage location of u_NormalMatrix uniform variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_LightColor = g_webGL.getUniformLocation(g_cubeProgram, 'u_LightColor');
	if(!g_cubeProgram.u_LightColor)
	{
		console.log('*** Error: Failed to get the storage location of u_LightColor uniform variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_LightPosition = g_webGL.getUniformLocation(g_cubeProgram, 'u_LightPosition');
	if(!g_cubeProgram.u_LightPosition)
	{
		console.log('*** Error: Failed to get the storage location of u_LightPosition uniform variable for cube shader');
		return -1;
	}
	
	g_cubeProgram.u_AmbientLight = g_webGL.getUniformLocation(g_cubeProgram, 'u_AmbientLight');
	if(!g_cubeProgram.u_AmbientLight)
	{
		console.log('*** Error: Failed to get the storage location of u_AmbientLight uniform variable for cube shader');
		return -1;
	}
	
	return 1;
}

function initOutlineAttribsAndUniforms()
{
	g_outlineProgram.a_Position = g_webGL.getAttribLocation(g_outlineProgram, 'a_Position');
	if(g_outlineProgram.a_Position < 0)
	{
		console.log('*** Error: Failed to get the storage location of a_Position attribute variable for outline shader');
		return -1;
	}
	g_outlineProgram.a_Color = g_webGL.getAttribLocation(g_outlineProgram, 'a_Color');
	if(g_outlineProgram.a_Color < 0)
	{
		console.log('*** Error: Failed to get the storage location of a_Color attribute variable for outline shader');
		return -1;
	}
	g_outlineProgram.u_MVPMatrix = g_webGL.getUniformLocation(g_outlineProgram, 'u_MVPMatrix');
	if(!g_outlineProgram.u_MVPMatrix)
	{
		console.log('*** Error: Failed to get the storage location of u_MVPMatrix uniform variable for outline shader');
		return -1;
	}
	
	return 1;
}

function initTextures(location)
{
	var texture = g_webGL.createTexture();   // Create a texture object
	if (!texture) {
		console.log('Failed to create the texture object');
		return null;
	}
	
	var image = new Image();  // Create a image object
	if (!image) {
		console.log('Failed to create the image object');
		return null;
	}
	// Register the event handler to be called when image loading is completed
	image.onload = function() {
		// Write the image data to texture object
		g_webGL.pixelStorei(g_webGL.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
		g_webGL.activeTexture(g_webGL.TEXTURE0);
		g_webGL.bindTexture(g_webGL.TEXTURE_2D, texture);
		g_webGL.texParameteri(g_webGL.TEXTURE_2D, g_webGL.TEXTURE_MIN_FILTER, g_webGL.LINEAR);
		g_webGL.texImage2D(g_webGL.TEXTURE_2D, 0, g_webGL.RGBA, g_webGL.RGBA, g_webGL.UNSIGNED_BYTE, image);
	
		g_webGL.bindTexture(g_webGL.TEXTURE_2D, null); // Unbind texture
	};
	
	// Tell the browser to load an Image
	image.src = location;
	
	return texture;
}

function initCubeVertexBuffers()
{
	// Create a cube
	//    v6----- v5
	//   /|      /|
	//  v1------v0|
	//  | |     | |
	//  | |v7---|-|v4
	//  |/      |/
	//  v2------v3
	
	var cubeVertices = new Float32Array([   // Vertex coordinates
		1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
		1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
		-1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
		-1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
		1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
	]);
	
	var cubeNormals = new Float32Array([    // Normal
		0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
		1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
		0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
		-1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
		0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
		0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
	]);
	
	var cubeTexCoords = new Float32Array([   // Texture coordinates
		1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
		0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
		1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
		1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
		0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
		0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
	]);
	
	var cubeIndices = new Uint8Array([       // Indices of the vertices
		0, 1, 2,   0, 2, 3,    // front
		4, 5, 6,   4, 6, 7,    // right
		8, 9,10,   8,10,11,    // up
		12,13,14,  12,14,15,    // left
		16,17,18,  16,18,19,    // down
		20,21,22,  20,22,23     // back
	]);
	
	var bufferCollection = new Object();
	
	// Write coords to buffers, but don't assign to attribute variables
	bufferCollection.vertexBuffer = initArrayBufferForLaterUse(cubeVertices, 3, g_webGL.FLOAT);
	bufferCollection.normalBuffer = initArrayBufferForLaterUse(cubeNormals, 3, g_webGL.FLOAT);
	bufferCollection.texCoordBuffer = initArrayBufferForLaterUse(cubeTexCoords, 2, g_webGL.FLOAT);
	bufferCollection.indexBuffer = initElementArrayBufferForLaterUse(cubeIndices, g_webGL.UNSIGNED_BYTE);
	bufferCollection.numIndices = cubeIndices.length;
	if (!bufferCollection.vertexBuffer || !bufferCollection.normalBuffer || !bufferCollection.texCoordBuffer || !bufferCollection.indexBuffer) { return null; }
	
	return bufferCollection;
}

function initOutlineVertexBuffers()
{
	var outlineVertices = new Float32Array([   // Vertex coordinates
		1.0, 1.0, 1.0,
		1.0, 1.0,-1.0,
		1.0,-1.0, 1.0,
		1.0,-1.0,-1.0,
		-1.0, 1.0, 1.0,
		-1.0, 1.0,-1.0,
		-1.0,-1.0, 1.0,
		-1.0,-1.0,-1.0,
	]);
	
	var outlineColors = new Float32Array([   // Colors
		0.07, 0.67, 1.0,   0.07, 0.67, 1.0,   0.07, 0.67, 1.0,  0.07, 0.67, 1.0,
		0.07, 0.67, 1.0,   0.07, 0.67, 1.0,   0.07, 0.67, 1.0,  0.07, 0.67, 1.0
	]);
	
	var outlineIndices = new Uint8Array([       // Indices of the vertices
		0, 1,
		0, 2,
		0, 4,
		7, 6,
		7, 5,
		7, 3,
		2, 6,
		4, 5,
		1, 3,
		1, 5,
		3, 2,
		6, 4
	]);
	
	var bufferCollection = new Object();
	
	// Write coords to buffers, but don't assign to attribute variables
	bufferCollection.vertexBuffer = initArrayBufferForLaterUse(outlineVertices, 3, g_webGL.FLOAT);
	bufferCollection.colorBuffer = initArrayBufferForLaterUse(outlineColors, 3, g_webGL.FLOAT);
	bufferCollection.indexBuffer = initElementArrayBufferForLaterUse(outlineIndices, g_webGL.UNSIGNED_BYTE);
	bufferCollection.numIndices = outlineIndices.length;
	if (!bufferCollection.vertexBuffer || !bufferCollection.colorBuffer || !bufferCollection.indexBuffer) { return null; }
	
	return bufferCollection;
}

function initArrayBufferForLaterUse(data, num, type){
	var buffer = g_webGL.createBuffer();   // Create a buffer object
	if (!buffer) {
	console.log('Failed to create the buffer object');
	return null;
	}
	// Write date into the buffer object
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, buffer);
	g_webGL.bufferData(g_webGL.ARRAY_BUFFER, data, g_webGL.STATIC_DRAW);
	
	// Store the necessary information to assign the object to the attribute variable later
	buffer.num = num;
	buffer.type = type;
	
	return buffer;
}

function initElementArrayBufferForLaterUse(data, type) {
	var buffer = g_webGL.createBuffer();　  // Create a buffer object
	if (!buffer) {
		console.log('Failed to create the buffer object');
		return null;
	}
	// Write date into the buffer object
	g_webGL.bindBuffer(g_webGL.ELEMENT_ARRAY_BUFFER, buffer);
	g_webGL.bufferData(g_webGL.ELEMENT_ARRAY_BUFFER, data, g_webGL.STATIC_DRAW);

	buffer.type = type;

	return buffer;
}

function moveCamera(){

	// The A Key: Strafe Left (Perpendicular of up vector)
	if(g_controlSet[65]){
		g_eyeX -= Math.sin(g_yaw*g_pi180) * g_moveSpeed;
		g_eyeZ += Math.cos(g_yaw*g_pi180) * g_moveSpeed;
	}
	// The D: Strafe Right (Perpendicular of up vector)
	if(g_controlSet[68]){
		g_eyeX += Math.sin(g_yaw*g_pi180) * g_moveSpeed;
		g_eyeZ -= Math.cos(g_yaw*g_pi180) * g_moveSpeed;
	}
	// The E: Descend (Down the Y Axis)
	if(g_controlSet[69]){
		g_eyeY -= g_moveSpeed;
	}
	// The Q: Ascend (Up the Y Axis)
	if(g_controlSet[81]){
		g_eyeY += g_moveSpeed;
	}
	// The W: Move Towards Look-At
	if(g_controlSet[87]){
		g_eyeX += g_moveSpeed * Math.cos(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
		g_eyeY += g_moveSpeed * Math.cos(g_pitch*g_pi180);
		g_eyeZ += g_moveSpeed * Math.sin(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
	}
	// The S: Move Away From Look-At
	if(g_controlSet[83]){
		g_eyeX -= g_moveSpeed * Math.cos(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
		g_eyeY -= g_moveSpeed * Math.cos(g_pitch*g_pi180);
		g_eyeZ -= g_moveSpeed * Math.sin(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180);
	}

	// The Space Bar: Lock on to Center of Cube Array
	if(g_controlSet[32]){
		//Delta's of eye(x,y,z) and origin(x,y,z)
		g_dX = g_eyeX-g_outlineOrigin;
		g_dY = g_eyeY-g_outlineOrigin;
		g_dZ = g_eyeZ-g_outlineOrigin;
		//Verticle angle, rotate around XZ plane
		g_pitch = -Math.atan2(g_dY, Math.sqrt(g_dZ*g_dZ + g_dX*g_dX))/g_pi180 - 90.0;
		//Horizontal angle, rotate around Y axis
		g_yaw = Math.atan2(g_dZ, g_dX)/g_pi180;
	}
	else{
		// The Left Arrow: Look Left
		if(g_controlSet[37]){
			g_yaw -= g_lookSpeed;
		}	
		// The Right Arrow: Look Right
		if(g_controlSet[39]){
			g_yaw += g_lookSpeed;
		}	
		// The Up Arrow: Look Up
		if(g_controlSet[38]){
			if(g_pitch + g_lookSpeed <= -10){
				g_pitch += g_lookSpeed;
			}
		}	
		// The Down Arrow: Look Down
		if(g_controlSet[40]){
			if(g_pitch - g_lookSpeed >= -176){
				g_pitch -= g_lookSpeed;
			}
		}	
	}

	//Set the Look-At Point
	//Based on pitch and yaw
	//Radius of 1 from the Eye-Point
	g_centerX = g_eyeX + (Math.cos(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180));
	g_centerY = g_eyeY + (Math.cos(g_pitch*g_pi180));
	g_centerZ = g_eyeZ + (Math.sin(g_yaw*g_pi180) * Math.sin(g_pitch*g_pi180));
	
}

function draw(highResTimestamp) {
	g_webGL.useProgram(g_cubeProgram);
	initAttributeVariable(g_cubeProgram.a_Position, g_cubeBuffers.vertexBuffer);  // Vertex coordinates
	initAttributeVariable(g_cubeProgram.a_Normal, g_cubeBuffers.normalBuffer);    // Normal
	initAttributeVariable(g_cubeProgram.a_TexCoord, g_cubeBuffers.texCoordBuffer);// Texture coordinates
	g_webGL.bindBuffer(g_webGL.ELEMENT_ARRAY_BUFFER, g_cubeBuffers.indexBuffer); // Bind indices
	
	requestAnimationFrame(draw);
	
	moveCamera();
	
	// Clear color and depth buffer
	g_webGL.clear(g_webGL.COLOR_BUFFER_BIT | g_webGL.DEPTH_BUFFER_BIT);
	
	g_webGL.activeTexture(g_webGL.TEXTURE1);
	g_webGL.bindTexture(g_webGL.TEXTURE_2D, g_bornTexture);
	
	g_webGL.activeTexture(g_webGL.TEXTURE2);
	g_webGL.bindTexture(g_webGL.TEXTURE_2D, g_surviveTexture);
	
	g_webGL.uniform3f(g_cubeProgram.u_LightPosition, g_eyeX, g_eyeY, g_eyeZ)

	g_vpMatrix.setPerspective(70.0, g_canvas.width / g_canvas.height, 1.0, 200.0);
	g_vpMatrix.lookAt(g_eyeX, g_eyeY, g_eyeZ, g_centerX, g_centerY, g_centerZ, 0.0, 1.0, 0.0);
	
	g_population = 0;
	//Read the 3D Array
	for(var z = 0; z < size; z++)
	{
		for(var y = 0; y < size; y++)
		{
			for(var x = 0; x < size; x ++)
			{
				if(g_currStep[z][y][x] != 0)
				{
					drawCube(g_cubeProgram, g_cubeBuffers, x, y, z, g_currStep[z][y][x]);
					g_population++;
				}
			}
		}
	}
	
	g_webGL.useProgram(g_outlineProgram);
	initAttributeVariable(g_outlineProgram.a_Position, g_outlineBuffers.vertexBuffer);  // Vertex coordinates
	initAttributeVariable(g_outlineProgram.a_Color, g_outlineBuffers.colorBuffer);    // Color
	g_webGL.bindBuffer(g_webGL.ELEMENT_ARRAY_BUFFER, g_outlineBuffers.indexBuffer); // Bind indices
	
	drawLargeCubeOutline(g_outlineProgram, g_outlineBuffers);
	
	drawHUD();

	if(!g_isStopped && highResTimestamp - g_lastUpdate > g_updateSpeed) {
		g_currStep = getGameStep();
		g_lastUpdate = highResTimestamp;
		g_stepCounter++;
	}
}

function initAttributeVariable(a_attribute, buffer) {
	g_webGL.bindBuffer(g_webGL.ARRAY_BUFFER, buffer);
	g_webGL.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
	g_webGL.enableVertexAttribArray(a_attribute);
}

function drawCube(program, buffers, x, y, z, val)
{
	g_webGL.uniform1i(program.u_Sampler, val);
	
	g_modelMatrix.setTranslate(x * 3, y * 3, z * 3);
	g_webGL.uniformMatrix4fv(program.u_MMatrix, false, g_modelMatrix.elements);
	
	// Calculate the model view project matrix and pass it to u_MVPMatrix
	g_mvpMatrix.set(g_vpMatrix);
	g_mvpMatrix.multiply(g_modelMatrix);
	g_webGL.uniformMatrix4fv(program.u_MVPMatrix, false, g_mvpMatrix.elements);
	// Calculate matrix for normal and pass it to u_NormalMatrix
	g_normalMatrix.setInverseOf(g_modelMatrix);
	g_normalMatrix.transpose();
	g_webGL.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);
	
	// Draw
	g_webGL.drawElements(g_webGL.TRIANGLES, buffers.numIndices, g_webGL.UNSIGNED_BYTE, 0);
}

function drawLargeCubeOutline(program, buffers)
{
	g_modelMatrix.setTranslate(g_outlineOrigin, g_outlineOrigin, g_outlineOrigin);
	g_modelMatrix.scale(g_outlineSize, g_outlineSize, g_outlineSize)
	
	// Calculate the model view project matrix and pass it to u_MVPMatrix
	g_mvpMatrix.set(g_vpMatrix);
	g_mvpMatrix.multiply(g_modelMatrix);
	g_webGL.uniformMatrix4fv(program.u_MVPMatrix, false, g_mvpMatrix.elements);
	// Calculate matrix for normal and pass it to u_NormalMatrix
	g_normalMatrix.setInverseOf(g_modelMatrix);
	g_normalMatrix.transpose();
	g_webGL.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);
	
	// Draw
	g_webGL.drawElements(g_webGL.LINES, buffers.numIndices, g_webGL.UNSIGNED_BYTE, 0);
}

function drawHUD(pop)
{
	// Drawing HUD to screen
	g_2DCG.clearRect(0, 0, g_hud.width, g_hud.height);
	g_2DCG.font = '14px "Lucida Console"'
	g_2DCG.fillStyle = 'rgba(255, 255, 255, 1)';
	g_2DCG.fillText('Current Step: ' + g_stepCounter, 3, 15);
	g_2DCG.fillText('Population: ' + g_population, 3, 35);
	g_2DCG.fillText('Camera Coords: (' + g_eyeX.toFixed(1) + ', ' + g_eyeY.toFixed(1) + ', ' + g_eyeZ.toFixed(1) + ')', 3, 575);
	g_2DCG.fillText('Look At Coords: (' + g_centerX.toFixed(1) + ', ' + g_centerY.toFixed(1) + ', ' + g_centerZ.toFixed(1) + ')', 3, 595);
}