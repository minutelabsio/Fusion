define([
    'jquery',
    'modules/interface',
    'physicsjs',
    'physicsjs/renderers/canvas',
    'physicsjs/behaviors/body-impulse-response',
    'physicsjs/behaviors/body-collision-detection',
    'physicsjs/behaviors/edge-collision-detection',
    'physicsjs/behaviors/sweep-prune',
    'physicsjs/behaviors/attractor',
    'physicsjs/behaviors/interactive',
    'physicsjs/bodies/circle',
    'modules/magnetic.physicsjs',
    'modules/coulomb.physicsjs',
    'modules/particle.physicsjs',
    'modules/strong-nuclear.physicsjs'
], function(
    $,
    Interface,
    Physics,
    __blank
) {
    'use strict';

    // wait for domready deferred
    function domready(){
        var dfd = $.Deferred();
        $(function(){ dfd.resolve(); });
        return dfd.promise();
    }

    function simulation( world ) {

        var ui = Interface( world )
            ,viewWidth = ui.width
            ,viewHeight = ui.height
            // bounds of the window
            ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
            ,center = Physics.vector(viewWidth/2, viewHeight/2)
            ,attractor = Physics.behavior('attractor', { pos: center, min: viewWidth/2, strength: 5e-9, order: -2 })
            ,edgeBounce
            ,renderer
            ,coulomb = Physics.behavior('coulomb', { strength: 8 })
            ,Bfield = Physics.behavior('magnetic', {strength: .01})
            ;

        // create a renderer
        renderer = Physics.renderer('canvas', {
            el: 'physics'
            ,width: viewWidth
            ,height: viewHeight
        });

        // add the renderer
        world.add(renderer);
        // render on each step
        world.on('step', function () {
            world.render();
        });

        // constrain objects to these bounds
        edgeBounce = Physics.behavior('edge-collision-detection', {
            aabb: viewportBounds
            ,restitution: 0.99
            ,cof: 0.8
        });

        // resize events
        ui.on('resize', function () {

            viewWidth = ui.width;
            viewHeight = ui.height;

            renderer.resize( viewWidth, viewWidth );

            viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);
            // update the boundaries
            edgeBounce.setAABB(viewportBounds);

            center.set(viewWidth, viewHeight).mult(0.5);
        });

        // create some protons
        var l = 0, x, y, add, pos = Physics.vector();
        var particles = [];
        while( l < 20 ){
            add = true;
            pos.set(viewWidth * Math.random(), viewHeight  * Math.random());
            for ( var i = 0, l = particles.lenght; i < l; i++ ){
                if ( particles[i].state.pos.dist(pos) <= 40 ){
                    add = false;
                    break;
                }
            }

            if ( add ){
                l = particles.push( Physics.body('particle', {
                    x: pos.x
                    ,y: pos.y
                    ,vx: -0.15
                    ,mass: 1
                    ,radius: 8
                }));
            }
        }

        world.add(particles);

        // add things to the world
        world.add([
            Physics.behavior('interactive', { el: renderer.el })
            ,Physics.behavior('sweep-prune')
            ,Physics.behavior('body-impulse-response')
            ,Physics.behavior('body-collision-detection')
            ,Physics.behavior('strong-nuclear')
            //,edgeBounce
            ,attractor
            ,coulomb
            ,Bfield
        ]);

        // subscribe to ticker to advance the simulation
        Physics.util.ticker.on(function( time ) {
            world.step( time );
        });

        // start the ticker
        Physics.util.ticker.start();
    }

    Physics({ timestep: 0.2 }, [ domready, simulation ]);
});
