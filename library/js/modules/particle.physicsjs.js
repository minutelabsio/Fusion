define([
    'require',
    'physicsjs',
    'physicsjs/bodies/circle'
], function(
    require,
    Physics
){
    'use strict';

    var images = {
        proton: require.toUrl('../../images/particle-blue.png')
        ,neutron: require.toUrl('../../images/particle-purple.png')
        ,positron: require.toUrl('../../images/particle-yellow.png')
    };

    Physics.body('particle', 'circle', function( parent ){
        return {
            init: function( opts ){
                parent.init.call(this, opts);
                this.styles = {};
                this.options.defaults({
                    charge: 1
                    ,ptype: 'proton'
                    ,restitution: 1
                    ,cof: 0
                });
                this.options( opts );
                delete this.state.angular.pos;
                Object.defineProperty(this.state.angular, 'pos', {
                    get: function(){
                        return 0;
                    }
                    ,set: function(){}
                });
            }
            ,get ptype(){
                return this._ptype;
            }
            ,set ptype( t ){
                if ( !this.geometry ){
                    return;
                }
                if ( t === 'neutron' ){
                    this._ptype = 'neutron';
                    this.charge = 0;
                    // this.styles.fillStyle = '#373f9b';
                    this.styles.src = images.neutron;
                    this.styles.width = this.geometry.radius*2 + 1;
                    this.styles.height = this.geometry.radius*2 + 1;

                } else if ( t === 'positron' ){
                    this._ptype = 'positron';
                    this.charge = 1;
                    this.geometry.radius = 5;
                    this.styles.src = images.positron;
                    this.styles.width = this.geometry.radius*2 + 1;
                    this.styles.height = this.geometry.radius*2 + 1;

                } else {
                    this._ptype = 'proton';
                    this.charge = 1;
                    // this.styles.fillStyle = '#942828';
                    this.styles.src = images.proton;
                    this.styles.width = this.geometry.radius*2 + 1;
                    this.styles.height = this.geometry.radius*2 + 1;

                }
                // force renderer to recreate the view
                this.view = false;
            }
        };
    });
});
