define([
    'jquery',
    'modules/slider.jquery',
    'hammer.jquery',
    'moddef'

], function(
    $,
    _slider,
    _hjq,
    M
){
    'use strict';

    var Module = M({
        constructor: function( world ){

            var self = this;
            this.width = 600; //window.innerWidth;
            this.height = 500; //window.innerHeight;

            $(window).on('resize', function(){
                self.width = 600; //window.innerWidth;
                self.height = 500; // window.innerHeight;
                self.emit('resize');
            });

            this.$el = $('#controls');

            this.settings = {};
            this.$el.find('.slider').slider().each(function(){
                self.settings[ $(this).attr('data-name') ] = parseFloat($(this).attr('data-value'));
            });

            this.$el.on('change', '.slider', function( e, val ){
                var $this = $(this)
                    ,name = $this.attr('data-name')
                    ;

                if ( name ){
                    self.settings[name] = val;
                    self.emit('change:'+name, val);
                }
            });

            this.$el.find('.radio-group').each(function(){
                var $rg = $(this);
                var name = $rg.attr('data-name');
                self.settings[ name ] = $rg.find('> .on').attr('data-value');
                $rg.hammer().on('touch', '>a', function( e ){
                    e.preventDefault();
                    var $this = $(this);
                    $this.siblings().removeClass('on');
                    $this.addClass('on');
                    self.settings[ name ] = $this.attr('data-value');
                    self.emit('change:'+name, self.settings[name]);
                });
            });

            this.$el.hammer().on('touch', '#ctrl-add', function( e ){
                e.preventDefault();
                self.emit('add');
            });


            // var gui = new dat.GUI();
            // var oldT = 1;
            // var settings = {
            //     'Field Strength': Bfield.options.strength,
            //     'Temperature': oldT,
            //     'RESTART': function(){
            //         for(var i = 0, l = particles.length; i < l; i++){
            //
            //             particles[i].state.pos.set(viewWidth * Math.random(), viewHeight  * Math.random());
            //             particles[i].state.old.pos.clone(particles[i].state.pos);
            //             particles[i].state.vel.zero();
            //         }
            //     }
            // };
            // gui.add(settings, 'Field Strength', 0.0001, 0.02).onChange(function( val ){
            //     Bfield.options({ strength: val });
            // });
            //
            // gui.add(settings, 'Temperature', 0.1, 10).onChange(function( val ){
            //     var mul = Math.sqrt(val) / Math.sqrt(oldT);
            //     for(var i = 0, l = particles.length; i < l; i++){
            //         particles[i].state.vel.mult(mul);
            //     }
            //     oldT = val;
            // });
            //
            // gui.add(settings, 'RESTART');
        }
    }, ['events']);

    return function( world ){
        return new Module( world );
    };
});
