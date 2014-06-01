define([
    'physicsjs'
], function(
    Physics
){
    'use strict';

    var neutronQuery = Physics.query({ charge: 0 });
    var protonQuery = Physics.query({ charge: 1 });

    Physics.behavior('fusion-monitor', function( parent ){
        return {
            init: function( opts ){
                parent.init.call(this, opts);
            }
            ,connect: function( world ){
                world.on('collisions:detected', this.handleCollisions, this, 100);
            }
            ,disconnect: function( world ){
                world.off('collisions:detected', this.handleCollisions);
            }
            ,checkFusion: function( bodyA, bodyB ){
                var self = this
                    ,t
                    ;

                // two solitary protons
                if ( bodyA.ptype === 'proton' && bodyB.ptype === 'proton' ){

                    // change one into a neutron
                    bodyA.ptype = 'neutron';
                    bodyB.ptype = 'helium';

                    bodyA.state.vel.mult(20);
                    bodyB.state.vel.mult(20);

                    this._world.emit('fusion', {
                        name: 'He'
                        ,members: [
                            bodyA
                            ,bodyB
                        ]
                    });
                    return;
                }
            }
            ,handleCollisions: function( data ){
                var cols = data.collisions, c;
                for (var i = 0, l = cols.length; i < l; i++){
                    c = cols[i];
                    // neutrons rarely collide
                    // if (c.bodyA.ptype === 'neutron' || c.bodyB.ptype === 'neutron'){
                    //     cols.splice(i, 1);
                    //     l--;
                    //     i--;
                    //     continue;
                    // }

                    if ( c.bodyA.name === 'particle' && c.bodyB.name === 'particle' ){
                        this.checkFusion(c.bodyA, c.bodyB);
                    }
                }
            }
        };
    });
});
