define([
    'physicsjs',
    'physicsjs/bodies/circle'
], function(
    Physics
){
    'use strict';

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
            }
            ,get ptype(){
                return this._ptype;
            }
            ,set ptype( t ){
                if ( t === 'neutron' ){
                    this._ptype = 'neutron';
                    this.charge = 0;
                    this.styles.fillStyle = '#373f9b';
                } else {
                    this._ptype = 'proton';
                    this.charge = 1;
                    this.styles.fillStyle = '#942828';
                }
                // force renderer to recreate the view
                this.view = false;
            }
        };
    });
});
