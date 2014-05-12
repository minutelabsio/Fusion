define([
    'jquery',
    'tween',
    'modules/canvas-draw',
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
    TWEEN,
    Draw,
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
            ,attractor = Physics.behavior('attractor', { pos: center, min: viewWidth/2, strength: 1e-8, order: -2 })
            ,edgeBounce
            ,renderer
            ,coulomb = Physics.behavior('coulomb', { strength: 7 })
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

        // set a velocity maximum
        var maxV = 4;
        world.on('integrate:velocities', function( data ){
            var bodies = data.bodies
                ,n
                ;

            for ( var i = 0, l = bodies.length; i < l; i++ ){
                n = bodies[ i ].state.vel.norm();

                if ( n > maxV ){
                    bodies[ i ].state.vel.normalize().mult( maxV );
                }
            }
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
        var l = 0, x, y, add, pos = Physics.vector(), v;
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
                v = Physics.vector(1, 0).rotate(Math.random()*2*Math.PI).mult( 0.1 * Math.random() );
                l = particles.push( Physics.body('particle', {
                    x: pos.x
                    ,y: pos.y
                    ,vx: v.x
                    ,vy: v.y
                    ,mass: 1
                    ,radius: 5
                }));
            }
        }

        world.add(particles);

        var lastE = 1;
        ui.on({
            'change:field': function( e, val ){
                Bfield.options.strength = val;
            }
            ,'change:energy': function( e, val ){
                var scale = Math.sqrt(val/lastE);
                lastE = val;
                for ( var i = 0, l = particles.length; i < l; i++ ){
                    particles[ i ].state.vel.mult( scale );
                }
            }
        });

        world.on('fusion', function( entity ){
            // create a little explosion animation
            var pos = Physics.vector().clone( entity.members[0].state.pos )
                ,text = entity.name
                ,s = {
                    lineWidth: 3
                    ,strokeStyle: 'rgba(136, 130, 0, 1)'
                    ,shadowBlur: 10
                }
                ,textStyles = {
                    font: '30px "latin-modern-mono-light", Courier, monospace'
                    ,fillStyle: 'rgba(200, 0, 0, 1)'
                }
                ,ctx = renderer.layer('main').ctx
                ;

            new TWEEN.Tween({ r: 1, opacity: 1 })
                .to( { r: 600, opacity: 0 }, 1000 )
                .easing( TWEEN.Easing.Linear.None )
                .onUpdate(function () {

                    s.strokeStyle = s.shadowColor = s.strokeStyle.replace( /[^,]*\)$/, this.opacity + ')' );
                    Draw( ctx ).styles( s ).circle( pos.x, pos.y, this.r );

                })
                .start()
                ;

            new TWEEN.Tween({ dy: 0, opacity: 1 })
                .to({ dy: -50, opacity: 0 }, 1500)
                .easing( TWEEN.Easing.Linear.None )
                .onUpdate(function(){
                    textStyles.fillStyle = textStyles.fillStyle.replace( /[^,]*\)$/, this.opacity + ')' );
                    Draw( ctx ).styles( textStyles ).text( text, pos.x, pos.y + this.dy );
                })
                .start()
                ;
        });

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
            TWEEN.update();
        });

        // start the ticker
        Physics.util.ticker.start();
    }

    // wait for domready, then initialize
    Physics({ timestep: 0.2 }, [ domready, simulation ]);
});
