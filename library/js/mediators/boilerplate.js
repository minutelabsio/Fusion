define([
    'require',
    'jquery',
    'vendor/viewport.jquery',
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
    require,
    $,
    _$vp,
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
        return lerp(0.0001, 0.05, v);
    }

    function GFieldStrength( v ){
        return lerp(2, 80, v);
    }

    function R2FieldStrength( v ){
        return lerp(0, 2e-8, v);
    }

    function fusionEvent( entity ){

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
            ,ctx = this.renderer().layer('main').ctx
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
    }

    function simulation( world, ui, el, field ){
        var renderer
            ,viewWidth = ui.width
            ,viewHeight = ui.height
            // bounds of the window
            ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
            ,center = Physics.vector(viewWidth/2, viewHeight/2)
            ,coulomb = Physics.behavior('coulomb', { strength: 3/world.timestep(), min: 5 })
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
            field.options({ pos:center });
        });

        var lastE = 1;
        ui.on({
            'change:energy': function( e, val ){
                var E = val/lastE;
                var particles = world.find({ name: 'particle' });
                for ( var i = 0, l = particles.length; i < l; i++ ){
                    particles[ i ].state.vel.mult( Math.sqrt(E) );
                }
                lastE = val;
            }
            ,'restart': function(){
                lastE = ui.settings.energy;
                // remove all particles
                var old = world.find({ name: 'particle' });
                if ( old.length ) {
                    world.remove( old );
                }

                // create some protons
                var l = 0, x, y, add, pos = Physics.vector(), v;
                var density = ui.settings.density;
                var T = ui.settings.energy/world.timestep();
                var particles = [];
                var tries = 100;
                while( l < 60 && tries > 0 ){
                    add = true;
                    pos.set(viewWidth * Math.random(), viewHeight  * Math.random());
                    for ( var i = 0, l = particles.length; i < l; i++ ){
                        if ( particles[i].state.pos.dist(pos) <= lerp(200, 15, density) ){
                            add = false;
                            break;
                        }
                    }

                    if ( add ){
                        tries = 100;
                        v = Physics.vector(1, 0).rotate(Math.random()*2*Math.PI).mult( gauss(Math.sqrt(T)/8, Math.sqrt(T)/10) );
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
                field.applyTo(particles);
            }
        });

        world.on('fusion', fusionEvent, world);

        // add things to the world
        world.add([
            Physics.behavior('sweep-prune')
            ,Physics.behavior('body-impulse-response')
            ,Physics.behavior('body-collision-detection')
            ,Physics.behavior('strong-nuclear')
            ,field
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

        // pause if you can't see it
        $(window).on('scroll', function(){
            if ( el.is(':in-viewport') ){
                world.unpause();
            } else {
                world.pause();
            }
        });
    }

    function sunSimulation( world ) {

        var el = $('#sun-simulation')
            ,ui = Interface({ el: el.find('.controls:first'), width: 600, height: 600 })
            ,field = Physics.behavior('attractor', { pos: Physics.vector(ui.width/2, ui.width/2), min: 80, strength: R2FieldStrength(ui.settings.field), order: -2 })
            ;

        ui.on('change:field', function( e, val ){

            field.options.strength = R2FieldStrength(val);
        });

        simulation( world, ui, el, field );

        // create the arrows
        var arrows = $((new Array(9)).join('<img>'))
            .attr('src', require.toUrl('../../images/arrow-down.png'))
            .attr('width', '80')
            .css({ 'margin-left': '-20px', 'margin-top': '-50px', 'zIndex': 5 })
            .appendTo(el)
            ;

        var center = Physics.vector(el.width()/2 - 12, el.height()/2 - 26);

        function placement( r ){
            var v = Physics.vector(0, -r);
            arrows.each(function( i ){
                $(this).css({
                    position: 'absolute'
                    ,top: 0// v.y + center.y
                    ,left: 0//center.x + v.x
                });
                this.style[Modernizr.prefixed('transform')] = 'translate('+[v.x+center.x, v.y+center.y].join('px,')+'px) rotate('+(45 * i)+'deg)';
                v.rotate( Math.PI/4 );

            });
        }

        ui.on('change:field', function( e, val ){
            placement( lerp(200, 150, val) );
        });

        placement( lerp(200, 150, ui.settings.field) );
    }

    function bottleSimulation( world ) {

        var el = $('#bottle-simulation')
            ,ui = Interface({ el: el.find('.controls:first'), width: 450, height: 450 })
            ,field = Physics.behavior('magnetic', { strength: BFieldStrength(ui.settings.field) })
            ;

        ui.on('change:field', function( e, val ){

            field.options.strength = BFieldStrength(val);
        });

        simulation( world, ui, el, field );

        var magnets = $('<img>')
            .attr('src', require.toUrl('../../images/bg-magnets.png'))
            .attr('width', '550')
            .css({ 'position': 'absolute', 'top': 112, 'left': 25, 'zIndex': 5 })
            .appendTo(el)
            ;

        ui.on('change:field', function( e, val ){
            magnets.css('opacity', val);
        });

        magnets.css('opacity', ui.settings.field);
    }

    // wait for domready, then initialize
    Physics({ timestep: 6 }, [ domready, sunSimulation ]);
    Physics({ timestep: 0.1 }, [ domready, bottleSimulation ]);
});
