define([
    'jquery',
    'modules/slider.jquery',
    'hammer.jquery',
    'vendor/color.jquery',
    'moddef'

], function(
    $,
    _slider,
    _hjq,
    _cjq,
    M
){
    'use strict';

    var Module = M({
        constructor: function( opts ){

            var self = this;
            this.width = opts.width || 600; //window.innerWidth;
            this.height = opts.height || 600; //window.innerHeight;

            $(window).on('resize', function(){
                // self.width = 600; //window.innerWidth;
                // self.height = 300; // window.innerHeight;
                self.emit('resize');
            });

            this.$el = $( opts.el );

            // default settings
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
            }).on('touch', '#ctrl-restart', function( e ){
                e.preventDefault();
                self.emit('restart');
            });

            $('.phdbtn').on('click', function( e ){
                e.preventDefault();
            });

            this.on('collision-counter', function( e, val ){

                self.$el.find('.col-counter data')
                    .html( val|0 )
                    .stop()
                    .css({
                        'color': 'rgb(236, 29, 29)'
                    })
                    .animate({
                        'color': 'rgb(67, 67, 67)'
                    }, 2000)
                    ;
            });

        }
    }, ['events']);

    return function( opts ){
        return new Module( opts );
    };
});
