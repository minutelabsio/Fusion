define([
    'physicsjs',
    'physicsjs/behaviors/verlet-constraints'
], function(
    Physics
){
    'use strict';

    var neutronQuery = Physics.query({ charge: 0 });
    var protonQuery = Physics.query({ charge: 1 });

    Physics.behavior('strong-nuclear', function( parent ){
        return {
            init: function( opts ){
                parent.init.call(this, opts);
                this.options.defaults({
                    maxVel: 1.5
                });
                this.options( opts );

                this.constraints = Physics.behavior('verlet-constraints', { iterations: 3 });
            }
            ,connect: function( world ){
                world.add( this.constraints );
                world.on('collisions:detected', this.handleCollisions, this, 10);
            }
            ,disconnect: function( world ){
                world.remove( this.constraints );
                world.off('collisions:detected', this.handleCollisions);
            }
            ,createEntity: function( name, members ){
                var constr = this.constraints;
                var e = {
                    name: name
                    ,members: [].concat( members )
                    ,bonds: []
                    ,addMember: function( m ){
                        e.members.push( m );
                        e.rebond();
                    }
                    ,removeMember: function( m ){
                        var idx = Physics.util.indexOf( e.members, m );
                        if ( idx ){
                            e.members.splice( idx, 1 );
                            m.entity = null;
                            e.rebond();
                        }
                    }
                    ,removeBonds: function(){
                        var i, l;
                        for ( i = 0, l = e.bonds.length; i < l; i++ ){
                            constr.remove( e.bonds[ i ] );
                        }

                        e.bonds = [];
                    }
                    ,rebond: function(){
                        var i, l, c, d = 2 * e.members[ 0 ].geometry.radius;
                        e.removeBonds();

                        for ( i = 1, l = e.members.length; i <= l; i++ ){
                            c = constr.distanceConstraint( e.members[ i-1 ], e.members[ i%l ], 1, d );
                            e.bonds.push( c );
                            e.members[ i-1 ].entity = e;
                        }

                        if ( l === 4 ){
                            c = constr.distanceConstraint(e.members[0], e.members[2], 1, d);
                            e.bonds.push( c );
                            c = constr.distanceConstraint(e.members[1], e.members[3], 1, d * Math.sqrt(3));
                            e.bonds.push( c );
                        }
                    }
                };
                e.rebond();
                return e;
            }
            ,checkFusion: function( bodyA, bodyB ){
                var self = this
                    ,t
                    ;

                // check max velocity
                // if ( bodyA.state.vel.dist( bodyB.state.vel ) > self.options.maxVel ){
                //     return;
                // }

                // two solitary particles
                if ( !bodyA.entity && !bodyB.entity ){

                    // change one into a neutron
                    bodyA.ptype = 'neutron';

                    var positron = Physics.body('particle', {
                        ptype: 'positron'
                        ,x: bodyA.x
                        ,y: bodyA.y
                    });

                    positron.state.vel.set(3, 0).rotate(Math.PI * 2 * Math.random());
                    this._world.add( positron );

                    this.createEntity('H2', [bodyA, bodyB]);
                    this._world.emit('fusion', bodyA.entity);
                    return;
                }

                if ( bodyA.entity && !bodyB.entity ){
                    // swap...
                    t = bodyA;
                    bodyA = bodyB;
                    bodyB = t;
                }

                // H2 + H
                if ( bodyB.entity && bodyB.entity.name === 'H2' && !bodyA.entity ){

                    bodyB.entity.name = 'He3';
                    bodyB.entity.addMember( bodyA );
                    this._world.emit('fusion', bodyA.entity);
                    return;
                }

                // He3 + He3
                if (
                    bodyB.entity && bodyA.entity &&
                    bodyA.entity !== bodyB.entity &&
                    bodyB.entity.name === 'He3' && bodyA.entity.name === 'He3'
                ){
                    // remove all bonds
                    t = bodyB.entity.members.concat(bodyA.entity.members);
                    bodyA.entity.removeBonds();
                    bodyB.entity.removeBonds();

                    var neutrons = Physics.util.filter(t, neutronQuery);
                    var protons = Physics.util.filter(t, protonQuery);
                    // combine two neutrons and two protons
                    t = neutrons;
                    t.splice( 1, 0, protons[0] );
                    t.push( protons[1] );
                    // free two protons...
                    protons[2].entity = protons[3].entity = null;

                    // set positions
                    t[1].state.pos.set( t[0].geometry.radius, 0 ).rotate( Math.PI/6 ).vadd( t[0].state.pos );
                    t[2].state.pos.set( 2 * t[0].geometry.radius * Math.sqrt(3), 0 ).vadd( t[0].state.pos );
                    t[3].state.pos.set( t[0].geometry.radius, 0 ).rotate( -Math.PI/6 ).vadd( t[0].state.pos );
                    // bind all in t
                    this.createEntity( 'He4', t );
                    this._world.emit('fusion', t[0].entity);
                }
            }
            ,handleCollisions: function( data ){
                var cols = data.collisions, c;
                for (var i = 0, l = cols.length; i < l; i++){
                    c = cols[i];

                    // if two fused particles are colliding, then ignore the collision
                    if (
                        c.bodyA.entity && c.bodyA.entity === c.bodyB.entity ||
                        // if one is a neutrino or positron... ignore
                        c.bodyA.ptype === 'neutrino' || c.bodyB.ptype === 'neutrino' ||
                        c.bodyA.ptype === 'positron' || c.bodyB.ptype === 'positron'
                    ){
                        cols.splice(i, 1);
                        l--;
                        i--;
                        continue;
                    }

                    if ( c.bodyA.name === 'particle' && c.bodyB.name === 'particle' ){
                        this.checkFusion(c.bodyA, c.bodyB);
                    }
                }
            }
        };
    });
});
