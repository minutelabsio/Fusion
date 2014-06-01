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
    'modules/strong-nuclear.physicsjs',
    'modules/fusion-monitor'
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

    function BFieldStrength( v ){
        return lerp(0.0001, 0.1, v);
    }

    function GFieldStrength( v ){
        return lerp(2, 60, v);
    }

    function R2FieldStrength( v ){
        return lerp(1e-8, 1e-7, v);
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
            ,Bfield = Physics.behavior('magnetic', { strength: BFieldStrength(ui.settings.field) })
            ,Gfield = Physics.behavior('attractor', { pos: center, min: 30, strength: GFieldStrength(ui.settings.field), order: 2 })
            ,R2field = Physics.behavior('attractor', { pos: center, min: 50, strength: R2FieldStrength(ui.settings.field), order: -2 })
            ;

        // create a renderer
        renderer = Physics.renderer('canvas', {
            el: 'physics'
            ,width: viewWidth
            ,height: viewHeight
        });

        renderer.addLayer('bg', false, { zIndex: 0 }).render = function(){};

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

            renderer.resize( viewWidth, viewHeight );

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
            for ( var i = 0, l = particles.length; i < l; i++ ){
                if ( particles[i].state.pos.dist(pos) <= 80 ){
                    add = false;
                    break;
                }
            }

            if ( add ){
                v = Physics.vector(1, 0).rotate(Math.random()*2*Math.PI).mult( 0.05 * Math.random() );
                l = particles.push( Physics.body('particle', {
                    x: pos.x
                    ,y: pos.y
                    ,vx: v.x
                    ,vy: v.y
                    ,mass: 1
                    ,radius: 10
                }));
            }
        }

        world.add(particles);

        var lastE = 1;
        ui.on({
            'change:field': function( e, val ){
                Bfield.options.strength = BFieldStrength( val );
                Gfield.options.strength = GFieldStrength( val );
                R2field.options.strength = R2FieldStrength( val );

                // if ( ui.settings.fieldType === 'gravity' ){
                //     // radial gradient
                //     Draw( renderer.layer('bg').ctx );
                //     var grd = Draw.ctx.createRadialGradient(center.x, center.y, lerp( 200, 40, ui.settings.field ), center.x, center.y, viewWidth*0.9);
                //     grd.addColorStop(0, 'white');
                //     grd.addColorStop(1, colors.blueBottle);
                //     Draw
                //         .styles('fillStyle', grd)
                //         .rect(0, 0, viewWidth, viewHeight)
                //         .fill()
                //         ;
                // } else if ( ui.settings.fieldType === 'r2' ){
                //     // radial gradient
                //     Draw( renderer.layer('bg').ctx );
                //     var grd = Draw.ctx.createRadialGradient(center.x, center.y, lerp( 200, 40, ui.settings.field ), center.x, center.y, viewWidth*0.9);
                //     grd.addColorStop(0, colors.blueBottle);
                //     grd.addColorStop(1, 'white');
                //     Draw
                //         .styles('fillStyle', grd)
                //         .rect(0, 0, viewWidth, viewHeight)
                //         .fill()
                //         ;
                // } else {
                //     Draw( renderer.layer('bg').ctx )
                //         .clear()
                //         .styles('fillStyle', adjustAlpha( colors.blueBottle, lerp( 0, .8, val ) ))
                //         .rect(0, 0, viewWidth, viewHeight)
                //         .fill()
                //         ;
                // }
            }
            ,'change:fieldType': function( e, val ){
                if ( val === 'magnetic' ){
                    world.remove([ Gfield, R2field ]).add( Bfield );
                } else if ( val === 'r2' ){
                    world.remove([ Gfield, Bfield ]).add( R2field );
                } else {
                    world.remove([ Bfield, R2field ]).add( Gfield );
                }
                ui.emit('change:field', ui.settings.field);
            }
            ,'change:energy': function( e, val ){
                var scale = Math.sqrt(val/lastE);
                lastE = val;
                for ( var i = 0, l = particles.length; i < l; i++ ){
                    particles[ i ].state.vel.mult( scale );
                }
            }
            ,'add': function( e ){
                var tries = 100;
                do {
                    pos.set(viewWidth * Math.random(), viewHeight  * Math.random());
                } while ( tries-- && world.findOne({ $at: pos }) );

                v = Physics.vector(1, 0).rotate(Math.random()*2*Math.PI).mult( Math.sqrt(ui.settings.energy) * 0.5 * Math.random() );
                var p = Physics.body('particle', {
                    x: pos.x
                    ,y: pos.y
                    ,vx: v.x
                    ,vy: v.y
                    ,mass: 1
                    ,radius: 10
                });
                world.add( p );
                particles.push( p );
            }
            ,'change:simulation': function( e, val ){
                ui.width = val === 'sun' ? 360 : 600;
                ui.emit('resize');
                $('#sim-wrap').removeClass('bottle sun').addClass( val );
            }
        });

        ui.emit('change:fieldType', ui.settings.fieldType);
        ui.emit('change:simulation', ui.settings.simulation);

        var bangWords = ["BAM!", "THWAP!", "BANG!"];
        world.on('fusion', function( entity ){
            // create a little explosion animation
            var pos = Physics.vector().clone( entity.members[0].state.pos )
                ,text = bangWords[Math.random()*3|0] //entity.name
                ,s = {
                    lineWidth: 3
                    ,strokeStyle: 'rgba(217, 199, 3, 1)'
                    ,shadowBlur: 10
                }
                ,textStyles = {
                    font: '30px "sf_cartoonist_hand", Helvetica, Arial, sans-serif' // '30px "latin-modern-mono-light", Courier, monospace'
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

            ui.emit('add');
        });

        // add things to the world
        world.add([
            Physics.behavior('interactive', { el: renderer.el })
            ,Physics.behavior('fusion-monitor')
            ,Physics.behavior('sweep-prune')
            ,Physics.behavior('body-impulse-response')
            ,Physics.behavior('body-collision-detection')
            // ,Physics.behavior('strong-nuclear')
            //,edgeBounce
            ,attractor
            ,coulomb
            // ,Bfield
            ,Gfield
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
