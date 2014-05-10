define([
    'jquery',
    'moddef'

], function(
    $,
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
