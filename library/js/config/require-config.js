/**
 * Config options at: http://requirejs.org/docs/api.html#config
 */
require.config({

    config: {
        // module specific configuration
    },

    shim: {
        'tween': {
            exports: 'TWEEN'
        }
    },

    paths: {
        //
        //  This is where you can add paths to any plugins or vendor scripts.
        //

        // Plugins
        'text': 'plugins/text',
        'json': 'plugins/json',
        'tpl' : 'plugins/tpl',
        'async' : 'plugins/async',

        // Templating
        'dot' : 'vendor/doT',

        // MVC
        'stapes': 'vendor/stapes',
        'hammer.jquery': 'vendor/hammer.jquery',
        'moddef': 'util/module',

        'tween': 'vendor/tween',

        // jQuery
        'jquery': 'vendor/jquery',
        'hammerjs': 'vendor/hammer',

        // draw helper
        'canvas-draw': 'modules/canvas-draw',

        // requestAnimationFrame polyfill
        'raf': 'vendor/raf'


    },

    packages: [
        { name: 'when', location: 'vendor/when', main: 'when' }
        ,{
            name: 'physicsjs',
            location: 'vendor/physicsjs-0.6.0',
            main: 'physicsjs-0.6.0.min'
        }
    ],

    map: {

        '*' : {
            'jquery': 'modules/adapters/jquery', // jQuery noconflict adapter
            'site-config': 'config/site-config.json'
        },

        'modules/adapters/jquery': {
            'jquery': 'jquery'
        }
    }
});
