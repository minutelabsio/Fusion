define([
    'physicsjs',
    'physicsjs/behaviors/newtonian'
], function(
    Physics
){
    'use strict';

    Physics.behavior('coulomb', 'newtonian', function(){
        return {
            behave: function(){
                var bodies = this.getTargets()
                    ,body
                    ,other
                    ,strength = this.options.strength
                    ,minDistSq = this._minDistSq
                    ,maxDistSq = this._maxDistSq
                    ,scratch = Physics.scratchpad()
                    ,pos = scratch.vector()
                    ,normsq
                    ,g
                    ;

                for ( var j = 0, l = bodies.length; j < l; j++ ){

                    body = bodies[ j ];

                    for ( var i = j + 1; i < l; i++ ){

                        other = bodies[ i ];
                        // clone the position
                        pos.clone( other.state.pos );
                        pos.vsub( body.state.pos );
                        // get the square distance
                        normsq = pos.normSq();

                        if (normsq > minDistSq && normsq < maxDistSq){

                            g = -strength / normsq;

                            body.accelerate( pos.normalize().mult( g * (other.charge|0) * (body.charge|0) / other.mass ) );
                            other.accelerate( pos.mult( body.mass/other.mass ).negate() );
                        }
                    }
                }

                scratch.done();
            }
        };
    });
});
