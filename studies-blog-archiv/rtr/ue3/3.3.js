// Required TDL modules.
tdl.require('tdl.programs');
tdl.require('tdl.models');
tdl.require('tdl.primitives');

// Loads all shader programs from the DOM and return them in an array.
function createProgramsFromTags() {
  var vs = $('script[id^="vs"]');
  var fs = $('script[id^="fs"]');
  var programs = [];
  for (var i = 0; i != vs.length; i++)
      programs[i] = tdl.programs.loadProgram(vs[i].text, fs[i].text)
  return programs;
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
    $('#error').text(e.message || e);
    $('#error').css('display', 'block');
  }
}

// Recalculate per face normals for a triangle mesh.
function perFaceNormals(arrays) {
  var n = arrays.indices.numElements;
  var idx = arrays.indices;
  var pos = arrays.position;
  var nrm = arrays.normal;
  for (var ti = 0; ti != n; ti++) {
    var i = idx.getElement(ti);
    var normal = nrm.getElement(i[0]);
    nrm.setElement(i[1], normal);
    nrm.setElement(i[2], normal);
  }
  return arrays;
};

// The main entry point.
function initialize() {
  // Setup the canvas widget for WebGL. 
  window.canvas = document.getElementById("canvas");
  window.gl = tdl.webgl.setupWebGL(canvas);

  // Create the shader programs.
  var programs = createProgramsFromTags(); 

  var frag =  window.location.hash.substring(1);
  var pnum = frag ? parseInt(frag) : 0;

  // Create a sphere mesh that initialy is renderd using the first shader
  // program.
  var sphere = new tdl.models.Model(
    programs[pnum], 
    //tdl.primitives.createSphere(0.4, 10, 12),    
    //tdl.primitives.createTorus(0.25, 0.2, 20, 20)
    tdl.primitives.createCube(0.5));

  // Register a keypress-handler for shader program switching using the number
  // keys.
  window.onkeypress = function(event) {
    var n = String.fromCharCode(event.which);
    if (n == "s")
      animate = !animate;
    else
      sphere.setProgram(programs[n % programs.length]);
  };

  // Create some matrices and vectors now to save time later.
  var projection = mat4.create();
  var view = mat4.create();
  var model = mat4.create();

  // Uniforms for lighting.
  var lightPosition = vec3.create([10, 10, 10]);
  var lightIntensity = vec3.create([1.0, 1.0, 1.0]); 
  var color = vec3.create();
  
  var eyePosition = vec3.create();
  var target = vec3.create();
  var up = vec3.create([0, 1, 0]);

  // Animation parameters for the rotating eye-point.
  var eyeSpeed = 0.2;
  var eyeHeight = 2;
  var eyeRadius = 3.5;
  var animate = true;

  // Animation needs accurate timing information.
  var elapsedTime = 0.0;
  var then = 0.0;
  var clock = 0.0;

  // Uniform variables that are the same for all sphere in one frame.
  var sphereConst = {
    view: view,
    projection: projection,
    eyePosition: eyePosition,      
    lightPosition: lightPosition,    
    lightIntensity: lightIntensity, 
    color: vec3.create([1,0,0]),
    background: vec3.create([0,0,1]),
    radius: 0.3,
    density: 5,
    time: clock
  };
 
  // Uniform variables that change for each sphere in a frame.
  var spherePer = {
    model: model    
  };
  
  var yRot = 0;

  // Renders one frame and registers itself for the next frame.
  function render() {
    
    // add controls
    $('input#radius').change(function() {
        sphereConst.radius = $(this).val();
    });

    $('input#density').change(function() {
        sphereConst.density = $(this).val();
    });


    $('input#color').change(function() {
        sphereConst.color = vec3fromString($(this).val());
    });

    $('input#bgcolor').change(function() {
        sphereConst.background = vec3fromString($(this).val());
    });
      
      
    tdl.webgl.requestAnimationFrame(render, canvas); 

    // Do the time keeping.
    var now = (new Date()).getTime() * 0.001;
    elapsedTime = (then == 0.0 ? 0.0 : now - then);
    then = now;
    if (animate) {
      clock += elapsedTime;
      yRot += (20 * elapsedTime);
    }

    // Calculate the current eye position.
    eyePosition[0] = Math.sin(clock * eyeSpeed) * eyeRadius;
    //eyePosition[0] = 5;
    eyePosition[1] = eyeHeight;
    eyePosition[2] = Math.cos(clock * eyeSpeed) * eyeRadius;
    //eyePosition[2] = 3;
  
    // Setup global WebGL rendering behavior.
    gl.viewport(0, 0, canvas.width, canvas.width * 0.6); 
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    // 0.5, 0.5, 0.5, 1
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Calculate the perspective projection matrix.
    mat4.perspective(
      60, 
      canvas.clientWidth / canvas.clientHeight, 
      0.1, 10,
      projection);

    // Calculate the viewing transfomation.
    mat4.lookAt(
      eyePosition, target, up, 
      view);

    // Prepare rendering of spheres.
    sphereConst.time = clock;
    sphere.drawPrep(sphereConst);
    
    //animateFct();

    var across = 3;
    var half = (across - 1) * 0.5;
    for (var xx = 0; xx < across; ++xx) {
      for (var yy = 0; yy < across; ++yy) {
        for (var zz = 0; zz < across; ++zz) {
          mat4.translate(mat4.identity(spherePer.model), [xx - half, yy - half, zz - half]);          
          //mat4.rotate(spherePer.model, degToRad(yRot), [ 0, 0, 1 ])        

          // Actually render one sphere.
          sphere.draw(spherePer);
        }
      }
    }
  }

  // Initial call to get the rendering started.
  render();
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}  

function vec3fromString(str) {
    if(!str.match(/-?[0-9]+((\.)[0-9]+)?\s?;\s?-?[0-9]+((\.)[0-9]+)?\s?;\s?-?[0-9]+((\.)[0-9]+)?\s?/)) {
        throw "Ungültige Eingabe für Vektor";
    }
    var arr = str.split(';');
    var x = arr[0].trim();
    var y = arr[1].trim();
    var z = arr[2].trim();
    return vec3.create([x, y, z]);
}

