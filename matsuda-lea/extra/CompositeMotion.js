// RotatedTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +      
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '}\n';

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';


function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

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



 // Get the storage location of u_FragColor
  var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }


  // Create Matrix4 object for model transformation
  var modelMatrix = new Matrix4();
  modelMatrix.setIdentity();

  // set up to pass the model matrix to the vertex shader
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');  
  if(!u_ViewMatrix || !u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_viewMatrix or u_ModelMatrix');
    return;
  }

  // get the storage location of u_ProjMatrix
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) { 
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }

  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4(); 
  viewMatrix.setLookAt(1, 1, 5, 0, 0, -20, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 2, 10);

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  var A = [[0,0,0], [1,0,0], [0,0,1], [1,0,1]];
  var m = initVertexBuffers(gl,A);  
  if (m < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  gl.uniform4f(u_FragColor, 1, 0.8, 0.8, 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, m);

  // Write the positions of vertices to a vertex shader
  var P=[[ 0.5,0.5,0.5],
	 [ 1,0.75, 1],	 
         [ 1,1 , 0.75]];

  var n = initVertexBuffers(gl,P);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  
  // initial position
  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  modelMatrix.setTranslate(-P[0][0],-P[0][1],-P[0][2]); 
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, 0.0, 1.0, 0.0, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  // step 2 rotate about y axis
  modelMatrix.setRotate(-45,0,1,0);
  modelMatrix.translate(-P[0][0],-P[0][1],-P[0][2]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, 0, 0, 1, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  // step 3 rotate about x axis
  
  var radians = Math.asin(0.25*Math.sqrt(2));
  var degrees = 180 * radians / Math.PI;
  modelMatrix.setRotate(degrees,1,0,0);  
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.translate(-P[0][0],-P[0][1],-P[0][2]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, 1, 1, 0, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, n);

  // step 4 rotate about z axis
  var D3=0.75;
  var y3proj=0.5;
  var radians2 = Math.asin(y3proj/D3);
  var degrees2 = 180 * radians / Math.PI;
  modelMatrix.setRotate(degrees2,0,0,1);
  modelMatrix.rotate(degrees,1,0,0);
  modelMatrix.rotate(-45,0,1,0);
  modelMatrix.translate(-P[0][0],-P[0][1],-P[0][2]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4f(u_FragColor, 1, 0, 1, 1.0);
  gl.drawArrays(gl.TRIANGLES, 0, n);
  

}

function initVertexBuffers(gl,P) {
  var flatten=[];

  for (var i=0; i<P.length; i++){
    flatten=flatten.concat(P[i]);
  }
  
  var vertices = new Float32Array(
    flatten
  );
  var n = vertices.length/3; // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}

