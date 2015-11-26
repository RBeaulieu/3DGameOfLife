// LookAtTrianglesWithKeys.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');
  var coords = document.getElementById('coords');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);
  // Enable alpha blending
  gl.enable (gl.BLEND);
  // Set blending function
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


  // Get the storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ModelMatrix) { 
    console.log('Failed to get the storage locations of u_ModelMatrix');
    return;
  }

  var modelMatrix = new Matrix4();
  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, n, u_ModelMatrix, modelMatrix, coords); };

  draw(gl, n, u_ModelMatrix, modelMatrix, coords);   // Draw
}

function initVertexBuffers(gl) {
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
    0.0,  0.5,  -0.5,  0.4,  1.0,  0.4, 0.8, // The back green one
   -0.5, -0.5,  -0.5,  0.4,  1.0,  0.4, 0.8,
    0, -0.5,  -0.5,  0.4,  1.0,  0.4, 0.8,
    
    0.5,  0.4,  0,  1.0,  1.0,  0.4, 0.6,// The middle yellow one
   -0.5,  0.4,  0,  1.0,  1.0,  0.4, 0.6,
    0.0, -0.6,  0,  1.0,  1.0,  0.4, 0.6,

    0.0,  0.5,   0.5,  0.4,  0.4,  1.0, 0.4, // The front blue one 
    0, -0.5,   0.5,  0.4,  0.4,  1.0, 0.4,
    0.5, -0.5,   0.5,  0.4,  0.4,  1, 0.4,
  ]);
  var n = 9;

  // Create a buffer object
  var vertexColorbuffer = gl.createBuffer();  
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write the vertex information and enable it
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 7, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Assign the buffer object to a_Color variable
  gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  return n;
}

var g_centreX = 0, g_centreY = 0, g_centreZ = 0; // Centre position
function keydown(ev, gl, n, u_ModelMatrix, modelMatrix, coords) {
    if(ev.keyCode == 40) { // The down arrow key was pressed
      g_centreZ -= 0.01;
    } else
    if(ev.keyCode == 39) { // The right arrow key was pressed
      g_centreX += 0.01;
    } else
    if(ev.keyCode == 38) { // The up arrow key was pressed
      g_centreZ += 0.01;
    } else
      
    if (ev.keyCode == 37) { // The left arrow key was pressed
      g_centreX -= 0.01;
    } else
    if(ev.keyCode == 34) { // The page down key was pressed
      g_centreY -= 0.01;
    } else    
    if(ev.keyCode == 33) { // The page up key was pressed
      g_centreY += 0.01;
    } else  { return; }
  draw(gl, n, u_ModelMatrix, modelMatrix, coords);    
}

function draw(gl, n, u_ModelMatrix, modelMatrix, coords) {
  // Set the matrix to be used for to set the camera view
  
  modelMatrix.setTranslate(g_centreX, g_centreY, g_centreZ);

  // Pass the view projection matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT);     // Clear <canvas>

  gl.drawArrays(gl.TRIANGLES, 0, n); // Draw the rectangle

  // Display the current near and far values
  coords.innerHTML = 'x=' + Math.round(g_centreX * 100)/100
    +' y=' + Math.round(g_centreY * 100)/100  
    +' z=' + Math.round(g_centreZ * 100)/100;

}
