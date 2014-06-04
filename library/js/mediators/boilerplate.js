define([
    'jquery',
    'tween',
    'modules/canvas-draw',
    'modules/interface',
    'physicsjs',
    'physicsjs/renderers/canvas',
    'physicsjs/behaviors/body-impulse-response',
    'physicsjs/behaviors/body-collision-detection',
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

    var colors = {
        'grey': 'rgb(220, 220, 220)'
        ,'greyLight': 'rgb(237, 237, 237)'
        ,'greyDark': 'rgb(200, 200, 200)'

        ,'deepGrey': 'rgb(67, 67, 67)'
        ,'deepGreyLight': 'rgb(98, 98, 98)'

        ,'blue': 'rgb(40, 136, 228)'
        ,'blueLight': 'rgb(91, 191, 243)'
        ,'blueDark': 'rgb(18, 84, 151)'

        ,'blueGlass': 'rgb(221, 249, 255)'
        ,'blueBottle': 'rgb(157, 188, 227)'

        ,'blueFire': '#626ead'

        ,'green': 'rgb(121, 229, 0)'
        ,'greenLight': 'rgb(125, 242, 129)'
        ,'greenDark': 'rgb(64, 128, 0)'

        ,'phdred': 'rgb(153, 43, 43)'

        ,'red': 'rgb(233, 63, 51)'
        ,'redLight': 'rgb(244, 183, 168)'
        ,'redDark': 'rgb(167, 42, 34)'

        ,'orange': 'rgb(239, 132, 51)'
        ,'orangeLight': 'rgb(247, 195, 138)'
        ,'orangeDark': 'rgb(159, 80, 31)'

        ,'yellow': 'rgb(228, 212, 44)'
        ,'yellowLight': 'rgb(242, 232, 110)'
        ,'yellowDark': 'rgb(139, 129, 23)'

    };

    function adjustAlpha( color, alpha ){
        color = color.split(/[\(,\)]/);
        color.pop();
        color[4] = alpha;
        var type = color.shift().split('a')[0] + 'a';
        return type+'('+ color.join(',') +')';
    }

    // wait for domready deferred
    function domready(){
        var dfd = $.Deferred();
        $(function(){ dfd.resolve(); });
        return dfd.promise();
    }

    function lerp(a, b, p) {
        return (b-a)*p + a;
    }

    function gauss( mean, stddev ){
        var r = 2 * (Math.random() + Math.random() + Math.random()) - 3;
        return r * stddev + mean;
    }

    function BFieldStrength( v ){
        return lerp(0.0001, 0.01, v);
    }

    function GFieldStrength( v ){
        return lerp(2, 80, v);
    }

    function R2FieldStrength( v ){
        return lerp(0, 5e-7, v);
    }

    function sunSimulation( world ) {

        var el = $('#sun-simulation')
            ,ui = Interface({ el: el.find('.controls:first'), width: 400, height: 400 })
            ,viewWidth = ui.width
            ,viewHeight = ui.height
            ,renderer
            // bounds of the window
            ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
            ,center = Physics.vector(viewWidth/2, viewHeight/2)
            ,coulomb = Physics.behavior('coulomb', { strength: 10, min: 5 })
            ,Bfield = Physics.behavior('magnetic', { strength: BFieldStrength(ui.settings.field) })
            ,R2field = Physics.behavior('attractor', { pos: center, min: 80, strength: R2FieldStrength(ui.settings.field), order: -2 })
            ;

        // create a renderer
        renderer = Physics.renderer('canvas', {
            el: el.find('canvas:first')[0]
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

        // resize events
        ui.on('resize', function () {

            viewWidth = ui.width;
            viewHeight = ui.height;

            renderer.resize( viewWidth, viewHeight );

            viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);

            center.set(viewWidth, viewHeight).mult(0.5);
            R2field.options({ pos:center });
        });

        var collisions = 0;
        var lastE = 1;
        ui.on({
            'restart': function(){
                collisions = 0;
                // remove all particles
                var old = world.find({ name: 'particle' });
                if ( old.length ) {
                    world.remove( old );
                }

                // create some protons
                var l = 0, x, y, add, pos = Physics.vector(), v;
                var density = ui.settings.density;
                var T = ui.settings.energy;
                var particles = [];
                var tries = 100;
                while( l < 20 && tries > 0 ){
                    add = true;
                    pos.set(viewWidth * Math.random(), viewHeight  * Math.random());
                    for ( var i = 0, l = particles.length; i < l; i++ ){
                        if ( particles[i].state.pos.dist(pos) <= lerp(200, 25, density) ){
                            add = false;
                            break;
                        }
                    }

                    if ( add ){
                        tries = 100;
                        v = Physics.vector(1, 0).rotate(Math.random()*2*Math.PI).mult( gauss(Math.sqrt(T)/3, Math.sqrt(T)/10) );
                        l = particles.push( Physics.body('particle', {
                            x: pos.x
                            ,y: pos.y
                            ,vx: v.x
                            ,vy: v.y
                            ,mass: 1
                            ,radius: 8
                        }));
                    } else {
                        tries--;
                    }
                }

                world.add(particles);
                R2field.applyTo(particles);
                ui.emit('collision-counter', collisions);
            }
            ,'change:field': function( e, val ){

                R2field.options.strength = R2FieldStrength(val);
            }
        });

        world.on('fusion', function( entity ){

            // give the fused particle energy
            entity.members[0].state.vel.mult( 40 );

            // create a little explosion animation
            var pos = Physics.vector().clone( entity.members[0].state.pos )
                ,text = entity.name
                ,s = {
                    lineWidth: 3
                    ,strokeStyle: 'rgba(219, 135, 1, 0.98)'
                    ,shadowBlur: 10
                }
                ,textStyles = {
                    font: '30px "PHD", "sf_cartoonist_hand", Helvetica, Arial, sans-serif' // '30px "latin-modern-mono-light", Courier, monospace'
                    ,fillStyle: adjustAlpha(colors.phdred, 1)
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

            collisions++;
            ui.emit('collision-counter', collisions);
        });

        // add things to the world
        world.add([
            Physics.behavior('sweep-prune')
            ,Physics.behavior('body-impulse-response')
            ,Physics.behavior('body-collision-detection')
            ,Physics.behavior('strong-nuclear')
            ,R2field
            ,coulomb
        ]);

        // subscribe to ticker to advance the simulation
        Physics.util.ticker.on(function( time ) {
            world.step( time );
            TWEEN.update();
        });

        // start the ticker
        Physics.util.ticker.start();

        ui.emit('restart');
    }

    // wait for domready, then initialize
    Physics({ timestep: 0.2 }, [ domready, sunSimulation ]);
});
