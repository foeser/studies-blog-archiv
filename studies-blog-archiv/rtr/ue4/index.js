// Required TDL modules.
tdl.require('tdl.programs');
tdl.require('tdl.models');
tdl.require('tdl.primitives');
tdl.require('tdl.textures');
tdl.require('tdl.framebuffers');

// Display error messages in the page.
function displayError(e) {
  $('#error').text(e);
  $('#error').css('display', 'block');
}

// Registers an onload handler.
window.onload = function() {
  $(window).resize(function() {
    var width = $('#canvas-container').innerWidth();
    $('#canvas')
      .attr('width', width)
      .attr('height', width * 0.6);
  });
  $(window).resize();
  try {
    initialize();
  } catch (e) {
    displayError(e.message || e);
  }
}

// Loads all shader programs from the DOM and return them in an array.
function createProgramsFromTags() {
  var vs = $('script[id^="vs"]');
  var fs = $('script[id^="fs"]');
  var programs = [];
  for (var i = 0; i != vs.length; i++)
      programs[i] = tdl.programs.loadProgram(vs[i].text, fs[i].text)
  return programs;
}

// The main entry point.
function initialize() {
  // Setup the canvas widget for WebGL. 
  var canvas = document.getElementById("canvas");
  var gl = tdl.webgl.setupWebGL(canvas);
  
   // Create the shader programs.
  var programs = createProgramsFromTags(); 

  // Create the default shader programs.
  //var defaultProgram = tdl.programs.loadProgramFromScriptTags(
  //  'defaultVS', 'defaultFS');

  var textures = {
      envMap : tdl.textures.loadTexture('maps/cga-labor-sphere-small.png'),
      envMap2 : tdl.textures.loadTexture('maps/escher.jpg')
  };

  //var envMap = tdl.textures.loadTexture('maps/escher.jpg');
  //var envMap2 = tdl.textures.loadTexture('maps/cga-labor-sphere.png');

  // Create some matrices and vectors now to save time later.
  var projection = mat4.create();
  var view = mat4.create();

  // Animation needs accurate timing information.
  var elapsedTime = 0.0;
  var then = 0.0;
  var clock = 0.0;

  // Uniform variables that are the same for all objects in one frame.
  var uniforms = {
    time: clock
  };

  var camera = Entity.createCamera(canvas, uniforms);
  var floor = Entity.createFloor(programs[0]);
  var donut = Entity.createDonut([0, 1 , 0], programs[0], textures);
  var ball = Entity.createBall([0, 1 , 0], programs[0], textures[0]);

  //Entity.loadProgramFromUrl('checkered.vs', 'checkered.fs', [ball]);
    
  var entities = [ camera, floor, ball ];
  
  // Register a keypress-handler for shader program switching using the number
  // keys.
  window.onkeypress = function(event) {
    var n = String.fromCharCode(event.which);
    if(n == "1")
      ball.model.setProgram(programs[0]);
    else if(n == "2")
      ball.model.setProgram(programs[1]);
    else if(n == "3")        
      ball.model.setProgram(programs[2]);
    else if(n == "5")
      // don't know why i can't set i.e. textures[0] here
      ball.model.setTexture(tdl.textures.loadTexture('maps/cga-labor-sphere-small.png'));
    else if(n == "6")
      ball.model.setTexture(tdl.textures.loadTexture('maps/escher.jpg'));
  };
    
  // Renders one frame and registers itself for the next frame.
  function render() {
    tdl.webgl.requestAnimationFrame(render, canvas);

    // Do the time keeping.
    var now = (new Date()).getTime() * 0.001;
    elapsedTime = (then == 0.0 ? 0.0 : now - then);
    then = now;
    clock += elapsedTime;

    uniforms.time = clock;

    // Simulate the entities.
    for (var e in entities)
      entities[e].simulate(elapsedTime)

    // Setup global WebGL rendering behavior.
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    for (var e in entities)
      entities[e].draw(uniforms);
  }

  // Initial call to get the rendering started.
  render();
}
