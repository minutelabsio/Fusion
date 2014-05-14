define(['jquery'], function( $ ){
    function throttle( fn, delay, scope ){
        var to
            ,call = false
            ,args
            ,cb = function(){
                clearTimeout( to );
                if ( call ){
                    call = false;
                    to = setTimeout(cb, delay);
                    fn.apply(scope, args);
                } else {
                    to = false;
                }
            }
            ;

        scope = scope || null;

        return function(){
            call = true;
            args = arguments;
            if ( !to ){
                cb();
            }
        };
    }

    $.fn.slider = function( opts ){
        var startevent = window.Modernizr.touch ? 'touchstart' : 'mousedown';
        var moveevent = window.Modernizr.touch ? 'touchmove' : 'mousemove';
        var endevent = window.Modernizr.touch ? 'touchend' : 'mouseup';

        return $(this).each(function(){
            var $this = $(this).addClass('slider')
                ,options = $.extend({
                    min: parseFloat($this.attr('data-min')) || 0
                    ,max: parseFloat($this.attr('data-max')) || 1
                    ,value: parseFloat($this.attr('data-value')) || 0.5
                }, opts)
                ,factor = options.max - options.min
                ,val = (options.value - options.min) / factor
                ,$handle = $('<div>').appendTo($this).addClass('handle')
                ,$meter = $('<div>').appendTo($this).addClass('meter')
                ;

            function set( x ){
                var width = $this.width();
                if ( x !== undefined ){
                    x = Math.max(0, Math.min(width, x));
                    val = x / width;
                } else {
                    x = val * width;
                }

                $handle.css('left', x);
                $meter.css('width', (val * 100) + '%');

                $this.trigger('change', val * factor + options.min);
            }

            $this.css({
                position: this.style.position || 'relative'
            });

            $meter.css({
                display: 'block'
                ,position: 'absolute'
                ,top: '0'
                ,left: '0'
                ,bottom: '0'
            });

            $handle.css({
                position: 'absolute'
                ,top: '50%'
                ,marginLeft: -$handle.outerWidth() * 0.5
                ,marginTop: -$handle.outerHeight() * 0.5
            });

            var dragging = false;
            var drag = throttle(function( e ){

                if ( dragging ){

                    e.preventDefault();

                    if ( e.originalEvent.targetTouches ){
                        e = e.originalEvent.targetTouches[0];
                    }

                    var offset = $this.offset()
                        ,x = e.pageX - offset.left
                        ,y = e.pageY - offset.top
                        ;

                    set( x );
                }

            }, 20);

            function end(){
                dragging = false;
                $(document).off(moveevent, drag);
            }

            $this.on(startevent, function( e ){
                dragging = true;
                drag( e );

                $(document).on(moveevent, drag);
            });
            $(document).on(endevent, end);

            $this.on('mousedown', function(){
                return false;
            });

            $this.on('refresh', function( e, v ){
                v = Math.min(Math.max(v, options.min), options.max);
                val = (v - options.min) / factor;
                set();
            });

            set( val * $this.width() );
        });
    };
});
