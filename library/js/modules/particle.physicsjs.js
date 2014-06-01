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
        hydrogen: require.toUrl('../../images/hydrogen.png')
        ,helium: require.toUrl('../../images/helium.png')
        ,neutron: require.toUrl('../../images/neutron.png')
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
                if ( t === 'neutron' ){
                    this._ptype = 'neutron';
                    this.charge = 0;
                    // this.styles.fillStyle = '#373f9b';
                    this.geometry.radius -= 2;
                    this.styles.src = images.neutron;
                    this.styles.width = this.geometry.radius*2;
                    this.styles.height = this.geometry.radius*2;

                } else if ( t === 'helium' ) {
                    this._ptype = 'helium';
                    this.charge = 2;
                    // this.styles.fillStyle = '#942828';
                    this.geometry.radius += 4;
                    this.styles.src = images.helium;
                    this.styles.width = this.geometry.radius*2;
                    this.styles.height = this.geometry.radius*2;
                } else {
                    this._ptype = 'proton';
                    this.charge = 1;
                    // this.styles.fillStyle = '#942828';
                    this.styles.src = images.hydrogen;
                    this.styles.width = this.geometry.radius*2;
                    this.styles.height = this.geometry.radius*2;
                }
                // force renderer to recreate the view
                this.view = false;
            }
        };
    });
});
