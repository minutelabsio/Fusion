define([
    'physicsjs'

], function(
    Physics
){
    'use strict';

    Physics.behavior('magnetic', function( parent ){
        return {
            init: function( opts ){
                parent.init.call(this, opts);
                this.options.defaults({
                    strength: 1
                });
                this.options( opts );
            }
            ,behave: function(){
                var bodies = this.getTargets()
                    ,body
                    ,i
                    ,l = bodies.length
                    ,B = this.options.strength
                    ,scratch = Physics.scratchpad()
                    ,F = scratch.vector()
                    ,q
                    ;

                for ( i = 0; i < l; i++ ){
                    body = bodies[ i ];
                    q = body.charge;
                    if ( q ){
                        // apply magnetic force
                        // F = q (v x B)
                        F.clone( body.state.vel ).mult( q * F.norm() * B  ).perp( true );
                        body.applyForce( F );
                    }
                }

                scratch.done();
            }
        };
    });
});
