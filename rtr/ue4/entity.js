/*
 * Contains the entity definitions.
 */

/* 
 * Creates an entity. Entities consist of a TDL model, an initial
 * transformation and an optional behavior.
 */
var Entity = function(model, transform, behavior, properties) {
    this.model = model || null;
    this.transform = transform || mat4.identity(mat4.create());
    this.behavior = behavior || null;
    $.extend(this, properties || {});
};

/*
 * Render the model.
 */
Entity.prototype.draw = function(uniforms) {
    if (this.model) {
        this.model.drawPrep(uniforms);
        this.model.draw({ model: this.transform });
    }
}

/*
 * Simulate the entity.
 */
Entity.prototype.simulate = function(elapsed) {
    if (this.behavior)
        this.behavior.call(this, elapsed);
}

/*
 * The interctive camera.
 */
Entity.createCamera = function(canvas, uniforms) {

    uniforms.eyePosition = vec3.create([0, 1, 3]);
    uniforms.projection = mat4.create();
    uniforms.view = mat4.create();

    return new Entity(null, null, function(elapsed) {
        // Calculate the perspective projection matrix.
        mat4.perspective(
            60, 
            canvas.clientWidth / canvas.clientHeight, 
            0.01, 20,
            uniforms.projection);

        // Calculate the viewing transfomation.
        mat4.lookAt(
            uniforms.eyePosition, this.target, this.up, 
            uniforms.view);
    }, {
        target: vec3.create([0, 1, -1]),
        up: vec3.create([0, 1, 0])
    });
};

/*
 * The donut.
 */
Entity.createDonut = function(position, program, textures) {
    return new Entity(
        new tdl.models.Model(
            program,
            tdl.primitives.addTangentsAndBinormals(
                tdl.primitives.createTorus(0.25, 0.2, 80, 80)),
            textures),
        mat4.translate(mat4.identity(mat4.create()), position),
        function(elapsed) {
            mat4.multiply(this.transform, mat4.rotateX(mat4.identity([]), elapsed * 5));
        });
};

/*
 * Ball.
 */
Entity.createBall = function(position, program, textures) {
    return new Entity(
        new tdl.models.Model(
            program,
            tdl.primitives.addTangentsAndBinormals(
                tdl.primitives.createSphere(0.5, 80, 80)),
            textures),
        mat4.translate(mat4.identity(mat4.create()), position));
};

/*
 * The floor.
 */
Entity.createFloor = function(program, textures) {
    return new Entity(
        new tdl.models.Model(
            program, 
            tdl.primitives.addTangentsAndBinormals(
                tdl.primitives.createPlane(30, 30, 1, 1)),
            textures));
};

/*
 * Box.
 */
Entity.createBox = function(position, program, textures) {
    return new Entity(
        new tdl.models.Model(
            program,
            tdl.primitives.addTangentsAndBinormals(
                tdl.primitives.createCube(1)),
            textures),
        mat4.translate(mat4.identity(mat4.create()), position));
};

/*
 * Load program from URL and install on provided entities. 
 */
Entity.loadProgramFromUrl = function(vsurl, fsurl, entities) {
    $.when($.get(vsurl), $.get(fsurl)).done(
        function(vs, fs) {
            try {
                var program = tdl.programs.loadProgram(vs[0], fs[0]);
                entities.map(function(entity) {
                    entity.model.setProgram(program);
                });
            } catch (e) {
                displayError('Loading "' + vsurl + '" and  "' + fsurl + '" failed:\n' + e);
            }
        }
    );
};
