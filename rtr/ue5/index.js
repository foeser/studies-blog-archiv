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
//function createProgramsFromTags() {
//    var vs = $('script[id^="vs"]');
//    var fs = $('script[id^="fs"]');
//    var programs = [];
//    for (var i = 0; i != vs.length; i++)
//        programs[i] = tdl.programs.loadProgram(vs[i].text, fs[i].text)
//    return programs;
//}

var blurRadius = 8.0;
var blurStrength = 0.3;
var blurScale = 4.0;
var blurMapRes = 1024; 
 
function setBlurRadius(pos, slider) {    
    blurRadius = pos;
}

function setBlurStrength(pos, slider) {    
    blurStrength = pos/10;
}

function setBlurScale(pos, slider) {    
    blurScale = pos;
}

// The main entry point.
function initialize() {
    // Setup the canvas widget for WebGL. 
    var canvas = document.getElementById("canvas");
    var gl = tdl.webgl.setupWebGL(canvas);
  
    // Create the shader programs.
    //var programs = createProgramsFromTags(); 

    // Create the shader programs.
    var defaultProgram = tdl.programs.loadProgramFromScriptTags(
        'vs0', 'fs0');    
    var blurProgramm = tdl.programs.loadProgramFromScriptTags(
        'vsScreenQuad', 'blur'); 
        
    var blendProgramm = tdl.programs.loadProgramFromScriptTags(
        'vsScreenQuad', 'blend');
  
    // FBO for rendering the scene to an RGB offscreen texture with default color shader
    var colorBuffer =
    tdl.framebuffers.createFramebuffer(canvas.width, canvas.height, true);
  
    // FBO for rendering the blurmap
    var blurmap =
    tdl.framebuffers.createFramebuffer(blurMapRes, blurMapRes, true);
  
    // FBO for rendering the horizontal blur (vertical blur will be copied back into blurmap FBO)
    var horizontalBlur =
    tdl.framebuffers.createFramebuffer(blurMapRes, blurMapRes, true);
  
    var backBuffer = new tdl.framebuffers.BackBuffer(canvas);
    $('window').resize(function () {
        colorBuffer = 
        tdl.framebuffers.createFramebuffer(canvas.width, canvas.height, true);
        quadTextures.frame = colorBuffer.texture;
    });
    $('window').resize();
  
    var quadTextures = {
        frame: colorBuffer.texture
    };  
    
    var color = vec3.create();

    // Animation needs accurate timing information.
    var elapsedTime = 0.0;
    var then = 0.0;
    var clock = 0.0;

    // Uniform variables that are the same for all objects in one frame.
    var uniforms = {        
        time: clock,
        color:color,
        rippled:false
    };

    var camera = Entity.createCamera(canvas, uniforms);   
    var ball = Entity.createBall([0, 1.6 , 1], defaultProgram); 
    var ball2 = Entity.createBall([1, 1.6 , 0], defaultProgram);  
    var ball3 = Entity.createBall([-1, 1.6 , 0], defaultProgram);  
    var box = Entity.createBox([-1, 0 , 0], defaultProgram);
    var box2 = Entity.createBox([0, -0.1 , 0], defaultProgram);
    var box3 = Entity.createBox([1, 0 , 0], defaultProgram);
    //mat4.rotate(donut.transform, degToRad(90), [ 1, 1, 1 ]);
    // mat4.scale(ball.transform, [1.2,1.2,1.2]);
    
    // a screen aligned quad
    var quad = Entity.createQuad(blurProgramm, quadTextures); 
    
    var entities = [ camera, ball, ball2, ball3, box, box2, box3 ];
    
    var bShowColorMap = false;
    var bShowVBlur = false;
    var bShowHBlur = false;
    var bShowFullBlur = false;
    var bShowBloom = true;
    var bAnimate = true;
  
    // Register a keypress-handler for shader program switching using the number
    // keys.
    window.onkeypress = function(event) {
        var n = String.fromCharCode(event.which);
        if(n == "1")
        {
            bShowColorMap = !bShowColorMap;
            bShowFullBlur = false;
            bShowHBlur = false;
            bShowVBlur = false;
            bShowBloom = false;
        }
        else if(n == "2")
        {
            bShowHBlur = !bShowHBlur;
            bShowFullBlur = false;
            bShowColorMap = false;            
            bShowVBlur = false;
            bShowBloom = false;
        }
        else if(n == "3")
        {
            bShowVBlur = !bShowVBlur;
            bShowFullBlur = false;
            bShowHBlur = false;
            bShowColorMap = false;
            bShowBloom = false;
        }
        else if(n == "4")
        {              
            bShowFullBlur = !bShowFullBlur;
            bShowVBlur = false;
            bShowHBlur = false;
            bShowColorMap = false;
            bShowBloom = false;
        }
        else if(n == "5")
        {              
            bShowBloom = !bShowBloom;
            bShowFullBlur = false;
            bShowVBlur = false;
            bShowHBlur = false;
            bShowColorMap = false; 
        }
        else if(n == "h")
            bAnimate = !bAnimate;
     
    };
     
    // callback if user request a blurmap resolution change    
    $('select#blurres').change(function() {
        if($(this).val() == "64 x 64") {
            blurMapRes = 64;            
        } 
        else if($(this).val() == "128 x 128") {
            blurMapRes = 128;            
        }            
        else if($(this).val() == "256 x 256") {
            blurMapRes = 256;            
        }            
        else if($(this).val() == "512 x 512") {
            blurMapRes = 512;            
        }            
        else if($(this).val() == "1024 x 1024") {
            blurMapRes = 1024;             
        }   
         
        // recreate the FBO's with the choosen resolution
        blurmap =
        tdl.framebuffers.createFramebuffer(blurMapRes, blurMapRes, true); 
       
        horizontalBlur =
        tdl.framebuffers.createFramebuffer(blurMapRes, blurMapRes, true);
            
    });
    
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
        
        renderBloom();
       
    }
    
    function renderBloom() {
        
        // render the scene to texture using the default color shader        
        colorBuffer.bind();
        gl.depthMask(true);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);    
         
        uniforms.color = vec3.create([1, 0.45, 0.34]);
        ball2.draw(uniforms); 
        uniforms.color = vec3.create([0.45, 0.34, 1]);
        ball3.draw(uniforms); 
        uniforms.color = vec3.create([0, 0, 0]);
        uniforms.rippled = true && bAnimate;
        ball.draw(uniforms);
        uniforms.color = vec3.create([0.25, 1, 0.75]);
        uniforms.rippled = false;
        box.draw(uniforms);
        uniforms.color = vec3.create([0.75, 1, 0.25]);
        box2.draw(uniforms);
        uniforms.color = vec3.create([0.75, 0.25, 0.25]);
        box3.draw(uniforms);
        
        if(bShowColorMap)
        {           
            // show the color buffer only and return
            backBuffer.bind();  
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST); 
     
            quad.draw({ 
                colormap:colorBuffer.texture,
                renderColorMap:true,
                renderBlurMap:false
            }); 
            return;
        }
        
        //blur the blurmap 
        horizontalBlur.bind();
        gl.viewport(0, 0, blurMapRes, blurMapRes);
        quad.model.setProgram(blurProgramm);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.clear(gl.COLOR_BUFFER_BIT);
        quad.draw({
            Orientation: 0,
            frame:colorBuffer.texture,
            BlurAmount: blurRadius,
            BlurScale:blurScale,
            BlurStrength:blurStrength,            
            TexelSizeW:1.0 / blurMapRes,
            TexelSizeH:1.0 / blurMapRes
        }); 
    
        if(bShowHBlur)
        {            
            // show the color buffer only and return
            backBuffer.bind();             
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST); 
     
            quad.draw({ 
                colormap:horizontalBlur.texture,
                renderColorMap:true,
                renderBlurMap:false
            }); 
            return;
        }

        // mix with vertical blur
        blurmap.bind();
        gl.clear(gl.COLOR_BUFFER_BIT);

        quad.draw({
            Orientation: 1,
            frame:horizontalBlur.texture,
            BlurAmount: blurRadius,
            BlurScale:blurScale,
            BlurStrength:blurStrength,            
            TexelSizeW:1.0 / blurMapRes,
            TexelSizeH:1.0 / blurMapRes
        }); 
        
        if(bShowVBlur)
        {            
            // show the color buffer only and return
            backBuffer.bind();  
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST); 
     
            quad.draw({ 
                colormap:colorBuffer.texture,
                blurmap:blurmap.texture,
                renderColorMap:false,
                renderBlurMap:true
            }); 
            return;
        }              
        
        // blend the blurmap with the rendered scene
        // + restore viewport        
        if(bShowFullBlur)
        {            
            backBuffer.bind();  
            gl.viewport(0, 0, canvas.width, canvas.height);
            quad.model.setProgram(blendProgramm);
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST);  
        
            quad.draw({ 
                colormap:colorBuffer.texture,
                blurmap:blurmap.texture,
                renderColorMap:false,
                renderBlurMap:true
            }); 
            return;
        }
        
        if(bShowBloom)
        {            
            backBuffer.bind();
            gl.viewport(0, 0, canvas.width, canvas.height);
            quad.model.setProgram(blendProgramm);
            gl.depthMask(false);
            gl.disable(gl.DEPTH_TEST);  
        
            quad.draw({ 
                colormap:colorBuffer.texture,
                blurmap:blurmap.texture,
                renderColorMap:false,
                renderBlurMap:false
            }); 
            return;
        }
    }
     

    // Initial call to get the rendering started.
    render();
}



