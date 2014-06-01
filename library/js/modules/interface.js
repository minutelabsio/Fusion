define([
    'jquery',
    'modules/slider.jquery',
    'hammer.jquery',
    'moddef'

], function(
    $,
    _slider,
    _hjq,
    M
){
    'use strict';

    var Module = M({
        constructor: function(){

            var self = this;
            this.width = 600; //window.innerWidth;
            this.height = 300; //window.innerHeight;

            $(window).on('resize', function(){
                // self.width = 600; //window.innerWidth;
                // self.height = 300; // window.innerHeight;
                self.emit('resize');
            });

            this.$el = $('#controls');

            // default settings
            this.settings = {
                simulation: 'bottle'
            };

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
            });

            //simulation selector
            $('#sim-selector').on('click', '.sel', function(){
                var $this = $(this)
                    ,val = $this.attr('data-value')
                    ;

                self.settings['simulation'] = val;
                self.emit('change:simulation', val);
            });

        }
    }, ['events']);

    return function( world ){
        return new Module( world );
    };
});
