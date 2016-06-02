(function($) {

    if (typeof _wpcf7 == 'undefined' || _wpcf7 === null)
        _wpcf7 = {};

    _wpcf7 = $.extend({
        cached: 0
    }, _wpcf7);

    $(function() {
        _wpcf7.supportHtml5 = $.wpcf7SupportHtml5();
        $('div.wpcf7 > form').wpcf7InitForm();
    });

    $.fn.wpcf7InitForm = function() {
        this.ajaxForm({
            beforeSubmit: function(arr, $form, options) {
                $form.wpcf7ClearResponseOutput();
                $form.find('[aria-invalid]').attr('aria-invalid', 'false');
                $form.find('img.ajax-loader').css({
                    visibility: 'visible'
                });
                return true;
            },
            beforeSerialize: function($form, options) {
                $form.find('[placeholder].placeheld').on('each', function(i, n) {
                    $(n).val('');
                });
                return true;
            },
            data: {
                '_wpcf7_is_ajax_call': 1
            },
            dataType: 'json',
            success: $.wpcf7AjaxSuccess,
            error: function(xhr, status, error, $form) {
                var e = $('<div class="ajax-error"></div>').text(error.message);
                $form.after(e);
            }
        });

        if (_wpcf7.cached)
            this.wpcf7OnloadRefill();

        this.wpcf7ToggleSubmit();

        this.find('.wpcf7-submit').wpcf7AjaxLoader();

        this.find('.wpcf7-acceptance').on('click', function() {
            $(this).closest('form').wpcf7ToggleSubmit();
        });

        this.find('.wpcf7-exclusive-checkbox').wpcf7ExclusiveCheckbox();

        this.find('.wpcf7-list-item.has-free-text').wpcf7ToggleCheckboxFreetext();

        this.find('[placeholder]').wpcf7Placeholder();

        if (_wpcf7.jqueryUi && !_wpcf7.supportHtml5.date) {
            this.find('input.wpcf7-date[type="date"]').on('each', function () {
                $(this).datepicker({
                    dateFormat: 'yy-mm-dd',
                    minDate: new Date($(this).attr('min')),
                    maxDate: new Date($(this).attr('max'))
                });
            });
        }

        if (_wpcf7.jqueryUi && !_wpcf7.supportHtml5.number) {
            this.find('input.wpcf7-number[type="number"]').on('each', function () {
                $(this).spinner({
                    min: $(this).attr('min'),
                    max: $(this).attr('max'),
                    step: $(this).attr('step')
                });
            });
        }

        this.find('.wpcf7-character-count').wpcf7CharacterCount();

        this.find('.wpcf7-validates-as-url').on('change', function() {
            $(this).wpcf7NormalizeUrl();
        });
    };

    $.wpcf7AjaxSuccess = function(data, status, xhr, $form) {
        if (!$.isPlainObject(data) || $.isEmptyObject(data))
            return;

        var $responseOutput = $form.find('div.wpcf7-response-output');

        $form.wpcf7ClearResponseOutput();

        $form.find('.wpcf7-form-control').removeClass('wpcf7-not-valid');
        $form.removeClass('invalid spam sent failed');

        if (data.captcha)
            $form.wpcf7RefillCaptcha(data.captcha);

        if (data.quiz)
            $form.wpcf7RefillQuiz(data.quiz);

        if (data.invalids) {
            $.each(data.invalids, function(i, n) {
                $form.find(n.into).wpcf7NotValidTip(n.message);
                $form.find(n.into).find('.wpcf7-form-control').addClass('wpcf7-not-valid');
                $form.find(n.into).find('[aria-invalid]').attr('aria-invalid', 'true');
            });

            $responseOutput.addClass('wpcf7-validation-errors');
            $form.addClass('invalid');

            $(data.into).trigger('invalid.wpcf7');

        } else if (1 == data.spam) {
            $responseOutput.addClass('wpcf7-spam-blocked');
            $form.addClass('spam');

            $(data.into).trigger('spam.wpcf7');

        } else if (1 == data.mailSent) {
            $responseOutput.addClass('wpcf7-mail-sent-ok');
            $form.addClass('sent');

            if (data.onSentOk)
                $.each(data.onSentOk, function(i, n) {
                    eval(n)
                });

            $(data.into).trigger('mailsent.wpcf7');

        } else {
            $responseOutput.addClass('wpcf7-mail-sent-ng');
            $form.addClass('failed');

            $(data.into).trigger('mailfailed.wpcf7');
        }

        if (data.onSubmit)
            $.each(data.onSubmit, function(i, n) {
                eval(n)
            });

        $(data.into).trigger('submit.wpcf7');

        if (1 == data.mailSent)
            $form.resetForm();

        $form.find('[placeholder].placeheld').on('each', function(i, n) {
            $(n).val($(n).attr('placeholder'));
        });

        $responseOutput.append(data.message).slideDown('fast');
        $responseOutput.attr('role', 'alert');

        $.wpcf7UpdateScreenReaderResponse($form, data);
    };

    $.fn.wpcf7ExclusiveCheckbox = function() {
        return this.find('input:checkbox').on('click', function() {
            var name = $(this).attr('name');
            $(this).closest('form').find('input:checkbox[name="' + name + '"]').not(this).prop('checked', false);
        });
    };

    $.fn.wpcf7Placeholder = function() {
        if (_wpcf7.supportHtml5.placeholder)
            return this;

        return this.on("each", function() {
            $(this).val($(this).attr('placeholder'));
            $(this).addClass('placeheld');

            $(this).on("focus", function() {
                if ($(this).hasClass('placeheld'))
                    $(this).val('').removeClass('placeheld');
            });

            $(this).on("blur", function() {
                if ('' == $(this).val()) {
                    $(this).val($(this).attr('placeholder'));
                    $(this).addClass('placeheld');
                }
            });
        });
    };

    $.fn.wpcf7AjaxLoader = function() {
        return this.on("each", function() {
            var loader = $('<img class="ajax-loader" />')
                .attr({
                    src: _wpcf7.loaderUrl,
                    alt: _wpcf7.sending
                })
                .css('visibility', 'hidden');

            $(this).after(loader);
        });
    };

    $.fn.wpcf7ToggleSubmit = function() {
        return this.on("each", function() {
            var form = $(this);
            if (this.tagName.toLowerCase() != 'form')
                form = $(this).find('form').first();

            if (form.hasClass('wpcf7-acceptance-as-validation'))
                return;

            var submit = form.find('input:submit');
            if (!submit.length) return;

            var acceptances = form.find('input:checkbox.wpcf7-acceptance');
            if (!acceptances.length) return;

            submit.removeAttr('disabled');
            acceptances.on("each", function(i, n) {
                n = $(n);
                if (n.hasClass('wpcf7-invert') && n.is(':checked') || !n.hasClass('wpcf7-invert') && !n.is(':checked'))
                    submit.attr('disabled', 'disabled');
            });
        });
    };

    $.fn.wpcf7ToggleCheckboxFreetext = function() {
        return this.on("each", function() {
            var $wrap = $(this).closest('.wpcf7-form-control');

            if ($(this).find(':checkbox, :radio').is(':checked')) {
                $(this).find(':input.wpcf7-free-text').prop('disabled', false);
            } else {
                $(this).find(':input.wpcf7-free-text').prop('disabled', true);
            }

            $wrap.find(':checkbox, :radio').on("change", function() {
                var $cb = $('.has-free-text', $wrap).find(':checkbox, :radio');
                var $freetext = $(':input.wpcf7-free-text', $wrap);

                if ($cb.is(':checked')) {
                    $freetext.prop('disabled', false).focus();
                } else {
                    $freetext.prop('disabled', true);
                }
            });
        });
    };

    $.fn.wpcf7CharacterCount = function() {
        return this.on("each", function() {
            var $count = $(this);
            var name = $count.attr('data-target-name');
            var down = $count.hasClass('down');
            var starting = parseInt($count.attr('data-starting-value'), 10);
            var maximum = parseInt($count.attr('data-maximum-value'), 10);
            var minimum = parseInt($count.attr('data-minimum-value'), 10);

            var updateCount = function($target) {
                var length = $target.val().length;
                var count = down ? starting - length : length;
                $count.attr('data-current-value', count);
                $count.text(count);

                if (maximum && maximum < length) {
                    $count.addClass('too-long');
                } else {
                    $count.removeClass('too-long');
                }

                if (minimum && length < minimum) {
                    $count.addClass('too-short');
                } else {
                    $count.removeClass('too-short');
                }
            };

            $count.closest('form').find(':input[name="' + name + '"]').on('each', function () {
                updateCount($(this));

                $(this).keyup(function() {
                    updateCount($(this));
                });
            });
        });
    };

    $.fn.wpcf7NormalizeUrl = function() {
        return this.on("each", function() {
            var val = $.trim($(this).val());

            if (val && !val.match(/^[a-z][a-z0-9.+-]*:/i)) { // check the scheme part
                val = val.replace(/^\/+/, '');
                val = 'http://' + val;
            }

            $(this).val(val);
        });
    };

    $.fn.wpcf7NotValidTip = function(message) {
        return this.on("each", function() {
            var $into = $(this);

            $into.find('span.wpcf7-not-valid-tip').remove();
            $into.append('<span role="alert" class="wpcf7-not-valid-tip">' + message + '</span>');

            if ($into.is('.use-floating-validation-tip *')) {
                $('.wpcf7-not-valid-tip', $into).on('mouseover', function() {
                    $(this).wpcf7FadeOut();
                });

                $(':input', $into).on('focus', function() {
                    $('.wpcf7-not-valid-tip', $into).not(':hidden').wpcf7FadeOut();
                });
            }
        });
    };

    $.fn.wpcf7FadeOut = function() {
        return this.on("each", function() {
            $(this).animate({
                opacity: 0
            }, 'fast', function() {
                $(this).css({
                    'z-index': -100
                });
            });
        });
    };

    $.fn.wpcf7OnloadRefill = function() {
        return this.on("each", function() {
            var url = $(this).attr('action');
            if (0 < url.indexOf('#'))
                url = url.substr(0, url.indexOf('#'));

            var id = $(this).find('input[name="_wpcf7"]').val();
            var unitTag = $(this).find('input[name="_wpcf7_unit_tag"]').val();

            $.getJSON(url, {
                    _wpcf7_is_ajax_call: 1,
                    _wpcf7: id,
                    _wpcf7_request_ver: $.now()
                },
                function(data) {
                    if (data && data.captcha)
                        $('#' + unitTag).wpcf7RefillCaptcha(data.captcha);

                    if (data && data.quiz)
                        $('#' + unitTag).wpcf7RefillQuiz(data.quiz);
                }
            );
        });
    };

    $.fn.wpcf7RefillCaptcha = function(captcha) {
        return this.on("each", function() {
            var form = $(this);

            $.each(captcha, function(i, n) {
                form.find(':input[name="' + i + '"]').clearFields();
                form.find('img.wpcf7-captcha-' + i).attr('src', n);
                var match = /([0-9]+)\.(png|gif|jpeg)$/.exec(n);
                form.find('input:hidden[name="_wpcf7_captcha_challenge_' + i + '"]').attr('value', match[1]);
            });
        });
    };

    $.fn.wpcf7RefillQuiz = function(quiz) {
        return this.on("each", function() {
            var form = $(this);

            $.each(quiz, function(i, n) {
                form.find(':input[name="' + i + '"]').clearFields();
                form.find(':input[name="' + i + '"]').siblings('span.wpcf7-quiz-label').text(n[0]);
                form.find('input:hidden[name="_wpcf7_quiz_answer_' + i + '"]').attr('value', n[1]);
            });
        });
    };

    $.fn.wpcf7ClearResponseOutput = function() {
        return this.on("each", function() {
            $(this).find('div.wpcf7-response-output').hide().empty().removeClass('wpcf7-mail-sent-ok wpcf7-mail-sent-ng wpcf7-validation-errors wpcf7-spam-blocked').removeAttr('role');
            $(this).find('span.wpcf7-not-valid-tip').remove();
            $(this).find('img.ajax-loader').css({
                visibility: 'hidden'
            });
        });
    };

    $.wpcf7UpdateScreenReaderResponse = function($form, data) {
        $('.wpcf7 .screen-reader-response').html('').attr('role', '');

        if (data.message) {
            var $response = $form.siblings('.screen-reader-response').first();
            $response.append(data.message);

            if (data.invalids) {
                var $invalids = $('<ul></ul>');

                $.each(data.invalids, function(i, n) {
                    if (n.idref) {
                        var $li = $('<li></li>').append($('<a></a>').attr('href', '#' + n.idref).append(n.message));
                    } else {
                        var $li = $('<li></li>').append(n.message);
                    }

                    $invalids.append($li);
                });

                $response.append($invalids);
            }

            $response.attr('role', 'alert').focus();
        }
    };

    $.wpcf7SupportHtml5 = function() {
        var features = {};
        var input = document.createElement('input');

        features.placeholder = 'placeholder' in input;

        var inputTypes = ['email', 'url', 'tel', 'number', 'range', 'date'];

        $.each(inputTypes, function(index, value) {
            input.setAttribute('type', value);
            features[value] = input.type !== 'text';
        });

        return features;
    };

})(jQuery);;



/*
 * Collection of script for formatting the visual plus
 * additional styling and features.
 * 
 * @author jason.xie@victheme.com
 */
(function($) {
    "use strict";

    var VTVisualPlus = {
        $doc: $(document),
        $win: $(window)
    };

    if (VTVisualPlus.$doc.find('.js-fullscreen').length) {
        VTVisualPlus.fullHeight = {
            init: function() {
                this.$el = VTVisualPlus.$doc.find('.js-fullscreen');
                return this;
            },
            destroy: function() {
                this.$el.each(function() {
                    $(this).css('width', '').css('height', '');
                });
                return this;
            },
            reposition: function() {
                var that = this;
                this.$el.each(function() {
                    that.$current = $(this);
                    if (that.$current.height() < VTVisualPlus.$win.height()) {
                        that.$current.height(VTVisualPlus.$win.height()).width(VTVisualPlus.$win.width());
                    } else if (that.$current.height() > VTVisualPlus.$win.height()) {
                        that.$current.css('width', '').css('height', '');
                    }
                });

                return this;
            }
        }

        VTVisualPlus.fullHeight.init().reposition();
    }

    /**
    if (VTVisualPlus.$doc.find('.js-nicescroll')) {
      VTVisualPlus.niceScroll = {
        init: function() {
          this.$el = VTVisualPlus.$doc.find('.js-nicescroll').find('.gabby_row');
          return this;
        },
        reposition: function() {
          this.$el.each(function() {
            //$(this).niceScroll();
          })
        }
      }

      VTVisualPlus.niceScroll.init().reposition();
    }
     **/

    if (VTVisualPlus.$doc.find('.js-verticalcenter').length) {
        VTVisualPlus.verticalCenter = {
            init: function() {
                this.$el = {};
                this.$parent = {};
                var that = this;
                VTVisualPlus.$doc.find('.js-verticalcenter').on('each', function(key, items) {
                    that.$el[key] = $(this).find('.gabby_row').eq(0);
                    that.$el[key].addClass('js-verticaltarget');
                    that.$parent[key] = $(this);
                });

                return this;
            },
            destroy: function() {
                var that = this;
                $.each(this.$el, function(key, item) {
                    $(this).css('margin-top', '').css('top', '');
                });

                return this;
            },
            reposition: function() {
                var that = this;
                $.each(this.$el, function(key, item) {
                    that.$current = $(this);

                    if (that.$current.height() < that.$parent[key].height()) {
                        that.$current.css({
                            position: 'relative',
                            marginTop: (that.$parent[key].height() - that.$current.height()) / 2
                        });
                    } else {
                        that.$current.css('margin-top', '').css('top', '');
                    }
                });

                return this;
            }
        }

        VTVisualPlus.verticalCenter.init().reposition();
    }


    if (VTVisualPlus.$doc.find('.js-deckmode').length) {

        VTVisualPlus.deckMode = {
            init: function() {
                this.$parent = VTVisualPlus.$doc.find('.js-deckmode').eq(0).parent();

                this.$parent.snapscroll();
            }
        }
    }

    if (VTVisualPlus.$doc.find('.gabby_text_column.fittext p').length) {

        VTVisualPlus.fitText = {
            init: function() {
                this.$el = VTVisualPlus.$doc.find('.fittext');

                // Fix VC Text failed to use fittext js
                this.fixVCText();
                return this;
            },
            fixVCText: function() {
                this.$el.filter('.gabby_text_column').removeClass('fittext').find('p').addClass('fittext');
            }
        }

        VTVisualPlus.fitText.init();
    }


    $(window)
        .on('resize.visualplus resize_end.visualplus', function() {
            setTimeout(function() {
                VTVisualPlus.fullHeight && VTVisualPlus.fullHeight.destroy().reposition();
            }, 1)

            setTimeout(function() {
                VTVisualPlus.verticalCenter && VTVisualPlus.verticalCenter.destroy().reposition();
            }, 1)
        })
        .on('load.visualplus pageready.visualplus', function() {
            VTVisualPlus.fullHeight && VTVisualPlus.fullHeight.reposition();
            VTVisualPlus.verticalCenter && VTVisualPlus.verticalCenter.reposition();
            // VTVisualPlus.niceScroll && VTVisualPlus.niceScroll.reposition();
        });

    $(document)
        .on('ready.visualplus', function() {
            // Don't call this before document ready to avoid deps not loaded yet bug.
            VTVisualPlus.deckMode && VTVisualPlus.deckMode.init();
        })
        .on('ajaxComplete.visualplus', function() {
            VTVisualPlus.fullHeight && VTVisualPlus.fullHeight.init().reposition();
            VTVisualPlus.verticalCenter && VTVisualPlus.verticalCenter.init().reposition();
            // VTVisualPlus.niceScroll && VTVisualPlus.niceScroll.init().reposition();
        })

})(jQuery);;


/*
 * Isotope PACKAGED v2.1.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 * 
 * Customized Version Don't use the standard
 * one as it will break.
 * 
 * 1. Added gutter width and height for fitrows
 * 2. Added equalheight for fitrows
 * 3. bubbling the layoutComplete to document via jquery
 */

/**
 * Bridget makes jQuery widgets
 * v1.1.0
 * MIT license
 */

(function(window) {
    "use strict";


    // -------------------------- utils -------------------------- //

    var slice = Array.prototype.slice;

    function noop() {}

    // -------------------------- definition -------------------------- //

    function defineBridget($) {

        // bail if no jQuery
        if (!$) {
            return;
        }

        // -------------------------- addOptionMethod -------------------------- //

        /**
         * adds option method -> $().plugin('option', {...})
         * @param {Function} PluginClass - constructor class
         */
        function addOptionMethod(PluginClass) {
            // don't overwrite original option method
            if (PluginClass.prototype.option) {
                return;
            }

            // option setter
            PluginClass.prototype.option = function(opts) {
                // bail out if not an object
                if (!$.isPlainObject(opts)) {
                    return;
                }
                this.options = $.extend(true, this.options, opts);
            };
        }

        // -------------------------- plugin bridge -------------------------- //

        // helper function for logging errors
        // $.error breaks jQuery chaining
        var logError = typeof console === 'undefined' ? noop :
            function(message) {
                console.error(message);
            };

        /**
         * jQuery plugin bridge, access methods like $elem.plugin('method')
         * @param {String} namespace - plugin name
         * @param {Function} PluginClass - constructor class
         */
        function bridge(namespace, PluginClass) {
            // add to jQuery fn namespace
            $.fn[namespace] = function(options) {
                if (typeof options === 'string') {
                    // call plugin method when first argument is a string
                    // get arguments for method
                    var args = slice.call(arguments, 1);

                    for (var i = 0, len = this.length; i < len; i++) {
                        var elem = this[i];
                        var instance = $.data(elem, namespace);
                        if (!instance) {
                            logError("cannot call methods on " + namespace + " prior to initialization; " +
                                "attempted to call '" + options + "'");
                            continue;
                        }
                        if (!$.isFunction(instance[options]) || options.charAt(0) === '_') {
                            logError("no such method '" + options + "' for " + namespace + " instance");
                            continue;
                        }

                        // trigger method with arguments
                        var returnValue = instance[options].apply(instance, args);

                        // break look and return first value if provided
                        if (returnValue !== undefined) {
                            return returnValue;
                        }
                    }
                    // return this if no return value
                    return this;
                } else {
                    return this.each( function () {
                        var instance = $.data(this, namespace);
                        if (instance) {
                            // apply options & init
                            instance.option(options);
                            instance._init();
                        } else {
                            // initialize new instance
                            instance = new PluginClass(this, options);
                            $.data(this, namespace, instance);
                        }
                    });
                }
            };

        }

        // -------------------------- bridget -------------------------- //

        /**
         * converts a Prototypical class into a proper jQuery plugin
         *   the class must have a ._init method
         * @param {String} namespace - plugin name, used in $().pluginName
         * @param {Function} PluginClass - constructor class
         */
        $.bridget = function(namespace, PluginClass) {
            addOptionMethod(PluginClass);
            bridge(namespace, PluginClass);
        };

        return $.bridget;

    }

    // transport
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('jquery-bridget/jquery.bridget', ['jquery'], defineBridget);
    } else if (typeof exports === 'object') {
        defineBridget(require('jquery'));
    } else {
        // get jquery from browser global
        defineBridget(window.jQuery);
    }

})(window);

/*
 * eventie v1.0.5
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

(function(window) {
    "use strict";


    var docElem = document.documentElement;

    var bind = function() {};

    function getIEEvent(obj) {
        var event = window.event;
        // add event.target
        event.target = event.target || event.srcElement || obj;
        return event;
    }

    if (docElem.addEventListener) {
        bind = function(obj, type, fn) {
            obj.addEventListener(type, fn, false);
        };
    } else if (docElem.attachEvent) {
        bind = function(obj, type, fn) {
            obj[type + fn] = fn.handleEvent ?
                function() {
                    var event = getIEEvent(obj);
                    fn.handleEvent.call(fn, event);
                } :
                function() {
                    var event = getIEEvent(obj);
                    fn.call(obj, event);
                };
            obj.attachEvent("on" + type, obj[type + fn]);
        };
    }

    var unbind = function() {};

    if (docElem.removeEventListener) {
        unbind = function(obj, type, fn) {
            obj.removeEventListener(type, fn, false);
        };
    } else if (docElem.detachEvent) {
        unbind = function(obj, type, fn) {
            obj.detachEvent("on" + type, obj[type + fn]);
            try {
                delete obj[type + fn];
            } catch (err) {
                // can't delete window object properties
                obj[type + fn] = undefined;
            }
        };
    }

    var eventie = {
        bind: bind,
        unbind: unbind
    };

    // ----- module definition ----- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('eventie/eventie', eventie);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = eventie;
    } else {
        // browser global
        window.eventie = eventie;
    }

})(this);

/*
 * docReady v1.0.4
 * Cross browser DOMContentLoaded event emitter
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true*/
/*global define: false, require: false, module: false */

(function(window) {
    "use strict";


    var document = window.document;
    // collection of functions to be triggered on ready
    var queue = [];

    function docReady(fn) {
        // throw out non-functions
        if (typeof fn !== 'function') {
            return;
        }

        if (docReady.isReady) {
            // ready now, hit it
            fn();
        } else {
            // queue function when ready
            queue.push(fn);
        }
    }

    docReady.isReady = false;

    // triggered on various doc ready events
    function onReady(event) {
        // bail if already triggered or IE8 document is not ready just yet
        var isIE8NotReady = event.type === 'readystatechange' && document.readyState !== 'complete';
        if (docReady.isReady || isIE8NotReady) {
            return;
        }

        trigger();
    }

    function trigger() {
        docReady.isReady = true;
        // process queue
        for (var i = 0, len = queue.length; i < len; i++) {
            var fn = queue[i];
            fn();
        }
    }

    function defineDocReady(eventie) {
        // trigger ready if page is ready
        if (document.readyState === 'complete') {
            trigger();
        } else {
            // listen for events
            eventie.bind(document, 'DOMContentLoaded', onReady);
            eventie.bind(document, 'readystatechange', onReady);
            eventie.bind(window, 'load', onReady);
        }

        return docReady;
    }

    // transport
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('doc-ready/doc-ready', ['eventie/eventie'], defineDocReady);
    } else if (typeof exports === 'object') {
        module.exports = defineDocReady(require('eventie'));
    } else {
        // browser global
        window.docReady = defineDocReady(window.eventie);
    }

})(window);

/*
 * EventEmitter v4.2.9 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function() {
    "use strict";

    /**
     * Class for managing events.
     * Can be extended to provide event functionality in other classes.
     *
     * @class EventEmitter Manages event registering and emitting.
     */
    function EventEmitter() {}

    // Shortcuts to improve speed and size
    var proto = EventEmitter.prototype;
    var exports = this;
    var originalGlobalValue = exports.EventEmitter;

    /**
     * Finds the index of the listener for the event in its storage array.
     *
     * @param {Function[]} listeners Array of listeners to search through.
     * @param {Function} listener Method to look for.
     * @return {Number} Index of the specified listener, -1 if not found
     * @api private
     */
    function indexOfListener(listeners, listener) {
        var i = listeners.length;
        while (i--) {
            if (listeners[i].listener === listener) {
                return i;
            }
        }

        return -1;
    }

    /**
     * Alias a method while keeping the context correct, to allow for overwriting of target method.
     *
     * @param {String} name The name of the target method.
     * @return {Function} The aliased method
     * @api private
     */
    function alias(name) {
        return function aliasClosure() {
            return this[name].apply(this, arguments);
        };
    }

    /**
     * Returns the listener array for the specified event.
     * Will initialise the event object and listener arrays if required.
     * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
     * Each property in the object response is an array of listener functions.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Function[]|Object} All listener functions for the event.
     */
    proto.getListeners = function getListeners(evt) {
        var events = this._getEvents();
        var response;
        var key;

        // Return a concatenated array of all matching events if
        // the selector is a regular expression.
        if (evt instanceof RegExp) {
            response = {};
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    response[key] = events[key];
                }
            }
        } else {
            response = events[evt] || (events[evt] = []);
        }

        return response;
    };

    /**
     * Takes a list of listener objects and flattens it into a list of listener functions.
     *
     * @param {Object[]} listeners Raw listener objects.
     * @return {Function[]} Just the listener functions.
     */
    proto.flattenListeners = function flattenListeners(listeners) {
        var flatListeners = [];
        var i;

        for (i = 0; i < listeners.length; i += 1) {
            flatListeners.push(listeners[i].listener);
        }

        return flatListeners;
    };

    /**
     * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
     *
     * @param {String|RegExp} evt Name of the event to return the listeners from.
     * @return {Object} All listener functions for an event in an object.
     */
    proto.getListenersAsObject = function getListenersAsObject(evt) {
        var listeners = this.getListeners(evt);
        var response;

        if (listeners instanceof Array) {
            response = {};
            response[evt] = listeners;
        }

        return response || listeners;
    };

    /**
     * Adds a listener function to the specified event.
     * The listener will not be added if it is a duplicate.
     * If the listener returns true then it will be removed after it is called.
     * If you pass a regular expression as the event name then the listener will be added to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListener = function addListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var listenerIsWrapped = typeof listener === 'object';
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
                listeners[key].push(listenerIsWrapped ? listener : {
                    listener: listener,
                    once: false
                });
            }
        }

        return this;
    };

    /**
     * Alias of addListener
     */
    proto.on = alias('addListener');

    /**
     * Semi-alias of addListener. It will add a listener that will be
     * automatically removed after its first execution.
     *
     * @param {String|RegExp} evt Name of the event to attach the listener to.
     * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addOnceListener = function addOnceListener(evt, listener) {
        return this.addListener(evt, {
            listener: listener,
            once: true
        });
    };

    /**
     * Alias of addOnceListener.
     */
    proto.once = alias('addOnceListener');

    /**
     * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
     * You need to tell it what event names should be matched by a regex.
     *
     * @param {String} evt Name of the event to create.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvent = function defineEvent(evt) {
        this.getListeners(evt);
        return this;
    };

    /**
     * Uses defineEvent to define multiple events.
     *
     * @param {String[]} evts An array of event names to define.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.defineEvents = function defineEvents(evts) {
        for (var i = 0; i < evts.length; i += 1) {
            this.defineEvent(evts[i]);
        }
        return this;
    };

    /**
     * Removes a listener function from the specified event.
     * When passed a regular expression as the event name, it will remove the listener from all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to remove the listener from.
     * @param {Function} listener Method to remove from the event.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListener = function removeListener(evt, listener) {
        var listeners = this.getListenersAsObject(evt);
        var index;
        var key;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                index = indexOfListener(listeners[key], listener);

                if (index !== -1) {
                    listeners[key].splice(index, 1);
                }
            }
        }

        return this;
    };

    /**
     * Alias of removeListener
     */
    proto.off = alias('removeListener');

    /**
     * Adds listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
     * You can also pass it a regular expression to add the array of listeners to all events that match it.
     * Yeah, this function does quite a bit. That's probably a bad thing.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.addListeners = function addListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(false, evt, listeners);
    };

    /**
     * Removes listeners in bulk using the manipulateListeners method.
     * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be removed.
     * You can also pass it a regular expression to remove the listeners from all events that match it.
     *
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeListeners = function removeListeners(evt, listeners) {
        // Pass through to manipulateListeners
        return this.manipulateListeners(true, evt, listeners);
    };

    /**
     * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
     * The first argument will determine if the listeners are removed (true) or added (false).
     * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
     * You can also pass it an event name and an array of listeners to be added/removed.
     * You can also pass it a regular expression to manipulate the listeners of all events that match it.
     *
     * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
     * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
     * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
        var i;
        var value;
        var single = remove ? this.removeListener : this.addListener;
        var multiple = remove ? this.removeListeners : this.addListeners;

        // If evt is an object then pass each of its properties to this method
        if (typeof evt === 'object' && !(evt instanceof RegExp)) {
            for (i in evt) {
                if (evt.hasOwnProperty(i) && (value = evt[i])) {
                    // Pass the single listener straight through to the singular method
                    if (typeof value === 'function') {
                        single.call(this, i, value);
                    } else {
                        // Otherwise pass back to the multiple function
                        multiple.call(this, i, value);
                    }
                }
            }
        } else {
            // So evt must be a string
            // And listeners must be an array of listeners
            // Loop over it and pass each one to the multiple method
            i = listeners.length;
            while (i--) {
                single.call(this, evt, listeners[i]);
            }
        }

        return this;
    };

    /**
     * Removes all listeners from a specified event.
     * If you do not specify an event then all listeners will be removed.
     * That means every event will be emptied.
     * You can also pass a regex to remove all events that match it.
     *
     * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.removeEvent = function removeEvent(evt) {
        var type = typeof evt;
        var events = this._getEvents();
        var key;

        // Remove different things depending on the state of evt
        if (type === 'string') {
            // Remove all listeners for the specified event
            delete events[evt];
        } else if (evt instanceof RegExp) {
            // Remove all events matching the regex.
            for (key in events) {
                if (events.hasOwnProperty(key) && evt.test(key)) {
                    delete events[key];
                }
            }
        } else {
            // Remove all listeners in all events
            delete this._events;
        }

        return this;
    };

    /**
     * Alias of removeEvent.
     *
     * Added to mirror the node API.
     */
    proto.removeAllListeners = alias('removeEvent');

    /**
     * Emits an event of your choice.
     * When emitted, every listener attached to that event will be executed.
     * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
     * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
     * So they will not arrive within the array on the other side, they will be separate.
     * You can also pass a regular expression to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {Array} [args] Optional array of arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emitEvent = function emitEvent(evt, args) {
        var listeners = this.getListenersAsObject(evt);
        var listener;
        var i;
        var key;
        var response;

        for (key in listeners) {
            if (listeners.hasOwnProperty(key)) {
                i = listeners[key].length;

                while (i--) {
                    // If the listener returns true then it shall be removed from the event
                    // The function is executed either with a basic call or an apply if there is an args array
                    listener = listeners[key][i];

                    if (listener.once === true) {
                        this.removeListener(evt, listener.listener);
                    }

                    response = listener.listener.apply(this, args || []);

                    if (response === this._getOnceReturnValue()) {
                        this.removeListener(evt, listener.listener);
                    }
                }
            }
        }

        return this;
    };

    /**
     * Alias of emitEvent
     */
    proto.trigger = alias('emitEvent');

    /**
     * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
     * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
     *
     * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
     * @param {...*} Optional additional arguments to be passed to each listener.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.emit = function emit(evt) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.emitEvent(evt, args);
    };

    /**
     * Sets the current value to check against when executing listeners. If a
     * listeners return value matches the one set here then it will be removed
     * after execution. This value defaults to true.
     *
     * @param {*} value The new value to check for when executing listeners.
     * @return {Object} Current instance of EventEmitter for chaining.
     */
    proto.setOnceReturnValue = function setOnceReturnValue(value) {
        this._onceReturnValue = value;
        return this;
    };

    /**
     * Fetches the current value to check against when executing listeners. If
     * the listeners return value matches this one then it should be removed
     * automatically. It will return true by default.
     *
     * @return {*|Boolean} The current value to check for or the default, true.
     * @api private
     */
    proto._getOnceReturnValue = function _getOnceReturnValue() {
        if (this.hasOwnProperty('_onceReturnValue')) {
            return this._onceReturnValue;
        } else {
            return true;
        }
    };

    /**
     * Fetches the events object and creates one if required.
     *
     * @return {Object} The events storage object.
     * @api private
     */
    proto._getEvents = function _getEvents() {
        return this._events || (this._events = {});
    };

    /**
     * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
     *
     * @return {Function} Non conflicting EventEmitter class.
     */
    EventEmitter.noConflict = function noConflict() {
        exports.EventEmitter = originalGlobalValue;
        return EventEmitter;
    };

    // Expose the class either via AMD, CommonJS or the global object
    if (typeof define === 'function' && define.amd) {
        define('eventEmitter/EventEmitter', [], function() {
            return EventEmitter;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = EventEmitter;
    } else {
        exports.EventEmitter = EventEmitter;
    }
}.call(this));

/*
 * getStyleProperty v1.0.4
 * original by kangax
 * http://perfectionkills.com/feature-testing-css-properties/
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false, exports: false, module: false */

(function(window) {
    "use strict";


    var prefixes = 'Webkit Moz ms Ms O'.split(' ');
    var docElemStyle = document.documentElement.style;

    function getStyleProperty(propName) {
        if (!propName) {
            return;
        }

        // test standard property first
        if (typeof docElemStyle[propName] === 'string') {
            return propName;
        }

        // capitalize
        propName = propName.charAt(0).toUpperCase() + propName.slice(1);

        // test vendor specific properties
        var prefixed;
        for (var i = 0, len = prefixes.length; i < len; i++) {
            prefixed = prefixes[i] + propName;
            if (typeof docElemStyle[prefixed] === 'string') {
                return prefixed;
            }
        }
    }

    // transport
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('get-style-property/get-style-property', [], function() {
            return getStyleProperty;
        });
    } else if (typeof exports === 'object') {
        // CommonJS for Component
        module.exports = getStyleProperty;
    } else {
        // browser global
        window.getStyleProperty = getStyleProperty;
    }

})(window);

/*
 * getSize v1.2.2
 * measure size of elements
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, exports: false, require: false, module: false, console: false */

(function(window, undefined) {
    "use strict";


    // -------------------------- helpers -------------------------- //

    // get a number from a string, not a percentage
    function getStyleSize(value) {
        var num = parseFloat(value);
        // not a percent like '100%', and a number
        var isValid = value.indexOf('%') === -1 && !isNaN(num);
        return isValid && num;
    }

    function noop() {}

    var logError = typeof console === 'undefined' ? noop :
        function(message) {
            console.error(message);
        };

    // -------------------------- measurements -------------------------- //

    var measurements = [
        'paddingLeft',
        'paddingRight',
        'paddingTop',
        'paddingBottom',
        'marginLeft',
        'marginRight',
        'marginTop',
        'marginBottom',
        'borderLeftWidth',
        'borderRightWidth',
        'borderTopWidth',
        'borderBottomWidth'
    ];

    function getZeroSize() {
        var size = {
            width: 0,
            height: 0,
            innerWidth: 0,
            innerHeight: 0,
            outerWidth: 0,
            outerHeight: 0
        };
        for (var i = 0, len = measurements.length; i < len; i++) {
            var measurement = measurements[i];
            size[measurement] = 0;
        }
        return size;
    }



    function defineGetSize(getStyleProperty) {

        // -------------------------- setup -------------------------- //

        var isSetup = false;

        var getStyle, boxSizingProp, isBoxSizeOuter;

        /**
         * setup vars and functions
         * do it on initial getSize(), rather than on script load
         * For Firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=548397
         */
        function setup() {
            // setup once
            if (isSetup) {
                return;
            }
            isSetup = true;

            var getComputedStyle = window.getComputedStyle;

            getStyle = (function() {
                var getStyleFn = getComputedStyle ?
                    function(elem) {
                        return getComputedStyle(elem, null);
                    } :
                    function(elem) {
                        return elem.currentStyle;
                    };

                return function getStyle(elem) {
                    var style = getStyleFn(elem);
                    if (!style) {
                        logError('Style returned ' + style +
                            '. Are you running this code in a hidden iframe on Firefox? ' +
                            'See http://bit.ly/getsizebug1');
                    }
                    return style;
                };
            })();

            // -------------------------- box sizing -------------------------- //

            boxSizingProp = getStyleProperty('boxSizing');

            /**
             * WebKit measures the outer-width on style.width on border-box elems
             * IE & Firefox measures the inner-width
             */
            if (boxSizingProp) {
                var div = document.createElement('div');
                div.style.width = '200px';
                div.style.padding = '1px 2px 3px 4px';
                div.style.borderStyle = 'solid';
                div.style.borderWidth = '1px 2px 3px 4px';
                div.style[boxSizingProp] = 'border-box';

                var body = document.body || document.documentElement;
                body.appendChild(div);
                var style = getStyle(div);

                isBoxSizeOuter = getStyleSize(style.width) === 200;
                body.removeChild(div);
            }

        }

        // -------------------------- getSize -------------------------- //

        function getSize(elem) {
            setup();

            // use querySeletor if elem is string
            if (typeof elem === 'string') {
                elem = document.querySelector(elem);
            }

            // do not proceed on non-objects
            if (!elem || typeof elem !== 'object' || !elem.nodeType) {
                return;
            }

            var style = getStyle(elem);

            // if hidden, everything is 0
            if (style.display === 'none') {
                return getZeroSize();
            }

            var size = {};
            size.width = elem.offsetWidth;
            size.height = elem.offsetHeight;

            var isBorderBox = size.isBorderBox = !!(boxSizingProp &&
                style[boxSizingProp] && style[boxSizingProp] === 'border-box');

            // get all measurements
            for (var i = 0, len = measurements.length; i < len; i++) {
                var measurement = measurements[i];
                var value = style[measurement];
                value = mungeNonPixel(elem, value);
                var num = parseFloat(value);
                // any 'auto', 'medium' value will be 0
                size[measurement] = !isNaN(num) ? num : 0;
            }

            var paddingWidth = size.paddingLeft + size.paddingRight;
            var paddingHeight = size.paddingTop + size.paddingBottom;
            var marginWidth = size.marginLeft + size.marginRight;
            var marginHeight = size.marginTop + size.marginBottom;
            var borderWidth = size.borderLeftWidth + size.borderRightWidth;
            var borderHeight = size.borderTopWidth + size.borderBottomWidth;

            var isBorderBoxSizeOuter = isBorderBox && isBoxSizeOuter;

            // overwrite width and height if we can get it from style
            var styleWidth = getStyleSize(style.width);
            if (styleWidth !== false) {
                size.width = styleWidth +
                    // add padding and border unless it's already including it
                    (isBorderBoxSizeOuter ? 0 : paddingWidth + borderWidth);
            }

            var styleHeight = getStyleSize(style.height);
            if (styleHeight !== false) {
                size.height = styleHeight +
                    // add padding and border unless it's already including it
                    (isBorderBoxSizeOuter ? 0 : paddingHeight + borderHeight);
            }

            size.innerWidth = size.width - (paddingWidth + borderWidth);
            size.innerHeight = size.height - (paddingHeight + borderHeight);

            size.outerWidth = size.width + marginWidth;
            size.outerHeight = size.height + marginHeight;

            return size;
        }

        // IE8 returns percent values, not pixels
        // taken from jQuery's curCSS
        function mungeNonPixel(elem, value) {
            // IE8 and has percent value
            if (window.getComputedStyle || value.indexOf('%') === -1) {
                return value;
            }
            var style = elem.style;
            // Remember the original values
            var left = style.left;
            var rs = elem.runtimeStyle;
            var rsLeft = rs && rs.left;

            // Put in the new values to get a computed value out
            if (rsLeft) {
                rs.left = elem.currentStyle.left;
            }
            style.left = value;
            value = style.pixelLeft;

            // Revert the changed values
            style.left = left;
            if (rsLeft) {
                rs.left = rsLeft;
            }

            return value;
        }

        return getSize;

    }

    // transport
    if (typeof define === 'function' && define.amd) {
        // AMD for RequireJS
        define('get-size/get-size', ['get-style-property/get-style-property'], defineGetSize);
    } else if (typeof exports === 'object') {
        // CommonJS for Component
        module.exports = defineGetSize(require('desandro-get-style-property'));
    } else {
        // browser global
        window.getSize = defineGetSize(window.getStyleProperty);
    }

})(window);

/*
 * matchesSelector v1.0.2
 * matchesSelector( element, '.selector' )
 * MIT license
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

(function(ElemProto) {
    "use strict";


    var matchesMethod = (function() {
        // check un-prefixed
        if (ElemProto.matchesSelector) {
            return 'matchesSelector';
        }
        // check vendor prefixes
        var prefixes = ['webkit', 'moz', 'ms', 'o'];

        for (var i = 0, len = prefixes.length; i < len; i++) {
            var prefix = prefixes[i];
            var method = prefix + 'MatchesSelector';
            if (ElemProto[method]) {
                return method;
            }
        }
    })();

    // ----- match ----- //

    function match(elem, selector) {
        return elem[matchesMethod](selector);
    }

    // ----- appendToFragment ----- //

    function checkParent(elem) {
        // not needed if already has parent
        if (elem.parentNode) {
            return;
        }
        var fragment = document.createDocumentFragment();
        fragment.appendChild(elem);
    }

    // ----- query ----- //

    // fall back to using QSA
    // thx @jonathantneal https://gist.github.com/3062955
    function query(elem, selector) {
        // append to fragment if no parent
        checkParent(elem);

        // match elem with all selected elems of parent
        var elems = elem.parentNode.querySelectorAll(selector);

        for (var i = 0, len = elems.length; i < len; i++) {
            // return true if match
            if (elems[i] === elem) {
                return true;
            }
        }
        // otherwise return false
        return false;
    }

    // ----- matchChild ----- //

    function matchChild(elem, selector) {
        checkParent(elem);
        return match(elem, selector);
    }

    // ----- matchesSelector ----- //

    var matchesSelector;

    if (matchesMethod) {
        // IE9 supports matchesSelector, but doesn't work on orphaned elems
        // check for that
        var div = document.createElement('div');
        var supportsOrphans = match(div, 'div');
        matchesSelector = supportsOrphans ? match : matchChild;
    } else {
        matchesSelector = query;
    }

    // transport
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('matches-selector/matches-selector', [], function() {
            return matchesSelector;
        });
    } else if (typeof exports === 'object') {
        module.exports = matchesSelector;
    } else {
        // browser global
        window.matchesSelector = matchesSelector;
    }

})(Element.prototype);

/*
 * Outlayer Item
 */

(function(window) {
    "use strict";


    // ----- get style ----- //

    var getComputedStyle = window.getComputedStyle;
    var getStyle = getComputedStyle ?
        function(elem) {
            return getComputedStyle(elem, null);
        } :
        function(elem) {
            return elem.currentStyle;
        };


    // extend objects
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }

    function isEmptyObj(obj) {
        for (var prop in obj) {
            return false;
        }
        prop = null;
        return true;
    }

    // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
    function toDash(str) {
        return str.replace(/([A-Z])/g, function($1) {
            return '-' + $1.toLowerCase();
        });
    }

    // -------------------------- Outlayer definition -------------------------- //

    function outlayerItemDefinition(EventEmitter, getSize, getStyleProperty) {

        // -------------------------- CSS3 support -------------------------- //

        var transitionProperty = getStyleProperty('transition');
        var transformProperty = getStyleProperty('transform');
        var supportsCSS3 = transitionProperty && transformProperty;
        var is3d = !!getStyleProperty('perspective');

        var transitionEndEvent = {
            WebkitTransition: 'webkitTransitionEnd',
            MozTransition: 'transitionend',
            OTransition: 'otransitionend',
            transition: 'transitionend'
        }[transitionProperty];

        // properties that could have vendor prefix
        var prefixableProperties = [
            'transform',
            'transition',
            'transitionDuration',
            'transitionProperty'
        ];

        // cache all vendor properties
        var vendorProperties = (function() {
            var cache = {};
            for (var i = 0, len = prefixableProperties.length; i < len; i++) {
                var prop = prefixableProperties[i];
                var supportedProp = getStyleProperty(prop);
                if (supportedProp && supportedProp !== prop) {
                    cache[prop] = supportedProp;
                }
            }
            return cache;
        })();

        // -------------------------- Item -------------------------- //

        function Item(element, layout) {
            if (!element) {
                return;
            }

            this.element = element;
            // parent layout class, i.e. Masonry, Isotope, or Packery
            this.layout = layout;
            this.position = {
                x: 0,
                y: 0
            };

            this._create();
        }

        // inherit EventEmitter
        extend(Item.prototype, EventEmitter.prototype);

        Item.prototype._create = function() {
            // transition objects
            this._transn = {
                ingProperties: {},
                clean: {},
                onEnd: {}
            };

            this.css({
                position: 'absolute'
            });
        };

        // trigger specified handler for event type
        Item.prototype.handleEvent = function(event) {
            var method = 'on' + event.type;
            if (this[method]) {
                this[method](event);
            }
        };

        Item.prototype.getSize = function() {
            this.size = getSize(this.element);
        };

        /**
         * apply CSS styles to element
         * @param {Object} style
         */
        Item.prototype.css = function(style) {
            var elemStyle = this.element.style;

            for (var prop in style) {
                // use vendor property if available
                var supportedProp = vendorProperties[prop] || prop;
                elemStyle[supportedProp] = style[prop];
            }
        };

        // measure position, and sets it
        Item.prototype.getPosition = function() {
            var style = getStyle(this.element);
            var layoutOptions = this.layout.options;
            var isOriginLeft = layoutOptions.isOriginLeft;
            var isOriginTop = layoutOptions.isOriginTop;
            var x = parseInt(style[isOriginLeft ? 'left' : 'right'], 10);
            var y = parseInt(style[isOriginTop ? 'top' : 'bottom'], 10);

            // clean up 'auto' or other non-integer values
            x = isNaN(x) ? 0 : x;
            y = isNaN(y) ? 0 : y;
            // remove padding from measurement
            var layoutSize = this.layout.size;
            x -= isOriginLeft ? layoutSize.paddingLeft : layoutSize.paddingRight;
            y -= isOriginTop ? layoutSize.paddingTop : layoutSize.paddingBottom;

            this.position.x = x;
            this.position.y = y;
        };

        // set settled position, apply padding
        Item.prototype.layoutPosition = function() {
            var layoutSize = this.layout.size;
            var layoutOptions = this.layout.options;
            var style = {};

            if (layoutOptions.isOriginLeft) {
                style.left = (this.position.x + layoutSize.paddingLeft) + 'px';
                // reset other property
                style.right = '';
            } else {
                style.right = (this.position.x + layoutSize.paddingRight) + 'px';
                style.left = '';
            }

            if (layoutOptions.isOriginTop) {
                style.top = (this.position.y + layoutSize.paddingTop) + 'px';
                style.bottom = '';
            } else {
                style.bottom = (this.position.y + layoutSize.paddingBottom) + 'px';
                style.top = '';
            }

            this.css(style);
            this.emitEvent('layout', [this]);
        };


        // transform translate function
        var translate = is3d ?
            function(x, y) {
                return 'translate3d(' + x + 'px, ' + y + 'px, 0)';
            } :
            function(x, y) {
                return 'translate(' + x + 'px, ' + y + 'px)';
            };


        Item.prototype._transitionTo = function(x, y) {
            this.getPosition();
            // get current x & y from top/left
            var curX = this.position.x;
            var curY = this.position.y;

            var compareX = parseInt(x, 10);
            var compareY = parseInt(y, 10);
            var didNotMove = compareX === this.position.x && compareY === this.position.y;

            // save end position
            this.setPosition(x, y);

            // if did not move and not transitioning, just go to layout
            if (didNotMove && !this.isTransitioning) {
                this.layoutPosition();
                return;
            }

            var transX = x - curX;
            var transY = y - curY;
            var transitionStyle = {};
            // flip cooridinates if origin on right or bottom
            var layoutOptions = this.layout.options;
            transX = layoutOptions.isOriginLeft ? transX : -transX;
            transY = layoutOptions.isOriginTop ? transY : -transY;
            transitionStyle.transform = translate(transX, transY);

            this.transition({
                to: transitionStyle,
                onTransitionEnd: {
                    transform: this.layoutPosition
                },
                isCleaning: true
            });
        };

        // non transition + transform support
        Item.prototype.goTo = function(x, y) {
            this.setPosition(x, y);
            this.layoutPosition();
        };

        // use transition and transforms if supported
        Item.prototype.moveTo = supportsCSS3 ?
            Item.prototype._transitionTo : Item.prototype.goTo;

        Item.prototype.setPosition = function(x, y) {
            // Author claims that fractional positioning will blur text
            // although it is not proven but for safe bet just roundup the number
            this.position.x = Math.ceil(x); //parseFloat( x, 10 );
            this.position.y = Math.ceil(y); //parseFloat( y, 10 );
        };

        // ----- transition ----- //

        /**
         * @param {Object} style - CSS
         * @param {Function} onTransitionEnd
         */

        // non transition, just trigger callback
        Item.prototype._nonTransition = function(args) {
            this.css(args.to);
            if (args.isCleaning) {
                this._removeStyles(args.to);
            }
            for (var prop in args.onTransitionEnd) {
                args.onTransitionEnd[prop].call(this);
            }
        };

        /**
         * proper transition
         * @param {Object} args - arguments
         *   @param {Object} to - style to transition to
         *   @param {Object} from - style to start transition from
         *   @param {Boolean} isCleaning - removes transition styles after transition
         *   @param {Function} onTransitionEnd - callback
         */
        Item.prototype._transition = function(args) {
            // redirect to nonTransition if no transition duration
            if (!parseFloat(this.layout.options.transitionDuration)) {
                this._nonTransition(args);
                return;
            }

            var _transition = this._transn;
            // keep track of onTransitionEnd callback by css property
            for (var prop in args.onTransitionEnd) {
                _transition.onEnd[prop] = args.onTransitionEnd[prop];
            }
            // keep track of properties that are transitioning
            for (prop in args.to) {
                _transition.ingProperties[prop] = true;
                // keep track of properties to clean up when transition is done
                if (args.isCleaning) {
                    _transition.clean[prop] = true;
                }
            }

            // set from styles
            if (args.from) {
                this.css(args.from);
                // force redraw. http://blog.alexmaccaw.com/css-transitions
                var h = this.element.offsetHeight;
                // hack for JSHint to hush about unused var
                h = null;
            }
            // enable transition
            this.enableTransition(args.to);
            // set styles that are transitioning
            this.css(args.to);

            this.isTransitioning = true;

        };

        var itemTransitionProperties = transformProperty && (toDash(transformProperty) +
            ',opacity');

        Item.prototype.enableTransition = function( /* style */ ) {
            // only enable if not already transitioning
            // bug in IE10 were re-setting transition style will prevent
            // transitionend event from triggering
            if (this.isTransitioning) {
                return;
            }

            // make transition: foo, bar, baz from style object
            // TODO uncomment this bit when IE10 bug is resolved
            // var transitionValue = [];
            // for ( var prop in style ) {
            //   // dash-ify camelCased properties like WebkitTransition
            //   transitionValue.push( toDash( prop ) );
            // }
            // enable transition styles
            // HACK always enable transform,opacity for IE10
            this.css({
                transitionProperty: itemTransitionProperties,
                transitionDuration: this.layout.options.transitionDuration
            });
            // listen for transition end event
            this.element.addEventListener(transitionEndEvent, this, false);
        };

        Item.prototype.transition = Item.prototype[transitionProperty ? '_transition' : '_nonTransition'];

        // ----- events ----- //

        Item.prototype.onwebkitTransitionEnd = function(event) {
            this.ontransitionend(event);
        };

        Item.prototype.onotransitionend = function(event) {
            this.ontransitionend(event);
        };

        // properties that I munge to make my life easier
        var dashedVendorProperties = {
            '-webkit-transform': 'transform',
            '-moz-transform': 'transform',
            '-o-transform': 'transform'
        };

        Item.prototype.ontransitionend = function(event) {
            // disregard bubbled events from children
            if (event.target !== this.element) {
                return;
            }
            var _transition = this._transn;
            // get property name of transitioned property, convert to prefix-free
            var propertyName = dashedVendorProperties[event.propertyName] || event.propertyName;

            // remove property that has completed transitioning
            delete _transition.ingProperties[propertyName];
            // check if any properties are still transitioning
            if (isEmptyObj(_transition.ingProperties)) {
                // all properties have completed transitioning
                this.disableTransition();
            }
            // clean style
            if (propertyName in _transition.clean) {
                // clean up style
                this.element.style[event.propertyName] = '';
                delete _transition.clean[propertyName];
            }
            // trigger onTransitionEnd callback
            if (propertyName in _transition.onEnd) {
                var onTransitionEnd = _transition.onEnd[propertyName];
                onTransitionEnd.call(this);
                delete _transition.onEnd[propertyName];
            }

            this.emitEvent('transitionEnd', [this]);
        };

        Item.prototype.disableTransition = function() {
            this.removeTransitionStyles();
            this.element.removeEventListener(transitionEndEvent, this, false);
            this.isTransitioning = false;
        };

        /**
         * removes style property from element
         * @param {Object} style
         **/
        Item.prototype._removeStyles = function(style) {
            // clean up transition styles
            var cleanStyle = {};
            for (var prop in style) {
                cleanStyle[prop] = '';
            }
            this.css(cleanStyle);
        };

        var cleanTransitionStyle = {
            transitionProperty: '',
            transitionDuration: ''
        };

        Item.prototype.removeTransitionStyles = function() {
            // remove transition
            this.css(cleanTransitionStyle);
        };

        // ----- show/hide/remove ----- //

        // remove element from DOM
        Item.prototype.removeElem = function() {
            this.element.parentNode.removeChild(this.element);
            this.emitEvent('remove', [this]);
        };

        Item.prototype.remove = function() {
            // just remove element if no transition support or no transition
            if (!transitionProperty || !parseFloat(this.layout.options.transitionDuration)) {
                this.removeElem();
                return;
            }

            // start transition
            var _this = this;
            this.on('transitionEnd', function() {
                _this.removeElem();
                return true; // bind once
            });
            this.hide();
        };

        Item.prototype.reveal = function() {
            delete this.isHidden;
            // remove display: none
            this.css({
                display: ''
            });

            var options = this.layout.options;
            this.transition({
                from: options.hiddenStyle,
                to: options.visibleStyle,
                isCleaning: true
            });
        };

        Item.prototype.hide = function() {
            // set flag
            this.isHidden = true;
            // remove display: none
            this.css({
                display: ''
            });

            var options = this.layout.options;
            this.transition({
                from: options.visibleStyle,
                to: options.hiddenStyle,
                // keep hidden stuff hidden
                isCleaning: true,
                onTransitionEnd: {
                    opacity: function() {
                        // check if still hidden
                        // during transition, item may have been un-hidden
                        if (this.isHidden) {
                            this.css({
                                display: 'none'
                            });
                        }
                    }
                }
            });
        };

        Item.prototype.destroy = function() {
            this.css({
                position: '',
                left: '',
                right: '',
                top: '',
                bottom: '',
                transition: '',
                transform: ''
            });
        };

        return Item;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('outlayer/item', [
                'eventEmitter/EventEmitter',
                'get-size/get-size',
                'get-style-property/get-style-property'
            ],
            outlayerItemDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = outlayerItemDefinition(
            require('wolfy87-eventemitter'),
            require('get-size'),
            require('desandro-get-style-property')
        );
    } else {
        // browser global
        window.Outlayer = {};
        window.Outlayer.Item = outlayerItemDefinition(
            window.EventEmitter,
            window.getSize,
            window.getStyleProperty
        );
    }

})(window);

/*
 * Outlayer v1.3.0
 * the brains and guts of a layout library
 * MIT license
 */

(function(window) {
    "use strict";


    // ----- vars ----- //

    var document = window.document;
    var console = window.console;
    var jQuery = window.jQuery;
    var noop = function() {};

    // -------------------------- helpers -------------------------- //

    // extend objects
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }


    var objToString = Object.prototype.toString;

    function isArray(obj) {
        return objToString.call(obj) === '[object Array]';
    }

    // turn element or nodeList into an array
    function makeArray(obj) {
        var ary = [];
        if (isArray(obj)) {
            // use object if already an array
            ary = obj;
        } else if (obj && typeof obj.length === 'number') {
            // convert nodeList to array
            for (var i = 0, len = obj.length; i < len; i++) {
                ary.push(obj[i]);
            }
        } else {
            // array of single index
            ary.push(obj);
        }
        return ary;
    }

    // http://stackoverflow.com/a/384380/182183
    var isElement = (typeof HTMLElement === 'function' || typeof HTMLElement === 'object') ?
        function isElementDOM2(obj) {
            return obj instanceof HTMLElement;
        } :
        function isElementQuirky(obj) {
            return obj && typeof obj === 'object' &&
                obj.nodeType === 1 && typeof obj.nodeName === 'string';
        };

    // index of helper cause IE8
    var indexOf = Array.prototype.indexOf ? function(ary, obj) {
        return ary.indexOf(obj);
    } : function(ary, obj) {
        for (var i = 0, len = ary.length; i < len; i++) {
            if (ary[i] === obj) {
                return i;
            }
        }
        return -1;
    };

    function removeFrom(obj, ary) {
        var index = indexOf(ary, obj);
        if (index !== -1) {
            ary.splice(index, 1);
        }
    }

    // http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/
    function toDashed(str) {
        return str.replace(/(.)([A-Z])/g, function(match, $1, $2) {
            return $1 + '-' + $2;
        }).toLowerCase();
    }


    function outlayerDefinition(eventie, docReady, EventEmitter, getSize, matchesSelector, Item) {

        // -------------------------- Outlayer -------------------------- //

        // globally unique identifiers
        var GUID = 0;
        // internal store of all Outlayer intances
        var instances = {};


        /**
         * @param {Element, String} element
         * @param {Object} options
         * @constructor
         */
        function Outlayer(element, options) {
            // use element as selector string
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }

            // bail out if not proper element
            if (!element || !isElement(element)) {
                if (console) {
                    console.error('Bad ' + this.constructor.namespace + ' element: ' + element);
                }
                return;
            }

            this.element = element;

            // options
            this.options = extend({}, this.constructor.defaults);
            this.option(options);

            // add id for Outlayer.getFromElement
            var id = ++GUID;
            this.element.outlayerGUID = id; // expando
            instances[id] = this; // associate via id

            // kick it off
            setTimeout(function() {
                instances[id]._create();
                if (instances[id].options.isInitLayout) {
                    instances[id].layout();
                }
            }, instances[id].options.layoutDelay);

        }

        // settings are for internal use only
        Outlayer.namespace = 'outlayer';
        Outlayer.Item = Item;

        // default options
        Outlayer.defaults = {
            containerStyle: {
                position: 'relative'
            },
            layoutDelay: 1,
            isInitLayout: true,
            isOriginLeft: true,
            isOriginTop: true,
            isResizeBound: true,
            isResizingContainer: true,
            // item options
            transitionDuration: '0.4s',
            hiddenStyle: {
                opacity: 0,
                transform: 'scale(0.001)'
            },
            visibleStyle: {
                opacity: 1,
                transform: 'scale(1)'
            }
        };

        // inherit EventEmitter
        extend(Outlayer.prototype, EventEmitter.prototype);

        /**
         * set options
         * @param {Object} opts
         */
        Outlayer.prototype.option = function(opts) {
            extend(this.options, opts);
        };

        Outlayer.prototype._create = function() {
            // get items from children
            this.reloadItems();
            // elements that affect layout, but are not laid out
            this.stamps = [];
            this.stamp(this.options.stamp);
            // set container style
            extend(this.element.style, this.options.containerStyle);

            // bind resize method
            if (this.options.isResizeBound) {
                this.bindResize();
            }
        };

        // goes through all children again and gets bricks in proper order
        Outlayer.prototype.reloadItems = function() {
            // collection of item elements
            this.items = this._itemize(this.element.children);
        };


        /**
         * turn elements into Outlayer.Items to be used in layout
         * @param {Array or NodeList or HTMLElement} elems
         * @returns {Array} items - collection of new Outlayer Items
         */
        Outlayer.prototype._itemize = function(elems) {

            var itemElems = this._filterFindItemElements(elems);
            var Item = this.constructor.Item;

            // create new Outlayer Items for collection
            var items = [];
            for (var i = 0, len = itemElems.length; i < len; i++) {
                var elem = itemElems[i];
                var item = new Item(elem, this);
                items.push(item);
            }

            return items;
        };

        /**
         * get item elements to be used in layout
         * @param {Array or NodeList or HTMLElement} elems
         * @returns {Array} items - item elements
         */
        Outlayer.prototype._filterFindItemElements = function(elems) {
            // make array of elems
            elems = makeArray(elems);
            var itemSelector = this.options.itemSelector;
            var itemElems = [];
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                // check that elem is an actual element
                if (!isElement(elem)) {
                    continue;
                }
                // filter & find items if we have an item selector
                if (itemSelector) {
                    // filter siblings
                    if (matchesSelector(elem, itemSelector)) {
                        itemElems.push(elem);
                    }
                    // find children
                    var childElems = elem.querySelectorAll(itemSelector);
                    // concat childElems to filterFound array
                    for (var j = 0, jLen = childElems.length; j < jLen; j++) {
                        itemElems.push(childElems[j]);
                    }
                } else {
                    itemElems.push(elem);
                }
            }

            return itemElems;
        };

        /**
         * getter method for getting item elements
         * @returns {Array} elems - collection of item elements
         */
        Outlayer.prototype.getItemElements = function() {
            var elems = [];
            for (var i = 0, len = this.items.length; i < len; i++) {
                elems.push(this.items[i].element);
            }
            return elems;
        };

        // ----- init & layout ----- //

        /**
         * lays out all items
         */
        Outlayer.prototype.layout = function() {
            this._resetLayout();
            this._manageStamps();

            // don't animate first layout
            var isInstant = this.options.isLayoutInstant !== undefined ?
                this.options.isLayoutInstant : !this._isLayoutInited;
            this.layoutItems(this.items, isInstant);

            // flag for initalized
            this._isLayoutInited = true;
        };

        // _init is alias for layout
        Outlayer.prototype._init = Outlayer.prototype.layout;

        /**
         * logic before any new layout
         */
        Outlayer.prototype._resetLayout = function() {
            this.getSize();
        };


        Outlayer.prototype.getSize = function() {
            this.size = getSize(this.element);
        };

        /**
         * get measurement from option, for columnWidth, rowHeight, gutter
         * if option is String -> get element from selector string, & get size of element
         * if option is Element -> get size of element
         * else use option as a number
         *
         * @param {String} measurement
         * @param {String} size - width or height
         * @private
         */
        Outlayer.prototype._getMeasurement = function(measurement, size) {
            var option = this.options[measurement];
            var elem;
            if (!option) {
                // default to 0
                this[measurement] = 0;
            } else {
                // use option as an element
                if (typeof option === 'string') {
                    elem = this.element.querySelector(option);
                } else if (isElement(option)) {
                    elem = option;
                }
                // use size of element, if element
                this[measurement] = elem ? getSize(elem)[size] : option;
            }
        };

        /**
         * layout a collection of item elements
         * @api public
         */
        Outlayer.prototype.layoutItems = function(items, isInstant) {
            items = this._getItemsForLayout(items);

            this._layoutItems(items, isInstant);

            this._postLayout();
        };

        /**
         * get the items to be laid out
         * you may want to skip over some items
         * @param {Array} items
         * @returns {Array} items
         */
        Outlayer.prototype._getItemsForLayout = function(items) {
            var layoutItems = [];
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                if (!item.isIgnored) {
                    layoutItems.push(item);
                }
            }
            return layoutItems;
        };

        /**
         * layout items
         * @param {Array} items
         * @param {Boolean} isInstant
         */
        Outlayer.prototype._layoutItems = function(items, isInstant) {
            var _this = this;

            // Emit start layout
            jQuery && jQuery(document).trigger('layoutStart', _this, items);

            function onItemsLayout() {
                _this.emitEvent('layoutComplete', [_this, items]);
                jQuery && jQuery(document).trigger('layoutComplete', _this, items);
            }

            if (!items || !items.length) {
                // no items, emit event with empty array
                onItemsLayout();
                return;
            }

            // emit layoutComplete when done
            this._itemsOn(items, 'layout', onItemsLayout);

            var queue = [];

            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                // get x/y object from method
                var position = this._getItemLayoutPosition(item);
                // enqueue
                position.item = item;
                position.isInstant = isInstant || item.isLayoutInstant;
                queue.push(position);
            }

            this._processLayoutQueue(queue);
        };

        /**
         * get item layout position
         * @param {Outlayer.Item} item
         * @returns {Object} x and y position
         */
        Outlayer.prototype._getItemLayoutPosition = function( /* item */ ) {
            return {
                x: 0,
                y: 0
            };
        };

        /**
         * iterate over array and position each item
         * Reason being - separating this logic prevents 'layout invalidation'
         * thx @paul_irish
         * @param {Array} queue
         */
        Outlayer.prototype._processLayoutQueue = function(queue) {
            for (var i = 0, len = queue.length; i < len; i++) {
                var obj = queue[i];
                this._positionItem(obj.item, obj.x, obj.y, obj.isInstant);
            }
        };

        /**
         * Sets position of item in DOM
         * @param {Outlayer.Item} item
         * @param {Number} x - horizontal position
         * @param {Number} y - vertical position
         * @param {Boolean} isInstant - disables transitions
         */
        Outlayer.prototype._positionItem = function(item, x, y, isInstant) {
            if (isInstant) {
                // if not transition, just set CSS
                item.goTo(x, y);
            } else {
                item.moveTo(x, y);
            }
        };

        /**
         * Any logic you want to do after each layout,
         * i.e. size the container
         */
        Outlayer.prototype._postLayout = function() {
            this.resizeContainer();
        };

        Outlayer.prototype.resizeContainer = function() {
            if (!this.options.isResizingContainer) {
                return;
            }
            var size = this._getContainerSize();
            if (size) {
                this._setContainerMeasure(size.width, true);
                this._setContainerMeasure(size.height, false);
            }
        };

        /**
         * Sets width or height of container if returned
         * @returns {Object} size
         *   @param {Number} width
         *   @param {Number} height
         */
        Outlayer.prototype._getContainerSize = noop;

        /**
         * @param {Number} measure - size of width or height
         * @param {Boolean} isWidth
         */
        Outlayer.prototype._setContainerMeasure = function(measure, isWidth) {
            if (measure === undefined) {
                return;
            }

            var elemSize = this.size;
            // add padding and border width if border box
            if (elemSize.isBorderBox) {
                measure += isWidth ? elemSize.paddingLeft + elemSize.paddingRight +
                    elemSize.borderLeftWidth + elemSize.borderRightWidth :
                    elemSize.paddingBottom + elemSize.paddingTop +
                    elemSize.borderTopWidth + elemSize.borderBottomWidth;
            }

            measure = Math.max(measure, 0);
            this.element.style[isWidth ? 'width' : 'height'] = measure + 'px';
        };

        /**
         * trigger a callback for a collection of items events
         * @param {Array} items - Outlayer.Items
         * @param {String} eventName
         * @param {Function} callback
         */
        Outlayer.prototype._itemsOn = function(items, eventName, callback) {
            var doneCount = 0;
            var count = items.length;
            // event callback
            var _this = this;

            function tick() {
                doneCount++;
                if (doneCount === count) {
                    callback.call(_this);
                }
                return true; // bind once
            }
            // bind callback
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                item.on(eventName, tick);
            }
        };

        // -------------------------- ignore & stamps -------------------------- //


        /**
         * keep item in collection, but do not lay it out
         * ignored items do not get skipped in layout
         * @param {Element} elem
         */
        Outlayer.prototype.ignore = function(elem) {
            var item = this.getItem(elem);
            if (item) {
                item.isIgnored = true;
            }
        };

        /**
         * return item to layout collection
         * @param {Element} elem
         */
        Outlayer.prototype.unignore = function(elem) {
            var item = this.getItem(elem);
            if (item) {
                delete item.isIgnored;
            }
        };

        /**
         * adds elements to stamps
         * @param {NodeList, Array, Element, or String} elems
         */
        Outlayer.prototype.stamp = function(elems) {
            elems = this._find(elems);
            if (!elems) {
                return;
            }

            this.stamps = this.stamps.concat(elems);
            // ignore
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                this.ignore(elem);
            }
        };

        /**
         * removes elements to stamps
         * @param {NodeList, Array, or Element} elems
         */
        Outlayer.prototype.unstamp = function(elems) {
            elems = this._find(elems);
            if (!elems) {
                return;
            }

            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                // filter out removed stamp elements
                removeFrom(elem, this.stamps);
                this.unignore(elem);
            }

        };

        /**
         * finds child elements
         * @param {NodeList, Array, Element, or String} elems
         * @returns {Array} elems
         */
        Outlayer.prototype._find = function(elems) {
            if (!elems) {
                return;
            }
            // if string, use argument as selector string
            if (typeof elems === 'string') {
                elems = this.element.querySelectorAll(elems);
            }
            elems = makeArray(elems);
            return elems;
        };

        Outlayer.prototype._manageStamps = function() {
            if (!this.stamps || !this.stamps.length) {
                return;
            }

            this._getBoundingRect();

            for (var i = 0, len = this.stamps.length; i < len; i++) {
                var stamp = this.stamps[i];
                this._manageStamp(stamp);
            }
        };

        // update boundingLeft / Top
        Outlayer.prototype._getBoundingRect = function() {
            // get bounding rect for container element
            var boundingRect = this.element.getBoundingClientRect();
            var size = this.size;
            this._boundingRect = {
                left: boundingRect.left + size.paddingLeft + size.borderLeftWidth,
                top: boundingRect.top + size.paddingTop + size.borderTopWidth,
                right: boundingRect.right - (size.paddingRight + size.borderRightWidth),
                bottom: boundingRect.bottom - (size.paddingBottom + size.borderBottomWidth)
            };
        };

        /**
         * @param {Element} stamp
         **/
        Outlayer.prototype._manageStamp = noop;

        /**
         * get x/y position of element relative to container element
         * @param {Element} elem
         * @returns {Object} offset - has left, top, right, bottom
         */
        Outlayer.prototype._getElementOffset = function(elem) {
            var boundingRect = elem.getBoundingClientRect();
            var thisRect = this._boundingRect;
            var size = getSize(elem);
            var offset = {
                left: boundingRect.left - thisRect.left - size.marginLeft,
                top: boundingRect.top - thisRect.top - size.marginTop,
                right: thisRect.right - boundingRect.right - size.marginRight,
                bottom: thisRect.bottom - boundingRect.bottom - size.marginBottom
            };
            return offset;
        };

        // -------------------------- resize -------------------------- //

        // enable event handlers for listeners
        // i.e. resize -> onresize
        Outlayer.prototype.handleEvent = function(event) {
            var method = 'on' + event.type;
            if (this[method]) {
                this[method](event);
            }
        };

        /**
         * Bind layout to window resizing
         */
        Outlayer.prototype.bindResize = function() {
            // bind just one listener
            if (this.isResizeBound) {
                return;
            }
            eventie.bind(window, 'resize', this);
            this.isResizeBound = true;
        };

        /**
         * Unbind layout to window resizing
         */
        Outlayer.prototype.unbindResize = function() {
            if (this.isResizeBound) {
                eventie.unbind(window, 'resize', this);
            }
            this.isResizeBound = false;
        };

        // original debounce by John Hann
        // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/

        // this fires every resize
        Outlayer.prototype.onresize = function() {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            var _this = this;

            function delayed() {
                _this.resize();
                delete _this.resizeTimeout;
            }

            this.resizeTimeout = setTimeout(delayed, this.options.resizeDelay || 100);
        };

        // debounced, layout on resize
        Outlayer.prototype.resize = function() {
            // don't trigger if size did not change
            // or if resize was unbound. See #9
            if (!this.isResizeBound || !this.needsResizeLayout()) {
                return;
            }

            this.layout();
        };

        /**
         * check if layout is needed post layout
         * @returns Boolean
         */
        Outlayer.prototype.needsResizeLayout = function() {
            var size = getSize(this.element);
            // check that this.size and size are there
            // IE8 triggers resize on body size change, so they might not be
            var hasSizes = this.size && size;
            return hasSizes && size.innerWidth !== this.size.innerWidth;
        };

        // -------------------------- methods -------------------------- //

        /**
         * add items to Outlayer instance
         * @param {Array or NodeList or Element} elems
         * @returns {Array} items - Outlayer.Items
         **/
        Outlayer.prototype.addItems = function(elems) {
            var items = this._itemize(elems);
            // add items to collection
            if (items.length) {
                this.items = this.items.concat(items);
            }
            return items;
        };

        /**
         * Layout newly-appended item elements
         * @param {Array or NodeList or Element} elems
         */
        Outlayer.prototype.appended = function(elems) {
            var items = this.addItems(elems);
            if (!items.length) {
                return;
            }
            // layout and reveal just the new items
            this.layoutItems(items, true);
            this.reveal(items);
        };

        /**
         * Layout prepended elements
         * @param {Array or NodeList or Element} elems
         */
        Outlayer.prototype.prepended = function(elems) {
            var items = this._itemize(elems);
            if (!items.length) {
                return;
            }
            // add items to beginning of collection
            var previousItems = this.items.slice(0);
            this.items = items.concat(previousItems);
            // start new layout
            this._resetLayout();
            this._manageStamps();
            // layout new stuff without transition
            this.layoutItems(items, true);
            this.reveal(items);
            // layout previous items
            this.layoutItems(previousItems);
        };

        /**
         * reveal a collection of items
         * @param {Array of Outlayer.Items} items
         */
        Outlayer.prototype.reveal = function(items) {
            var len = items && items.length;
            if (!len) {
                return;
            }
            for (var i = 0; i < len; i++) {
                var item = items[i];
                item.reveal();
            }
        };

        /**
         * hide a collection of items
         * @param {Array of Outlayer.Items} items
         */
        Outlayer.prototype.hide = function(items) {
            var len = items && items.length;
            if (!len) {
                return;
            }
            for (var i = 0; i < len; i++) {
                var item = items[i];
                item.hide();
            }
        };

        /**
         * get Outlayer.Item, given an Element
         * @param {Element} elem
         * @param {Function} callback
         * @returns {Outlayer.Item} item
         */
        Outlayer.prototype.getItem = function(elem) {
            // loop through items to get the one that matches
            for (var i = 0, len = this.items.length; i < len; i++) {
                var item = this.items[i];
                if (item.element === elem) {
                    // return item
                    return item;
                }
            }
        };

        /**
         * get collection of Outlayer.Items, given Elements
         * @param {Array} elems
         * @returns {Array} items - Outlayer.Items
         */
        Outlayer.prototype.getItems = function(elems) {
            if (!elems || !elems.length) {
                return;
            }
            var items = [];
            for (var i = 0, len = elems.length; i < len; i++) {
                var elem = elems[i];
                var item = this.getItem(elem);
                if (item) {
                    items.push(item);
                }
            }

            return items;
        };

        /**
         * remove element(s) from instance and DOM
         * @param {Array or NodeList or Element} elems
         */
        Outlayer.prototype.remove = function(elems) {
            elems = makeArray(elems);

            var removeItems = this.getItems(elems);
            // bail if no items to remove
            if (!removeItems || !removeItems.length) {
                return;
            }

            this._itemsOn(removeItems, 'remove', function() {
                this.emitEvent('removeComplete', [this, removeItems]);
            });

            for (var i = 0, len = removeItems.length; i < len; i++) {
                var item = removeItems[i];
                item.remove();
                // remove item from collection
                removeFrom(item, this.items);
            }
        };

        // ----- destroy ----- //

        // remove and disable Outlayer instance
        Outlayer.prototype.destroy = function() {
            // clean up dynamic styles
            var style = this.element.style;
            style.height = '';
            style.position = '';
            style.width = '';
            // destroy items
            for (var i = 0, len = this.items.length; i < len; i++) {
                var item = this.items[i];
                item.destroy();
            }

            this.unbindResize();

            var id = this.element.outlayerGUID;
            delete instances[id]; // remove reference to instance by id
            delete this.element.outlayerGUID;
            // remove data for jQuery
            if (jQuery) {
                jQuery.removeData(this.element, this.constructor.namespace);
            }

        };

        // -------------------------- data -------------------------- //

        /**
         * get Outlayer instance from element
         * @param {Element} elem
         * @returns {Outlayer}
         */
        Outlayer.data = function(elem) {
            var id = elem && elem.outlayerGUID;
            return id && instances[id];
        };


        // -------------------------- create Outlayer class -------------------------- //

        /**
         * create a layout class
         * @param {String} namespace
         */
        Outlayer.create = function(namespace, options) {
            // sub-class Outlayer
            function Layout() {
                Outlayer.apply(this, arguments);
            }
            // inherit Outlayer prototype, use Object.create if there
            if (Object.create) {
                Layout.prototype = Object.create(Outlayer.prototype);
            } else {
                extend(Layout.prototype, Outlayer.prototype);
            }
            // set contructor, used for namespace and Item
            Layout.prototype.constructor = Layout;

            Layout.defaults = extend({}, Outlayer.defaults);
            // apply new options
            extend(Layout.defaults, options);
            // keep prototype.settings for backwards compatibility (Packery v1.2.0)
            Layout.prototype.settings = {};

            Layout.namespace = namespace;

            Layout.data = Outlayer.data;

            // sub-class Item
            Layout.Item = function LayoutItem() {
                Item.apply(this, arguments);
            };

            Layout.Item.prototype = new Item();

            // -------------------------- declarative -------------------------- //

            /**
             * allow user to initialize Outlayer via .js-namespace class
             * options are parsed from data-namespace-option attribute
             */
            docReady(function() {
                var dashedNamespace = toDashed(namespace);
                var elems = document.querySelectorAll('.js-' + dashedNamespace);
                var dataAttr = 'data-' + dashedNamespace + '-options';

                for (var i = 0, len = elems.length; i < len; i++) {
                    var elem = elems[i];
                    var attr = elem.getAttribute(dataAttr);
                    var options;
                    try {
                        options = attr && JSON.parse(attr);
                    } catch (error) {
                        // log error, do not initialize
                        if (console) {
                            console.error('Error parsing ' + dataAttr + ' on ' +
                                elem.nodeName.toLowerCase() + (elem.id ? '#' + elem.id : '') + ': ' +
                                error);
                        }
                        continue;
                    }
                    // initialize
                    var instance = new Layout(elem, options);
                    // make available via $().data('layoutname')
                    if (jQuery) {
                        jQuery.data(elem, namespace, instance);
                    }
                }
            });

            // -------------------------- jQuery bridge -------------------------- //

            // make into jQuery plugin
            if (jQuery && jQuery.bridget) {
                jQuery.bridget(namespace, Layout);
            }

            return Layout;
        };

        // ----- fin ----- //

        // back in global
        Outlayer.Item = Item;

        return Outlayer;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('outlayer/outlayer', [
                'eventie/eventie',
                'doc-ready/doc-ready',
                'eventEmitter/EventEmitter',
                'get-size/get-size',
                'matches-selector/matches-selector',
                'item'
            ],
            outlayerDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = outlayerDefinition(
            require('eventie'),
            require('doc-ready'),
            require('wolfy87-eventemitter'),
            require('get-size'),
            require('desandro-matches-selector'),
            require('./item')
        );
    } else {
        // browser global
        window.Outlayer = outlayerDefinition(
            window.eventie,
            window.docReady,
            window.EventEmitter,
            window.getSize,
            window.matchesSelector,
            window.Outlayer.Item
        );
    }

})(window);

/*
 * Isotope Item
 */

(function(window) {
    "use strict";


    // -------------------------- Item -------------------------- //

    function itemDefinition(Outlayer) {

        // sub-class Outlayer Item
        function Item() {
            Outlayer.Item.apply(this, arguments);
        }

        Item.prototype = new Outlayer.Item();

        Item.prototype._create = function() {
            // assign id, used for original-order sorting
            this.id = this.layout.itemGUID++;
            Outlayer.Item.prototype._create.call(this);
            this.sortData = {};
        };

        Item.prototype.updateSortData = function() {
            if (this.isIgnored) {
                return;
            }
            // default sorters
            this.sortData.id = this.id;
            // for backward compatibility
            this.sortData['original-order'] = this.id;
            this.sortData.random = Math.random();
            // go thru getSortData obj and apply the sorters
            var getSortData = this.layout.options.getSortData;
            var sorters = this.layout._sorters;
            for (var key in getSortData) {
                var sorter = sorters[key];
                this.sortData[key] = sorter(this.element, this);
            }
        };

        var _destroy = Item.prototype.destroy;
        Item.prototype.destroy = function() {
            // call super
            _destroy.apply(this, arguments);
            // reset display, #741
            this.css({
                display: ''
            });
        };

        return Item;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('isotope/js/item', [
                'outlayer/outlayer'
            ],
            itemDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = itemDefinition(
            require('outlayer')
        );
    } else {
        // browser global
        window.Isotope = window.Isotope || {};
        window.Isotope.Item = itemDefinition(
            window.Outlayer
        );
    }

})(window);

(function(window) {
    "use strict";


    // --------------------------  -------------------------- //

    function layoutModeDefinition(getSize, Outlayer) {

        // layout mode class
        function LayoutMode(isotope) {
            this.isotope = isotope;
            // link properties
            if (isotope) {
                this.options = isotope.options[this.namespace];
                this.element = isotope.element;
                this.items = isotope.filteredItems;
                this.size = isotope.size;
            }
        }

        /**
         * some methods should just defer to default Outlayer method
         * and reference the Isotope instance as `this`
         **/
        (function() {
            var facadeMethods = [
                '_resetLayout',
                '_getItemLayoutPosition',
                '_manageStamp',
                '_getContainerSize',
                '_getElementOffset',
                'needsResizeLayout'
            ];

            for (var i = 0, len = facadeMethods.length; i < len; i++) {
                var methodName = facadeMethods[i];
                LayoutMode.prototype[methodName] = getOutlayerMethod(methodName);
            }

            function getOutlayerMethod(methodName) {
                return function() {
                    return Outlayer.prototype[methodName].apply(this.isotope, arguments);
                };
            }
        })();

        // -----  ----- //

        // for horizontal layout modes, check vertical size
        LayoutMode.prototype.needsVerticalResizeLayout = function() {
            // don't trigger if size did not change
            var size = getSize(this.isotope.element);
            // check that this.size and size are there
            // IE8 triggers resize on body size change, so they might not be
            var hasSizes = this.isotope.size && size;
            return hasSizes && size.innerHeight !== this.isotope.size.innerHeight;
        };

        // ----- measurements ----- //

        LayoutMode.prototype._getMeasurement = function() {
            this.isotope._getMeasurement.apply(this, arguments);
        };

        LayoutMode.prototype.getColumnWidth = function() {
            this.getSegmentSize('column', 'Width');
        };

        LayoutMode.prototype.getRowHeight = function() {
            this.getSegmentSize('row', 'Height');
        };

        /**
         * get columnWidth or rowHeight
         * segment: 'column' or 'row'
         * size 'Width' or 'Height'
         **/
        LayoutMode.prototype.getSegmentSize = function(segment, size) {
            var segmentName = segment + size;
            var outerSize = 'outer' + size;
            // columnWidth / outerWidth // rowHeight / outerHeight
            this._getMeasurement(segmentName, outerSize);
            // got rowHeight or columnWidth, we can chill
            if (this[segmentName]) {
                return;
            }
            // fall back to item of first element
            var firstItemSize = this.getFirstItemSize();
            this[segmentName] = firstItemSize && firstItemSize[outerSize] ||
                // or size of container
                this.isotope.size['inner' + size];
        };

        LayoutMode.prototype.getFirstItemSize = function() {
            var firstItem = this.isotope.filteredItems[0];
            return firstItem && firstItem.element && getSize(firstItem.element);
        };

        // ----- methods that should reference isotope ----- //

        LayoutMode.prototype.layout = function() {
            this.isotope.layout.apply(this.isotope, arguments);
        };

        LayoutMode.prototype.getSize = function() {
            this.isotope.getSize();
            this.size = this.isotope.size;
        };

        // -------------------------- create -------------------------- //

        LayoutMode.modes = {};

        LayoutMode.create = function(namespace, options) {

            function Mode() {
                LayoutMode.apply(this, arguments);
            }

            Mode.prototype = new LayoutMode();

            // default options
            if (options) {
                Mode.options = options;
            }

            Mode.prototype.namespace = namespace;
            // register in Isotope
            LayoutMode.modes[namespace] = Mode;

            return Mode;
        };


        return LayoutMode;

    }

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('isotope/js/layout-mode', [
                'get-size/get-size',
                'outlayer/outlayer'
            ],
            layoutModeDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = layoutModeDefinition(
            require('get-size'),
            require('outlayer')
        );
    } else {
        // browser global
        window.Isotope = window.Isotope || {};
        window.Isotope.LayoutMode = layoutModeDefinition(
            window.getSize,
            window.Outlayer
        );
    }


})(window);


/*
 * Packery layout mode PACKAGED v1.1.1
 * sub-classes Packery
 * http://packery.metafizzy.co
 */

/*!
 * classie v1.0.1
 * class helper functions
 * from bonzo https://github.com/ded/bonzo
 * MIT license
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true, unused: true */
/*global define: false, module: false */

(function(window) {
    "use strict";


    // class helper functions from bonzo https://github.com/ded/bonzo

    function classReg(className) {
        return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    var hasClass, addClass, removeClass;

    if ('classList' in document.documentElement) {
        hasClass = function(elem, c) {
            return elem.classList.contains(c);
        };
        addClass = function(elem, c) {
            elem.classList.add(c);
        };
        removeClass = function(elem, c) {
            elem.classList.remove(c);
        };
    } else {
        hasClass = function(elem, c) {
            return classReg(c).test(elem.className);
        };
        addClass = function(elem, c) {
            if (!hasClass(elem, c)) {
                elem.className = elem.className + ' ' + c;
            }
        };
        removeClass = function(elem, c) {
            elem.className = elem.className.replace(classReg(c), ' ');
        };
    }

    function toggleClass(elem, c) {
        var fn = hasClass(elem, c) ? removeClass : addClass;
        fn(elem, c);
    }

    var classie = {
        // full names
        hasClass: hasClass,
        addClass: addClass,
        removeClass: removeClass,
        toggleClass: toggleClass,
        // short names
        has: hasClass,
        add: addClass,
        remove: removeClass,
        toggle: toggleClass
    };

    // transport
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('classie/classie', classie);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = classie;
    } else {
        // browser global
        window.classie = classie;
    }

})(window);

/*
 * Rect
 * low-level utility class for basic geometry
 */

(function(window) {
    "use strict";


    // -------------------------- Packery -------------------------- //

    // global namespace
    var Packery = window.Packery = function() {};

    function rectDefinition() {

        // -------------------------- Rect -------------------------- //

        function Rect(props) {
            // extend properties from defaults
            for (var prop in Rect.defaults) {
                this[prop] = Rect.defaults[prop];
            }

            for (prop in props) {
                this[prop] = props[prop];
            }

        }

        // make available
        Packery.Rect = Rect;

        Rect.defaults = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };

        /**
         * Determines whether or not this rectangle wholly encloses another rectangle or point.
         * @param {Rect} rect
         * @returns {Boolean}
         **/
        Rect.prototype.contains = function(rect) {
            // points don't have width or height
            var otherWidth = rect.width || 0;
            var otherHeight = rect.height || 0;
            return this.x <= rect.x &&
                this.y <= rect.y &&
                this.x + this.width >= rect.x + otherWidth &&
                this.y + this.height >= rect.y + otherHeight;
        };

        /**
         * Determines whether or not the rectangle intersects with another.
         * @param {Rect} rect
         * @returns {Boolean}
         **/
        Rect.prototype.overlaps = function(rect) {
            var thisRight = this.x + this.width;
            var thisBottom = this.y + this.height;
            var rectRight = rect.x + rect.width;
            var rectBottom = rect.y + rect.height;

            // http://stackoverflow.com/a/306332
            return this.x < rectRight &&
                thisRight > rect.x &&
                this.y < rectBottom &&
                thisBottom > rect.y;
        };

        /**
         * @param {Rect} rect - the overlapping rect
         * @returns {Array} freeRects - rects representing the area around the rect
         **/
        Rect.prototype.getMaximalFreeRects = function(rect) {

            // if no intersection, return false
            if (!this.overlaps(rect)) {
                return false;
            }

            var freeRects = [];
            var freeRect;

            var thisRight = this.x + this.width;
            var thisBottom = this.y + this.height;
            var rectRight = rect.x + rect.width;
            var rectBottom = rect.y + rect.height;

            // top
            if (this.y < rect.y) {
                freeRect = new Rect({
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: rect.y - this.y
                });
                freeRects.push(freeRect);
            }

            // right
            if (thisRight > rectRight) {
                freeRect = new Rect({
                    x: rectRight,
                    y: this.y,
                    width: thisRight - rectRight,
                    height: this.height
                });
                freeRects.push(freeRect);
            }

            // bottom
            if (thisBottom > rectBottom) {
                freeRect = new Rect({
                    x: this.x,
                    y: rectBottom,
                    width: this.width,
                    height: thisBottom - rectBottom
                });
                freeRects.push(freeRect);
            }

            // left
            if (this.x < rect.x) {
                freeRect = new Rect({
                    x: this.x,
                    y: this.y,
                    width: rect.x - this.x,
                    height: this.height
                });
                freeRects.push(freeRect);
            }

            return freeRects;
        };

        Rect.prototype.canFit = function(rect) {
            return this.width >= rect.width && this.height >= rect.height;
        };

        return Rect;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('packery/js/rect', rectDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = rectDefinition();
    } else {
        // browser global
        window.Packery = window.Packery || {};
        window.Packery.Rect = rectDefinition();
    }

})(window);

/*
 * Packer
 * bin-packing algorithm
 */

(function(window) {
    "use strict";


    // -------------------------- Packer -------------------------- //

    function packerDefinition(Rect) {

        /**
         * @param {Number} width
         * @param {Number} height
         * @param {String} sortDirection
         *   topLeft for vertical, leftTop for horizontal
         */
        function Packer(width, height, sortDirection) {
            this.width = width || 0;
            this.height = height || 0;
            this.sortDirection = sortDirection || 'downwardLeftToRight';

            this.reset();
        }

        Packer.prototype.reset = function() {
            this.spaces = [];
            this.newSpaces = [];

            var initialSpace = new Rect({
                x: 0,
                y: 0,
                width: this.width,
                height: this.height
            });

            this.spaces.push(initialSpace);
            // set sorter
            this.sorter = sorters[this.sortDirection] || sorters.downwardLeftToRight;
        };

        // change x and y of rect to fit with in Packer's available spaces
        Packer.prototype.pack = function(rect) {
            for (var i = 0, len = this.spaces.length; i < len; i++) {
                var space = this.spaces[i];
                if (space.canFit(rect)) {
                    this.placeInSpace(rect, space);
                    break;
                }
            }
        };

        Packer.prototype.placeInSpace = function(rect, space) {
            // place rect in space
            rect.x = space.x;
            rect.y = space.y;

            this.placed(rect);
        };

        // update spaces with placed rect
        Packer.prototype.placed = function(rect) {
            // update spaces
            var revisedSpaces = [];
            for (var i = 0, len = this.spaces.length; i < len; i++) {
                var space = this.spaces[i];
                var newSpaces = space.getMaximalFreeRects(rect);
                // add either the original space or the new spaces to the revised spaces
                if (newSpaces) {
                    revisedSpaces.push.apply(revisedSpaces, newSpaces);
                } else {
                    revisedSpaces.push(space);
                }
            }

            this.spaces = revisedSpaces;

            this.mergeSortSpaces();
        };

        Packer.prototype.mergeSortSpaces = function() {
            // remove redundant spaces
            Packer.mergeRects(this.spaces);
            this.spaces.sort(this.sorter);
        };

        // add a space back
        Packer.prototype.addSpace = function(rect) {
            this.spaces.push(rect);
            this.mergeSortSpaces();
        };

        // -------------------------- utility functions -------------------------- //

        /**
         * Remove redundant rectangle from array of rectangles
         * @param {Array} rects: an array of Rects
         * @returns {Array} rects: an array of Rects
         **/
        Packer.mergeRects = function(rects) {
            for (var i = 0, len = rects.length; i < len; i++) {
                var rect = rects[i];
                // skip over this rect if it was already removed
                if (!rect) {
                    continue;
                }
                // clone rects we're testing, remove this rect
                var compareRects = rects.slice(0);
                // do not compare with self
                compareRects.splice(i, 1);
                // compare this rect with others
                var removedCount = 0;
                for (var j = 0, jLen = compareRects.length; j < jLen; j++) {
                    var compareRect = compareRects[j];
                    // if this rect contains another,
                    // remove that rect from test collection
                    var indexAdjust = i > j ? 0 : 1;
                    if (rect.contains(compareRect)) {
                        // console.log( 'current test rects:' + testRects.length, testRects );
                        // console.log( i, j, indexAdjust, rect, compareRect );
                        rects.splice(j + indexAdjust - removedCount, 1);
                        removedCount++;
                    }
                }
            }

            return rects;
        };


        // -------------------------- sorters -------------------------- //

        // functions for sorting rects in order
        var sorters = {
            // top down, then left to right
            downwardLeftToRight: function(a, b) {
                return a.y - b.y || a.x - b.x;
            },
            // left to right, then top down
            rightwardTopToBottom: function(a, b) {
                return a.x - b.x || a.y - b.y;
            }
        };


        // --------------------------  -------------------------- //

        return Packer;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('packery/js/packer', ['rect'], packerDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = packerDefinition(
            require('./rect')
        );
    } else {
        // browser global
        var Packery = window.Packery = window.Packery || {};
        Packery.Packer = packerDefinition(Packery.Rect);
    }

})(window);

/*
 * Packery Item Element
 */

(function(window) {
    "use strict";


    // -------------------------- Item -------------------------- //

    function itemDefinition(getStyleProperty, Outlayer, Rect) {

        var transformProperty = getStyleProperty('transform');

        // sub-class Item
        var Item = function PackeryItem() {
            Outlayer.Item.apply(this, arguments);
        };

        Item.prototype = new Outlayer.Item();

        var protoCreate = Item.prototype._create;
        Item.prototype._create = function() {
            // call default _create logic
            protoCreate.call(this);
            this.rect = new Rect();
            // rect used for placing, in drag or Packery.fit()
            this.placeRect = new Rect();
        };

        // -------------------------- drag -------------------------- //

        Item.prototype.dragStart = function() {
            this.getPosition();
            this.removeTransitionStyles();
            // remove transform property from transition
            if (this.isTransitioning && transformProperty) {
                this.element.style[transformProperty] = 'none';
            }
            this.getSize();
            // create place rect, used for position when dragged then dropped
            // or when positioning
            this.isPlacing = true;
            this.needsPositioning = false;
            this.positionPlaceRect(this.position.x, this.position.y);
            this.isTransitioning = false;
            this.didDrag = false;
        };

        /**
         * handle item when it is dragged
         * @param {Number} x - horizontal position of dragged item
         * @param {Number} y - vertical position of dragged item
         */
        Item.prototype.dragMove = function(x, y) {
            this.didDrag = true;
            var packerySize = this.layout.size;
            x -= packerySize.paddingLeft;
            y -= packerySize.paddingTop;
            this.positionPlaceRect(x, y);
        };

        Item.prototype.dragStop = function() {
            this.getPosition();
            var isDiffX = this.position.x !== this.placeRect.x;
            var isDiffY = this.position.y !== this.placeRect.y;
            // set post-drag positioning flag
            this.needsPositioning = isDiffX || isDiffY;
            // reset flag
            this.didDrag = false;
        };

        // -------------------------- placing -------------------------- //

        /**
         * position a rect that will occupy space in the packer
         * @param {Number} x
         * @param {Number} y
         * @param {Boolean} isMaxYContained
         */
        Item.prototype.positionPlaceRect = function(x, y, isMaxYOpen) {
            this.placeRect.x = this.getPlaceRectCoord(x, true);
            this.placeRect.y = this.getPlaceRectCoord(y, false, isMaxYOpen);
        };

        /**
         * get x/y coordinate for place rect
         * @param {Number} coord - x or y
         * @param {Boolean} isX
         * @param {Boolean} isMaxOpen - does not limit value to outer bound
         * @returns {Number} coord - processed x or y
         */
        Item.prototype.getPlaceRectCoord = function(coord, isX, isMaxOpen) {
            var measure = isX ? 'Width' : 'Height';
            var size = this.size['outer' + measure];
            var segment = this.layout[isX ? 'columnWidth' : 'rowHeight'];
            var parentSize = this.layout.size['inner' + measure];

            // additional parentSize calculations for Y
            if (!isX) {
                parentSize = Math.max(parentSize, this.layout.maxY);
                // prevent gutter from bumping up height when non-vertical grid
                if (!this.layout.rowHeight) {
                    parentSize -= this.layout.gutter;
                }
            }

            var max;

            if (segment) {
                segment += this.layout.gutter;
                // allow for last column to reach the edge
                parentSize += isX ? this.layout.gutter : 0;
                // snap to closest segment
                coord = Math.round(coord / segment);
                // contain to outer bound
                // contain non-growing bound, allow growing bound to grow
                var mathMethod;
                if (this.layout.options.isHorizontal) {
                    mathMethod = !isX ? 'floor' : 'ceil';
                } else {
                    mathMethod = isX ? 'floor' : 'ceil';
                }
                var maxSegments = Math[mathMethod](parentSize / segment);
                maxSegments -= Math.ceil(size / segment);
                max = maxSegments;
            } else {
                max = parentSize - size;
            }

            coord = isMaxOpen ? coord : Math.min(coord, max);
            coord *= segment || 1;

            return Math.max(0, coord);
        };

        Item.prototype.copyPlaceRectPosition = function() {
            this.rect.x = this.placeRect.x;
            this.rect.y = this.placeRect.y;
        };

        // -----  ----- //

        // remove element from DOM
        Item.prototype.removeElem = function() {
            this.element.parentNode.removeChild(this.element);
            // add space back to packer
            this.layout.packer.addSpace(this.rect);
            this.emitEvent('remove', [this]);
        };

        // -----  ----- //

        return Item;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('packery/js/item', [
                'get-style-property/get-style-property',
                'outlayer/outlayer',
                'rect'
            ],
            itemDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = itemDefinition(
            require('desandro-get-style-property'),
            require('outlayer'),
            require('./rect')
        );
    } else {
        // browser global
        window.Packery.Item = itemDefinition(
            window.getStyleProperty,
            window.Outlayer,
            window.Packery.Rect
        );
    }

})(window);

/*
 * Packery v1.3.2
 * bin-packing layout library
 * http://packery.metafizzy.co
 *
 * Commercial use requires one-time purchase of a commercial license
 * http://packery.metafizzy.co/license.html
 *
 * Non-commercial use is licensed under the GPL v3 License
 *
 * Copyright 2015 Metafizzy
 */

(function(window) {
    "use strict";


    // used for AMD definition and requires
    function packeryDefinition(classie, getSize, Outlayer, Rect, Packer, Item) {

        // ----- Rect ----- //

        // allow for pixel rounding errors IE8-IE11 & Firefox; #227
        Rect.prototype.canFit = function(rect) {
            return this.width >= rect.width - 1 && this.height >= rect.height - 1;
        };

        // -------------------------- Packery -------------------------- //

        // create an Outlayer layout class
        var Packery = Outlayer.create('packery');
        Packery.Item = Item;

        Packery.prototype._create = function() {
            // call super
            Outlayer.prototype._create.call(this);

            // initial properties
            this.packer = new Packer();

            // Left over from v1.0
            this.stamp(this.options.stamped);

            // create drag handlers
            var _this = this;
            this.handleDraggabilly = {
                dragStart: function(draggie) {
                    _this.itemDragStart(draggie.element);
                },
                dragMove: function(draggie) {
                    _this.itemDragMove(draggie.element, draggie.position.x, draggie.position.y);
                },
                dragEnd: function(draggie) {
                    _this.itemDragEnd(draggie.element);
                }
            };

            this.handleUIDraggable = {
                start: function handleUIDraggableStart(event) {
                    _this.itemDragStart(event.currentTarget);
                },
                drag: function handleUIDraggableDrag(event, ui) {
                    _this.itemDragMove(event.currentTarget, ui.position.left, ui.position.top);
                },
                stop: function handleUIDraggableStop(event) {
                    _this.itemDragEnd(event.currentTarget);
                }
            };

        };


        // ----- init & layout ----- //

        /**
         * logic before any new layout
         */
        Packery.prototype._resetLayout = function() {
            this.getSize();

            this._getMeasurements();

            // reset packer
            var packer = this.packer;
            // packer settings, if horizontal or vertical
            if (this.options.isHorizontal) {
                packer.width = Number.POSITIVE_INFINITY;
                packer.height = this.size.innerHeight + this.gutter;
                packer.sortDirection = 'rightwardTopToBottom';
            } else {
                packer.width = this.size.innerWidth + this.gutter;
                packer.height = Number.POSITIVE_INFINITY;
                packer.sortDirection = 'downwardLeftToRight';
            }

            packer.reset();

            // layout
            this.maxY = 0;
            this.maxX = 0;
        };

        /**
         * update columnWidth, rowHeight, & gutter
         * @private
         */
        Packery.prototype._getMeasurements = function() {
            this._getMeasurement('columnWidth', 'width');
            this._getMeasurement('rowHeight', 'height');
            this._getMeasurement('gutter', 'width');
        };

        Packery.prototype._getItemLayoutPosition = function(item) {
            this._packItem(item);
            return item.rect;
        };


        /**
         * layout item in packer
         * @param {Packery.Item} item
         */
        Packery.prototype._packItem = function(item) {
            this._setRectSize(item.element, item.rect);
            // pack the rect in the packer
            this.packer.pack(item.rect);
            this._setMaxXY(item.rect);
        };

        /**
         * set max X and Y value, for size of container
         * @param {Packery.Rect} rect
         * @private
         */
        Packery.prototype._setMaxXY = function(rect) {
            this.maxX = Math.max(rect.x + rect.width, this.maxX);
            this.maxY = Math.max(rect.y + rect.height, this.maxY);
        };

        /**
         * set the width and height of a rect, applying columnWidth and rowHeight
         * @param {Element} elem
         * @param {Packery.Rect} rect
         */
        Packery.prototype._setRectSize = function(elem, rect) {
            var size = getSize(elem);
            var w = size.outerWidth;
            var h = size.outerHeight;
            // size for columnWidth and rowHeight, if available
            // only check if size is non-zero, #177
            if (w || h) {
                w = this._applyGridGutter(w, this.columnWidth);
                h = this._applyGridGutter(h, this.rowHeight);
            }
            // rect must fit in packer
            rect.width = Math.min(w, this.packer.width);
            rect.height = Math.min(h, this.packer.height);
        };

        /**
         * fits item to columnWidth/rowHeight and adds gutter
         * @param {Number} measurement - item width or height
         * @param {Number} gridSize - columnWidth or rowHeight
         * @returns measurement
         */
        Packery.prototype._applyGridGutter = function(measurement, gridSize) {
            // just add gutter if no gridSize
            if (!gridSize) {
                return measurement + this.gutter;
            }
            gridSize += this.gutter;
            // fit item to columnWidth/rowHeight
            var remainder = measurement % gridSize;
            var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
            measurement = Math[mathMethod](measurement / gridSize) * gridSize;
            return measurement;
        };

        Packery.prototype._getContainerSize = function() {
            if (this.options.isHorizontal) {
                return {
                    width: this.maxX - this.gutter
                };
            } else {
                return {
                    height: this.maxY - this.gutter
                };
            }
        };


        // -------------------------- stamp -------------------------- //

        /**
         * makes space for element
         * @param {Element} elem
         */
        Packery.prototype._manageStamp = function(elem) {

            var item = this.getItem(elem);
            var rect;
            if (item && item.isPlacing) {
                rect = item.placeRect;
            } else {
                var offset = this._getElementOffset(elem);
                rect = new Rect({
                    x: this.options.isOriginLeft ? offset.left : offset.right,
                    y: this.options.isOriginTop ? offset.top : offset.bottom
                });
            }

            this._setRectSize(elem, rect);
            // save its space in the packer
            this.packer.placed(rect);
            this._setMaxXY(rect);
        };

        // -------------------------- methods -------------------------- //

        function verticalSorter(a, b) {
            return a.position.y - b.position.y || a.position.x - b.position.x;
        }

        function horizontalSorter(a, b) {
            return a.position.x - b.position.x || a.position.y - b.position.y;
        }

        Packery.prototype.sortItemsByPosition = function() {
            var sorter = this.options.isHorizontal ? horizontalSorter : verticalSorter;
            this.items.sort(sorter);
        };

        /**
         * Fit item element in its current position
         * Packery will position elements around it
         * useful for expanding elements
         *
         * @param {Element} elem
         * @param {Number} x - horizontal destination position, optional
         * @param {Number} y - vertical destination position, optional
         */
        Packery.prototype.fit = function(elem, x, y) {
            var item = this.getItem(elem);
            if (!item) {
                return;
            }

            // prepare internal properties
            this._getMeasurements();

            // stamp item to get it out of layout
            this.stamp(item.element);
            // required for positionPlaceRect
            item.getSize();
            // set placing flag
            item.isPlacing = true;
            // fall back to current position for fitting
            x = x === undefined ? item.rect.x : x;
            y = y === undefined ? item.rect.y : y;

            // position it best at its destination
            item.positionPlaceRect(x, y, true);

            this._bindFitEvents(item);
            item.moveTo(item.placeRect.x, item.placeRect.y);
            // layout everything else
            this.layout();

            // return back to regularly scheduled programming
            this.unstamp(item.element);
            this.sortItemsByPosition();
            // un set placing flag, back to normal
            item.isPlacing = false;
            // copy place rect position
            item.copyPlaceRectPosition();
        };

        /**
         * emit event when item is fit and other items are laid out
         * @param {Packery.Item} item
         * @private
         */
        Packery.prototype._bindFitEvents = function(item) {
            var _this = this;
            var ticks = 0;

            function tick() {
                ticks++;
                if (ticks !== 2) {
                    return;
                }
                _this.emitEvent('fitComplete', [_this, item]);
            }
            // when item is laid out
            item.on('layout', function() {
                tick();
                return true;
            });
            // when all items are laid out
            this.on('layoutComplete', function() {
                tick();
                return true;
            });
        };

        // -------------------------- resize -------------------------- //

        // debounced, layout on resize
        Packery.prototype.resize = function() {
            // don't trigger if size did not change
            var size = getSize(this.element);
            // check that this.size and size are there
            // IE8 triggers resize on body size change, so they might not be
            var hasSizes = this.size && size;
            var innerSize = this.options.isHorizontal ? 'innerHeight' : 'innerWidth';
            if (hasSizes && size[innerSize] === this.size[innerSize]) {
                return;
            }

            this.layout();
        };

        // -------------------------- drag -------------------------- //

        /**
         * handle an item drag start event
         * @param {Element} elem
         */
        Packery.prototype.itemDragStart = function(elem) {
            this.stamp(elem);
            var item = this.getItem(elem);
            if (item) {
                item.dragStart();
            }
        };

        /**
         * handle an item drag move event
         * @param {Element} elem
         * @param {Number} x - horizontal change in position
         * @param {Number} y - vertical change in position
         */
        Packery.prototype.itemDragMove = function(elem, x, y) {
            var item = this.getItem(elem);
            if (item) {
                item.dragMove(x, y);
            }

            // debounce
            var _this = this;
            // debounce triggering layout
            function delayed() {
                _this.layout();
                delete _this.dragTimeout;
            }

            this.clearDragTimeout();

            this.dragTimeout = setTimeout(delayed, 40);
        };

        Packery.prototype.clearDragTimeout = function() {
            if (this.dragTimeout) {
                clearTimeout(this.dragTimeout);
            }
        };

        /**
         * handle an item drag end event
         * @param {Element} elem
         */
        Packery.prototype.itemDragEnd = function(elem) {
            var item = this.getItem(elem);
            var itemDidDrag;
            if (item) {
                itemDidDrag = item.didDrag;
                item.dragStop();
            }
            // if elem didn't move, or if it doesn't need positioning
            // unignore and unstamp and call it a day
            if (!item || (!itemDidDrag && !item.needsPositioning)) {
                this.unstamp(elem);
                return;
            }
            // procced with dragged item

            classie.add(item.element, 'is-positioning-post-drag');

            // save this var, as it could get reset in dragStart
            var onLayoutComplete = this._getDragEndLayoutComplete(elem, item);

            if (item.needsPositioning) {
                item.on('layout', onLayoutComplete);
                item.moveTo(item.placeRect.x, item.placeRect.y);
            } else if (item) {
                // item didn't need placement
                item.copyPlaceRectPosition();
            }

            this.clearDragTimeout();
            this.on('layoutComplete', onLayoutComplete);
            this.layout();

        };

        /**
         * get drag end callback
         * @param {Element} elem
         * @param {Packery.Item} item
         * @returns {Function} onLayoutComplete
         */
        Packery.prototype._getDragEndLayoutComplete = function(elem, item) {
            var itemNeedsPositioning = item && item.needsPositioning;
            var completeCount = 0;
            var asyncCount = itemNeedsPositioning ? 2 : 1;
            var _this = this;

            return function onLayoutComplete() {
                completeCount++;
                // don't proceed if not complete
                if (completeCount !== asyncCount) {
                    return true;
                }
                // reset item
                if (item) {
                    classie.remove(item.element, 'is-positioning-post-drag');
                    item.isPlacing = false;
                    item.copyPlaceRectPosition();
                }

                _this.unstamp(elem);
                // only sort when item moved
                _this.sortItemsByPosition();

                // emit item drag event now that everything is done
                if (itemNeedsPositioning) {
                    _this.emitEvent('dragItemPositioned', [_this, item]);
                }
                // listen once
                return true;
            };
        };

        /**
         * binds Draggabilly events
         * @param {Draggabilly} draggie
         */
        Packery.prototype.bindDraggabillyEvents = function(draggie) {
            draggie.on('dragStart', this.handleDraggabilly.dragStart);
            draggie.on('dragMove', this.handleDraggabilly.dragMove);
            draggie.on('dragEnd', this.handleDraggabilly.dragEnd);
        };

        /**
         * binds jQuery UI Draggable events
         * @param {jQuery} $elems
         */
        Packery.prototype.bindUIDraggableEvents = function($elems) {
            $elems
                .on('dragstart', this.handleUIDraggable.start)
                .on('drag', this.handleUIDraggable.drag)
                .on('dragstop', this.handleUIDraggable.stop);
        };

        Packery.Rect = Rect;
        Packery.Packer = Packer;

        return Packery;

    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('packery/js/packery', [
                'classie/classie',
                'get-size/get-size',
                'outlayer/outlayer',
                'rect',
                'packer',
                'item'
            ],
            packeryDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = packeryDefinition(
            require('desandro-classie'),
            require('get-size'),
            require('outlayer'),
            require('./rect'),
            require('./packer'),
            require('./item')
        );
    } else {
        // browser global
        window.Packery = packeryDefinition(
            window.classie,
            window.getSize,
            window.Outlayer,
            window.Packery.Rect,
            window.Packery.Packer,
            window.Packery.Item
        );
    }

})(window);

/*
 * Packery layout mode v1.1.1
 * sub-classes Packery
 * http://packery.metafizzy.co
 */

/*jshint browser: true, strict: true, undef: true, unused: true */

(function(window) {
    "use strict";


    // -------------------------- helpers -------------------------- //

    // extend objects
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }

    // -------------------------- masonryDefinition -------------------------- //

    // used for AMD definition and requires
    function packeryDefinition(LayoutMode, Packery, getSize) {
        // create an Outlayer layout class
        var PackeryMode = LayoutMode.create('packery');

        // save on to these methods
        var _getElementOffset = PackeryMode.prototype._getElementOffset;
        // var layout = PackeryMode.prototype.layout;
        var _getMeasurement = PackeryMode.prototype._getMeasurement;

        // sub-class Masonry
        extend(PackeryMode.prototype, Packery.prototype);

        // set back, as it was overwritten by Packery
        PackeryMode.prototype._getElementOffset = _getElementOffset;
        // PackeryMode.prototype.layout = layout;
        PackeryMode.prototype._getMeasurement = _getMeasurement;

        // set packery in _resetLayout
        var _resetLayout = PackeryMode.prototype._resetLayout;
        PackeryMode.prototype._resetLayout = function() {
            this.packer = this.packer || new Packery.Packer();
            _resetLayout.apply(this, arguments);
        };

        var _getItemLayoutPosition = PackeryMode.prototype._getItemLayoutPosition;
        PackeryMode.prototype._getItemLayoutPosition = function(item) {
            // set packery rect
            item.rect = item.rect || new Packery.Rect();
            return _getItemLayoutPosition.call(this, item);
        };

        // HACK copy over isOriginLeft/Top options
        var _manageStamp = PackeryMode.prototype._manageStamp;
        PackeryMode.prototype._manageStamp = function() {
            this.options.isOriginLeft = this.isotope.options.isOriginLeft;
            this.options.isOriginTop = this.isotope.options.isOriginTop;
            _manageStamp.apply(this, arguments);
        };

        PackeryMode.prototype.needsResizeLayout = function() {
            // don't trigger if size did not change
            var size = getSize(this.element);
            // check that this.size and size are there
            // IE8 triggers resize on body size change, so they might not be
            var hasSizes = this.size && size;
            var innerSize = this.options.isHorizontal ? 'innerHeight' : 'innerWidth';
            return hasSizes && size[innerSize] !== this.size[innerSize];
        };

        return PackeryMode;
    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define([
                'isotope/js/layout-mode',
                'packery/js/packery',
                'get-size/get-size'
            ],
            packeryDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = packeryDefinition(
            require('isotope-layout/js/layout-mode'),
            require('packery'),
            require('get-size')
        );
    } else {
        // browser global
        packeryDefinition(
            window.Isotope.LayoutMode,
            window.Packery,
            window.getSize
        );
    }

})(window);



/*
 * Masonry v3.2.1
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

(function(window) {
    "use strict";


    // -------------------------- helpers -------------------------- //

    var indexOf = Array.prototype.indexOf ?
        function(items, value) {
            return items.indexOf(value);
        } :
        function(items, value) {
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                if (item === value) {
                    return i;
                }
            }
            return -1;
        };

    // -------------------------- masonryDefinition -------------------------- //

    // used for AMD definition and requires
    function masonryDefinition(Outlayer, getSize) {
        // create an Outlayer layout class
        var Masonry = Outlayer.create('masonry');

        Masonry.prototype._resetLayout = function() {
            this.getSize();
            this._getMeasurement('columnWidth', 'outerWidth');
            this._getMeasurement('gutter', 'outerWidth');
            this.measureColumns();

            // reset column Y
            var i = this.cols;
            this.colYs = [];
            while (i--) {
                this.colYs.push(0);
            }

            this.maxY = 0;
        };

        Masonry.prototype.measureColumns = function() {
            this.getContainerWidth();
            // if columnWidth is 0, default to outerWidth of first item
            if (!this.columnWidth) {
                var firstItem = this.items[0];
                var firstItemElem = firstItem && firstItem.element;
                // columnWidth fall back to item of first element
                this.columnWidth = firstItemElem && getSize(firstItemElem).outerWidth ||
                    // if first elem has no width, default to size of container
                    this.containerWidth;
            }

            this.columnWidth += this.gutter;

            this.cols = Math.floor((this.containerWidth + this.gutter) / this.columnWidth);
            this.cols = Math.max(this.cols, 1);
        };

        Masonry.prototype.getContainerWidth = function() {
            // container is parent if fit width
            var container = this.options.isFitWidth ? this.element.parentNode : this.element;
            // check that this.size and size are there
            // IE8 triggers resize on body size change, so they might not be
            var size = getSize(container);
            this.containerWidth = size && size.innerWidth + 1;
        };

        Masonry.prototype._getItemLayoutPosition = function(item) {
            item.getSize();
            // how many columns does this brick span
            var remainder = item.size.outerWidth % this.columnWidth;
            var mathMethod = remainder && remainder < 1 ? 'round' : 'ceil';
            // round if off by 1 pixel, otherwise use ceil
            var colSpan = Math[mathMethod](item.size.outerWidth / this.columnWidth);
            colSpan = Math.min(colSpan, this.cols);

            var colGroup = this._getColGroup(colSpan);
            // get the minimum Y value from the columns
            var minimumY = Math.min.apply(Math, colGroup);
            var shortColIndex = indexOf(colGroup, minimumY);

            // position the brick
            var position = {
                x: this.columnWidth * shortColIndex,
                y: minimumY
            };

            // apply setHeight to necessary columns
            var setHeight = minimumY + item.size.outerHeight;
            var setSpan = this.cols + 1 - colGroup.length;
            for (var i = 0; i < setSpan; i++) {
                this.colYs[shortColIndex + i] = setHeight;
            }

            return position;
        };

        /**
         * @param {Number} colSpan - number of columns the element spans
         * @returns {Array} colGroup
         */
        Masonry.prototype._getColGroup = function(colSpan) {
            if (colSpan < 2) {
                // if brick spans only one column, use all the column Ys
                return this.colYs;
            }

            var colGroup = [];
            // how many different places could this brick fit horizontally
            var groupCount = this.cols + 1 - colSpan;
            // for each group potential horizontal position
            for (var i = 0; i < groupCount; i++) {
                // make an array of colY values for that one group
                var groupColYs = this.colYs.slice(i, i + colSpan);
                // and get the max value of the array
                colGroup[i] = Math.max.apply(Math, groupColYs);
            }
            return colGroup;
        };

        Masonry.prototype._manageStamp = function(stamp) {
            var stampSize = getSize(stamp);
            var offset = this._getElementOffset(stamp);
            // get the columns that this stamp affects
            var firstX = this.options.isOriginLeft ? offset.left : offset.right;
            var lastX = firstX + stampSize.outerWidth;
            var firstCol = Math.floor(firstX / this.columnWidth);
            firstCol = Math.max(0, firstCol);
            var lastCol = Math.floor(lastX / this.columnWidth);
            // lastCol should not go over if multiple of columnWidth #425
            lastCol -= lastX % this.columnWidth ? 0 : 1;
            lastCol = Math.min(this.cols - 1, lastCol);
            // set colYs to bottom of the stamp
            var stampMaxY = (this.options.isOriginTop ? offset.top : offset.bottom) +
                stampSize.outerHeight;
            for (var i = firstCol; i <= lastCol; i++) {
                this.colYs[i] = Math.max(stampMaxY, this.colYs[i]);
            }
        };

        Masonry.prototype._getContainerSize = function() {
            this.maxY = Math.max.apply(Math, this.colYs);
            var size = {
                height: this.maxY
            };

            if (this.options.isFitWidth) {
                size.width = this._getContainerFitWidth();
            }

            return size;
        };

        Masonry.prototype._getContainerFitWidth = function() {
            var unusedCols = 0;
            // count unused columns
            var i = this.cols;
            while (--i) {
                if (this.colYs[i] !== 0) {
                    break;
                }
                unusedCols++;
            }
            // fit container to columns that have been used
            return (this.cols - unusedCols) * this.columnWidth - this.gutter;
        };

        Masonry.prototype.needsResizeLayout = function() {
            var previousWidth = this.containerWidth;
            this.getContainerWidth();
            return previousWidth !== this.containerWidth;
        };

        return Masonry;
    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('masonry/masonry', [
                'outlayer/outlayer',
                'get-size/get-size'
            ],
            masonryDefinition);
    } else if (typeof exports === 'object') {
        module.exports = masonryDefinition(
            require('outlayer'),
            require('get-size')
        );
    } else {
        // browser global
        window.Masonry = masonryDefinition(
            window.Outlayer,
            window.getSize
        );
    }

})(window);

/*
 * Masonry layout mode
 * sub-classes Masonry
 * http://masonry.desandro.com
 */

(function(window) {
    "use strict";


    // -------------------------- helpers -------------------------- //

    // extend objects
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }

    // -------------------------- masonryDefinition -------------------------- //

    // used for AMD definition and requires
    function masonryDefinition(LayoutMode, Masonry) {
        // create an Outlayer layout class
        var MasonryMode = LayoutMode.create('masonry');

        // save on to these methods
        var _getElementOffset = MasonryMode.prototype._getElementOffset;
        var layout = MasonryMode.prototype.layout;
        var _getMeasurement = MasonryMode.prototype._getMeasurement;

        // sub-class Masonry
        extend(MasonryMode.prototype, Masonry.prototype);

        // set back, as it was overwritten by Masonry
        MasonryMode.prototype._getElementOffset = _getElementOffset;
        MasonryMode.prototype.layout = layout;
        MasonryMode.prototype._getMeasurement = _getMeasurement;

        var measureColumns = MasonryMode.prototype.measureColumns;
        MasonryMode.prototype.measureColumns = function() {
            // set items, used if measuring first item
            this.items = this.isotope.filteredItems;
            measureColumns.call(this);
        };

        // HACK copy over isOriginLeft/Top options
        var _manageStamp = MasonryMode.prototype._manageStamp;
        MasonryMode.prototype._manageStamp = function() {
            this.options.isOriginLeft = this.isotope.options.isOriginLeft;
            this.options.isOriginTop = this.isotope.options.isOriginTop;
            _manageStamp.apply(this, arguments);
        };

        return MasonryMode;
    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('isotope/js/layout-modes/masonry', [
                'layout-mode',
                'masonry/masonry'
            ],
            masonryDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = masonryDefinition(
            require('../layout-mode'),
            require('masonry-layout')
        );
    } else {
        // browser global
        masonryDefinition(
            window.Isotope.LayoutMode,
            window.Masonry
        );
    }

})(window);

(function(window) {
    "use strict";


    function fitRowsDefinition(LayoutMode) {

        var FitRows = LayoutMode.create('fitRows');

        FitRows.prototype._resetLayout = function() {
            this.x = 0;
            this.y = 0;
            this.maxY = 0;
            this.row = 0;
            this.rows = [];
            this._getMeasurement('gutter', 'outerWidth');

            if (this.options.equalheight) {
                for (var i = 0; i < this.isotope.items.length; i++) {
                    this.isotope.items[i].css({
                        height: 'auto'
                    });
                }
            }

        };

        FitRows.prototype._getItemLayoutPosition = function(item) {

            item.getSize();

            var itemWidth = item.size.outerWidth + (this.gutter.width || 0);

            // if this element cannot fit in the current row
            var containerWidth = Math.ceil(this.isotope.size.innerWidth + (this.gutter.width || 0)) + 1;

            if (this.x !== 0 && itemWidth + this.x > containerWidth) {
                this.x = 0;
                this.y = this.maxY;
            }

            // New row?
            if (this.x == 0 && this.y != 0) {
                this.row++;
            }

            var position = {
                x: this.x,
                y: this.y
            };


            this.maxY = Math.max(this.maxY, this.y + item.size.outerHeight + (this.gutter.height || 0));
            this.x += itemWidth;


            // Compare Y from this row and previous row
            if (typeof this.rows[this.row] == 'undefined') {
                this.rows[this.row] = [];
                this.rows[this.row].start = this.y;
                this.rows[this.row].end = this.maxY;
            } else {
                this.rows[this.row].end = Math.max(this.rows[this.row].end, this.maxY);
            }

            // Record row number to item
            item.row = this.row;

            return position;
        };


        FitRows.prototype._equalHeight = function() {

            for (var i = 0; i < this.isotope.items.length; i++) {

                var row = this.isotope.items[i].row,
                    data = this.rows[row];

                if (data) {
                    var height = data.end - data.start;

                    height -= this.isotope.items[i].size.borderTopWidth + this.isotope.items[i].size.borderBottomWidth;
                    height -= this.isotope.items[i].size.marginTop + this.isotope.items[i].size.marginBottom;
                    height -= this.gutter.height || 0;

                    if (this.isotope.items[i].size.isBorderBox == false) {
                        height -= this.isotope.items[i].size.paddingTop + this.isotope.items[i].size.paddingBottom;
                    }

                    this.isotope.items[i].size.height = height;

                    this.isotope.items[i].css({
                        height: height.toString() + 'px'
                    });
                }
            }
        }


        FitRows.prototype._getContainerSize = function() {
            if (this.options.equalheight) {
                this._equalHeight();
            }

            return {
                height: this.maxY
            };
        };

        return FitRows;

    }

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('isotope/js/layout-modes/fit-rows', [
                'layout-mode'
            ],
            fitRowsDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = fitRowsDefinition(
            require('../layout-mode')
        );
    } else {
        // browser global
        fitRowsDefinition(
            window.Isotope.LayoutMode
        );
    }

})(window);

(function(window) {
    "use strict";


    function verticalDefinition(LayoutMode) {

        var Vertical = LayoutMode.create('vertical', {
            horizontalAlignment: 0
        });

        Vertical.prototype._resetLayout = function() {
            this.y = 0;
        };

        Vertical.prototype._getItemLayoutPosition = function(item) {
            item.getSize();
            var x = (this.isotope.size.innerWidth - item.size.outerWidth) *
                this.options.horizontalAlignment;
            var y = this.y;
            this.y += item.size.outerHeight;
            return {
                x: x,
                y: y
            };
        };

        Vertical.prototype._getContainerSize = function() {
            return {
                height: this.y
            };
        };

        return Vertical;

    }

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('isotope/js/layout-modes/vertical', [
                'layout-mode'
            ],
            verticalDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = verticalDefinition(
            require('../layout-mode')
        );
    } else {
        // browser global
        verticalDefinition(
            window.Isotope.LayoutMode
        );
    }

})(window);


/*
 * fitColumns layout mode for Isotope
 * v1.1.1
 * http://isotope.metafizzy.co/layout-modes/fitcolumns.html
 */

/*jshint browser: true, devel: false, strict: true, undef: true, unused: true */

(function(window) {
    "use strict";

    function fitColumnsDefinition(LayoutMode) {

        var FitColumns = LayoutMode.create('fitColumns');

        FitColumns.prototype._resetLayout = function() {
            this.x = 0;
            this.y = 0;
            this.maxX = 0;
        };

        FitColumns.prototype._getItemLayoutPosition = function(item) {
            item.getSize();

            // if this element cannot fit in the current row
            if (this.y !== 0 && item.size.outerHeight + this.y > this.isotope.size.innerHeight) {
                this.y = 0;
                this.x = this.maxX;
            }

            var position = {
                x: this.x,
                y: this.y
            };

            this.maxX = Math.max(this.maxX, this.x + item.size.outerWidth);
            this.y += item.size.outerHeight;

            return position;
        };

        FitColumns.prototype._getContainerSize = function() {
            return {
                width: this.maxX
            };
        };

        FitColumns.prototype.needsResizeLayout = function() {
            return this.needsVerticalResizeLayout();
        };

        return FitColumns;

    }

    if (typeof define === 'function' && define.amd) {
        // AMD
        define('isotope/js/layout-modes/fit-columns', [
                'layout-mode'
            ],
            fitColumnsDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = fitColumnsDefinition(
            require('../layout-mode')
        );
    } else {
        // browser global
        fitColumnsDefinition(
            window.Isotope.LayoutMode
        );
    }

})(window);

/*
 * Isotope v2.1.0
 * Filter & sort magical layouts
 * http://isotope.metafizzy.co
 */

(function(window) {
    "use strict";


    // -------------------------- vars -------------------------- //

    var jQuery = window.jQuery;

    // -------------------------- helpers -------------------------- //

    // extend objects
    function extend(a, b) {
        for (var prop in b) {
            a[prop] = b[prop];
        }
        return a;
    }

    var trim = String.prototype.trim ?
        function(str) {
            return str.trim();
        } :
        function(str) {
            return str.replace(/^\s+|\s+$/g, '');
        };

    var docElem = document.documentElement;

    var getText = docElem.textContent ?
        function(elem) {
            return elem.textContent;
        } :
        function(elem) {
            return elem.innerText;
        };

    var objToString = Object.prototype.toString;

    function isArray(obj) {
        return objToString.call(obj) === '[object Array]';
    }

    // index of helper cause IE8
    var indexOf = Array.prototype.indexOf ? function(ary, obj) {
        return ary.indexOf(obj);
    } : function(ary, obj) {
        for (var i = 0, len = ary.length; i < len; i++) {
            if (ary[i] === obj) {
                return i;
            }
        }
        return -1;
    };

    // turn element or nodeList into an array
    function makeArray(obj) {
        var ary = [];
        if (isArray(obj)) {
            // use object if already an array
            ary = obj;
        } else if (obj && typeof obj.length === 'number') {
            // convert nodeList to array
            for (var i = 0, len = obj.length; i < len; i++) {
                ary.push(obj[i]);
            }
        } else {
            // array of single index
            ary.push(obj);
        }
        return ary;
    }

    function removeFrom(obj, ary) {
        var index = indexOf(ary, obj);
        if (index !== -1) {
            ary.splice(index, 1);
        }
    }

    // -------------------------- isotopeDefinition -------------------------- //

    // used for AMD definition and requires
    function isotopeDefinition(Outlayer, getSize, matchesSelector, Item, LayoutMode) {
        // create an Outlayer layout class
        var Isotope = Outlayer.create('isotope', {
            layoutMode: "masonry",
            isJQueryFiltering: true,
            sortAscending: true
        });

        Isotope.Item = Item;
        Isotope.LayoutMode = LayoutMode;

        Isotope.prototype._create = function() {
            this.itemGUID = 0;
            // functions that sort items
            this._sorters = {};
            this._getSorters();
            // call super
            Outlayer.prototype._create.call(this);

            // create layout modes
            this.modes = {};
            // start filteredItems with all items
            this.filteredItems = this.items;
            // keep of track of sortBys
            this.sortHistory = ['original-order'];
            // create from registered layout modes
            for (var name in LayoutMode.modes) {
                this._initLayoutMode(name);
            }
        };

        Isotope.prototype.reloadItems = function() {
            // reset item ID counter
            this.itemGUID = 0;
            // call super
            Outlayer.prototype.reloadItems.call(this);
        };

        Isotope.prototype._itemize = function() {
            var items = Outlayer.prototype._itemize.apply(this, arguments);
            // assign ID for original-order
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                item.id = this.itemGUID++;
            }
            this._updateItemsSortData(items);
            return items;
        };


        // -------------------------- layout -------------------------- //

        Isotope.prototype._initLayoutMode = function(name) {
            var Mode = LayoutMode.modes[name];
            // set mode options
            // HACK extend initial options, back-fill in default options
            var initialOpts = this.options[name] || {};
            this.options[name] = Mode.options ?
                extend(Mode.options, initialOpts) : initialOpts;
            // init layout mode instance
            this.modes[name] = new Mode(this);
        };


        Isotope.prototype.layout = function() {
            // if first time doing layout, do all magic
            if (!this._isLayoutInited && this.options.isInitLayout) {
                this.arrange();
                return;
            }
            this._layout();
        };

        // private method to be used in layout() & magic()
        Isotope.prototype._layout = function() {
            // don't animate first layout
            var isInstant = this._getIsInstant();
            // layout flow
            this._resetLayout();
            this._manageStamps();
            this.layoutItems(this.filteredItems, isInstant);

            // flag for initalized
            this._isLayoutInited = true;
        };

        // filter + sort + layout
        Isotope.prototype.arrange = function(opts) {
            // set any options pass
            this.option(opts);
            this._getIsInstant();
            // filter, sort, and layout
            this.filteredItems = this._filter(this.items);
            this._sort();
            this._layout();
        };
        // alias to _init for main plugin method
        Isotope.prototype._init = Isotope.prototype.arrange;

        // HACK
        // Don't animate/transition first layout
        // Or don't animate/transition other layouts
        Isotope.prototype._getIsInstant = function() {
            var isInstant = this.options.isLayoutInstant !== undefined ?
                this.options.isLayoutInstant : !this._isLayoutInited;
            this._isInstant = isInstant;
            return isInstant;
        };

        // -------------------------- filter -------------------------- //

        Isotope.prototype._filter = function(items) {
            var filter = this.options.filter;
            filter = filter || '*';
            var matches = [];
            var hiddenMatched = [];
            var visibleUnmatched = [];

            var test = this._getFilterTest(filter);

            // test each item
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i];
                if (item.isIgnored) {
                    continue;
                }
                // add item to either matched or unmatched group
                var isMatched = test(item);
                // item.isFilterMatched = isMatched;
                // add to matches if its a match
                if (isMatched) {
                    matches.push(item);
                }
                // add to additional group if item needs to be hidden or revealed
                if (isMatched && item.isHidden) {
                    hiddenMatched.push(item);
                } else if (!isMatched && !item.isHidden) {
                    visibleUnmatched.push(item);
                }
            }

            var _this = this;

            function hideReveal() {
                _this.reveal(hiddenMatched);
                _this.hide(visibleUnmatched);
            }

            if (this._isInstant) {
                this._noTransition(hideReveal);
            } else {
                hideReveal();
            }


            return matches;
        };

        // get a jQuery, function, or a matchesSelector test given the filter
        Isotope.prototype._getFilterTest = function(filter) {
            if (jQuery && this.options.isJQueryFiltering) {
                // use jQuery
                return function(item) {
                    return jQuery(item.element).is(filter);
                };
            }
            if (typeof filter === 'function') {
                // use filter as function
                return function(item) {
                    return filter(item.element);
                };
            }
            // default, use filter as selector string
            return function(item) {
                return matchesSelector(item.element, filter);
            };
        };

        // -------------------------- sorting -------------------------- //

        /**
         * @params {Array} elems
         * @public
         */
        Isotope.prototype.updateSortData = function(elems) {
            // get items
            var items;
            if (elems) {
                elems = makeArray(elems);
                items = this.getItems(elems);
            } else {
                // update all items if no elems provided
                items = this.items;
            }

            this._getSorters();
            this._updateItemsSortData(items);
        };

        Isotope.prototype._getSorters = function() {
            var getSortData = this.options.getSortData;
            for (var key in getSortData) {
                var sorter = getSortData[key];
                this._sorters[key] = mungeSorter(sorter);
            }
        };

        /**
         * @params {Array} items - of Isotope.Items
         * @private
         */
        Isotope.prototype._updateItemsSortData = function(items) {
            // do not update if no items
            var len = items && items.length;

            for (var i = 0; len && i < len; i++) {
                var item = items[i];
                item.updateSortData();
            }
        };

        // ----- munge sorter ----- //

        // encapsulate this, as we just need mungeSorter
        // other functions in here are just for munging
        var mungeSorter = (function() {
            // add a magic layer to sorters for convienent shorthands
            // `.foo-bar` will use the text of .foo-bar querySelector
            // `[foo-bar]` will use attribute
            // you can also add parser
            // `.foo-bar parseInt` will parse that as a number
            function mungeSorter(sorter) {
                // if not a string, return function or whatever it is
                if (typeof sorter !== 'string') {
                    return sorter;
                }
                // parse the sorter string
                var args = trim(sorter).split(' ');
                var query = args[0];
                // check if query looks like [an-attribute]
                var attrMatch = query.match(/^\[(.+)\]$/);
                var attr = attrMatch && attrMatch[1];
                var getValue = getValueGetter(attr, query);
                // use second argument as a parser
                var parser = Isotope.sortDataParsers[args[1]];
                // parse the value, if there was a parser
                sorter = parser ? function(elem) {
                        return elem && parser(getValue(elem));
                    } :
                    // otherwise just return value
                    function(elem) {
                        return elem && getValue(elem);
                    };

                return sorter;
            }

            // get an attribute getter, or get text of the querySelector
            function getValueGetter(attr, query) {
                var getValue;
                // if query looks like [foo-bar], get attribute
                if (attr) {
                    getValue = function(elem) {
                        return elem.getAttribute(attr);
                    };
                } else {
                    // otherwise, assume its a querySelector, and get its text
                    getValue = function(elem) {
                        var child = elem.querySelector(query);
                        return child && getText(child);
                    };
                }
                return getValue;
            }

            return mungeSorter;
        })();

        // parsers used in getSortData shortcut strings
        Isotope.sortDataParsers = {
            'parseInt': function(val) {
                return parseInt(val, 10);
            },
            'parseFloat': function(val) {
                return parseFloat(val);
            }
        };

        // ----- sort method ----- //

        // sort filteredItem order
        Isotope.prototype._sort = function() {
            var sortByOpt = this.options.sortBy;
            if (!sortByOpt) {
                return;
            }
            // concat all sortBy and sortHistory
            var sortBys = [].concat.apply(sortByOpt, this.sortHistory);
            // sort magic
            var itemSorter = getItemSorter(sortBys, this.options.sortAscending);
            this.filteredItems.sort(itemSorter);
            // keep track of sortBy History
            if (sortByOpt !== this.sortHistory[0]) {
                // add to front, oldest goes in last
                this.sortHistory.unshift(sortByOpt);
            }
        };

        // returns a function used for sorting
        function getItemSorter(sortBys, sortAsc) {
            return function sorter(itemA, itemB) {
                // cycle through all sortKeys
                for (var i = 0, len = sortBys.length; i < len; i++) {
                    var sortBy = sortBys[i];
                    var a = itemA.sortData[sortBy];
                    var b = itemB.sortData[sortBy];
                    if (a > b || a < b) {
                        // if sortAsc is an object, use the value given the sortBy key
                        var isAscending = sortAsc[sortBy] !== undefined ? sortAsc[sortBy] : sortAsc;
                        var direction = isAscending ? 1 : -1;
                        return (a > b ? 1 : -1) * direction;
                    }
                }
                return 0;
            };
        }

        // -------------------------- methods -------------------------- //

        // get layout mode
        Isotope.prototype._mode = function() {
            var layoutMode = this.options.layoutMode;
            var mode = this.modes[layoutMode];
            if (!mode) {
                // TODO console.error
                throw new Error('No layout mode: ' + layoutMode);
            }
            // HACK sync mode's options
            // any options set after init for layout mode need to be synced
            mode.options = this.options[layoutMode];
            return mode;
        };

        Isotope.prototype._resetLayout = function() {
            // trigger original reset layout
            Outlayer.prototype._resetLayout.call(this);
            this._mode()._resetLayout();
        };

        Isotope.prototype._getItemLayoutPosition = function(item) {
            return this._mode()._getItemLayoutPosition(item);
        };

        Isotope.prototype._manageStamp = function(stamp) {
            this._mode()._manageStamp(stamp);
        };

        Isotope.prototype._getContainerSize = function() {
            return this._mode()._getContainerSize();
        };

        Isotope.prototype.needsResizeLayout = function() {
            return this._mode().needsResizeLayout();
        };

        // -------------------------- adding & removing -------------------------- //

        // HEADS UP overwrites default Outlayer appended
        Isotope.prototype.appended = function(elems) {
            var items = this.addItems(elems);
            if (!items.length) {
                return;
            }
            var filteredItems = this._filterRevealAdded(items);
            // add to filteredItems
            this.filteredItems = this.filteredItems.concat(filteredItems);
            this._layoutItems(filteredItems);
        };

        // HEADS UP overwrites default Outlayer prepended
        Isotope.prototype.prepended = function(elems) {
            var items = this._itemize(elems);
            if (!items.length) {
                return;
            }
            // add items to beginning of collection
            var previousItems = this.items.slice(0);
            this.items = items.concat(previousItems);
            // start new layout
            this._resetLayout();
            this._manageStamps();
            // layout new stuff without transition
            var filteredItems = this._filterRevealAdded(items);
            // layout previous items
            this.layoutItems(previousItems);
            // add to filteredItems
            this.filteredItems = filteredItems.concat(this.filteredItems);
        };

        Isotope.prototype._filterRevealAdded = function(items) {
            var filteredItems = this._noTransition(function() {
                return this._filter(items);
            });
            // layout and reveal just the new items
            this.layoutItems(filteredItems, true);
            this.reveal(filteredItems);
            return items;
        };

        /**
         * Filter, sort, and layout newly-appended item elements
         * @param {Array or NodeList or Element} elems
         */
        Isotope.prototype.insert = function(elems) {
            var items = this.addItems(elems);
            if (!items.length) {
                return;
            }
            // append item elements
            var i, item;
            var len = items.length;
            for (i = 0; i < len; i++) {
                item = items[i];
                this.element.appendChild(item.element);
            }
            // filter new stuff
            /*
            // this way adds hides new filtered items with NO transition
            // so user can't see if new hidden items have been inserted
            var filteredInsertItems;
            this._noTransition( function() {
              filteredInsertItems = this._filter( items );
              // hide all new items
              this.hide( filteredInsertItems );
            });
            // */
            // this way hides new filtered items with transition
            // so user at least sees that something has been added
            var filteredInsertItems = this._filter(items);
            // hide all newitems
            this._noTransition(function() {
                this.hide(filteredInsertItems);
            });
            // */
            // set flag
            for (i = 0; i < len; i++) {
                items[i].isLayoutInstant = true;
            }
            this.arrange();
            // reset flag
            for (i = 0; i < len; i++) {
                delete items[i].isLayoutInstant;
            }
            this.reveal(filteredInsertItems);
        };

        var _remove = Isotope.prototype.remove;
        Isotope.prototype.remove = function(elems) {
            elems = makeArray(elems);
            var removeItems = this.getItems(elems);
            // do regular thing
            _remove.call(this, elems);
            // bail if no items to remove
            if (!removeItems || !removeItems.length) {
                return;
            }
            // remove elems from filteredItems
            for (var i = 0, len = removeItems.length; i < len; i++) {
                var item = removeItems[i];
                // remove item from collection
                removeFrom(item, this.filteredItems);
            }
        };

        Isotope.prototype.shuffle = function() {
            // update random sortData
            for (var i = 0, len = this.items.length; i < len; i++) {
                var item = this.items[i];
                item.sortData.random = Math.random();
            }
            this.options.sortBy = 'random';
            this._sort();
            this._layout();
        };

        /**
         * trigger fn without transition
         * kind of hacky to have this in the first place
         * @param {Function} fn
         * @returns ret
         * @private
         */
        Isotope.prototype._noTransition = function(fn) {
            // save transitionDuration before disabling
            var transitionDuration = this.options.transitionDuration;
            // disable transition
            this.options.transitionDuration = 0;
            // do it
            var returnValue = fn.call(this);
            // re-enable transition for reveal
            this.options.transitionDuration = transitionDuration;
            return returnValue;
        };

        // ----- helper methods ----- //

        /**
         * getter method for getting filtered item elements
         * @returns {Array} elems - collection of item elements
         */
        Isotope.prototype.getFilteredItemElements = function() {
            var elems = [];
            for (var i = 0, len = this.filteredItems.length; i < len; i++) {
                elems.push(this.filteredItems[i].element);
            }
            return elems;
        };

        // -----  ----- //

        return Isotope;
    }

    // -------------------------- transport -------------------------- //

    if (typeof define === 'function' && define.amd) {
        // AMD
        define([
                'outlayer/outlayer',
                'get-size/get-size',
                'matches-selector/matches-selector',
                'isotope/js/item',
                'isotope/js/layout-mode',
                // include default layout modes
                'isotope/js/layout-modes/masonry',
                'isotope/js/layout-modes/fit-rows',
                'isotope/js/layout-modes/vertical'
            ],
            isotopeDefinition);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = isotopeDefinition(
            require('outlayer'),
            require('get-size'),
            require('desandro-matches-selector'),
            require('./item'),
            require('./layout-mode'),
            // include default layout modes
            require('./layout-modes/masonry'),
            require('./layout-modes/fit-rows'),
            require('./layout-modes/vertical')
        );
    } else {
        // browser global
        window.Isotope = isotopeDefinition(
            window.Outlayer,
            window.getSize,
            window.matchesSelector,
            window.Isotope.Item,
            window.Isotope.LayoutMode
        );
    }

})(window);;




/*
 * animsition v3.2.0
 * http://blivesta.github.io/animsition/
 * Licensed under MIT
 * Author : blivesta
 * http://blivesta.com/
 * Modified don't override!
 */
(function($) {
    "use strict";
    var namespace = "animsition";
    var methods = {
        init: function(options) {
            options = $.extend({
                inClass: this.data('animsition-in-class') || "fade-in",
                outClass: this.data('animsition-out-class') || "fade-out",
                inDuration: this.data('animsition-in-duration') || 1500,
                outDuration: this.data('animsition-out-duration') || 800,
                linkElement: ".animsition-link",
                touchSupport: true,
                loading: true,
                loadingParentElement: "body",
                loadingClass: "animsition-loading",
                loadingText: 'Loading..',
                unSupportCss: ["animation-duration", "-webkit-animation-duration", "-o-animation-duration"]
            }, options);
            var support = methods.supportCheck.call(this, options);
            if (support === false) {
                if (!("console" in window)) {
                    window.console = {};
                    window.console.log = function(str) {
                        return str;
                    };
                }
                console.log("Animsition does not support this browser.");
                return methods.destroy.call(this);
            }
            var bindEvts = "click." + namespace;
            if (options.touchSupport) {
                bindEvts += " touchend." + namespace;
            }
            if (options.loading === true) {
                methods.addLoading.call(this, options);
            }
            return this.each(function() {
                var _this = this;
                var $this = $(this);
                var $window = $(window);
                var data = $this.data(namespace);
                if (!data) {
                    options = $.extend({}, options);
                    $this.data(namespace, {
                        options: options
                    });
                    $window.on("load." + namespace, function() {
                        methods.pageIn.call(_this);
                    });
                    $window.on("unload." + namespace, function() {});
                    $(options.linkElement).on(bindEvts, function(event) {
                        event.preventDefault();
                        var $self = $(this);
                        methods.pageOut.call(_this, $self);
                    });
                }
            });
        },
        supportCheck: function(options) {
            var $this = $(this);
            var props = options.unSupportCss;
            var propsNum = props.length;
            var support = false;
            if (propsNum === 0) {
                support = true;
            }
            for (var i = 0; i < propsNum; i++) {
                if (typeof $this.css(props[i]) === "string") {
                    support = true;
                    break;
                }
            }
            return support;
        },
        addLoading: function(options) {
            if ($(this).data('animsition-loading-text')) {
                options.loadingText = $(this).data('animsition-loading-text');
            }
            $(options.loadingParentElement).append('<div class="' + options.loadingClass + '"><span class="loading-text">' + options.loadingText + '</span></div>');
        },
        removeLoading: function() {
            var $this = $(this);
            var options = $this.data(namespace).options;
            var $loading = $(options.loadingParentElement).children("." + options.loadingClass);
            $loading.remove();
        },
        pageInClass: function() {
            var $this = $(this);
            var options = $this.data(namespace).options;
            var thisInClass = $this.data("animsition-in");
            var inClass;
            if (typeof thisInClass === "string") {
                inClass = thisInClass;
            } else {
                inClass = options.inClass;
            }
            return inClass;
        },
        pageInDuration: function() {
            var $this = $(this);
            var options = $this.data(namespace).options;
            var thisInDuration = $this.data("animsition-in-duration");
            var inDuration;
            if (typeof thisInDuration === "number") {
                inDuration = thisInDuration;
            } else {
                inDuration = options.inDuration;
            }
            return inDuration;
        },
        pageIn: function() {
            var _this = this;
            var $this = $(this);
            var options = $this.data(namespace).options;
            var inClass = methods.pageInClass.call(_this);
            var inDuration = methods.pageInDuration.call(_this);
            if (options.loading === true) {
                methods.removeLoading.call(_this);
            }
            $this.css({
                "animation-duration": inDuration / 1e3 + "s"
            }).addClass(inClass);
            setTimeout(function() {
                $this.removeClass(inClass).css({
                    opacity: 1
                });
                $(document).trigger('animsitionPageIn');
            }, inDuration);
        },
        pageOutClass: function($self) {
            var $this = $(this);
            var options = $this.data(namespace).options;
            var selfOutClass = $self.data("animsition-out");
            var thisOutClass = $this.data("animsition-out");
            var outClass;
            if (typeof selfOutClass === "string") {
                outClass = selfOutClass;
            } else if (typeof thisOutClass === "string") {
                outClass = thisOutClass;
            } else {
                outClass = options.outClass;
            }
            return outClass;
        },
        pageOutDuration: function($self) {
            var $this = $(this);
            var options = $this.data(namespace).options;
            var selfOutDuration = $self.data("animsition-out-duration");
            var thisOutDuration = $this.data("animsition-out-duration");
            var outDuration;
            if (typeof selfOutDuration === "number") {
                outDuration = selfOutDuration;
            } else if (typeof thisOutDuration === "number") {
                outDuration = thisOutDuration;
            } else {
                outDuration = options.outDuration;
            }
            return outDuration;
        },
        pageOut: function($self) {
            var _this = this;
            var $this = $(this);
            var url = $self.attr("href");
            var outClass = methods.pageOutClass.call(_this, $self);
            var outDuration = methods.pageOutDuration.call(_this, $self);
            $this.css({
                "animation-duration": outDuration / 1e3 + "s"
            }).addClass(outClass);
            setTimeout(function() {
                location.href = url;
            }, outDuration);
            setTimeout(function() {
                this.destroy();
            }, outDuration + 200);
        },
        destroy: function() {
            return this.each(function() {
                var $this = $(this);
                $(window).unbind("." + namespace);
                $this.removeClass(namespace).removeData(namespace);
            });
        }
    };
    $.fn.animsition = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === "object" || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error("Method " + method + " does not exist on jQuery." + namespace);
        }
    };

    // autoboot
    $(document).ready(function() {
        $('.animsition:not(.animsition-loaded)').animsition().addClass('animsition-loaded');
    });
})(jQuery);




/*
 * Binding Style switchers function and events
 * Don't change the jQuery header because we need
 * the document to be fully loaded first before
 * we can bind everything.
 */
jQuery(document).ready(function($) {
    "use strict";
    $('.switcher-panel').find('[data-toggle="tooltip"]').tooltip();


    $(this)

    // Open close drawer
    .on('click', '.style-open-trigger', function() {
        $('body').toggleClass('slided');
    })

    // Bind on change events for select elements
    .on('change', '.switcher-panel select', function() {
        var self = $(this);

        $('html').addClass('do-animate');

        // Nuke existing classes first and grab the target ID
        self.find('option').each(function() {
            $('#page').removeClass($(this).attr('value'));
        });


        // Add the new selected class
        $('#page').toggleClass(self.val());


        // Perform task after CSS3 animation completes
        setTimeout(function() {
            $(window).trigger('resize');
            $('.js-isotope').isotope('layout');
            $('html').removeClass('do-animate');
        }, 800);


        setTimeout(function() {
            $(window).trigger('resize');
            $('.js-isotope').isotope('layout');
            //$('html').removeClass('do-animate');
        }, 1600);



    });




    // Binding live color change preview
    // @need further testing, this is just plainly nuke everything!
    $('.theme-stylizer-target > .bootstrap-colorpicker').on('changeColor', function(ev) {

        var value = ev.color.toHex(),
            targets = $(this).closest('.theme-stylizer-target').data('selectors'),
            type = $(this).data('type');

        $.each(targets, function(key, selector) {

            selector = '#page ' + selector;

            if (strpos(type, 'link') !== false) {
                $(selector).find('a').css('color', value);
            } else if (strpos(type, 'font') !== false) {
                $(selector).css('color', value);
            } else if (strpos(type, 'background') !== false) {
                $(selector).css('backgroundColor', value);
            } else if (strpos(type, 'heading') !== false) {
                $(selector).find('h1, h2, h3, h4, h5, h6').css('color', value);
            } else if (strpos(type, 'border') !== false) {
                $(selector).css('borderColor', value);
            }
        });
    });


    // Helper function to mimick strpos
    function strpos(haystack, needle, offset) {
        var i = (haystack + '').indexOf(needle, (offset || 0));
        return i === -1 ? false : i;
    }


    // Binding switch panel
    $('.switcher-panel select').each(function() {
        var self = $(this);

        $('html').addClass('do-animate');

        // Nuke existing classes first and grab the target ID
        self.find('option').each(function() {
            $('#page').removeClass($(this).attr('value'));
        });

        // Add the new selected class
        $('#page').toggleClass(self.val());

        // Perform task after CSS3 animation completes
        setTimeout(function() {
            $(window).trigger('resize');
            $('html').removeClass('do-animate');
        }, 800);

    });


    // Binding nice scroll to stylizer
    // $('.theme-style-wrapper').niceScroll();
    // $('.theme-style-wrapper').getNiceScroll().hide();

});;




(function($) {
    "use strict";
    /*
     * Equalheight per row plugin taken from http://css-tricks.com
     */
    $.fn.EqualHeight = function() {
        $(this.get()).each(function() {
            var self = $(this),
                currentTallest = 0,
                currentRowStart = 0,
                currentItem = 0,
                currentDiv = 0,
                rowDivs = new Array(),
                $el,
                items = self.equalHeightFirstLevel(' .items'),
                count = items.length,
                column = 0,
                i = 0;

            // Don't process if we got only 1 element
            if (count <= 1) {
                return;
            }

            currentRowStart = Math.floor(items.eq(currentItem).position().top);

            // Determine what is the maximum column number
            for (currentItem = 0; currentItem < count; currentItem++) {

                if (Math.floor(items.eq(currentItem).position().top) != currentRowStart) {
                    break;
                }

                column = currentItem;
            }



            for (currentItem = 0; currentItem < count; currentItem++) {

                $el = items.eq(currentItem);

                // Reset column counter
                if (column < i) {
                    i = 0;
                }

                // Entering new row
                if (i == 0) {
                    // we just came to a new row. Set all the heights on the completed row
                    for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
                        var mode = rowDivs[currentDiv].data('rowmode');
                        if (typeof mode == 'undefined') {
                            mode = 'min-height';
                        }

                        rowDivs[currentDiv].css(mode, currentTallest + 'px');
                    }

                    // set the variables for the new row
                    rowDivs = new Array(); // empty the array
                    currentTallest = Math.ceil($el.innerHeight() + 1);
                    rowDivs.push($el);

                    // Clear floats
                    rowDivs[0].css('clear', 'both');

                }

                // No more items left force resizing
                else if (items.eq(currentItem + 1).length == 0) {

                    rowDivs.push($el);
                    currentTallest = (currentTallest < $el.innerHeight()) ? ($el.innerHeight()) : (currentTallest);

                    for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
                        var mode = rowDivs[currentDiv].data('rowmode');
                        if (typeof mode == 'undefined') {
                            mode = 'min-height';
                        }

                        rowDivs[currentDiv].css(mode, currentTallest + 'px');
                    }
                }

                // Still got child just record tallest and register el
                else {

                    // another div on the current row. Add it to the list and check if
                    // it's taller
                    rowDivs.push($el);
                    currentTallest = (currentTallest < $el.innerHeight()) ? ($el.innerHeight()) : (currentTallest);
                }

                i++;

            }
        });

        return this;
    };

    /**
     * Reset The equalheight
     */
    $.fn.resetEqualHeight = function(timeout) {
        var VTEqualHeight = {
            $el: $(this),
            is_safari: navigator.userAgent.indexOf("Safari") > -1,
            queue: $({}),
            timout: timeout,
            init: function() {

                var that = this;

                this.queue
                    .queue('equalheight', function(next) {
                        that.$el.trigger('equalheight-reset');
                        next();
                    })
                    .queue('equalheight', function(next) {
                        that.destroy();
                        next();
                    })
                    .queue('equalheight', function(next) {
                        that.$el.trigger('equalheight-start');
                        setTimeout(function() {
                            next();
                        }, that.timeout);
                    })
                    .queue('equalheight', function(next) {
                        that.reposition();
                        next();
                    })
                    .queue('equalheight', function(next) {
                        that.$el.trigger('equalheight-complete');
                        next()
                    });

                this.queue.dequeue('equalheight');

                return this;
            },
            destroy: function() {
                this.$el.find('.items').css('min-height', '').css('height', '').css('clear', 'none');
                return this;
            },
            reposition: function() {
                this.$el.EqualHeight();
                return this;
            }
        };

        VTEqualHeight.init();

        return this;
    }


    $.fn.equalHeightFirstLevel = function(sel) {
        var obj = $(this);
        if (obj.selector != sel) {
            obj = obj.find(sel);
        }
        obj = obj.not(obj.find(sel));

        return obj;
    }

    /**
     * Autoloading equalheight
     */
    $(window)
        .on('load.equalheightrow resize_end.equalheightrow resize.equalheightrow', function() {
            $('.equalheightRow').resetEqualHeight(800);
        });

    $(document)
        .on('ajaxComplete animsitionPageIn.equalheightRow', function() {
            $('.equalheightRow').resetEqualHeight(800);
        });

})(jQuery);




var imgLiquid=imgLiquid||{VER:"0.9.944"};imgLiquid.bgs_Available=!1,imgLiquid.bgs_CheckRunned=!1,imgLiquid.injectCss=".imgLiquid img {visibility:hidden}",function(i){function t(){if(!imgLiquid.bgs_CheckRunned){imgLiquid.bgs_CheckRunned=!0;var t=i('<span style="background-size:cover" />');i("body").append(t),!function(){var i=t[0];if(i&&window.getComputedStyle){var e=window.getComputedStyle(i,null);e&&e.backgroundSize&&(imgLiquid.bgs_Available="cover"===e.backgroundSize)}}(),t.remove()}}i.fn.extend({imgLiquid:function(e){this.defaults={fill:!0,verticalAlign:"center",horizontalAlign:"center",useBackgroundSize:!0,useDataHtmlAttr:!0,responsive:!0,delay:0,fadeInTime:0,removeBoxBackground:!0,hardPixels:!0,responsiveCheckTime:500,timecheckvisibility:500,onStart:null,onFinish:null,onItemStart:null,onItemFinish:null,onItemError:null},t();var a=this;return this.options=e,this.settings=i.extend({},this.defaults,this.options),this.settings.onStart&&this.settings.onStart(),this.each(function(t){function e(){-1===u.css("background-image").indexOf(encodeURI(c.attr("src")))&&u.css({"background-image":'url("'+encodeURI(c.attr("src"))+'")'}),u.css({"background-size":g.fill?"cover":"contain","background-position":(g.horizontalAlign+" "+g.verticalAlign).toLowerCase(),"background-repeat":"no-repeat"}),i("a:first",u).css({display:"block",width:"100%",height:"100%"}),i("img",u).css({display:"none"}),g.onItemFinish&&g.onItemFinish(t,u,c),u.addClass("imgLiquid_bgSize"),u.addClass("imgLiquid_ready"),l()}function d(){function e(){c.data("imgLiquid_error")||c.data("imgLiquid_loaded")||c.data("imgLiquid_oldProcessed")||(u.is(":visible")&&c[0].complete&&c[0].width>0&&c[0].height>0?(c.data("imgLiquid_loaded",!0),setTimeout(r,t*g.delay)):setTimeout(e,g.timecheckvisibility))}if(c.data("oldSrc")&&c.data("oldSrc")!==c.attr("src")){var a=c.clone().removeAttr("style");return a.data("imgLiquid_settings",c.data("imgLiquid_settings")),c.parent().prepend(a),c.remove(),c=a,c[0].width=0,setTimeout(d,10),void 0}return c.data("imgLiquid_oldProcessed")?(r(),void 0):(c.data("imgLiquid_oldProcessed",!1),c.data("oldSrc",c.attr("src")),i("img:not(:first)",u).css("display","none"),u.css({overflow:"hidden"}),c.fadeTo(0,0).removeAttr("width").removeAttr("height").css({visibility:"visible","max-width":"none","max-height":"none",width:"auto",height:"auto",display:"block"}),c.on("error",n),c[0].onerror=n,e(),o(),void 0)}function o(){(g.responsive||c.data("imgLiquid_oldProcessed"))&&c.data("imgLiquid_settings")&&(g=c.data("imgLiquid_settings"),u.actualSize=u.get(0).offsetWidth+u.get(0).offsetHeight/1e4,u.sizeOld&&u.actualSize!==u.sizeOld&&r(),u.sizeOld=u.actualSize,setTimeout(o,g.responsiveCheckTime))}function n(){c.data("imgLiquid_error",!0),u.addClass("imgLiquid_error"),g.onItemError&&g.onItemError(t,u,c),l()}function s(){var i={};if(a.settings.useDataHtmlAttr){var t=u.attr("data-imgLiquid-fill"),e=u.attr("data-imgLiquid-horizontalAlign"),d=u.attr("data-imgLiquid-verticalAlign");("true"===t||"false"===t)&&(i.fill=Boolean("true"===t)),void 0===e||"left"!==e&&"center"!==e&&"right"!==e&&-1===e.indexOf("%")||(i.horizontalAlign=e),void 0===d||"top"!==d&&"bottom"!==d&&"center"!==d&&-1===d.indexOf("%")||(i.verticalAlign=d)}return imgLiquid.isIE&&a.settings.ieFadeInDisabled&&(i.fadeInTime=0),i}function r(){var i,e,a,d,o,n,s,r,m=0,h=0,f=u.width(),v=u.height();void 0===c.data("owidth")&&c.data("owidth",c[0].width),void 0===c.data("oheight")&&c.data("oheight",c[0].height),g.fill===f/v>=c.data("owidth")/c.data("oheight")?(i="100%",e="auto",a=Math.floor(f),d=Math.floor(f*(c.data("oheight")/c.data("owidth")))):(i="auto",e="100%",a=Math.floor(v*(c.data("owidth")/c.data("oheight"))),d=Math.floor(v)),o=g.horizontalAlign.toLowerCase(),s=f-a,"left"===o&&(h=0),"center"===o&&(h=.5*s),"right"===o&&(h=s),-1!==o.indexOf("%")&&(o=parseInt(o.replace("%",""),10),o>0&&(h=.01*s*o)),n=g.verticalAlign.toLowerCase(),r=v-d,"left"===n&&(m=0),"center"===n&&(m=.5*r),"bottom"===n&&(m=r),-1!==n.indexOf("%")&&(n=parseInt(n.replace("%",""),10),n>0&&(m=.01*r*n)),g.hardPixels&&(i=a,e=d),c.css({width:i,height:e,"margin-left":Math.floor(h),"margin-top":Math.floor(m)}),c.data("imgLiquid_oldProcessed")||(c.fadeTo(g.fadeInTime,1),c.data("imgLiquid_oldProcessed",!0),g.removeBoxBackground&&u.css("background-image","none"),u.addClass("imgLiquid_nobgSize"),u.addClass("imgLiquid_ready")),g.onItemFinish&&g.onItemFinish(t,u,c),l()}function l(){t===a.length-1&&a.settings.onFinish&&a.settings.onFinish()}var g=a.settings,u=i(this),c=i("img:first",u);return c.length?(c.data("imgLiquid_settings")?(u.removeClass("imgLiquid_error").removeClass("imgLiquid_ready"),g=i.extend({},c.data("imgLiquid_settings"),a.options)):g=i.extend({},a.settings,s()),c.data("imgLiquid_settings",g),g.onItemStart&&g.onItemStart(t,u,c),imgLiquid.bgs_Available&&g.useBackgroundSize?e():d(),void 0):(n(),void 0)})}})}(jQuery),!function(){var i=imgLiquid.injectCss,t=document.getElementsByTagName("head")[0],e=document.createElement("style");e.type="text/css",e.styleSheet?e.styleSheet.cssText=i:e.appendChild(document.createTextNode(i)),t.appendChild(e)}();
// Autobooting
jQuery(document).ready(function($) {
"use strict";    
  $(document)
    .on('ajaxComplete', function() {
      $('.imgLiquidFill:not(.imgLiquid_ready)').imgLiquid();
    })
    .on('layoutComplete', function() {
      $('.imgLiquidFill:not(.imgLiquid_ready)').imgLiquid();
    });
  
  $(window)
    .on('load', function() {
      $('.imgLiquidFill').imgLiquid();
    });
 
});




/*
 * Javascript for handling the Portfolio on metro mode.
 * This script relies on correct CSS format for proper
 * display that has metro stacked grid.
 * 
 * @author jason.xie@victheme.com
 */
(function($) {

    "use strict";

    $(window)
        .on('load', function() {

            $('.portfolio-metro-gallery').isotope({
                itemSelector: '.portfolio-item',
                layoutMode: 'fitColumns'
            });


            $('.portfolio-metro-gallery-wrapper').each(function() {

                $(this).customScrollbar({
                    skin: 'portfolio-metro',

                    // Rely on Isotope to handle window
                    // resizing and triggers the scrollbar
                    // resizing.
                    updateOnWindowResize: true,

                    vScroll: false,
                    fixedThumbHeight: 24,
                    fixedThumbWidth: 84
                });

                if ($(this).data('start') == 'right') {
                    $(this).customScrollbar('scrollToX', $(this).find('.viewport').width(), 10);
                }

                if ($(this).data('start') == 'center') {
                    $(this).customScrollbar('scrollToX', $(this).find('.viewport').width() / 2, 10);
                }

                // This is edge case where the content is narrower than the viewport
                if ($(this).find('.portfolio-metro-gallery').width() < $(this).find('.viewport').width()) {
                    $(this).find('.portfolio-metro-gallery').css('width', $(this).find('.viewport').width() + 1);
                    $(this).customScrollbar("resize", true);
                }

            });
        });

    $(document)
        .on('layoutComplete', function(element, item) {

            if ($.isFunction($.inviewport)) {
                $(item.element).find('.scroll-animated:in-viewport').removeClass('scroll-animated').addClass('animated');
            }

            if ($.isFunction($.fn.VTCoreAspectRatio)) {
                $(item.element).find('[data-aspect="true"]').VTCoreAspectRatio();
            }

            if ($.isFunction($.fn.vertCentInit)) {
                $(item.element).find('.vertical-target').stop();
                $(item.element).find('.vertical-center').vertCentInit();
            }

            setTimeout(function() {
                if ($(item.element).hasClass('portfolio-metro-gallery')) {
                    $(item.element).closest('.portfolio-metro-gallery-wrapper').customScrollbar("resize", true)
                }
            }, 800);

        })
        .on('customScroll', '.portfolio-metro-gallery-wrapper', function(event, scrollData) {

            // Only fires on end of scroll 
            if (scrollData.scrollPercent != 100 || $(this).data('ajax') == false) {
                return true;
            }

            $(this).addClass('btn-ajax').trigger('click.btn-ajax').removeClass('btn-ajax').spin();
        })
        .on('ajaxComplete', function(event, xhr, settings) {

            if (typeof settings.marker != 'undefined' && typeof settings.marker.mode != 'undefined' && typeof settings.marker.target != 'undefined' && settings.marker.mode == 'vtcore-portfolio-metro-ajax') {

                var AjaxData = $.fn.VTCoreProcessAjaxResponse(xhr.responseText),
                    objectQueue = $({});

                AjaxData.content && AjaxData.content.action && $.each(AjaxData.content.action, function(key, data) {

                    if (data.mode == 'portfolio-metro-append' && data.content) {

                        var items = $(data.content.replace(/(\r\n|\n|\r)/gm, "")),
                            self = $(data.target);

                        objectQueue.queue(function(next) {
                            self.append(items).isotope('appended', items);
                            next();

                        });

                        objectQueue.queue(function(next) {
                            setTimeout(function() {
                                self.isotope('layout');
                                self.closest('.portfolio-metro-gallery-wrapper').spin(false);
                                next();
                            }, 1000);
                        });

                        objectQueue.dequeue();
                    }
                });

            }
        });

})(jQuery);




(function() {
    "use strict";
    var root = (typeof exports == 'undefined' ? window : exports);

    var config = {
        // Ensure Content-Type is an image before trying to load @2x image
        // https://github.com/imulus/retinajs/pull/45)
        check_mime_type: true,

        // Resize high-resolution images to original image's pixel dimensions
        // https://github.com/imulus/retinajs/issues/8
        force_original_dimensions: true
    };

    root.Retina = Retina;

    function Retina() {}

    Retina.configure = function(options) {
        if (options == null) options = {};
        for (var prop in options) config[prop] = options[prop];
    };

    Retina.init = function(context) {
        if (context == null) context = root;

        var existing_onload = context.onload || new Function;

        context.onload = function() {
            var images = document.getElementsByTagName("img"),
                retinaImages = [],
                i, image;
            for (i = 0; i < images.length; i++) {
                image = images[i];
                retinaImages.push(new RetinaImage(image));
            }
            existing_onload();
        }
    };

    Retina.isRetina = function() {
        var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
                      (min--moz-device-pixel-ratio: 1.5),\
                      (-o-min-device-pixel-ratio: 3/2),\
                      (min-resolution: 1.5dppx)";

        if (root.devicePixelRatio > 1)
            return true;

        if (root.matchMedia && root.matchMedia(mediaQuery).matches)
            return true;

        return false;
    };


    root.RetinaImagePath = RetinaImagePath;

    function RetinaImagePath(path, at_2x_path) {
        this.path = path;
        if (typeof at_2x_path !== "undefined" && at_2x_path !== null) {
            this.at_2x_path = at_2x_path;
            this.perform_check = false;
        } else {
            this.at_2x_path = path.replace(/\.\w+$/, function(match) {
                return "@2x" + match;
            });
            this.perform_check = true;
        }
    }

    RetinaImagePath.confirmed_paths = [];

    RetinaImagePath.prototype.is_external = function() {
        return !!(this.path.match(/^https?\:/i) && !this.path.match('//' + document.domain))
    }

    RetinaImagePath.prototype.check_2x_variant = function(callback) {
        var http, that = this;
        if (this.is_external()) {
            return callback(false);
        } else if (!this.perform_check && typeof this.at_2x_path !== "undefined" && this.at_2x_path !== null) {
            return callback(true);
        } else if (this.at_2x_path in RetinaImagePath.confirmed_paths) {
            return callback(true);
        } else {
            http = new XMLHttpRequest;
            http.open('HEAD', this.at_2x_path);
            http.onreadystatechange = function() {
                if (http.readyState != 4) {
                    return callback(false);
                }

                if (http.status >= 200 && http.status <= 399) {
                    if (config.check_mime_type) {
                        var type = http.getResponseHeader('Content-Type');
                        if (type == null || !type.match(/^image/i)) {
                            return callback(false);
                        }
                    }

                    RetinaImagePath.confirmed_paths.push(that.at_2x_path);
                    return callback(true);
                } else {
                    return callback(false);
                }
            }
            http.send();
        }
    }



    function RetinaImage(el) {
        this.el = el;
        this.path = new RetinaImagePath(this.el.getAttribute('src'), this.el.getAttribute('data-at2x'));
        var that = this;
        this.path.check_2x_variant(function(hasVariant) {
            if (hasVariant) that.swap();
        });
    }

    root.RetinaImage = RetinaImage;

    RetinaImage.prototype.swap = function(path) {
        if (typeof path == 'undefined') path = this.path.at_2x_path;

        var that = this;

        function load() {
            if (!that.el.complete) {
                setTimeout(load, 5);
            } else {
                if (config.force_original_dimensions) {
                    that.el.setAttribute('width', that.el.offsetWidth);
                    that.el.setAttribute('height', that.el.offsetHeight);
                }

                that.el.setAttribute('src', path);
            }
        }
        load();
    }



    if (Retina.isRetina()) {
        Retina.init(root);
    }

})();




/*
 * Fotorama 4.6.3 | http://fotorama.io/license/
 */
fotoramaVersion = '4.6.3';
(function(window, document, location, $, undefined) {
    "use strict";
    var _fotoramaClass = 'fotorama',
        _fullscreenClass = 'fullscreen',

        wrapClass = _fotoramaClass + '__wrap',
        wrapCss2Class = wrapClass + '--css2',
        wrapCss3Class = wrapClass + '--css3',
        wrapVideoClass = wrapClass + '--video',
        wrapFadeClass = wrapClass + '--fade',
        wrapSlideClass = wrapClass + '--slide',
        wrapNoControlsClass = wrapClass + '--no-controls',
        wrapNoShadowsClass = wrapClass + '--no-shadows',
        wrapPanYClass = wrapClass + '--pan-y',
        wrapRtlClass = wrapClass + '--rtl',
        wrapOnlyActiveClass = wrapClass + '--only-active',
        wrapNoCaptionsClass = wrapClass + '--no-captions',
        wrapToggleArrowsClass = wrapClass + '--toggle-arrows',

        stageClass = _fotoramaClass + '__stage',
        stageFrameClass = stageClass + '__frame',
        stageFrameVideoClass = stageFrameClass + '--video',
        stageShaftClass = stageClass + '__shaft',

        grabClass = _fotoramaClass + '__grab',
        pointerClass = _fotoramaClass + '__pointer',

        arrClass = _fotoramaClass + '__arr',
        arrDisabledClass = arrClass + '--disabled',
        arrPrevClass = arrClass + '--prev',
        arrNextClass = arrClass + '--next',
        arrArrClass = arrClass + '__arr',

        navClass = _fotoramaClass + '__nav',
        navWrapClass = navClass + '-wrap',
        navShaftClass = navClass + '__shaft',
        navDotsClass = navClass + '--dots',
        navThumbsClass = navClass + '--thumbs',
        navFrameClass = navClass + '__frame',
        navFrameDotClass = navFrameClass + '--dot',
        navFrameThumbClass = navFrameClass + '--thumb',

        fadeClass = _fotoramaClass + '__fade',
        fadeFrontClass = fadeClass + '-front',
        fadeRearClass = fadeClass + '-rear',

        shadowClass = _fotoramaClass + '__shadow',
        shadowsClass = shadowClass + 's',
        shadowsLeftClass = shadowsClass + '--left',
        shadowsRightClass = shadowsClass + '--right',

        activeClass = _fotoramaClass + '__active',
        selectClass = _fotoramaClass + '__select',

        hiddenClass = _fotoramaClass + '--hidden',

        fullscreenClass = _fotoramaClass + '--fullscreen',
        fullscreenIconClass = _fotoramaClass + '__fullscreen-icon',

        errorClass = _fotoramaClass + '__error',
        loadingClass = _fotoramaClass + '__loading',
        loadedClass = _fotoramaClass + '__loaded',
        loadedFullClass = loadedClass + '--full',
        loadedImgClass = loadedClass + '--img',

        grabbingClass = _fotoramaClass + '__grabbing',

        imgClass = _fotoramaClass + '__img',
        imgFullClass = imgClass + '--full',

        dotClass = _fotoramaClass + '__dot',
        thumbClass = _fotoramaClass + '__thumb',
        thumbBorderClass = thumbClass + '-border',

        htmlClass = _fotoramaClass + '__html',

        videoClass = _fotoramaClass + '__video',
        videoPlayClass = videoClass + '-play',
        videoCloseClass = videoClass + '-close',

        captionClass = _fotoramaClass + '__caption',
        captionWrapClass = _fotoramaClass + '__caption__wrap',

        spinnerClass = _fotoramaClass + '__spinner',

        buttonAttributes = '" tabindex="0" role="button';
    var JQUERY_VERSION = $ && $.fn.jquery.split('.');

    if (!JQUERY_VERSION || JQUERY_VERSION[0] < 1 || (JQUERY_VERSION[0] == 1 && JQUERY_VERSION[1] < 8)) {
        throw 'Fotorama requires jQuery 1.8 or later and will not run without it.';
    }
    // My Underscore :-)
    var _ = {};
    /* Modernizr 2.6.2 (Custom Build) | MIT & BSD
     * Build: http://modernizr.com/download/#-csstransforms3d-prefixed-teststyles-testprop-testallprops-prefixes-domprefixes
     */

    var Modernizr = (function(window, document, undefined) {

        var version = '2.6.2',

            Modernizr = {},

            docElement = document.documentElement,

            mod = 'modernizr',
            modElem = document.createElement(mod),
            mStyle = modElem.style,

            inputElem,

            toString = {}.toString,

            prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),

            omPrefixes = 'Webkit Moz O ms',

            cssomPrefixes = omPrefixes.split(' '),

            domPrefixes = omPrefixes.toLowerCase().split(' '),

            tests = {},
            inputs = {},
            attrs = {},

            classes = [],

            slice = classes.slice,

            featureName,

            injectElementWithStyles = function(rule, callback, nodes, testnames) {

                var style, ret, node, docOverflow,
                    div = document.createElement('div'),
                    body = document.body,
                    fakeBody = body || document.createElement('body');

                if (parseInt(nodes, 10)) {
                    while (nodes--) {
                        node = document.createElement('div');
                        node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
                        div.appendChild(node);
                    }
                }

                style = ['&#173;', '<style id="s', mod, '">', rule, '</style>'].join('');
                div.id = mod;
                (body ? div : fakeBody).innerHTML += style;
                fakeBody.appendChild(div);
                if (!body) {
                    fakeBody.style.background = '';
                    fakeBody.style.overflow = 'hidden';
                    docOverflow = docElement.style.overflow;
                    docElement.style.overflow = 'hidden';
                    docElement.appendChild(fakeBody);
                }

                ret = callback(div, rule);
                if (!body) {
                    fakeBody.parentNode.removeChild(fakeBody);
                    docElement.style.overflow = docOverflow;
                } else {
                    div.parentNode.removeChild(div);
                }

                return !!ret;

            },
            _hasOwnProperty = ({}).hasOwnProperty,
            hasOwnProp;

        if (!is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined')) {
            hasOwnProp = function(object, property) {
                return _hasOwnProperty.call(object, property);
            };
        } else {
            hasOwnProp = function(object, property) {
                return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
            };
        }


        if (!Function.prototype.bind) {
            Function.prototype.bind = function bind(that) {

                var target = this;

                if (typeof target != "function") {
                    throw new TypeError();
                }

                var args = slice.call(arguments, 1),
                    bound = function() {

                        if (this instanceof bound) {

                            var F = function() {};
                            F.prototype = target.prototype;
                            var self = new F();

                            var result = target.apply(
                                self,
                                args.concat(slice.call(arguments))
                            );
                            if (Object(result) === result) {
                                return result;
                            }
                            return self;

                        } else {

                            return target.apply(
                                that,
                                args.concat(slice.call(arguments))
                            );

                        }

                    };

                return bound;
            };
        }

        function setCss(str) {
            mStyle.cssText = str;
        }

        function setCssAll(str1, str2) {
            return setCss(prefixes.join(str1 + ';') + (str2 || ''));
        }

        function is(obj, type) {
            return typeof obj === type;
        }

        function contains(str, substr) {
            return !!~('' + str).indexOf(substr);
        }

        function testProps(props, prefixed) {
            for (var i in props) {
                var prop = props[i];
                if (!contains(prop, "-") && mStyle[prop] !== undefined) {
                    return prefixed == 'pfx' ? prop : true;
                }
            }
            return false;
        }

        function testDOMProps(props, obj, elem) {
            for (var i in props) {
                var item = obj[props[i]];
                if (item !== undefined) {

                    if (elem === false) return props[i];

                    if (is(item, 'function')) {
                        return item.bind(elem || obj);
                    }

                    return item;
                }
            }
            return false;
        }

        function testPropsAll(prop, prefixed, elem) {

            var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
                props = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

            if (is(prefixed, "string") || is(prefixed, "undefined")) {
                return testProps(props, prefixed);

            } else {
                props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
                return testDOMProps(props, prefixed, elem);
            }
        }

        tests['csstransforms3d'] = function() {

            var ret = !!testPropsAll('perspective');

            // Chrome fails that test, ignore
            //		if (ret && 'webkitPerspective' in docElement.style) {
            //
            //			injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function (node, rule) {
            //				ret = node.offsetLeft === 9 && node.offsetHeight === 3;
            //			});
            //		}
            return ret;
        };

        for (var feature in tests) {
            if (hasOwnProp(tests, feature)) {
                featureName = feature.toLowerCase();
                Modernizr[featureName] = tests[feature]();

                classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
            }
        }

        Modernizr.addTest = function(feature, test) {
            if (typeof feature == 'object') {
                for (var key in feature) {
                    if (hasOwnProp(feature, key)) {
                        Modernizr.addTest(key, feature[key]);
                    }
                }
            } else {

                feature = feature.toLowerCase();

                if (Modernizr[feature] !== undefined) {
                    return Modernizr;
                }

                test = typeof test == 'function' ? test() : test;

                if (typeof enableClasses !== "undefined" && enableClasses) {
                    docElement.className += ' ' + (test ? '' : 'no-') + feature;
                }
                Modernizr[feature] = test;

            }

            return Modernizr;
        };


        setCss('');
        modElem = inputElem = null;


        Modernizr._version = version;

        Modernizr._prefixes = prefixes;
        Modernizr._domPrefixes = domPrefixes;
        Modernizr._cssomPrefixes = cssomPrefixes;

        Modernizr.testProp = function(prop) {
            return testProps([prop]);
        };

        Modernizr.testAllProps = testPropsAll;

        Modernizr.testStyles = injectElementWithStyles;
        Modernizr.prefixed = function(prop, obj, elem) {
            if (!obj) {
                return testPropsAll(prop, 'pfx');
            } else {
                return testPropsAll(prop, obj, elem);
            }
        };

        return Modernizr;
    })(window, document);
    var fullScreenApi = {
            ok: false,
            is: function() {
                return false;
            },
            request: function() {},
            cancel: function() {},
            event: '',
            prefix: ''
        },
        browserPrefixes = 'webkit moz o ms khtml'.split(' ');

    // check for native support
    if (typeof document.cancelFullScreen != 'undefined') {
        fullScreenApi.ok = true;
    } else {
        // check for fullscreen support by vendor prefix
        for (var i = 0, il = browserPrefixes.length; i < il; i++) {
            fullScreenApi.prefix = browserPrefixes[i];
            if (typeof document[fullScreenApi.prefix + 'CancelFullScreen'] != 'undefined') {
                fullScreenApi.ok = true;
                break;
            }
        }
    }

    // update methods to do something useful
    if (fullScreenApi.ok) {
        fullScreenApi.event = fullScreenApi.prefix + 'fullscreenchange';
        fullScreenApi.is = function() {
            switch (this.prefix) {
                case '':
                    return document.fullScreen;
                case 'webkit':
                    return document.webkitIsFullScreen;
                default:
                    return document[this.prefix + 'FullScreen'];
            }
        };
        fullScreenApi.request = function(el) {
            return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
        };
        fullScreenApi.cancel = function(el) {
            return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
        };
    }
    //fgnass.github.com/spin.js#v1.3.2

    /**
     * Copyright (c) 2011-2013 Felix Gnass
     * Licensed under the MIT license
     */

    var Spinner,
        spinnerDefaults = {
            lines: 12, // The number of lines to draw
            length: 5, // The length of each line
            width: 2, // The line thickness
            radius: 7, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 15, // The rotation offset
            color: 'rgba(128, 128, 128, .75)',
            hwaccel: true
        },
        spinnerOverride = {
            top: 'auto',
            left: 'auto',
            className: ''
        };

    (function(root, factory) {

            /* CommonJS */
            //if (typeof exports == 'object')  module.exports = factory()

            /* AMD module */
            //else if (typeof define == 'function' && define.amd) define(factory)

            /* Browser global */
            //else root.Spinner = factory()

            Spinner = factory();
        }
        (this, function() {
            "use strict";

            var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */ ,
                animations = {} /* Animation rules keyed by their name */ ,
                useCssAnimations /* Whether to use CSS animations or setTimeout */

            /**
             * Utility function to create elements. If no tag name is given,
             * a DIV is created. Optionally properties can be passed.
             */
            function createEl(tag, prop) {
                var el = document.createElement(tag || 'div'),
                    n

                for (n in prop) el[n] = prop[n]
                return el
            }

            /**
             * Appends children and returns the parent.
             */
            function ins(parent /* child1, child2, ...*/ ) {
                for (var i = 1, n = arguments.length; i < n; i++)
                    parent.appendChild(arguments[i])

                return parent
            }

            /**
             * Insert a new stylesheet to hold the @keyframe or VML rules.
             */
            var sheet = (function() {
                var el = createEl('style', {
                    type: 'text/css'
                })
                ins(document.getElementsByTagName('head')[0], el)
                return el.sheet || el.styleSheet
            }())

            /**
             * Creates an opacity keyframe animation rule and returns its name.
             * Since most mobile Webkits have timing issues with animation-delay,
             * we create separate rules for each line/segment.
             */
            function addAnimation(alpha, trail, i, lines) {
                var name = ['opacity', trail, ~~(alpha * 100), i, lines].join('-'),
                    start = 0.01 + i / lines * 100,
                    z = Math.max(1 - (1 - alpha) / trail * (100 - start), alpha),
                    prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase(),
                    pre = prefix && '-' + prefix + '-' || ''

                if (!animations[name]) {
                    sheet.insertRule(
                        '@' + pre + 'keyframes ' + name + '{' +
                        '0%{opacity:' + z + '}' +
                        start + '%{opacity:' + alpha + '}' +
                        (start + 0.01) + '%{opacity:1}' +
                        (start + trail) % 100 + '%{opacity:' + alpha + '}' +
                        '100%{opacity:' + z + '}' +
                        '}', sheet.cssRules.length)

                    animations[name] = 1
                }

                return name
            }

            /**
             * Tries various vendor prefixes and returns the first supported property.
             */
            function vendor(el, prop) {
                var s = el.style,
                    pp, i

                prop = prop.charAt(0).toUpperCase() + prop.slice(1)
                for (i = 0; i < prefixes.length; i++) {
                    pp = prefixes[i] + prop
                    if (s[pp] !== undefined) return pp
                }
                if (s[prop] !== undefined) return prop
            }

            /**
             * Sets multiple style properties at once.
             */
            function css(el, prop) {
                for (var n in prop)
                    el.style[vendor(el, n) || n] = prop[n]

                return el
            }

            /**
             * Fills in default values.
             */
            function merge(obj) {
                for (var i = 1; i < arguments.length; i++) {
                    var def = arguments[i]
                    for (var n in def)
                        if (obj[n] === undefined) obj[n] = def[n]
                }
                return obj
            }

            /**
             * Returns the absolute page-offset of the given element.
             */
            function pos(el) {
                var o = {
                    x: el.offsetLeft,
                    y: el.offsetTop
                }
                while ((el = el.offsetParent))
                    o.x += el.offsetLeft, o.y += el.offsetTop

                return o
            }

            /**
             * Returns the line color from the given string or array.
             */
            function getColor(color, idx) {
                return typeof color == 'string' ? color : color[idx % color.length]
            }

            // Built-in defaults

            var defaults = {
                lines: 12, // The number of lines to draw
                length: 7, // The length of each line
                width: 5, // The line thickness
                radius: 10, // The radius of the inner circle
                rotate: 0, // Rotation offset
                corners: 1, // Roundness (0..1)
                color: '#000', // #rgb or #rrggbb
                direction: 1, // 1: clockwise, -1: counterclockwise
                speed: 1, // Rounds per second
                trail: 100, // Afterglow percentage
                opacity: 1 / 4, // Opacity of the lines
                fps: 20, // Frames per second when using setTimeout()
                zIndex: 2e9, // Use a high z-index by default
                className: 'spinner', // CSS class to assign to the element
                top: 'auto', // center vertically
                left: 'auto', // center horizontally
                position: 'relative' // element position
            }

            /** The constructor */
            function Spinner(o) {
                if (typeof this == 'undefined') return new Spinner(o)
                this.opts = merge(o || {}, Spinner.defaults, defaults)
            }

            // Global defaults that override the built-ins:
            Spinner.defaults = {}

            merge(Spinner.prototype, {

                /**
                 * Adds the spinner to the given target element. If this instance is already
                 * spinning, it is automatically removed from its previous target b calling
                 * stop() internally.
                 */
                spin: function(target) {
                    this.stop()

                    var self = this,
                        o = self.opts,
                        el = self.el = css(createEl(0, {
                            className: o.className
                        }), {
                            position: o.position,
                            width: 0,
                            zIndex: o.zIndex
                        }),
                        mid = o.radius + o.length + o.width,
                        ep // element position
                        , tp // target position

                    if (target) {
                        target.insertBefore(el, target.firstChild || null)
                        tp = pos(target)
                        ep = pos(el)
                        css(el, {
                            left: (o.left == 'auto' ? tp.x - ep.x + (target.offsetWidth >> 1) : parseInt(o.left, 10) + mid) + 'px',
                            top: (o.top == 'auto' ? tp.y - ep.y + (target.offsetHeight >> 1) : parseInt(o.top, 10) + mid) + 'px'
                        })
                    }

                    el.setAttribute('role', 'progressbar')
                    self.lines(el, self.opts)

                    if (!useCssAnimations) {
                        // No CSS animation support, use setTimeout() instead
                        var i = 0,
                            start = (o.lines - 1) * (1 - o.direction) / 2,
                            alpha, fps = o.fps,
                            f = fps / o.speed,
                            ostep = (1 - o.opacity) / (f * o.trail / 100),
                            astep = f / o.lines

                        ;
                        (function anim() {
                            i++;
                            for (var j = 0; j < o.lines; j++) {
                                alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

                                self.opacity(el, j * o.direction + start, alpha, o)
                            }
                            self.timeout = self.el && setTimeout(anim, ~~(1000 / fps))
                        })()
                    }
                    return self
                },

                /**
                 * Stops and removes the Spinner.
                 */
                stop: function() {
                    var el = this.el
                    if (el) {
                        clearTimeout(this.timeout)
                        if (el.parentNode) el.parentNode.removeChild(el)
                        this.el = undefined
                    }
                    return this
                },

                /**
                 * Internal method that draws the individual lines. Will be overwritten
                 * in VML fallback mode below.
                 */
                lines: function(el, o) {
                    var i = 0,
                        start = (o.lines - 1) * (1 - o.direction) / 2,
                        seg

                    function fill(color, shadow) {
                        return css(createEl(), {
                            position: 'absolute',
                            width: (o.length + o.width) + 'px',
                            height: o.width + 'px',
                            background: color,
                            boxShadow: shadow,
                            transformOrigin: 'left',
                            transform: 'rotate(' + ~~(360 / o.lines * i + o.rotate) + 'deg) translate(' + o.radius + 'px' + ',0)',
                            borderRadius: (o.corners * o.width >> 1) + 'px'
                        })
                    }

                    for (; i < o.lines; i++) {
                        seg = css(createEl(), {
                            position: 'absolute',
                            top: 1 + ~(o.width / 2) + 'px',
                            transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
                            opacity: o.opacity,
                            animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1 / o.speed + 's linear infinite'
                        })

                        if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {
                            top: 2 + 'px'
                        }))
                        ins(el, ins(seg, fill(getColor(o.color, i), '0 0 1px rgba(0,0,0,.1)')))
                    }
                    return el
                },

                /**
                 * Internal method that adjusts the opacity of a single line.
                 * Will be overwritten in VML fallback mode below.
                 */
                opacity: function(el, i, val) {
                    if (i < el.childNodes.length) el.childNodes[i].style.opacity = val
                }

            })


            function initVML() {

                /* Utility function to create a VML tag */
                function vml(tag, attr) {
                    return createEl('<' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">', attr)
                }

                // No CSS transforms but VML support, add a CSS rule for VML elements:
                sheet.addRule('.spin-vml', 'behavior:url(#default#VML)')

                Spinner.prototype.lines = function(el, o) {
                    var r = o.length + o.width,
                        s = 2 * r

                    function grp() {
                        return css(
                            vml('group', {
                                coordsize: s + ' ' + s,
                                coordorigin: -r + ' ' + -r
                            }), {
                                width: s,
                                height: s
                            }
                        )
                    }

                    var margin = -(o.width + o.length) * 2 + 'px',
                        g = css(grp(), {
                            position: 'absolute',
                            top: margin,
                            left: margin
                        }),
                        i

                    function seg(i, dx, filter) {
                        ins(g,
                            ins(css(grp(), {
                                    rotation: 360 / o.lines * i + 'deg',
                                    left: ~~dx
                                }),
                                ins(css(vml('roundrect', {
                                        arcsize: o.corners
                                    }), {
                                        width: r,
                                        height: o.width,
                                        left: o.radius,
                                        top: -o.width >> 1,
                                        filter: filter
                                    }),
                                    vml('fill', {
                                        color: getColor(o.color, i),
                                        opacity: o.opacity
                                    }),
                                    vml('stroke', {
                                        opacity: 0
                                    }) // transparent stroke to fix color bleeding upon opacity change
                                )
                            )
                        )
                    }

                    if (o.shadow)
                        for (i = 1; i <= o.lines; i++)
                            seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)')

                    for (i = 1; i <= o.lines; i++) seg(i)
                    return ins(el, g)
                }

                Spinner.prototype.opacity = function(el, i, val, o) {
                    var c = el.firstChild
                    o = o.shadow && o.lines || 0
                    if (c && i + o < c.childNodes.length) {
                        c = c.childNodes[i + o];
                        c = c && c.firstChild;
                        c = c && c.firstChild
                        if (c) c.opacity = val
                    }
                }
            }

            var probe = css(createEl('group'), {
                behavior: 'url(#default#VML)'
            })

            if (!vendor(probe, 'transform') && probe.adj) initVML()
            else useCssAnimations = vendor(probe, 'animation')

            return Spinner

        }));

    /* Bez v1.0.10-g5ae0136
     * http://github.com/rdallasgray/bez
     *
     * A plugin to convert CSS3 cubic-bezier co-ordinates to jQuery-compatible easing functions
     *
     * With thanks to Nikolay Nemshilov for clarification on the cubic-bezier maths
     * See http://st-on-it.blogspot.com/2011/05/calculating-cubic-bezier-function.html
     *
     * Copyright 2011 Robert Dallas Gray. All rights reserved.
     * Provided under the FreeBSD license: https://github.com/rdallasgray/bez/blob/master/LICENSE.txt
     */
    function bez(coOrdArray) {
        "use strict";
        var encodedFuncName = "bez_" + $.makeArray(arguments).join("_").replace(".", "p");
        if (typeof $['easing'][encodedFuncName] !== "function") {
            var polyBez = function(p1, p2) {
                var A = [null, null],
                    B = [null, null],
                    C = [null, null],
                    bezCoOrd = function(t, ax) {
                        C[ax] = 3 * p1[ax];
                        B[ax] = 3 * (p2[ax] - p1[ax]) - C[ax];
                        A[ax] = 1 - C[ax] - B[ax];
                        return t * (C[ax] + t * (B[ax] + t * A[ax]));
                    },
                    xDeriv = function(t) {
                        return C[0] + t * (2 * B[0] + 3 * A[0] * t);
                    },
                    xForT = function(t) {
                        var x = t,
                            i = 0,
                            z;
                        while (++i < 14) {
                            z = bezCoOrd(x, 0) - t;
                            if (Math.abs(z) < 1e-3) break;
                            x -= z / xDeriv(x);
                        }
                        return x;
                    };
                return function(t) {
                    return bezCoOrd(xForT(t), 1);
                }
            };
            $['easing'][encodedFuncName] = function(x, t, b, c, d) {
                return c * polyBez([coOrdArray[0], coOrdArray[1]], [coOrdArray[2], coOrdArray[3]])(t / d) + b;
            }
        }
        return encodedFuncName;
    }
    var $WINDOW = $(window),
        $DOCUMENT = $(document),
        $HTML,
        $BODY,

        QUIRKS_FORCE = location.hash.replace('#', '') === 'quirks',
        TRANSFORMS3D = Modernizr.csstransforms3d,
        CSS3 = TRANSFORMS3D && !QUIRKS_FORCE,
        COMPAT = TRANSFORMS3D || document.compatMode === 'CSS1Compat',
        FULLSCREEN = fullScreenApi.ok,

        MOBILE = navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i),
        SLOW = !CSS3 || MOBILE,

        MS_POINTER = navigator.msPointerEnabled,

        WHEEL = "onwheel" in document.createElement("div") ? "wheel" : document.onmousewheel !== undefined ? "mousewheel" : "DOMMouseScroll",

        TOUCH_TIMEOUT = 250,
        TRANSITION_DURATION = 300,

        SCROLL_LOCK_TIMEOUT = 1400,

        AUTOPLAY_INTERVAL = 5000,
        MARGIN = 2,
        THUMB_SIZE = 64,

        WIDTH = 500,
        HEIGHT = 333,

        STAGE_FRAME_KEY = '$stageFrame',
        NAV_DOT_FRAME_KEY = '$navDotFrame',
        NAV_THUMB_FRAME_KEY = '$navThumbFrame',

        AUTO = 'auto',

        BEZIER = bez([.1, 0, .25, 1]),

        MAX_WIDTH = 99999,

        FIFTYFIFTY = '50%',

        OPTIONS = {
            // dimensions
            width: null, // 500 || '100%'
            minwidth: null,
            maxwidth: '100%', // '100%'
            height: null,
            minheight: null,
            maxheight: null,

            ratio: null, // '16/9' || 500/333 || 1.5

            margin: MARGIN,
            glimpse: 0,

            fit: 'contain', // 'cover' || 'scaledown' || 'none'

            position: FIFTYFIFTY,
            thumbposition: FIFTYFIFTY,

            // navigation, thumbs
            nav: 'dots', // 'thumbs' || false
            navposition: 'bottom', // 'top'
            navwidth: null,
            thumbwidth: THUMB_SIZE,
            thumbheight: THUMB_SIZE,
            thumbmargin: MARGIN,
            thumbborderwidth: MARGIN,
            thumbfit: 'cover', // 'contain' || 'scaledown' || 'none'

            allowfullscreen: false, // true || 'native'

            transition: 'slide', // 'crossfade' || 'dissolve'
            clicktransition: null,
            transitionduration: TRANSITION_DURATION,

            captions: true,

            hash: false,
            startindex: 0,

            loop: false,

            autoplay: false,
            stopautoplayontouch: true,

            keyboard: false,

            arrows: true,
            click: true,
            swipe: true,
            trackpad: false,

            enableifsingleframe: false,

            controlsonstart: true,

            shuffle: false,

            direction: 'ltr', // 'rtl'

            shadows: true,
            spinner: null
        },

        KEYBOARD_OPTIONS = {
            left: true,
            right: true,
            down: false,
            up: false,
            space: false,
            home: false,
            end: false
        };

    function noop() {}

    function minMaxLimit(value, min, max) {
        return Math.max(isNaN(min) ? -Infinity : min, Math.min(isNaN(max) ? Infinity : max, value));
    }

    function readTransform(css) {
        return css.match(/ma/) && css.match(/-?\d+(?!d)/g)[css.match(/3d/) ? 12 : 4];
    }

    function readPosition($el) {
        if (CSS3) {
            return +readTransform($el.css('transform'));
        } else {
            return +$el.css('left').replace('px', '');
        }
    }

    function getTranslate(pos /*, _001*/ ) {
        var obj = {};
        if (CSS3) {
            obj.transform = 'translate3d(' + (pos /* + (_001 ? 0.001 : 0)*/ ) + 'px,0,0)'; // 0.001 to remove Retina artifacts
        } else {
            obj.left = pos;
        }
        return obj;
    }

    function getDuration(time) {
        return {
            'transition-duration': time + 'ms'
        };
    }

    function unlessNaN(value, alternative) {
        return isNaN(value) ? alternative : value;
    }

    function numberFromMeasure(value, measure) {
        return unlessNaN(+String(value).replace(measure || 'px', ''));
    }

    function numberFromPercent(value) {
        return /%$/.test(value) ? numberFromMeasure(value, '%') : undefined;
    }

    function numberFromWhatever(value, whole) {
        return unlessNaN(numberFromPercent(value) / 100 * whole, numberFromMeasure(value));
    }

    function measureIsValid(value) {
        return (!isNaN(numberFromMeasure(value)) || !isNaN(numberFromMeasure(value, '%'))) && value;
    }

    function getPosByIndex(index, side, margin, baseIndex) {
        //console.log('getPosByIndex', index, side, margin, baseIndex);
        //console.log((index - (baseIndex || 0)) * (side + (margin || 0)));

        return (index - (baseIndex || 0)) * (side + (margin || 0));
    }

    function getIndexByPos(pos, side, margin, baseIndex) {
        return -Math.round(pos / (side + (margin || 0)) - (baseIndex || 0));
    }

    function bindTransitionEnd($el) {
        var elData = $el.data();

        if (elData.tEnd) return;

        var el = $el[0],
            transitionEndEvent = {
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend',
                msTransition: 'MSTransitionEnd',
                transition: 'transitionend'
            };
        addEvent(el, transitionEndEvent[Modernizr.prefixed('transition')], function(e) {
            elData.tProp && e.propertyName.match(elData.tProp) && elData.onEndFn();
        });
        elData.tEnd = true;
    }

    function afterTransition($el, property, fn, time) {
        var ok,
            elData = $el.data();

        if (elData) {
            elData.onEndFn = function() {
                if (ok) return;
                ok = true;
                clearTimeout(elData.tT);
                fn();
            };
            elData.tProp = property;

            // Passive call, just in case of fail of native transition-end event
            clearTimeout(elData.tT);
            elData.tT = setTimeout(function() {
                elData.onEndFn();
            }, time * 1.5);

            bindTransitionEnd($el);
        }
    }


    function stop($el, left /*, _001*/ ) {
        if ($el.length) {
            var elData = $el.data();
            if (CSS3) {
                $el.css(getDuration(0));
                elData.onEndFn = noop;
                clearTimeout(elData.tT);
            } else {
                $el.stop();
            }
            var lockedLeft = getNumber(left, function() {
                return readPosition($el);
            });

            $el.css(getTranslate(lockedLeft /*, _001*/ )); //.width(); // `.width()` for reflow
            return lockedLeft;
        }
    }

    function getNumber() {
        var number;
        for (var _i = 0, _l = arguments.length; _i < _l; _i++) {
            number = _i ? arguments[_i]() : arguments[_i];
            if (typeof number === 'number') {
                break;
            }
        }

        return number;
    }

    function edgeResistance(pos, edge) {
        return Math.round(pos + ((edge - pos) / 1.5));
    }

    function getProtocol() {
        getProtocol.p = getProtocol.p || (location.protocol === 'https:' ? 'https://' : 'http://');
        return getProtocol.p;
    }

    function parseHref(href) {
        var a = document.createElement('a');
        a.href = href;
        return a;
    }

    function findVideoId(href, forceVideo) {
        if (typeof href !== 'string') return href;
        href = parseHref(href);

        var id,
            type;

        if (href.host.match(/youtube\.com/) && href.search) {
            //.log();
            id = href.search.split('v=')[1];
            if (id) {
                var ampersandPosition = id.indexOf('&');
                if (ampersandPosition !== -1) {
                    id = id.substring(0, ampersandPosition);
                }
                type = 'youtube';
            }
        } else if (href.host.match(/youtube\.com|youtu\.be/)) {
            id = href.pathname.replace(/^\/(embed\/|v\/)?/, '').replace(/\/.*/, '');
            type = 'youtube';
        } else if (href.host.match(/vimeo\.com/)) {
            type = 'vimeo';
            id = href.pathname.replace(/^\/(video\/)?/, '').replace(/\/.*/, '');
        }

        if ((!id || !type) && forceVideo) {
            id = href.href;
            type = 'custom';
        }

        return id ? {
            id: id,
            type: type,
            s: href.search.replace(/^\?/, ''),
            p: getProtocol()
        } : false;
    }

    function getVideoThumbs(dataFrame, data, fotorama) {
        var img, thumb, video = dataFrame.video;
        if (video.type === 'youtube') {
            thumb = getProtocol() + 'img.youtube.com/vi/' + video.id + '/default.jpg';
            img = thumb.replace(/\/default.jpg$/, '/hqdefault.jpg');
            dataFrame.thumbsReady = true;
        } else if (video.type === 'vimeo') {
            $.ajax({
                url: getProtocol() + 'vimeo.com/api/v2/video/' + video.id + '.json',
                dataType: 'jsonp',
                success: function(json) {
                    dataFrame.thumbsReady = true;
                    updateData(data, {
                        img: json[0].thumbnail_large,
                        thumb: json[0].thumbnail_small
                    }, dataFrame.i, fotorama);
                }
            });
        } else {
            dataFrame.thumbsReady = true;
        }

        return {
            img: img,
            thumb: thumb
        }
    }

    function updateData(data, _dataFrame, i, fotorama) {
        for (var _i = 0, _l = data.length; _i < _l; _i++) {
            var dataFrame = data[_i];

            if (dataFrame.i === i && dataFrame.thumbsReady) {
                var clear = {
                    videoReady: true
                };
                clear[STAGE_FRAME_KEY] = clear[NAV_THUMB_FRAME_KEY] = clear[NAV_DOT_FRAME_KEY] = false;

                fotorama.splice(_i, 1, $.extend({},
                    dataFrame,
                    clear,
                    _dataFrame
                ));

                break;
            }
        }
    }

    function getDataFromHtml($el) {
        var data = [];

        function getDataFromImg($img, imgData, checkVideo) {
            var $child = $img.children('img').eq(0),
                _imgHref = $img.attr('href'),
                _imgSrc = $img.attr('src'),
                _thumbSrc = $child.attr('src'),
                _video = imgData.video,
                video = checkVideo ? findVideoId(_imgHref, _video === true) : false;

            if (video) {
                _imgHref = false;
            } else {
                video = _video;
            }

            getDimensions($img, $child, $.extend(imgData, {
                video: video,
                img: imgData.img || _imgHref || _imgSrc || _thumbSrc,
                thumb: imgData.thumb || _thumbSrc || _imgSrc || _imgHref
            }));
        }

        function getDimensions($img, $child, imgData) {
            var separateThumbFLAG = imgData.thumb && imgData.img !== imgData.thumb,
                width = numberFromMeasure(imgData.width || $img.attr('width')),
                height = numberFromMeasure(imgData.height || $img.attr('height'));

            $.extend(imgData, {
                width: width,
                height: height,
                thumbratio: getRatio(imgData.thumbratio || (numberFromMeasure(imgData.thumbwidth || ($child && $child.attr('width')) || separateThumbFLAG || width) / numberFromMeasure(imgData.thumbheight || ($child && $child.attr('height')) || separateThumbFLAG || height)))
            });
        }

        $el.children().each(function() {
            var $this = $(this),
                dataFrame = optionsToLowerCase($.extend($this.data(), {
                    id: $this.attr('id')
                }));
            if ($this.is('a, img')) {
                getDataFromImg($this, dataFrame, true);
            } else if (!$this.is(':empty')) {
                getDimensions($this, null, $.extend(dataFrame, {
                    html: this,
                    _html: $this.html() // Because of IE
                }));
            } else return;

            data.push(dataFrame);
        });

        return data;
    }

    function isHidden(el) {
        return el.offsetWidth === 0 && el.offsetHeight === 0;
    }

    function isDetached(el) {
        return !$.contains(document.documentElement, el);
    }

    function waitFor(test, fn, timeout, i) {
        if (!waitFor.i) {
            waitFor.i = 1;
            waitFor.ii = [true];
        }

        i = i || waitFor.i;

        if (typeof waitFor.ii[i] === 'undefined') {
            waitFor.ii[i] = true;
        }

        if (test()) {
            fn();
        } else {
            waitFor.ii[i] && setTimeout(function() {
                waitFor.ii[i] && waitFor(test, fn, timeout, i);
            }, timeout || 100);
        }

        return waitFor.i++;
    }

    waitFor.stop = function(i) {
        waitFor.ii[i] = false;
    };

    function setHash(hash) {
        ////console.time('setHash ' + hash);
        location.replace(location.protocol + '//' + location.host + location.pathname.replace(/^\/?/, '/') + location.search + '#' + hash);
        ////console.timeEnd('setHash ' + hash);
    }

    function fit($el, measuresToFit, method, position) {
        var elData = $el.data(),
            measures = elData.measures;

        if (measures && (!elData.l ||
                elData.l.W !== measures.width ||
                elData.l.H !== measures.height ||
                elData.l.r !== measures.ratio ||
                elData.l.w !== measuresToFit.w ||
                elData.l.h !== measuresToFit.h ||
                elData.l.m !== method ||
                elData.l.p !== position)) {

            var width = measures.width,
                height = measures.height,
                ratio = measuresToFit.w / measuresToFit.h,
                biggerRatioFLAG = measures.ratio >= ratio,
                fitFLAG = method === 'scaledown',
                containFLAG = method === 'contain',
                coverFLAG = method === 'cover',
                pos = parsePosition(position);

            if (biggerRatioFLAG && (fitFLAG || containFLAG) || !biggerRatioFLAG && coverFLAG) {
                width = minMaxLimit(measuresToFit.w, 0, fitFLAG ? width : Infinity);
                height = width / measures.ratio;
            } else if (biggerRatioFLAG && coverFLAG || !biggerRatioFLAG && (fitFLAG || containFLAG)) {
                height = minMaxLimit(measuresToFit.h, 0, fitFLAG ? height : Infinity);
                width = height * measures.ratio;
            }

            $el.css({
                width: width,
                height: height,
                left: numberFromWhatever(pos.x, measuresToFit.w - width),
                top: numberFromWhatever(pos.y, measuresToFit.h - height)
            });

            elData.l = {
                W: measures.width,
                H: measures.height,
                r: measures.ratio,
                w: measuresToFit.w,
                h: measuresToFit.h,
                m: method,
                p: position
            };
        }

        return true;
    }

    function setStyle($el, style) {
        var el = $el[0];
        if (el.styleSheet) {
            el.styleSheet.cssText = style;
        } else {
            $el.html(style);
        }
    }

    function findShadowEdge(pos, min, max) {
        return min === max ? false : pos <= min ? 'left' : pos >= max ? 'right' : 'left right';
    }

    function getIndexFromHash(hash, data, ok, startindex) {
        if (!ok) return false;
        if (!isNaN(hash)) return hash - (startindex ? 0 : 1);

        var index;

        for (var _i = 0, _l = data.length; _i < _l; _i++) {
            var dataFrame = data[_i];

            if (dataFrame.id === hash) {
                index = _i;
                break;
            }
        }

        return index;
    }

    function smartClick($el, fn, _options) {
        _options = _options || {};

        $el.each(function() {
            var $this = $(this),
                thisData = $this.data(),
                startEvent;

            if (thisData.clickOn) return;

            thisData.clickOn = true;

            $.extend(touch($this, {
                onStart: function(e) {
                    startEvent = e;
                    (_options.onStart || noop).call(this, e);
                },
                onMove: _options.onMove || noop,
                onTouchEnd: _options.onTouchEnd || noop,
                onEnd: function(result) {
                    //console.log('smartClick â†’ result.moved', result.moved);
                    if (result.moved) return;
                    fn.call(this, startEvent);
                }
            }), {
                noMove: true
            });
        });
    }

    function div(classes, child) {
        return '<div class="' + classes + '">' + (child || '') + '</div>';
    }

    // Fisherâ€“Yates Shuffle
    // http://bost.ocks.org/mike/shuffle/
    function shuffle(array) {
        // While there remain elements to shuffle
        var l = array.length;
        while (l) {
            // Pick a remaining element
            var i = Math.floor(Math.random() * l--);

            // And swap it with the current element
            var t = array[l];
            array[l] = array[i];
            array[i] = t;
        }

        return array;
    }

    function clone(array) {
        return Object.prototype.toString.call(array) == '[object Array]' && $.map(array, function(frame) {
            return $.extend({}, frame);
        });
    }

    function lockScroll($el, left, top) {
        $el
            .scrollLeft(left || 0)
            .scrollTop(top || 0);
    }

    function optionsToLowerCase(options) {
        if (options) {
            var opts = {};
            $.each(options, function(key, value) {
                opts[key.toLowerCase()] = value;
            });

            return opts;
        }
    }

    function getRatio(_ratio) {
        if (!_ratio) return;
        var ratio = +_ratio;
        if (!isNaN(ratio)) {
            return ratio;
        } else {
            ratio = _ratio.split('/');
            return +ratio[0] / +ratio[1] || undefined;
        }
    }

    function addEvent(el, e, fn, bool) {
        if (!e) return;
        el.addEventListener ? el.addEventListener(e, fn, !!bool) : el.attachEvent('on' + e, fn);
    }

    function elIsDisabled(el) {
        return !!el.getAttribute('disabled');
    }

    function disableAttr(FLAG) {
        return {
            tabindex: FLAG * -1 + '',
            disabled: FLAG
        };
    }

    function addEnterUp(el, fn) {
        addEvent(el, 'keyup', function(e) {
            elIsDisabled(el) || e.keyCode == 13 && fn.call(el, e);
        });
    }

    function addFocus(el, fn) {
        addEvent(el, 'focus', el.onfocusin = function(e) {
            fn.call(el, e);
        }, true);
    }

    function stopEvent(e, stopPropagation) {
        e.preventDefault ? e.preventDefault() : (e.returnValue = false);
        stopPropagation && e.stopPropagation && e.stopPropagation();
    }

    function getDirectionSign(forward) {
        return forward ? '>' : '<';
    }

    function parsePosition(rule) {
        rule = (rule + '').split(/\s+/);
        return {
            x: measureIsValid(rule[0]) || FIFTYFIFTY,
            y: measureIsValid(rule[1]) || FIFTYFIFTY
        }
    }

    function slide($el, options) {
        var elData = $el.data(),
            elPos = Math.round(options.pos),
            onEndFn = function() {
                elData.sliding = false;
                (options.onEnd || noop)();
            };

        if (typeof options.overPos !== 'undefined' && options.overPos !== options.pos) {
            elPos = options.overPos;
            onEndFn = function() {
                slide($el, $.extend({}, options, {
                    overPos: options.pos,
                    time: Math.max(TRANSITION_DURATION, options.time / 2)
                }))
            };
        }

        //////console.time('var translate = $.extend');
        var translate = $.extend(getTranslate(elPos /*, options._001*/ ), options.width && {
            width: options.width
        });
        //////console.timeEnd('var translate = $.extend');

        elData.sliding = true;

        if (CSS3) {
            $el.css($.extend(getDuration(options.time), translate));
            if (options.time > 10) {
                //////console.time('afterTransition');
                afterTransition($el, 'transform', onEndFn, options.time);
                //////console.timeEnd('afterTransition');
            } else {
                onEndFn();
            }
        } else {
            $el.stop().animate(translate, options.time, BEZIER, onEndFn);
        }
    }

    function fade($el1, $el2, $frames, options, fadeStack, chain) {
        var chainedFLAG = typeof chain !== 'undefined';
        if (!chainedFLAG) {
            fadeStack.push(arguments);
            Array.prototype.push.call(arguments, fadeStack.length);
            if (fadeStack.length > 1) return;
        }

        $el1 = $el1 || $($el1);
        $el2 = $el2 || $($el2);

        var _$el1 = $el1[0],
            _$el2 = $el2[0],
            crossfadeFLAG = options.method === 'crossfade',
            onEndFn = function() {
                if (!onEndFn.done) {
                    onEndFn.done = true;
                    var args = (chainedFLAG || fadeStack.shift()) && fadeStack.shift();
                    args && fade.apply(this, args);
                    (options.onEnd || noop)(!!args);
                }
            },
            time = options.time / (chain || 1);

        $frames.removeClass(fadeRearClass + ' ' + fadeFrontClass);

        $el1
            .stop()
            .addClass(fadeRearClass);
        $el2
            .stop()
            .addClass(fadeFrontClass);

        crossfadeFLAG && _$el2 && $el1.fadeTo(0, 0);

        $el1.fadeTo(crossfadeFLAG ? time : 0, 1, crossfadeFLAG && onEndFn);
        $el2.fadeTo(time, 0, onEndFn);

        (_$el1 && crossfadeFLAG) || _$el2 || onEndFn();
    }
    var lastEvent,
        moveEventType,
        preventEvent,
        preventEventTimeout;

    function extendEvent(e) {
        var touch = (e.touches || [])[0] || e;
        e._x = touch.pageX;
        e._y = touch.clientY;
        e._now = $.now();
    }

    function touch($el, options) {
        var el = $el[0],
            tail = {},
            touchEnabledFLAG,
            startEvent,
            $target,
            controlTouch,
            touchFLAG,
            targetIsSelectFLAG,
            targetIsLinkFlag,
            tolerance,
            moved;

        function onStart(e) {
            $target = $(e.target);
            tail.checked = targetIsSelectFLAG = targetIsLinkFlag = moved = false;

            if (touchEnabledFLAG || tail.flow || (e.touches && e.touches.length > 1) || e.which > 1 || (lastEvent && lastEvent.type !== e.type && preventEvent) || (targetIsSelectFLAG = options.select && $target.is(options.select, el))) return targetIsSelectFLAG;

            touchFLAG = e.type === 'touchstart';
            targetIsLinkFlag = $target.is('a, a *', el);
            controlTouch = tail.control;

            tolerance = (tail.noMove || tail.noSwipe || controlTouch) ? 16 : !tail.snap ? 4 : 0;

            extendEvent(e);

            startEvent = lastEvent = e;
            moveEventType = e.type.replace(/down|start/, 'move').replace(/Down/, 'Move');

            (options.onStart || noop).call(el, e, {
                control: controlTouch,
                $target: $target
            });

            touchEnabledFLAG = tail.flow = true;

            if (!touchFLAG || tail.go) stopEvent(e);
        }

        function onMove(e) {
            if ((e.touches && e.touches.length > 1) || (MS_POINTER && !e.isPrimary) || moveEventType !== e.type || !touchEnabledFLAG) {
                touchEnabledFLAG && onEnd();
                (options.onTouchEnd || noop)();
                return;
            }

            extendEvent(e);

            var xDiff = Math.abs(e._x - startEvent._x), // opt _x â†’ _pageX
                yDiff = Math.abs(e._y - startEvent._y),
                xyDiff = xDiff - yDiff,
                xWin = (tail.go || tail.x || xyDiff >= 0) && !tail.noSwipe,
                yWin = xyDiff < 0;

            if (touchFLAG && !tail.checked) {
                if (touchEnabledFLAG = xWin) {
                    stopEvent(e);
                }
            } else {
                //console.log('onMove e.preventDefault');
                stopEvent(e);
                (options.onMove || noop).call(el, e, {
                    touch: touchFLAG
                });
            }

            if (!moved && Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2)) > tolerance) {
                moved = true;
            }

            tail.checked = tail.checked || xWin || yWin;
        }

        function onEnd(e) {
            ////console.time('touch.js onEnd');

            (options.onTouchEnd || noop)();

            var _touchEnabledFLAG = touchEnabledFLAG;
            tail.control = touchEnabledFLAG = false;

            if (_touchEnabledFLAG) {
                tail.flow = false;
            }

            if (!_touchEnabledFLAG || (targetIsLinkFlag && !tail.checked)) return;

            e && stopEvent(e);

            preventEvent = true;
            clearTimeout(preventEventTimeout);
            preventEventTimeout = setTimeout(function() {
                preventEvent = false;
            }, 1000);

            (options.onEnd || noop).call(el, {
                moved: moved,
                $target: $target,
                control: controlTouch,
                touch: touchFLAG,
                startEvent: startEvent,
                aborted: !e || e.type === 'MSPointerCancel'
            });
            ////console.timeEnd('touch.js onEnd');
        }

        function onOtherStart() {
            if (tail.flow) return;
            setTimeout(function() {
                tail.flow = true;
            }, 10);
        }

        function onOtherEnd() {
            if (!tail.flow) return;
            setTimeout(function() {
                tail.flow = false;
            }, TOUCH_TIMEOUT);
        }

        if (MS_POINTER) {
            addEvent(el, 'MSPointerDown', onStart);
            addEvent(document, 'MSPointerMove', onMove);
            addEvent(document, 'MSPointerCancel', onEnd);
            addEvent(document, 'MSPointerUp', onEnd);
        } else {
            addEvent(el, 'touchstart', onStart);
            addEvent(el, 'touchmove', onMove);
            addEvent(el, 'touchend', onEnd);

            addEvent(document, 'touchstart', onOtherStart);
            addEvent(document, 'touchend', onOtherEnd);
            addEvent(document, 'touchcancel', onOtherEnd);

            $WINDOW.on('scroll', onOtherEnd);

            $el.on('mousedown', onStart);
            $DOCUMENT
                .on('mousemove', onMove)
                .on('mouseup', onEnd);
        }

        $el.on('click', 'a', function(e) {
            tail.checked && stopEvent(e);
        });

        return tail;
    }

    function moveOnTouch($el, options) {
        var el = $el[0],
            elData = $el.data(),
            tail = {},
            startCoo,
            coo,
            startElPos,
            moveElPos,
            edge,
            moveTrack,
            startTime,
            endTime,
            min,
            max,
            snap,
            slowFLAG,
            controlFLAG,
            moved,
            tracked;

        function startTracking(e, noStop) {
            tracked = true;
            startCoo = coo = e._x;
            startTime = e._now;

            moveTrack = [
                [startTime, startCoo]
            ];

            startElPos = moveElPos = tail.noMove || noStop ? 0 : stop($el, (options.getPos || noop)() /*, options._001*/ );

            (options.onStart || noop).call(el, e);
        }

        function onStart(e, result) {
            min = tail.min;
            max = tail.max;
            snap = tail.snap;

            slowFLAG = e.altKey;
            tracked = moved = false;

            controlFLAG = result.control;

            if (!controlFLAG && !elData.sliding) {
                startTracking(e);
            }
        }

        function onMove(e, result) {
            if (!tail.noSwipe) {
                if (!tracked) {
                    startTracking(e);
                }

                coo = e._x;

                moveTrack.push([e._now, coo]);

                moveElPos = startElPos - (startCoo - coo);

                edge = findShadowEdge(moveElPos, min, max);

                if (moveElPos <= min) {
                    moveElPos = edgeResistance(moveElPos, min);
                } else if (moveElPos >= max) {
                    moveElPos = edgeResistance(moveElPos, max);
                }

                if (!tail.noMove) {
                    $el.css(getTranslate(moveElPos /*, options._001*/ ));
                    if (!moved) {
                        moved = true;
                        // only for mouse
                        result.touch || MS_POINTER || $el.addClass(grabbingClass);
                    }

                    (options.onMove || noop).call(el, e, {
                        pos: moveElPos,
                        edge: edge
                    });
                }
            }
        }

        function onEnd(result) {
            ////console.time('moveontouch.js onEnd');
            if (tail.noSwipe && result.moved) return;

            if (!tracked) {
                startTracking(result.startEvent, true);
            }

            //console.log('onEnd');

            result.touch || MS_POINTER || $el.removeClass(grabbingClass);

            endTime = $.now();

            var _backTimeIdeal = endTime - TOUCH_TIMEOUT,
                _backTime,
                _timeDiff,
                _timeDiffLast,
                backTime = null,
                backCoo,
                virtualPos,
                limitPos,
                newPos,
                overPos,
                time = TRANSITION_DURATION,
                speed,
                friction = options.friction;

            for (var _i = moveTrack.length - 1; _i >= 0; _i--) {
                _backTime = moveTrack[_i][0];
                _timeDiff = Math.abs(_backTime - _backTimeIdeal);
                if (backTime === null || _timeDiff < _timeDiffLast) {
                    backTime = _backTime;
                    backCoo = moveTrack[_i][1];
                } else if (backTime === _backTimeIdeal || _timeDiff > _timeDiffLast) {
                    break;
                }
                _timeDiffLast = _timeDiff;
            }

            newPos = minMaxLimit(moveElPos, min, max);

            var cooDiff = backCoo - coo,
                forwardFLAG = cooDiff >= 0,
                timeDiff = endTime - backTime,
                longTouchFLAG = timeDiff > TOUCH_TIMEOUT,
                swipeFLAG = !longTouchFLAG && moveElPos !== startElPos && newPos === moveElPos;

            if (snap) {
                newPos = minMaxLimit(Math[swipeFLAG ? (forwardFLAG ? 'floor' : 'ceil') : 'round'](moveElPos / snap) * snap, min, max);
                min = max = newPos;
            }

            if (swipeFLAG && (snap || newPos === moveElPos)) {
                speed = -(cooDiff / timeDiff);
                time *= minMaxLimit(Math.abs(speed), options.timeLow, options.timeHigh);
                virtualPos = Math.round(moveElPos + speed * time / friction);

                if (!snap) {
                    newPos = virtualPos;
                }

                if (!forwardFLAG && virtualPos > max || forwardFLAG && virtualPos < min) {
                    limitPos = forwardFLAG ? min : max;
                    overPos = virtualPos - limitPos;
                    if (!snap) {
                        newPos = limitPos;
                    }
                    overPos = minMaxLimit(newPos + overPos * .03, limitPos - 50, limitPos + 50);
                    time = Math.abs((moveElPos - overPos) / (speed / friction));
                }
            }

            time *= slowFLAG ? 10 : 1;

            (options.onEnd || noop).call(el, $.extend(result, {
                moved: result.moved || longTouchFLAG && snap,
                pos: moveElPos,
                newPos: newPos,
                overPos: overPos,
                time: time
            }));
        }

        tail = $.extend(touch(options.$wrap, $.extend({}, options, {
            onStart: onStart,
            onMove: onMove,
            onEnd: onEnd
        })), tail);

        return tail;
    }

    function wheel($el, options) {
        var el = $el[0],
            lockFLAG,
            lastDirection,
            lastNow,
            tail = {
                prevent: {}
            };

        addEvent(el, WHEEL, function(e) {
            var yDelta = e.wheelDeltaY || -1 * e.deltaY || 0,
                xDelta = e.wheelDeltaX || -1 * e.deltaX || 0,
                xWin = Math.abs(xDelta) && !Math.abs(yDelta),
                direction = getDirectionSign(xDelta < 0),
                sameDirection = lastDirection === direction,
                now = $.now(),
                tooFast = now - lastNow < TOUCH_TIMEOUT;

            lastDirection = direction;
            lastNow = now;

            if (!xWin || !tail.ok || tail.prevent[direction] && !lockFLAG) {
                return;
            } else {
                stopEvent(e, true);
                if (lockFLAG && sameDirection && tooFast) {
                    return;
                }
            }

            if (options.shift) {
                lockFLAG = true;
                clearTimeout(tail.t);
                tail.t = setTimeout(function() {
                    lockFLAG = false;
                }, SCROLL_LOCK_TIMEOUT);
            }

            (options.onEnd || noop)(e, options.shift ? direction : xDelta);

        });

        return tail;
    }
    jQuery.Fotorama = function($fotorama, opts) {
        $HTML = $('html');
        $BODY = $('body');

        var that = this,
            stamp = $.now(),
            stampClass = _fotoramaClass + stamp,
            fotorama = $fotorama[0],
            data,
            dataFrameCount = 1,
            fotoramaData = $fotorama.data(),
            size,

            $style = $('<style></style>'),

            $anchor = $(div(hiddenClass)),
            $wrap = $(div(wrapClass)),
            $stage = $(div(stageClass)).appendTo($wrap),
            stage = $stage[0],

            $stageShaft = $(div(stageShaftClass)).appendTo($stage),
            $stageFrame = $(),
            $arrPrev = $(div(arrClass + ' ' + arrPrevClass + buttonAttributes)),
            $arrNext = $(div(arrClass + ' ' + arrNextClass + buttonAttributes)),
            $arrs = $arrPrev.add($arrNext).appendTo($stage),
            $navWrap = $(div(navWrapClass)),
            $nav = $(div(navClass)).appendTo($navWrap),
            $navShaft = $(div(navShaftClass)).appendTo($nav),
            $navFrame,
            $navDotFrame = $(),
            $navThumbFrame = $(),

            stageShaftData = $stageShaft.data(),
            navShaftData = $navShaft.data(),

            $thumbBorder = $(div(thumbBorderClass)).appendTo($navShaft),

            $fullscreenIcon = $(div(fullscreenIconClass + buttonAttributes)),
            fullscreenIcon = $fullscreenIcon[0],
            $videoPlay = $(div(videoPlayClass)),
            $videoClose = $(div(videoCloseClass)).appendTo($stage),
            videoClose = $videoClose[0],

            spinner,
            $spinner = $(div(spinnerClass)),

            $videoPlaying,

            activeIndex = false,
            activeFrame,
            activeIndexes,
            repositionIndex,
            dirtyIndex,
            lastActiveIndex,
            prevIndex,
            nextIndex,
            nextAutoplayIndex,
            startIndex,

            o_loop,
            o_nav,
            o_navThumbs,
            o_navTop,
            o_allowFullScreen,
            o_nativeFullScreen,
            o_fade,
            o_thumbSide,
            o_thumbSide2,
            o_transitionDuration,
            o_transition,
            o_shadows,
            o_rtl,
            o_keyboard,
            lastOptions = {},

            measures = {},
            measuresSetFLAG,

            stageShaftTouchTail = {},
            stageWheelTail = {},
            navShaftTouchTail = {},
            navWheelTail = {},

            scrollTop,
            scrollLeft,

            showedFLAG,
            pausedAutoplayFLAG,
            stoppedAutoplayFLAG,

            toDeactivate = {},
            toDetach = {},

            measuresStash,

            touchedFLAG,

            hoverFLAG,

            navFrameKey,
            stageLeft = 0,

            fadeStack = [];

        $wrap[STAGE_FRAME_KEY] = $(div(stageFrameClass));
        $wrap[NAV_THUMB_FRAME_KEY] = $(div(navFrameClass + ' ' + navFrameThumbClass + buttonAttributes, div(thumbClass)));
        $wrap[NAV_DOT_FRAME_KEY] = $(div(navFrameClass + ' ' + navFrameDotClass + buttonAttributes, div(dotClass)));

        toDeactivate[STAGE_FRAME_KEY] = [];
        toDeactivate[NAV_THUMB_FRAME_KEY] = [];
        toDeactivate[NAV_DOT_FRAME_KEY] = [];
        toDetach[STAGE_FRAME_KEY] = {};

        $wrap
            .addClass(CSS3 ? wrapCss3Class : wrapCss2Class)
            .toggleClass(wrapNoControlsClass, !opts.controlsonstart);

        fotoramaData.fotorama = this;

        function checkForVideo() {
            $.each(data, function(i, dataFrame) {
                if (!dataFrame.i) {
                    dataFrame.i = dataFrameCount++;
                    var video = findVideoId(dataFrame.video, true);
                    if (video) {
                        var thumbs = {};
                        dataFrame.video = video;
                        if (!dataFrame.img && !dataFrame.thumb) {
                            thumbs = getVideoThumbs(dataFrame, data, that);
                        } else {
                            dataFrame.thumbsReady = true;
                        }
                        updateData(data, {
                            img: thumbs.img,
                            thumb: thumbs.thumb
                        }, dataFrame.i, that);
                    }
                }
            });
        }

        function allowKey(key) {
            return o_keyboard[key] || that.fullScreen;
        }

        function bindGlobalEvents(FLAG) {
            var keydownCommon = 'keydown.' + _fotoramaClass,
                localStamp = _fotoramaClass + stamp,
                keydownLocal = 'keydown.' + localStamp,
                resizeLocal = 'resize.' + localStamp + ' ' + 'orientationchange.' + localStamp;

            if (FLAG) {
                $DOCUMENT
                    .on(keydownLocal, function(e) {
                        var catched,
                            index;

                        if ($videoPlaying && e.keyCode === 27) {
                            catched = true;
                            unloadVideo($videoPlaying, true, true);
                        } else if (that.fullScreen || (opts.keyboard && !that.index)) {
                            if (e.keyCode === 27) {
                                catched = true;
                                that.cancelFullScreen();
                            } else if ((e.shiftKey && e.keyCode === 32 && allowKey('space')) || (e.keyCode === 37 && allowKey('left')) || (e.keyCode === 38 && allowKey('up'))) {
                                index = '<';
                            } else if ((e.keyCode === 32 && allowKey('space')) || (e.keyCode === 39 && allowKey('right')) || (e.keyCode === 40 && allowKey('down'))) {
                                index = '>';
                            } else if (e.keyCode === 36 && allowKey('home')) {
                                index = '<<';
                            } else if (e.keyCode === 35 && allowKey('end')) {
                                index = '>>';
                            }
                        }

                        (catched || index) && stopEvent(e);
                        index && that.show({
                            index: index,
                            slow: e.altKey,
                            user: true
                        });
                    });

                if (!that.index) {
                    $DOCUMENT
                        .off(keydownCommon)
                        .on(keydownCommon, 'textarea, input, select', function(e) {
                            !$BODY.hasClass(_fullscreenClass) && e.stopPropagation();
                        });
                }

                $WINDOW.on(resizeLocal, that.resize);
            } else {
                $DOCUMENT.off(keydownLocal);
                $WINDOW.off(resizeLocal);
            }
        }

        function appendElements(FLAG) {
            if (FLAG === appendElements.f) return;

            if (FLAG) {
                $fotorama
                    .html('')
                    .addClass(_fotoramaClass + ' ' + stampClass)
                    .append($wrap)
                    .before($style)
                    .before($anchor);

                addInstance(that);
            } else {
                $wrap.detach();
                $style.detach();
                $anchor.detach();
                $fotorama
                    .html(fotoramaData.urtext)
                    .removeClass(stampClass);

                hideInstance(that);
            }

            bindGlobalEvents(FLAG);
            appendElements.f = FLAG;
        }

        function setData() {
            data = that.data = data || clone(opts.data) || getDataFromHtml($fotorama);
            size = that.size = data.length;

            !ready.ok && opts.shuffle && shuffle(data);

            checkForVideo();

            activeIndex = limitIndex(activeIndex);

            size && appendElements(true);
        }

        function stageNoMove() {
            var _noMove = (size < 2 && !opts.enableifsingleframe) || $videoPlaying;
            stageShaftTouchTail.noMove = _noMove || o_fade;
            stageShaftTouchTail.noSwipe = _noMove || !opts.swipe;

            !o_transition && $stageShaft.toggleClass(grabClass, !opts.click && !stageShaftTouchTail.noMove && !stageShaftTouchTail.noSwipe);
            MS_POINTER && $wrap.toggleClass(wrapPanYClass, !stageShaftTouchTail.noSwipe);
        }

        function setAutoplayInterval(interval) {
            if (interval === true) interval = '';
            opts.autoplay = Math.max(+interval || AUTOPLAY_INTERVAL, o_transitionDuration * 1.5);
        }

        /**
         * Options on the fly
         * */
        function setOptions() {
            that.options = opts = optionsToLowerCase(opts);

            o_fade = (opts.transition === 'crossfade' || opts.transition === 'dissolve');

            o_loop = opts.loop && (size > 2 || (o_fade && (!o_transition || o_transition !== 'slide')));

            o_transitionDuration = +opts.transitionduration || TRANSITION_DURATION;

            o_rtl = opts.direction === 'rtl';

            o_keyboard = $.extend({}, opts.keyboard && KEYBOARD_OPTIONS, opts.keyboard);

            var classes = {
                add: [],
                remove: []
            };

            function addOrRemoveClass(FLAG, value) {
                classes[FLAG ? 'add' : 'remove'].push(value);
            }

            if (size > 1 || opts.enableifsingleframe) {
                o_nav = opts.nav;
                o_navTop = opts.navposition === 'top';
                classes.remove.push(selectClass);

                $arrs.toggle(!!opts.arrows);
            } else {
                o_nav = false;
                $arrs.hide();
            }

            spinnerStop();
            spinner = new Spinner($.extend(spinnerDefaults, opts.spinner, spinnerOverride, {
                direction: o_rtl ? -1 : 1
            }));

            arrsUpdate();
            stageWheelUpdate();

            if (opts.autoplay) setAutoplayInterval(opts.autoplay);

            o_thumbSide = numberFromMeasure(opts.thumbwidth) || THUMB_SIZE;
            o_thumbSide2 = numberFromMeasure(opts.thumbheight) || THUMB_SIZE;

            stageWheelTail.ok = navWheelTail.ok = opts.trackpad && !SLOW;

            stageNoMove();

            extendMeasures(opts, [measures]);

            o_navThumbs = o_nav === 'thumbs';

            if (o_navThumbs) {
                frameDraw(size, 'navThumb');

                $navFrame = $navThumbFrame;
                navFrameKey = NAV_THUMB_FRAME_KEY;

                setStyle($style, $.Fotorama.jst.style({
                    w: o_thumbSide,
                    h: o_thumbSide2,
                    b: opts.thumbborderwidth,
                    m: opts.thumbmargin,
                    s: stamp,
                    q: !COMPAT
                }));

                $nav
                    .addClass(navThumbsClass)
                    .removeClass(navDotsClass);
            } else if (o_nav === 'dots') {
                frameDraw(size, 'navDot');

                $navFrame = $navDotFrame;
                navFrameKey = NAV_DOT_FRAME_KEY;

                $nav
                    .addClass(navDotsClass)
                    .removeClass(navThumbsClass);
            } else {
                o_nav = false;
                $nav.removeClass(navThumbsClass + ' ' + navDotsClass);
            }

            if (o_nav) {
                if (o_navTop) {
                    $navWrap.insertBefore($stage);
                } else {
                    $navWrap.insertAfter($stage);
                }
                frameAppend.nav = false;
                frameAppend($navFrame, $navShaft, 'nav');
            }

            o_allowFullScreen = opts.allowfullscreen;

            if (o_allowFullScreen) {
                $fullscreenIcon.prependTo($stage);
                o_nativeFullScreen = FULLSCREEN && o_allowFullScreen === 'native';
            } else {
                $fullscreenIcon.detach();
                o_nativeFullScreen = false;
            }

            addOrRemoveClass(o_fade, wrapFadeClass);
            addOrRemoveClass(!o_fade, wrapSlideClass);
            addOrRemoveClass(!opts.captions, wrapNoCaptionsClass);
            addOrRemoveClass(o_rtl, wrapRtlClass);
            addOrRemoveClass(opts.arrows !== 'always', wrapToggleArrowsClass);

            o_shadows = opts.shadows && !SLOW;
            addOrRemoveClass(!o_shadows, wrapNoShadowsClass);

            $wrap
                .addClass(classes.add.join(' '))
                .removeClass(classes.remove.join(' '));

            lastOptions = $.extend({}, opts);
        }

        function normalizeIndex(index) {
            return index < 0 ? (size + (index % size)) % size : index >= size ? index % size : index;
        }

        function limitIndex(index) {
            return minMaxLimit(index, 0, size - 1);
        }

        function edgeIndex(index) {
            return o_loop ? normalizeIndex(index) : limitIndex(index);
        }

        function getPrevIndex(index) {
            return index > 0 || o_loop ? index - 1 : false;
        }

        function getNextIndex(index) {
            return index < size - 1 || o_loop ? index + 1 : false;
        }

        function setStageShaftMinmaxAndSnap() {
            stageShaftTouchTail.min = o_loop ? -Infinity : -getPosByIndex(size - 1, measures.w, opts.margin, repositionIndex);
            stageShaftTouchTail.max = o_loop ? Infinity : -getPosByIndex(0, measures.w, opts.margin, repositionIndex);
            stageShaftTouchTail.snap = measures.w + opts.margin;
        }

        function setNavShaftMinMax() {
            //////console.log('setNavShaftMinMax', measures.nw);
            navShaftTouchTail.min = Math.min(0, measures.nw - $navShaft.width());
            navShaftTouchTail.max = 0;
            $navShaft.toggleClass(grabClass, !(navShaftTouchTail.noMove = navShaftTouchTail.min === navShaftTouchTail.max));
        }

        function eachIndex(indexes, type, fn) {
            if (typeof indexes === 'number') {
                indexes = new Array(indexes);
                var rangeFLAG = true;
            }
            return $.each(indexes, function(i, index) {
                if (rangeFLAG) index = i;
                if (typeof index === 'number') {
                    var dataFrame = data[normalizeIndex(index)];

                    if (dataFrame) {
                        var key = '$' + type + 'Frame',
                            $frame = dataFrame[key];

                        fn.call(this, i, index, dataFrame, $frame, key, $frame && $frame.data());
                    }
                }
            });
        }

        function setMeasures(width, height, ratio, index) {
            if (!measuresSetFLAG || (measuresSetFLAG === '*' && index === startIndex)) {

                ////console.log('setMeasures', index, opts.width, opts.height);

                width = measureIsValid(opts.width) || measureIsValid(width) || WIDTH;
                height = measureIsValid(opts.height) || measureIsValid(height) || HEIGHT;
                that.resize({
                    width: width,
                    ratio: opts.ratio || ratio || width / height
                }, 0, index !== startIndex && '*');
            }
        }

        function loadImg(indexes, type, specialMeasures, method, position, again) {
            eachIndex(indexes, type, function(i, index, dataFrame, $frame, key, frameData) {

                if (!$frame) return;

                var fullFLAG = that.fullScreen && dataFrame.full && dataFrame.full !== dataFrame.img && !frameData.$full && type === 'stage';

                if (frameData.$img && !again && !fullFLAG) return;

                var img = new Image(),
                    $img = $(img),
                    imgData = $img.data();

                frameData[fullFLAG ? '$full' : '$img'] = $img;

                var srcKey = type === 'stage' ? (fullFLAG ? 'full' : 'img') : 'thumb',
                    src = dataFrame[srcKey],
                    dummy = fullFLAG ? null : dataFrame[type === 'stage' ? 'thumb' : 'img'];

                if (type === 'navThumb') $frame = frameData.$wrap;

                function triggerTriggerEvent(event) {
                    var _index = normalizeIndex(index);
                    triggerEvent(event, {
                        index: _index,
                        src: src,
                        frame: data[_index]
                    });
                }

                function error() {
                    $img.remove();

                    $.Fotorama.cache[src] = 'error';

                    if ((!dataFrame.html || type !== 'stage') && dummy && dummy !== src) {
                        dataFrame[srcKey] = src = dummy;
                        loadImg([index], type, specialMeasures, method, position, true);
                    } else {
                        if (src && !dataFrame.html && !fullFLAG) {
                            $frame
                                .trigger('f:error')
                                .removeClass(loadingClass)
                                .addClass(errorClass);

                            triggerTriggerEvent('error');
                        } else if (type === 'stage') {
                            $frame
                                .trigger('f:load')
                                .removeClass(loadingClass + ' ' + errorClass)
                                .addClass(loadedClass);

                            triggerTriggerEvent('load');
                            setMeasures();
                        }

                        frameData.state = 'error';

                        if (size > 1 && data[index] === dataFrame && !dataFrame.html && !dataFrame.deleted && !dataFrame.video && !fullFLAG) {
                            dataFrame.deleted = true;
                            that.splice(index, 1);
                        }
                    }
                }

                function loaded() {
                    ////console.log('loaded: ' + src);

                    //console.log('$.Fotorama.measures[src]', $.Fotorama.measures[src]);

                    $.Fotorama.measures[src] = imgData.measures = $.Fotorama.measures[src] || {
                        width: img.width,
                        height: img.height,
                        ratio: img.width / img.height
                    };

                    setMeasures(imgData.measures.width, imgData.measures.height, imgData.measures.ratio, index);

                    $img
                        .off('load error')
                        .addClass(imgClass + (fullFLAG ? ' ' + imgFullClass : ''))
                        .prependTo($frame);

                    fit($img, ($.isFunction(specialMeasures) ? specialMeasures() : specialMeasures) || measures, method || dataFrame.fit || opts.fit, position || dataFrame.position || opts.position);

                    $.Fotorama.cache[src] = frameData.state = 'loaded';

                    setTimeout(function() {
                        $frame
                            .trigger('f:load')
                            .removeClass(loadingClass + ' ' + errorClass)
                            .addClass(loadedClass + ' ' + (fullFLAG ? loadedFullClass : loadedImgClass));

                        if (type === 'stage') {
                            triggerTriggerEvent('load');
                        } else if (dataFrame.thumbratio === AUTO || !dataFrame.thumbratio && opts.thumbratio === AUTO) {
                            // danger! reflow for all thumbnails
                            dataFrame.thumbratio = imgData.measures.ratio;
                            reset();
                        }
                    }, 0);
                }

                if (!src) {
                    error();
                    return;
                }

                function waitAndLoad() {
                    var _i = 10;
                    waitFor(function() {
                        return !touchedFLAG || !_i-- && !SLOW;
                    }, function() {
                        loaded();
                    });
                }

                if (!$.Fotorama.cache[src]) {
                    $.Fotorama.cache[src] = '*';

                    $img
                        .on('load', waitAndLoad)
                        .on('error', error);
                } else {
                    (function justWait() {
                        if ($.Fotorama.cache[src] === 'error') {
                            error();
                        } else if ($.Fotorama.cache[src] === 'loaded') {
                            //console.log('take from cache: ' + src);
                            setTimeout(waitAndLoad, 0);
                        } else {
                            setTimeout(justWait, 100);
                        }
                    })();
                }

                frameData.state = '';
                img.src = src;
            });
        }

        function spinnerSpin($el) {
            $spinner.append(spinner.spin().el).appendTo($el);
        }

        function spinnerStop() {
            $spinner.detach();
            spinner && spinner.stop();
        }

        function updateFotoramaState() {
            var $frame = activeFrame[STAGE_FRAME_KEY];

            if ($frame && !$frame.data().state) {
                spinnerSpin($frame);
                $frame.on('f:load f:error', function() {
                    $frame.off('f:load f:error');
                    spinnerStop();
                });
            }
        }

        function addNavFrameEvents(frame) {
            addEnterUp(frame, onNavFrameClick);
            addFocus(frame, function() {

                setTimeout(function() {
                    lockScroll($nav);
                }, 0);
                slideNavShaft({
                    time: o_transitionDuration,
                    guessIndex: $(this).data().eq,
                    minMax: navShaftTouchTail
                });
            });
        }

        function frameDraw(indexes, type) {
            eachIndex(indexes, type, function(i, index, dataFrame, $frame, key, frameData) {
                if ($frame) return;

                $frame = dataFrame[key] = $wrap[key].clone();
                frameData = $frame.data();
                frameData.data = dataFrame;
                var frame = $frame[0];

                if (type === 'stage') {

                    if (dataFrame.html) {
                        $('<div class="' + htmlClass + '"></div>')
                            .append(
                                dataFrame._html ? $(dataFrame.html)
                                .removeAttr('id')
                                .html(dataFrame._html) // Because of IE
                                : dataFrame.html
                            )
                            .appendTo($frame);
                    }

                    dataFrame.caption && $(div(captionClass, div(captionWrapClass, dataFrame.caption))).appendTo($frame);

                    dataFrame.video && $frame
                        .addClass(stageFrameVideoClass)
                        .append($videoPlay.clone());

                    // This solves tabbing problems
                    addFocus(frame, function() {
                        setTimeout(function() {
                            lockScroll($stage);
                        }, 0);
                        clickToShow({
                            index: frameData.eq,
                            user: true
                        });
                    });

                    $stageFrame = $stageFrame.add($frame);
                } else if (type === 'navDot') {
                    addNavFrameEvents(frame);
                    $navDotFrame = $navDotFrame.add($frame);
                } else if (type === 'navThumb') {
                    addNavFrameEvents(frame);
                    frameData.$wrap = $frame.children(':first');
                    $navThumbFrame = $navThumbFrame.add($frame);
                    if (dataFrame.video) {
                        frameData.$wrap.append($videoPlay.clone());
                    }
                }
            });
        }

        function callFit($img, measuresToFit, method, position) {
            return $img && $img.length && fit($img, measuresToFit, method, position);
        }

        function stageFramePosition(indexes) {
            eachIndex(indexes, 'stage', function(i, index, dataFrame, $frame, key, frameData) {
                if (!$frame) return;

                var normalizedIndex = normalizeIndex(index),
                    method = dataFrame.fit || opts.fit,
                    position = dataFrame.position || opts.position;
                frameData.eq = normalizedIndex;

                toDetach[STAGE_FRAME_KEY][normalizedIndex] = $frame.css($.extend({
                    left: o_fade ? 0 : getPosByIndex(index, measures.w, opts.margin, repositionIndex)
                }, o_fade && getDuration(0)));

                if (isDetached($frame[0])) {
                    $frame.appendTo($stageShaft);
                    unloadVideo(dataFrame.$video);
                }

                callFit(frameData.$img, measures, method, position);
                callFit(frameData.$full, measures, method, position);
            });
        }

        function thumbsDraw(pos, loadFLAG) {
            if (o_nav !== 'thumbs' || isNaN(pos)) return;

            var leftLimit = -pos,
                rightLimit = -pos + measures.nw;

            $navThumbFrame.each(function() {
                var $this = $(this),
                    thisData = $this.data(),
                    eq = thisData.eq,
                    getSpecialMeasures = function() {
                        return {
                            h: o_thumbSide2,
                            w: thisData.w
                        }
                    },
                    specialMeasures = getSpecialMeasures(),
                    dataFrame = data[eq] || {},
                    method = dataFrame.thumbfit || opts.thumbfit,
                    position = dataFrame.thumbposition || opts.thumbposition;

                specialMeasures.w = thisData.w;

                if (thisData.l + thisData.w < leftLimit || thisData.l > rightLimit || callFit(thisData.$img, specialMeasures, method, position)) return;

                loadFLAG && loadImg([eq], 'navThumb', getSpecialMeasures, method, position);
            });
        }

        function frameAppend($frames, $shaft, type) {
            if (!frameAppend[type]) {

                var thumbsFLAG = type === 'nav' && o_navThumbs,
                    left = 0;

                $shaft.append(
                    $frames
                    .filter(function() {
                        var actual,
                            $this = $(this),
                            frameData = $this.data();
                        for (var _i = 0, _l = data.length; _i < _l; _i++) {
                            if (frameData.data === data[_i]) {
                                actual = true;
                                frameData.eq = _i;
                                break;
                            }
                        }
                        return actual || $this.remove() && false;
                    })
                    .sort(function(a, b) {
                        return $(a).data().eq - $(b).data().eq;
                    })
                    .each(function() {

                        if (!thumbsFLAG) return;

                        var $this = $(this),
                            frameData = $this.data(),
                            thumbwidth = Math.round(o_thumbSide2 * frameData.data.thumbratio) || o_thumbSide;

                        frameData.l = left;
                        frameData.w = thumbwidth;

                        $this.css({
                            width: thumbwidth
                        });

                        left += thumbwidth + opts.thumbmargin;
                    })
                );

                frameAppend[type] = true;
            }
        }

        function getDirection(x) {
            return x - stageLeft > measures.w / 3;
        }

        function disableDirrection(i) {
            return !o_loop && (!(activeIndex + i) || !(activeIndex - size + i)) && !$videoPlaying;
        }

        function arrsUpdate() {
            var disablePrev = disableDirrection(0),
                disableNext = disableDirrection(1);
            $arrPrev
                .toggleClass(arrDisabledClass, disablePrev)
                .attr(disableAttr(disablePrev));
            $arrNext
                .toggleClass(arrDisabledClass, disableNext)
                .attr(disableAttr(disableNext));
        }

        function stageWheelUpdate() {
            if (stageWheelTail.ok) {
                stageWheelTail.prevent = {
                    '<': disableDirrection(0),
                    '>': disableDirrection(1)
                };
            }
        }

        function getNavFrameBounds($navFrame) {
            var navFrameData = $navFrame.data(),
                left,
                width;

            if (o_navThumbs) {
                left = navFrameData.l;
                width = navFrameData.w;
            } else {
                left = $navFrame.position().left;
                width = $navFrame.width();
            }

            return {
                c: left + width / 2,
                min: -left + opts.thumbmargin * 10,
                max: -left + measures.w - width - opts.thumbmargin * 10
            };
        }

        function slideThumbBorder(time) {
            var navFrameData = activeFrame[navFrameKey].data();
            slide($thumbBorder, {
                time: time * 1.2,
                pos: navFrameData.l,
                width: navFrameData.w - opts.thumbborderwidth * 2
            });
        }

        function slideNavShaft(options) {
            //console.log('slideNavShaft', options.guessIndex, options.keep, slideNavShaft.l);
            var $guessNavFrame = data[options.guessIndex][navFrameKey];
            if ($guessNavFrame) {
                var overflowFLAG = navShaftTouchTail.min !== navShaftTouchTail.max,
                    minMax = options.minMax || overflowFLAG && getNavFrameBounds(activeFrame[navFrameKey]),
                    l = overflowFLAG && (options.keep && slideNavShaft.l ? slideNavShaft.l : minMaxLimit((options.coo || measures.nw / 2) - getNavFrameBounds($guessNavFrame).c, minMax.min, minMax.max)),
                    pos = overflowFLAG && minMaxLimit(l, navShaftTouchTail.min, navShaftTouchTail.max),
                    time = options.time * 1.1;

                slide($navShaft, {
                    time: time,
                    pos: pos || 0,
                    onEnd: function() {
                        thumbsDraw(pos, true);
                    }
                });

                //if (time) thumbsDraw(pos);

                setShadow($nav, findShadowEdge(pos, navShaftTouchTail.min, navShaftTouchTail.max));
                slideNavShaft.l = l;
            }
        }

        function navUpdate() {
            deactivateFrames(navFrameKey);
            toDeactivate[navFrameKey].push(activeFrame[navFrameKey].addClass(activeClass));
        }

        function deactivateFrames(key) {
            var _toDeactivate = toDeactivate[key];

            while (_toDeactivate.length) {
                _toDeactivate.shift().removeClass(activeClass);
            }
        }

        function detachFrames(key) {
            var _toDetach = toDetach[key];

            ////console.log('_toDetach', _toDetach);
            ////console.log('activeIndexes', activeIndexes);

            $.each(activeIndexes, function(i, index) {
                delete _toDetach[normalizeIndex(index)];
            });

            $.each(_toDetach, function(index, $frame) {
                delete _toDetach[index];
                ////console.log('Detach', index);
                $frame.detach();
            });
        }

        function stageShaftReposition(skipOnEnd) {

            repositionIndex = dirtyIndex = activeIndex;

            var $frame = activeFrame[STAGE_FRAME_KEY];

            if ($frame) {
                deactivateFrames(STAGE_FRAME_KEY);
                toDeactivate[STAGE_FRAME_KEY].push($frame.addClass(activeClass));

                skipOnEnd || that.show.onEnd(true);
                stop($stageShaft, 0, true);

                detachFrames(STAGE_FRAME_KEY);
                stageFramePosition(activeIndexes);
                setStageShaftMinmaxAndSnap();
                setNavShaftMinMax();
            }
        }

        function extendMeasures(options, measuresArray) {
            if (!options) return;

            $.each(measuresArray, function(i, measures) {
                if (!measures) return;

                $.extend(measures, {
                    width: options.width || measures.width,
                    height: options.height,
                    minwidth: options.minwidth,
                    maxwidth: options.maxwidth,
                    minheight: options.minheight,
                    maxheight: options.maxheight,
                    ratio: getRatio(options.ratio)
                })
            });
        }

        function triggerEvent(event, extra) {
            $fotorama.trigger(_fotoramaClass + ':' + event, [that, extra]);
        }

        function onTouchStart() {
            clearTimeout(onTouchEnd.t);
            touchedFLAG = 1;

            if (opts.stopautoplayontouch) {
                that.stopAutoplay();
            } else {
                pausedAutoplayFLAG = true;
            }
        }

        function onTouchEnd() {
            if (!touchedFLAG) return;
            if (!opts.stopautoplayontouch) {
                releaseAutoplay();
                changeAutoplay();
            }

            onTouchEnd.t = setTimeout(function() {
                touchedFLAG = 0;
            }, TRANSITION_DURATION + TOUCH_TIMEOUT);
            ////console.timeEnd('onTouchEnd');
        }

        function releaseAutoplay() {
            //console.log('releaseAutoplay');
            pausedAutoplayFLAG = !!($videoPlaying || stoppedAutoplayFLAG);
        }

        function changeAutoplay() {
            //console.log('changeAutoplay');

            clearTimeout(changeAutoplay.t);
            waitFor.stop(changeAutoplay.w);

            if (!opts.autoplay || pausedAutoplayFLAG) {
                if (that.autoplay) {
                    that.autoplay = false;
                    triggerEvent('stopautoplay');
                }

                return;
            }

            //console.log('changeAutoplay continue');

            if (!that.autoplay) {
                that.autoplay = true;
                triggerEvent('startautoplay');
            }

            var _activeIndex = activeIndex;


            var frameData = activeFrame[STAGE_FRAME_KEY].data();
            changeAutoplay.w = waitFor(function() {
                //console.log('wait for the state of the current frame');
                return frameData.state || _activeIndex !== activeIndex;
            }, function() {
                //console.log('the current frame is ready');
                changeAutoplay.t = setTimeout(function() {
                    //console.log('changeAutoplay.t setTimeout', pausedAutoplayFLAG, _activeIndex !== activeIndex);
                    if (pausedAutoplayFLAG || _activeIndex !== activeIndex) return;

                    var _nextAutoplayIndex = nextAutoplayIndex,
                        nextFrameData = data[_nextAutoplayIndex][STAGE_FRAME_KEY].data();

                    changeAutoplay.w = waitFor(function() {
                        //console.log('wait for the state of the next frame');
                        return nextFrameData.state || _nextAutoplayIndex !== nextAutoplayIndex;
                    }, function() {
                        if (pausedAutoplayFLAG || _nextAutoplayIndex !== nextAutoplayIndex) return;
                        that.show(o_loop ? getDirectionSign(!o_rtl) : nextAutoplayIndex);
                    });
                }, opts.autoplay);
            });

        }

        that.startAutoplay = function(interval) {
            if (that.autoplay) return this;
            pausedAutoplayFLAG = stoppedAutoplayFLAG = false;
            setAutoplayInterval(interval || opts.autoplay);
            changeAutoplay();

            return this;
        };

        that.stopAutoplay = function() {
            if (that.autoplay) {
                pausedAutoplayFLAG = stoppedAutoplayFLAG = true;
                changeAutoplay();
            }
            return this;
        };

        that.show = function(options) {
            //console.log('that.show');
            ////console.time('that.show prepare');
            var index;

            if (typeof options !== 'object') {
                index = options;
                options = {};
            } else {
                index = options.index;
            }

            index = index === '>' ? dirtyIndex + 1 : index === '<' ? dirtyIndex - 1 : index === '<<' ? 0 : index === '>>' ? size - 1 : index;
            index = isNaN(index) ? getIndexFromHash(index, data, true) : index;
            index = typeof index === 'undefined' ? activeIndex || 0 : index;

            that.activeIndex = activeIndex = edgeIndex(index);
            prevIndex = getPrevIndex(activeIndex);
            nextIndex = getNextIndex(activeIndex);
            nextAutoplayIndex = normalizeIndex(activeIndex + (o_rtl ? -1 : 1));
            activeIndexes = [activeIndex, prevIndex, nextIndex];

            dirtyIndex = o_loop ? index : activeIndex;

            var diffIndex = Math.abs(lastActiveIndex - dirtyIndex),
                time = getNumber(options.time, function() {
                    return Math.min(o_transitionDuration * (1 + (diffIndex - 1) / 12), o_transitionDuration * 2);
                }),
                overPos = options.overPos;

            if (options.slow) time *= 10;

            var _activeFrame = activeFrame;
            that.activeFrame = activeFrame = data[activeIndex];
            ////console.timeEnd('that.show prepare');

            var silent = _activeFrame === activeFrame && !options.user;

            //setTimeout(function () {
            ////console.time('unloadVideo');
            unloadVideo($videoPlaying, activeFrame.i !== data[normalizeIndex(repositionIndex)].i);
            ////console.timeEnd('unloadVideo');
            ////console.time('frameDraw');
            frameDraw(activeIndexes, 'stage');
            ////console.timeEnd('frameDraw');
            ////console.time('stageFramePosition');
            stageFramePosition(SLOW ? [dirtyIndex] : [dirtyIndex, getPrevIndex(dirtyIndex), getNextIndex(dirtyIndex)]);
            ////console.timeEnd('stageFramePosition');
            ////console.time('updateTouchTails');
            updateTouchTails('go', true);
            ////console.timeEnd('updateTouchTails');
            ////console.time('triggerEvent');

            silent || triggerEvent('show', {
                user: options.user,
                time: time
            });
            ////console.timeEnd('triggerEvent');
            //}, 0);

            ////console.time('bind onEnd');

            pausedAutoplayFLAG = true;

            var onEnd = that.show.onEnd = function(skipReposition) {
                if (onEnd.ok) return;
                onEnd.ok = true;

                skipReposition || stageShaftReposition(true);

                if (!silent) {
                    triggerEvent('showend', {
                        user: options.user
                    });
                }

                //console.log('o_transition', o_transition);

                if (!skipReposition && o_transition && o_transition !== opts.transition) {
                    //console.log('set transition back to: ' + o_transition);
                    that.setOptions({
                        transition: o_transition
                    });
                    o_transition = false;
                    return;
                }

                updateFotoramaState();
                loadImg(activeIndexes, 'stage');

                updateTouchTails('go', false);
                stageWheelUpdate();

                stageCursor();
                releaseAutoplay();
                changeAutoplay();
            };
            ////console.timeEnd('bind onEnd');

            if (!o_fade) {
                ////console.time('slide');
                slide($stageShaft, {
                    pos: -getPosByIndex(dirtyIndex, measures.w, opts.margin, repositionIndex),
                    overPos: overPos,
                    time: time,
                    onEnd: onEnd
                        /*,
                                _001: true*/
                });
                ////console.timeEnd('slide');
            } else {
                var $activeFrame = activeFrame[STAGE_FRAME_KEY],
                    $prevActiveFrame = activeIndex !== lastActiveIndex ? data[lastActiveIndex][STAGE_FRAME_KEY] : null;

                fade($activeFrame, $prevActiveFrame, $stageFrame, {
                    time: time,
                    method: opts.transition,
                    onEnd: onEnd
                }, fadeStack);
            }

            ////console.time('arrsUpdate');
            arrsUpdate();
            ////console.timeEnd('arrsUpdate');

            if (o_nav) {
                ////console.time('navUpdate');
                navUpdate();
                ////console.timeEnd('navUpdate');

                ////console.time('slideNavShaft');
                var guessIndex = limitIndex(activeIndex + minMaxLimit(dirtyIndex - lastActiveIndex, -1, 1));
                slideNavShaft({
                    time: time,
                    coo: guessIndex !== activeIndex && options.coo,
                    guessIndex: typeof options.coo !== 'undefined' ? guessIndex : activeIndex,
                    keep: silent
                });
                ////console.timeEnd('slideNavShaft');

                ////console.time('slideThumbBorder');
                if (o_navThumbs) slideThumbBorder(time);
                ////console.timeEnd('slideThumbBorder');
            }

            ////console.time('that.show end');
            showedFLAG = typeof lastActiveIndex !== 'undefined' && lastActiveIndex !== activeIndex;
            lastActiveIndex = activeIndex;
            opts.hash && showedFLAG && !that.eq && setHash(activeFrame.id || activeIndex + 1);
            ////console.timeEnd('that.show end');

            ////console.timeEnd('that.show');

            return this;
        };

        that.requestFullScreen = function() {
            if (o_allowFullScreen && !that.fullScreen) {
                scrollTop = $WINDOW.scrollTop();
                scrollLeft = $WINDOW.scrollLeft();

                lockScroll($WINDOW);

                updateTouchTails('x', true);

                measuresStash = $.extend({}, measures);

                $fotorama
                    .addClass(fullscreenClass)
                    .appendTo($BODY.addClass(_fullscreenClass));

                $HTML.addClass(_fullscreenClass);

                unloadVideo($videoPlaying, true, true);

                that.fullScreen = true;

                if (o_nativeFullScreen) {
                    fullScreenApi.request(fotorama);
                }

                that.resize();
                loadImg(activeIndexes, 'stage');
                updateFotoramaState();

                triggerEvent('fullscreenenter');
            }

            return this;
        };

        function cancelFullScreen() {
            if (that.fullScreen) {
                that.fullScreen = false;

                if (FULLSCREEN) {
                    fullScreenApi.cancel(fotorama);
                }

                $BODY.removeClass(_fullscreenClass);
                $HTML.removeClass(_fullscreenClass);

                $fotorama
                    .removeClass(fullscreenClass)
                    .insertAfter($anchor);

                measures = $.extend({}, measuresStash);

                unloadVideo($videoPlaying, true, true);

                updateTouchTails('x', false);

                that.resize();
                loadImg(activeIndexes, 'stage');

                lockScroll($WINDOW, scrollLeft, scrollTop);

                triggerEvent('fullscreenexit');
            }
        }

        that.cancelFullScreen = function() {
            if (o_nativeFullScreen && fullScreenApi.is()) {
                fullScreenApi.cancel(document);
            } else {
                cancelFullScreen();
            }

            return this;
        };

        that.toggleFullScreen = function() {
            return that[(that.fullScreen ? 'cancel' : 'request') + 'FullScreen']();
        };

        addEvent(document, fullScreenApi.event, function() {
            if (data && !fullScreenApi.is() && !$videoPlaying) {
                cancelFullScreen();
            }
        });

        that.resize = function(options) {
            if (!data) return this;

            var time = arguments[1] || 0,
                setFLAG = arguments[2];

            extendMeasures(!that.fullScreen ? optionsToLowerCase(options) : {
                width: '100%',
                maxwidth: null,
                minwidth: null,
                height: '100%',
                maxheight: null,
                minheight: null
            }, [measures, setFLAG || that.fullScreen || opts]);

            var width = measures.width,
                height = measures.height,
                ratio = measures.ratio,
                windowHeight = $WINDOW.height() - (o_nav ? $nav.height() : 0);

            if (measureIsValid(width)) {
                $wrap
                    .addClass(wrapOnlyActiveClass)
                    .css({
                        width: width,
                        minWidth: measures.minwidth || 0,
                        maxWidth: measures.maxwidth || MAX_WIDTH
                    });

                width = measures.W = measures.w = $wrap.width();
                measures.nw = o_nav && numberFromWhatever(opts.navwidth, width) || width;

                if (opts.glimpse) {
                    // Glimpse
                    measures.w -= Math.round((numberFromWhatever(opts.glimpse, width) || 0) * 2);
                }

                $stageShaft.css({
                    width: measures.w,
                    marginLeft: (measures.W - measures.w) / 2
                });

                ////console.log('measures.W', measures.W);
                ////console.log('measures.w', measures.w);

                height = numberFromWhatever(height, windowHeight);

                height = height || (ratio && width / ratio);

                if (height) {
                    width = Math.round(width);
                    height = measures.h = Math.round(minMaxLimit(height, numberFromWhatever(measures.minheight, windowHeight), numberFromWhatever(measures.maxheight, windowHeight)));

                    $stage
                        .stop()
                        .animate({
                            width: width,
                            height: height
                        }, time, function() {
                            $wrap.removeClass(wrapOnlyActiveClass);
                        });

                    stageShaftReposition();

                    if (o_nav) {
                        $nav
                            .stop()
                            .animate({
                                width: measures.nw
                            }, time);

                        slideNavShaft({
                            guessIndex: activeIndex,
                            time: time,
                            keep: true
                        });
                        if (o_navThumbs && frameAppend.nav) slideThumbBorder(time);
                    }

                    measuresSetFLAG = setFLAG || true;

                    ready();
                }
            }

            stageLeft = $stage.offset().left;

            return this;
        };

        that.setOptions = function(options) {
            $.extend(opts, options);
            reset();
            return this;
        };

        that.shuffle = function() {
            data && shuffle(data) && reset();
            return this;
        };

        function setShadow($el, edge) {
            ////console.time('setShadow');
            if (o_shadows) {
                $el.removeClass(shadowsLeftClass + ' ' + shadowsRightClass);
                edge && !$videoPlaying && $el.addClass(edge.replace(/^|\s/g, ' ' + shadowsClass + '--'));
            }
            ////console.timeEnd('setShadow');
        }

        that.destroy = function() {
            that.cancelFullScreen();
            that.stopAutoplay();

            data = that.data = null;

            appendElements();

            activeIndexes = [];
            detachFrames(STAGE_FRAME_KEY);

            reset.ok = false;

            return this;
        };

        that.playVideo = function() {
            var dataFrame = activeFrame,
                video = dataFrame.video,
                _activeIndex = activeIndex;

            if (typeof video === 'object' && dataFrame.videoReady) {
                o_nativeFullScreen && that.fullScreen && that.cancelFullScreen();

                waitFor(function() {
                    return !fullScreenApi.is() || _activeIndex !== activeIndex;
                }, function() {
                    if (_activeIndex === activeIndex) {
                        dataFrame.$video = dataFrame.$video || $($.Fotorama.jst.video(video));
                        dataFrame.$video.appendTo(dataFrame[STAGE_FRAME_KEY]);

                        $wrap.addClass(wrapVideoClass);
                        $videoPlaying = dataFrame.$video;

                        stageNoMove();

                        $arrs.blur();
                        $fullscreenIcon.blur();

                        triggerEvent('loadvideo');
                    }
                });
            }

            return this;
        };

        that.stopVideo = function() {
            unloadVideo($videoPlaying, true, true);
            return this;
        };

        function unloadVideo($video, unloadActiveFLAG, releaseAutoplayFLAG) {
            if (unloadActiveFLAG) {
                $wrap.removeClass(wrapVideoClass);
                $videoPlaying = false;

                stageNoMove();
            }

            if ($video && $video !== $videoPlaying) {
                $video.remove();
                triggerEvent('unloadvideo');
            }

            if (releaseAutoplayFLAG) {
                releaseAutoplay();
                changeAutoplay();
            }
        }

        function toggleControlsClass(FLAG) {
            $wrap.toggleClass(wrapNoControlsClass, FLAG);
        }

        function stageCursor(e) {
            if (stageShaftTouchTail.flow) return;

            var x = e ? e.pageX : stageCursor.x,
                pointerFLAG = x && !disableDirrection(getDirection(x)) && opts.click;

            if (stageCursor.p !== pointerFLAG && $stage.toggleClass(pointerClass, pointerFLAG)) {
                stageCursor.p = pointerFLAG;
                stageCursor.x = x;
            }
        }

        $stage.on('mousemove', stageCursor);

        function clickToShow(showOptions) {
            clearTimeout(clickToShow.t);

            if (opts.clicktransition && opts.clicktransition !== opts.transition) {
                //console.log('change transition to: ' + opts.clicktransition);

                // this timeout is for yield events flow
                setTimeout(function() {
                    // save original transition for later
                    var _o_transition = opts.transition;

                    that.setOptions({
                        transition: opts.clicktransition
                    });

                    // now safe to pass base transition to o_transition, so that.show will restor it
                    o_transition = _o_transition;
                    // this timeout is here to prevent jerking in some browsers
                    clickToShow.t = setTimeout(function() {
                        that.show(showOptions);
                    }, 10);
                }, 0);
            } else {
                that.show(showOptions);
            }
        }

        function onStageTap(e, toggleControlsFLAG) {
            ////console.time('onStageTap');
            var target = e.target,
                $target = $(target);

            if ($target.hasClass(videoPlayClass)) {
                that.playVideo();
            } else if (target === fullscreenIcon) {
                that.toggleFullScreen();
            } else if ($videoPlaying) {
                target === videoClose && unloadVideo($videoPlaying, true, true);
            } else {
                if (toggleControlsFLAG) {
                    toggleControlsClass();
                } else if (opts.click) {

                    clickToShow({
                        index: e.shiftKey || getDirectionSign(getDirection(e._x)),
                        slow: e.altKey,
                        user: true
                    });
                }
            }
            ////console.timeEnd('onStageTap');
        }

        function updateTouchTails(key, value) {
            stageShaftTouchTail[key] = navShaftTouchTail[key] = value;
        }

        stageShaftTouchTail = moveOnTouch($stageShaft, {
            onStart: onTouchStart,
            onMove: function(e, result) {
                setShadow($stage, result.edge);
            },
            onTouchEnd: onTouchEnd,
            onEnd: function(result) {
                ////console.time('stageShaftTouchTail.onEnd');
                setShadow($stage);

                ////console.log('result', result);

                var toggleControlsFLAG = (MS_POINTER && !hoverFLAG || result.touch) && opts.arrows && opts.arrows !== 'always';

                if (result.moved || (toggleControlsFLAG && result.pos !== result.newPos && !result.control)) {
                    var index = getIndexByPos(result.newPos, measures.w, opts.margin, repositionIndex);
                    that.show({
                        index: index,
                        time: o_fade ? o_transitionDuration : result.time,
                        overPos: result.overPos,
                        user: true
                    });
                } else if (!result.aborted && !result.control) {
                    onStageTap(result.startEvent, toggleControlsFLAG);
                }
                ////console.timeEnd('stageShaftTouchTail.onEnd');
            },
            //    getPos: function () {
            //      return -getPosByIndex(dirtyIndex, measures.w, opts.margin, repositionIndex);
            //    },
            //_001: true,
            timeLow: 1,
            timeHigh: 1,
            friction: 2,
            select: '.' + selectClass + ', .' + selectClass + ' *',
            $wrap: $stage
        });

        navShaftTouchTail = moveOnTouch($navShaft, {
            onStart: onTouchStart,
            onMove: function(e, result) {
                setShadow($nav, result.edge);
            },
            onTouchEnd: onTouchEnd,
            onEnd: function(result) {

                function onEnd() {
                    slideNavShaft.l = result.newPos;
                    releaseAutoplay();
                    changeAutoplay();
                    thumbsDraw(result.newPos, true);
                }

                if (!result.moved) {
                    var target = result.$target.closest('.' + navFrameClass, $navShaft)[0];
                    target && onNavFrameClick.call(target, result.startEvent);
                } else if (result.pos !== result.newPos) {
                    pausedAutoplayFLAG = true;
                    slide($navShaft, {
                        time: result.time,
                        pos: result.newPos,
                        overPos: result.overPos,
                        onEnd: onEnd
                    });
                    thumbsDraw(result.newPos);
                    o_shadows && setShadow($nav, findShadowEdge(result.newPos, navShaftTouchTail.min, navShaftTouchTail.max));
                } else {
                    onEnd();
                }
            },
            timeLow: .5,
            timeHigh: 2,
            friction: 5,
            $wrap: $nav
        });

        stageWheelTail = wheel($stage, {
            shift: true,
            onEnd: function(e, direction) {
                ////console.log('wheel $stage onEnd', direction);
                onTouchStart();
                onTouchEnd();
                that.show({
                    index: direction,
                    slow: e.altKey
                })
            }
        });

        navWheelTail = wheel($nav, {
            onEnd: function(e, direction) {
                ////console.log('wheel $nav onEnd', direction);
                onTouchStart();
                onTouchEnd();
                var newPos = stop($navShaft) + direction * .25;
                $navShaft.css(getTranslate(minMaxLimit(newPos, navShaftTouchTail.min, navShaftTouchTail.max)));
                o_shadows && setShadow($nav, findShadowEdge(newPos, navShaftTouchTail.min, navShaftTouchTail.max));
                navWheelTail.prevent = {
                    '<': newPos >= navShaftTouchTail.max,
                    '>': newPos <= navShaftTouchTail.min
                };
                clearTimeout(navWheelTail.t);
                navWheelTail.t = setTimeout(function() {
                    slideNavShaft.l = newPos;
                    thumbsDraw(newPos, true)
                }, TOUCH_TIMEOUT);
                thumbsDraw(newPos);
            }
        });

        $wrap.hover(
            function() {
                setTimeout(function() {
                    if (touchedFLAG) return;
                    toggleControlsClass(!(hoverFLAG = true));
                }, 0);
            },
            function() {
                if (!hoverFLAG) return;
                toggleControlsClass(!(hoverFLAG = false));
            }
        );

        function onNavFrameClick(e) {
            var index = $(this).data().eq;
            clickToShow({
                index: index,
                slow: e.altKey,
                user: true,
                coo: e._x - $nav.offset().left
            });
        }

        function onArrClick(e) {
            clickToShow({
                index: $arrs.index(this) ? '>' : '<',
                slow: e.altKey,
                user: true
            });
        }

        smartClick($arrs, function(e) {
            stopEvent(e);
            onArrClick.call(this, e);
        }, {
            onStart: function() {
                onTouchStart();
                stageShaftTouchTail.control = true;
            },
            onTouchEnd: onTouchEnd
        });

        function addFocusOnControls(el) {
            addFocus(el, function() {
                setTimeout(function() {
                    lockScroll($stage);
                }, 0);
                toggleControlsClass(false);
            });
        }

        $arrs.each(function() {
            addEnterUp(this, function(e) {
                onArrClick.call(this, e);
            });
            addFocusOnControls(this);
        });

        addEnterUp(fullscreenIcon, that.toggleFullScreen);
        addFocusOnControls(fullscreenIcon);

        function reset() {
            setData();
            setOptions();

            if (!reset.i) {
                reset.i = true;
                // Only once
                var _startindex = opts.startindex;
                if (_startindex || opts.hash && location.hash) {
                    startIndex = getIndexFromHash(_startindex || location.hash.replace(/^#/, ''), data, that.index === 0 || _startindex, _startindex);
                }
                activeIndex = repositionIndex = dirtyIndex = lastActiveIndex = startIndex = edgeIndex(startIndex) || 0; /*(o_rtl ? size - 1 : 0)*/ //;
            }

            if (size) {
                if (changeToRtl()) return;

                if ($videoPlaying) {
                    unloadVideo($videoPlaying, true);
                }

                activeIndexes = [];
                detachFrames(STAGE_FRAME_KEY);

                reset.ok = true;

                that.show({
                    index: activeIndex,
                    time: 0
                });
                that.resize();
            } else {
                that.destroy();
            }
        }

        function changeToRtl() {
            ////console.log('changeToRtl');
            if (!changeToRtl.f === o_rtl) {
                changeToRtl.f = o_rtl;
                activeIndex = size - 1 - activeIndex;
                ////console.log('changeToRtl execute, activeIndex is', activeIndex);
                that.reverse();

                return true;
            }
        }

        $.each('load push pop shift unshift reverse sort splice'.split(' '), function(i, method) {
            that[method] = function() {
                data = data || [];
                if (method !== 'load') {
                    Array.prototype[method].apply(data, arguments);
                } else if (arguments[0] && typeof arguments[0] === 'object' && arguments[0].length) {
                    data = clone(arguments[0]);
                }
                reset();
                return that;
            }
        });

        function ready() {
            if (!ready.ok) {
                ready.ok = true;
                triggerEvent('ready');
            }
        }

        reset();
    };


    $.fn.fotorama = function(opts) {
        return this.each(function() {
            var that = this,
                $fotorama = $(this),
                fotoramaData = $fotorama.data(),
                fotorama = fotoramaData.fotorama;

            if (!fotorama) {
                waitFor(function() {
                    return !isHidden(that);
                }, function() {
                    fotoramaData.urtext = $fotorama.html();
                    new $.Fotorama($fotorama,
                        /* Priority for options:
                         * 1. <div data-loop="true"></div>
                         * 2. $('div').fotorama({loop: false})
                         * 3. Defaults */
                        $.extend({},
                            OPTIONS,
                            window.fotoramaDefaults,
                            opts,
                            fotoramaData
                        )
                    );
                });
            } else {
                if ($.isFunction(fotorama.setOptions)) {
                    fotorama.setOptions(opts, true);
                }
            }
        });
    };
    $.Fotorama.instances = [];

    function calculateIndexes() {
        $.each($.Fotorama.instances, function(index, instance) {
            instance.index = index;
        });
    }

    function addInstance(instance) {
        $.Fotorama.instances.push(instance);
        calculateIndexes();
    }

    function hideInstance(instance) {
        $.Fotorama.instances.splice(instance.index, 1);
        calculateIndexes();
    }
    $.Fotorama.cache = {};
    $.Fotorama.measures = {};
    $ = $ || {};
    $.Fotorama = $.Fotorama || {};
    $.Fotorama.jst = $.Fotorama.jst || {};

    $.Fotorama.jst.style = function(v) {
        var __t, __p = '',
            __e = _.escape;
        __p += '.fotorama' +
            ((__t = (v.s)) == null ? '' : __t) +
            ' .fotorama__nav--thumbs .fotorama__nav__frame{\npadding:' +
            ((__t = (v.m)) == null ? '' : __t) +
            'px;\nheight:' +
            ((__t = (v.h)) == null ? '' : __t) +
            'px}\n.fotorama' +
            ((__t = (v.s)) == null ? '' : __t) +
            ' .fotorama__thumb-border{\nheight:' +
            ((__t = (v.h - v.b * (v.q ? 0 : 2))) == null ? '' : __t) +
            'px;\nborder-width:' +
            ((__t = (v.b)) == null ? '' : __t) +
            'px;\nmargin-top:' +
            ((__t = (v.m)) == null ? '' : __t) +
            'px}';
        return __p
    };

    $.Fotorama.jst.video = function(v) {
        var __t, __p = '',
            __e = _.escape,
            __j = Array.prototype.join;

        function print() {
            __p += __j.call(arguments, '')
        }
        __p += '<div class="fotorama__video"><iframe src="';
        print((v.type == 'youtube' ? v.p + 'youtube.com/embed/' + v.id + '?autoplay=1' : v.type == 'vimeo' ? v.p + 'player.vimeo.com/video/' + v.id + '?autoplay=1&badge=0' : v.id) + (v.s && v.type != 'custom' ? '&' + v.s : ''));
        __p += '" frameborder="0" allowfullscreen></iframe></div>\n';
        return __p
    };
    $(function() {
        $('.' + _fotoramaClass + ':not([data-auto="false"])').fotorama();
    });
})(window, document, location, typeof jQuery !== 'undefined' && jQuery);;