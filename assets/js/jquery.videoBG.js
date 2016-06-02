/*
 * @preserve Copyright 2011 Syd Lawrence ( www.sydlawrence.com ).
 * Version: 0.2
 *
 * Licensed under MIT and GPLv2.
 *
 * Usage: $('body').videoBG(options);
 *
 */

(function ($) {
"use strict";
  $.fn.videoBG = function (selector, options) {

    var options = {};
    if (typeof selector == "object") {
      options = $.extend({}, $.fn.videoBG.defaults, selector);
    }
    else {
      if (!selector) {
        options = $.fn.videoBG.defaults;
      }
      else {
        return $(selector).videoBG(options);
      }
    }

    var container = $(this);

    // check if elements available otherwise it will cause issues
    if (!container.length) {
      return;
    }

    // container to be at least relative
    if (container.css('position') == 'static' || !container.css('position')) {
      container.css('position', 'relative');
    }

    // we need a width
    if (options.width == 0) {
      options.width = container.width();
    }

    // we need a height
    if (options.height == 0) {
      options.height = container.height();
    }

    // get the wrapper
    var wrap = $.fn.videoBG.wrapper();
    wrap.height(options.height)
      .width(options.width);

    // if is a text replacement
    if (options.textReplacement) {

      // force sizes
      options.scale = true;

      // set sizes and forcing text out
      container.width(options.width)
        .height(options.height)
        .css('text-indent', '-9999px');
    }
    else {

      // set the wrapper above the video
      wrap.css('z-index', options.zIndex + 1);
    }

    // move the contents into the wrapper
    wrap.html(container.clone(true));

    // get the video
    var video = $.fn.videoBG.video(options);

    // if we are forcing width / height
    if (options.scale) {

      // overlay wrapper
      wrap.height(options.height)
        .width(options.width);

      // video
      video.height(options.height)
        .width(options.width);
    }

    // add it all to the container
    container.html(wrap);
    container.append(video);

    if (!options.autoplay) {
      var control = $('<div class="videobg-control"><div class="videobg-play"></div><div class="videobg-mute"></div></div>');
      control.find('.videobg-play').on('click', function () {
        var $video = $(this).parent().parent().find('video').eq(0);

        if ($video.length) {
          if ($video[0].paused == true) {
            $video[0].play();
            $(this).addClass('playing');
          }
          else {
            $video[0].pause();
            $(this).removeClass('playing');
          }
        }
      });

      control.find('.videobg-mute').on('click', function () {
        var $video = $(this).parent().parent().find('video').eq(0);

        if ($video.length) {
          if ($video[0].muted == true) {
            $video[0].muted = false;
            $(this).removeClass('muted');
          }
          else {
            $video[0].muted = true;
            $(this).addClass('muted');
          }
        }
      });
    }

    control && container.append(control);

    return video.find("video")[0];
  }

  // set to fullscreen
  $.fn.videoBG.setFullscreen = function ($el) {

    $el
      .css('min-height', 0)
      .css('min-width', 0)
      .css('left', '')
      .css('top', '')
      .css('height', '')
      .css('width', '');

    // Try width first
    var size = {
      window: {
        width: $el.parent().parent().parent().width(), // need smarter and doesn't depend on dom!
        height: $el.parent().parent().parent().height()
      },
      spacer: {
        left: 0,
        top: 0
      }
    }

    // This has to run first to get sane aspect ratio
    $el.parent().width(size.window.width).height(size.window.height);
    $el.parent().parent().find('.videoBG_wrapper').width(size.window.width).height(size.window.height);

    // Try using width first
    size.aspect = $el[0].videoWidth / $el[0].videoHeight;
    size.width = size.window.width;
    size.height = size.window.width / size.aspect;

    // Video is shorter than viewport
    if (size.height < size.window.height) {
      size.width = size.window.height * size.aspect;
      size.height = size.window.height;
    }

    // Get left positioning
    if (size.width < size.window.width) {
      size.spacer.left = (size.window.width - size.width) / 2;
    }
    else if (size.width > size.window.width) {
      size.spacer.left = (size.width - size.window.width) / 2;
    }

    // Get right positioning
    if (size.height < size.window.height) {
      size.spacer.top = (size.window.height - size.height) / 2;
    }
    else if (size.height > size.window.height) {
      size.spacer.top = (size.height - size.window.height) / 2;
    }

    $el.width(size.width).height(size.height).css('top', -size.spacer.top).css('left', -size.spacer.left);

    // No leaking!
    // delete(size);

  }

  // get the formatted video element
  $.fn.videoBG.video = function (options) {

    $('html, body').scrollTop(-1);

    // video container
    var $div = $('<div/>');
    $div.addClass('videoBG')
      .css('position', options.position)
      .css('z-index', options.zIndex)
      .css('top', 0)
      .css('left', 0)
      .css('height', options.height)
      .css('width', options.width)
      .css('opacity', options.opacity)
      .css('overflow', 'hidden');

    // video element
    var $video = $('<video/>');
    $video.css('position', 'absolute')
      .css('z-index', options.zIndex)
      .attr('poster', options.poster)
      .css('top', 0)
      .css('left', 0)
      .css('min-width', '100%')
      .css('min-height', '100%');

    if (options.autoplay) {
      $video.attr('autoplay', options.autoplay);
    }


    // if fullscreen
    if (options.fullscreen) {
      $video.bind('canplay', function () {
        // set the aspect ratio
        $video.aspectRatio = $video.width() / $video.height();
        $.fn.videoBG.setFullscreen($video);
      });

      $video[0].needResume = 'none';

      // listen out for screenresize
      $(window).on("resize", function () {
        resizeTimeout && clearTimeout(resizeTimeout);
        if ($video[0].needResume == 'none'
            && $video[0].paused != true) {
          $video[0].needResume = true;
          $video[0].pause();
        }


        var resizeTimeout = setTimeout(function () {
          $.fn.videoBG.setFullscreen($video);

          if ($video[0].needResume == true) {
            $video[0].play();
          }
          $video[0].needResume = 'none';
        }, 1);

        $.fn.videoBG.setFullscreen($video);
      });
      $.fn.videoBG.setFullscreen($video);
    }


    // video standard element
    var v = $video[0];

    // if meant to loop
    if (options.loop) {
      loops_left = options.loop;

      // cant use the loop attribute as firefox doesnt support it
      $video.bind('ended', function () {

        // if we have some loops to throw
        if (loops_left)
        // replay that bad boy
        {
          v.play();
        }

        // if not forever
        if (loops_left !== true)
        // one less loop
        {
          loops_left--;
        }
      });
    }

    // when can play, play
    $video.bind('canplay', function () {

      if (options.autoplay)
      // replay that bad boy
      {
        v.play();
      }

    });


    // if supports video
    if ($.fn.videoBG.supportsVideo()) {

      // supports webm
      if ($.fn.videoBG.supportType('mp4')) {
        // play mp4
        $video.attr('src', options.mp4);

        //  $video.html('<source src="'.options.mp4.'" />');

      }
      // supports mp4
      else {
        if ($.fn.videoBG.supportType('ogv')) {

          // play ogv
          $video.attr('src', options.ogv);

        }
        // throw ogv at it then
        else {
          if ($.fn.videoBG.supportType('webm')) {

            // play webm
            $video.attr('src', options.webm);

          }
        }
      }
    }


    // image for those that dont support the video
    var $img = $('<img/>');
    $img.attr('src', options.poster)
      .css('position', 'absolute')
      .css('z-index', options.zIndex)
      .css('top', 0)
      .css('left', 0)
      .css('min-width', '100%')
      .css('min-height', '100%');

    // add the image to the video
    // if suuports video
    if ($.fn.videoBG.supportsVideo()) {
      // add the video to the wrapper
      $div.html($video);
    }

    // nope - whoa old skool
    else {

      // add the image instead
      $div.html($img);
    }

    // if text replacement
    if (options.textReplacement) {

      // force the heights and widths
      $div.css('min-height', 1).css('min-width', 1);
      $video.css('min-height', 1).css('min-width', 1);
      $img.css('min-height', 1).css('min-width', 1);

      $div.height(options.height).width(options.width);
      $video.height(options.height).width(options.width);
      $img.height(options.height).width(options.width);
    }

    if ($.fn.videoBG.supportsVideo()) {
      v.play();
    }
    return $div;
  }

  // check if suuports video
  $.fn.videoBG.supportsVideo = function () {
    return (document.createElement('video').canPlayType);
  }

  // check which type is supported
  $.fn.videoBG.supportType = function (str) {

    // if not at all supported
    if (!$.fn.videoBG.supportsVideo()) {
      return false;
    }

    // create video
    var v = document.createElement('video');

    // check which?
    switch (str) {
      case 'webm' :
        return (v.canPlayType('video/webm; codecs="vp8, vorbis"'));
        break;
      case 'mp4' :
        return (v.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"'));
        break;
      case 'ogv' :
        return (v.canPlayType('video/ogg; codecs="theora, vorbis"'));
        break;
    }
    // nope
    return false;
  }

  // get the overlay wrapper
  $.fn.videoBG.wrapper = function () {
    var $wrap = $('<div/>');
    $wrap.addClass('videoBG_wrapper')
      .css('position', 'absolute')
      .css('top', 0)
      .css('left', 0);
    return $wrap;
  }

  // these are the defaults
  $.fn.videoBG.defaults = {
    mp4: '',
    ogv: '',
    webm: '',
    poster: '',
    autoplay: false,
    loop: false,
    scale: false,
    position: "absolute",
    opacity: 1,
    textReplacement: false,
    zIndex: 0,
    width: 0,
    height: 0,
    fullscreen: false,
    imgFallback: true
  }

})(jQuery);


jQuery(document).ready(function ($) {
  "use strict";

  // Auto loading for older template
  $('[data-mode="video-background"]').on('each', function () {
    $(this).videoBG($(this).data());
  });

  // Auto loading for newer template and page not on animsition
  // or not VTCore Zeus theme
  if ($('#page.with-animsition').length == 0) {
    $('[data-mode="video-background-ng"]').on('each', function () {
      $(this).videoBG($(this).data('settings'));
    });
  }

  // Autoloading for page with animsition or VTCore Zeus Theme
  $(window).on('pageready', function() {
    if ($('#page.with-animsition').length) {
      $('[data-mode="video-background-ng"]').on('each', function () {
        $(this).videoBG($(this).data('settings'));
      });
    }
  })

});;


/*
	SlickNav Responsive Mobile Menu
	(c) 2014 Josh Cope
	licensed under MIT
*/
;(function ($, document, window) {
"use strict";
	var
	// default settings object.
	defaults = {
		label: 'MENU',
		duplicate: true,
		duration: 200,
		easingOpen: 'swing',
		easingClose: 'swing',
		closedSymbol: '&#9658;',
		openedSymbol: '&#9660;',
		prependTo: 'body',
		appendTo: '',
		parentTag: 'a',
		closeOnClick: false,
		allowParentLinks: false,
		init: function(){},
		open: function(){},
		close: function(){}
	},
	mobileMenu = 'slicknav',
	prefix = 'slicknav';
	
	function Plugin( element, options ) {
		this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.settings = $.extend( {}, defaults, options);
        
        this._defaults = defaults;
        this._name = mobileMenu;
        
        this.init();
	}
	
	Plugin.prototype.init = function () {
        var $this = this;
		var menu = $(this.element);
		var settings = this.settings;
		
		// clone menu if needed
		if (settings.duplicate) {
			$this.mobileNav = menu.clone();
			//remove ids from clone to prevent css issues
			$this.mobileNav.removeAttr('id');
			$this.mobileNav.find('*').each(function(i,e){
				$(e).removeAttr('id');
			});
		}
		else
			$this.mobileNav = menu;
		
		// styling class for the button
		var iconClass = prefix+'_icon';
		
		if (settings.label == '') {
			iconClass += ' '+prefix+'_no-text';
		}
		
		if (settings.parentTag == 'a') {
			settings.parentTag = 'a href="#"';
		}
		
		// create menu bar
		$this.mobileNav.attr('class', prefix+'_nav');
		var menuBar = $('<div class="'+prefix+'_menu"></div>');
		$this.btn = $('<'+settings.parentTag+' aria-haspopup="true" tabindex="0" class="'+prefix+'_btn '+prefix+'_collapsed"><span class="'+prefix+'_menutxt">'+settings.label+'</span><span class="'+iconClass+'"><span class="'+prefix+'_icon-bar"></span><span class="'+prefix+'_icon-bar"></span><span class="'+prefix+'_icon-bar"></span></span></a>');
		$(menuBar).append($this.btn);		
		
		if (settings.prependTo != '') {
		  $(settings.prependTo).prepend(menuBar);
		} 
		
    if (settings.appendTo != '') {
      $(settings.appendTo).append(menuBar);
    }
    
		menuBar.append($this.mobileNav);
		
		// iterate over structure adding additional structure
		var items = $this.mobileNav.find('li');
		$(items).each(function () {
			var item = $(this),
			data = {};
			data.children = item.children('ul').attr('role','menu');
			item.data("menu", data);
			
			// if a list item has a nested menu
			if (data.children.length > 0) {
			
				// select all text before the child menu
				var a = item.contents();
				var nodes = [];
				$(a).each(function(){
					if(!$(this).is("ul")) {
						nodes.push(this);
					}
					else {
						return false;
					}
				});
				
				// wrap item text with tag and add classes
				var wrap = $(nodes).wrapAll('<'+settings.parentTag+' role="menuitem" aria-haspopup="true" tabindex="-1" class="'+prefix+'_item"/>').parent();
				
				item.addClass(prefix+'_collapsed');
				item.addClass(prefix+'_parent');
				
				// create parent arrow
				$(nodes).last().after('<span class="'+prefix+'_arrow">'+settings.closedSymbol+'</span>');
				
			
			} else if ( item.children().length == 0) {
				 item.addClass(prefix+'_txtnode');
			}
			
			// accessibility for links
			item.children('a').attr('role', 'menuitem').on("click", function(){
				//Emulate menu close if set
				if (settings.closeOnClick)
					$($this.btn).click();
			});
		});
		
		// structure is in place, now hide appropriate items
		$(items).each(function () {
			var data = $(this).data("menu");
			$this._visibilityToggle(data.children, false, null, true);
		});
		
		// finally toggle entire menu
		$this._visibilityToggle($this.mobileNav, false, 'init', true);
		
		// accessibility for menu button
		$this.mobileNav.attr('role','menu');
		
		// outline prevention when using mouse
		$(document).mousedown(function(){
			$this._outlines(false);
		});
		
		$(document).keyup(function(){
			$this._outlines(true);
		});
		
		// menu button click
		$($this.btn).on("click", function (e) {
			e.preventDefault();
			$this._menuToggle();			
		});
		
		// click on menu parent
		$this.mobileNav.on('click', '.'+prefix+'_item', function(e){
			e.preventDefault();
			$this._itemClick($(this));
		});
		
		// check for enter key on menu button and menu parents
		$($this.btn).keydown(function (e) {
			var ev = e || event;
			if(ev.keyCode == 13) {
				e.preventDefault();
				$this._menuToggle();
			}
		});
		
		$this.mobileNav.on('keydown', '.'+prefix+'_item', function(e) {
			var ev = e || event;
			if(ev.keyCode == 13) {
				e.preventDefault();
				$this._itemClick($(e.target));
			}
		});
		
		// allow links clickable within parent tags if set
		if (settings.allowParentLinks) {
			$('.'+prefix+'_item a').on("click", function(e){
					e.stopImmediatePropagation();
			});
		}
    };
	
	//toggle menu
	Plugin.prototype._menuToggle = function(el){
		var $this = this;
		var btn = $this.btn;
		var mobileNav = $this.mobileNav;
		
		if (btn.hasClass(prefix+'_collapsed')) {
			btn.removeClass(prefix+'_collapsed');
			btn.addClass(prefix+'_open');
			//$(window).trigger('slickOpen');
		} else {
			btn.removeClass(prefix+'_open');
			btn.addClass(prefix+'_collapsed');
		}
		btn.addClass(prefix+'_animating');
		$this._visibilityToggle(mobileNav, true, btn);
	}
	
	// toggle clicked items
	Plugin.prototype._itemClick = function(el) {
		var $this = this;
		var settings = $this.settings;
		var data = el.data("menu");
		if (!data) {
			data = {};
			data.arrow = el.children('.'+prefix+'_arrow');
			data.ul = el.next('ul');
			data.parent = el.parent();
			el.data("menu", data);
		}
		if (data.parent.hasClass(prefix+'_collapsed')) {
			data.arrow.html(settings.openedSymbol);
			data.parent.removeClass(prefix+'_collapsed');
			data.parent.addClass(prefix+'_open');
			data.parent.addClass(prefix+'_animating');
			$this._visibilityToggle(data.ul, true, el);
		} else {
			data.arrow.html(settings.closedSymbol);
			data.parent.addClass(prefix+'_collapsed');
			data.parent.removeClass(prefix+'_open');
			data.parent.addClass(prefix+'_animating');
			$this._visibilityToggle(data.ul, true, el);
		}
	}

	// toggle actual visibility and accessibility tags
	Plugin.prototype._visibilityToggle = function(el, animate, trigger, init) {
		var $this = this;
		var settings = $this.settings;
		var items = $this._getActionItems(el);
		var duration = 0;
		if (animate)
			duration = settings.duration;
		
		if (el.hasClass(prefix+'_hidden')) {
			el.removeClass(prefix+'_hidden');
			el.slideDown(duration, settings.easingOpen, function(){
				
				$(trigger).removeClass(prefix+'_animating');
				$(trigger).parent().removeClass(prefix+'_animating');
				
				//Fire open callback
				if (!init) {
					settings.open(trigger);
				}
			});
			el.attr('aria-hidden','false');
			items.attr('tabindex', '0');
			$this._setVisAttr(el, false);
		} else {
			el.addClass(prefix+'_hidden');
			el.slideUp(duration, this.settings.easingClose, function() {
				el.attr('aria-hidden','true');
				items.attr('tabindex', '-1');
				$this._setVisAttr(el, true);
				el.hide(); //jQuery 1.7 bug fix
				
				$(trigger).removeClass(prefix+'_animating');
				$(trigger).parent().removeClass(prefix+'_animating');
				
				//Fire init or close callback
				if (!init)
					settings.close(trigger);
				else if (trigger == 'init')
					settings.init();
			});
		}
	}

	// set attributes of element and children based on visibility
	Plugin.prototype._setVisAttr = function(el, hidden) {
		var $this = this;
		
		// select all parents that aren't hidden
		var nonHidden = el.children('li').children('ul').not('.'+prefix+'_hidden');
		
		// iterate over all items setting appropriate tags
		if (!hidden) {
			nonHidden.each(function(){
				var ul = $(this);
				ul.attr('aria-hidden','false');
				var items = $this._getActionItems(ul);
				items.attr('tabindex', '0');
				$this._setVisAttr(ul, hidden);
			});
		} else {
			nonHidden.each(function(){
				var ul = $(this);
				ul.attr('aria-hidden','true');
				var items = $this._getActionItems(ul);
				items.attr('tabindex', '-1');
				$this._setVisAttr(ul, hidden);
			});
		}
	}

	// get all 1st level items that are clickable
	Plugin.prototype._getActionItems = function(el) {
		var data = el.data("menu");
		if (!data) {
			data = {};
			var items = el.children('li');
			var anchors = items.children('a');
			data.links = anchors.add(items.children('.'+prefix+'_item'));
			el.data("menu", data);
		}
		return data.links;
	}

	Plugin.prototype._outlines = function(state) {
		if (!state) {
			$('.'+prefix+'_item, .'+prefix+'_btn').css('outline','none');
		} else {
			$('.'+prefix+'_item, .'+prefix+'_btn').css('outline','');
		}
	}
	
	Plugin.prototype.toggle = function(){
		$this._menuToggle();
	}
	
	Plugin.prototype.open = function(){
		$this = this;
		if ($this.btn.hasClass(prefix+'_collapsed')) {
			$this._menuToggle();
		}
	}
	
	Plugin.prototype.close = function(){
		$this = this;
		if ($this.btn.hasClass(prefix+'_open')) {
			$this._menuToggle();
		}
	}
	
	$.fn[mobileMenu] = function ( options ) {
		var args = arguments;

		// Is the first parameter an object (options), or was omitted, instantiate a new instance
		if (options === undefined || typeof options === 'object') {
			return this.each(function () {

				// Only allow the plugin to be instantiated once due to methods
				if (!$.data(this, 'plugin_' + mobileMenu)) {

					// if it has no instance, create a new one, pass options to our plugin constructor,
					// and store the plugin instance in the elements jQuery data object.
					$.data(this, 'plugin_' + mobileMenu, new Plugin( this, options ));
				}
			});

		// If is a string and doesn't start with an underscore or 'init' function, treat this as a call to a public method.
		} else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

			// Cache the method call to make it possible to return a value
			var returns;

			this.each(function () {
				var instance = $.data(this, 'plugin_' + mobileMenu);

				// Tests that there's already a plugin-instance and checks that the requested public method exists
				if (instance instanceof Plugin && typeof instance[options] === 'function') {

					// Call the method of our plugin instance, and pass it the supplied arguments.
					returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
				}
			});

			// If the earlier cached method gives a value back return the value, otherwise return this to preserve chainability.
			return returns !== undefined ? returns : this;
		}
	};
	
}(jQuery, document, window));;


// jQuery HC-Sticky
// =============
// Version: 1.2.43
// Copyright: Some Web Media
// Author: Some Web Guy
// Author URL: http://twitter.com/some_web_guy
// Website: http://someweblog.com/
// Plugin URL: https://github.com/somewebmedia/hc-sticky
// License: Released under the MIT License www.opensource.org/licenses/mit-license.php
// Description: Cross-browser jQuery plugin that makes any element attached to the page and always visible while you scroll.

(function($, window, undefined) {
	"use strict";

	// console.log shortcut
	var log = function(t){console.log(t)};

	var $window = $(window),
		document = window.document,
		$document = $(document);

	// detect IE version
	var ie = (function(){var undef, v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i'); while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]){}; return v > 4 ? v : undef})();

	/*----------------------------------------------------
						Global functions
	----------------------------------------------------*/

	// check for scroll direction and speed
	var getScroll = function() {
		var pageXOffset = window.pageXOffset !== undefined ? window.pageXOffset : (document.compatMode == "CSS1Compat" ? window.document.documentElement.scrollLeft : window.document.body.scrollLeft),
			pageYOffset = window.pageYOffset !== undefined ? window.pageYOffset : (document.compatMode == "CSS1Compat" ? window.document.documentElement.scrollTop : window.document.body.scrollTop);

		if (typeof getScroll.x == 'undefined') {
			getScroll.x = pageXOffset;
			getScroll.y = pageYOffset;
		}
		if (typeof getScroll.distanceX == 'undefined') {
			getScroll.distanceX = pageXOffset;
			getScroll.distanceY = pageYOffset;
		} else {
			getScroll.distanceX = pageXOffset - getScroll.x;
			getScroll.distanceY = pageYOffset - getScroll.y;
		}

		var diffX = getScroll.x - pageXOffset,
			diffY = getScroll.y - pageYOffset;

		getScroll.direction = diffX < 0 ? 'right' :
			diffX > 0 ? 'left' :
			diffY <= 0 ? 'down' :
			diffY > 0 ? 'up' : 'first';

		getScroll.x = pageXOffset;
		getScroll.y = pageYOffset;
	};
	$window.on('scroll', getScroll);


	// little original style plugin
	$.fn.style = function(style) {
		if (!style) return null;

		var $this = $(this),
			value; 

		// clone element
		var $clone = $this.clone().css('display','none');
		// randomize the name of cloned radio buttons, otherwise selections get screwed
		$clone.find('input:radio').attr('name','copy-' + Math.floor((Math.random()*100)+1));
		// insert clone to DOM
		$this.after($clone);

		var getStyle = function(el, style){
			var val;
			if (el.currentStyle) {
				// replace dashes with capitalized letter, e.g. padding-left to paddingLeft
				val = el.currentStyle[style.replace(/-\w/g, function(s){return s.toUpperCase().replace('-','')})];
			} else if (window.getComputedStyle) {
				val = document.defaultView.getComputedStyle(el,null).getPropertyValue(style);
			}
			// check for margin:auto
			val = (/margin/g.test(style)) ? ((parseInt(val) === $this[0].offsetLeft) ? val : 'auto') : val;
			return val;
		};

		if (typeof style == 'string') {
			value = getStyle($clone[0], style);
		} else {
			value = {};
			$.each(style, function(i, s){
				value[s] = getStyle($clone[0], s);
			});
		}

		// destroy clone
		$clone.remove();

		return value || null;
	};


	/*----------------------------------------------------
						jQuery plugin
	----------------------------------------------------*/

	$.fn.extend({

		hcSticky: function(options) {

			// check if selected element exist in DOM, user doesn't have to worry about that
			if (this.length == 0) return this;

			this.pluginOptions('hcSticky', {
				top: 0,
				bottom: 0,
				bottomEnd: 0,
				innerTop: 0,
				innerSticker: null,
				className: 'sticky',
				wrapperClassName: 'wrapper-sticky',
				stickTo: null,
				responsive: true,
				followScroll: true,
				offResolutions: null,
				onStart: $.noop,
				onStop: $.noop,
				on: true,
				fn: null // used only by the plugin
			}, options || {}, {
				reinit: function(){
					// just call itself again
					$(this).hcSticky();
				},
				stop: function(){
					$(this).pluginOptions('hcSticky', {on: false}).each(function(){
						var $this = $(this),
							options = $this.pluginOptions('hcSticky'),
							$wrapper = $this.parent('.' + options.wrapperClassName);

						// set current position
						var top = $this.offset().top - $wrapper.offset().top;
						$this.css({
							position: 'absolute',
							top: top,
							bottom: 'auto',
							left: 'auto',
							right: 'auto'
						}).removeClass(options.className);
					});
				},
				off: function(){
					$(this).pluginOptions('hcSticky', {on: false}).each(function(){
						var $this = $(this),
							options = $this.pluginOptions('hcSticky'),
							$wrapper = $this.parent('.' + options.wrapperClassName);

						// clear position
						$this.css({
							position: 'relative',
							top: 'auto',
							bottom: 'auto',
							left: 'auto',
							right: 'auto'
						}).removeClass(options.className);

						$wrapper.css('height', 'auto');
					});
				},
				on: function(){
					$(this).each(function(){
						$(this).pluginOptions('hcSticky', {
							on: true,
							remember: {
								offsetTop: $window.scrollTop()
							}
						}).hcSticky();
					});
				},
				destroy: function(){
					var $this = $(this),
						options = $this.pluginOptions('hcSticky'),
						$wrapper = $this.parent('.' + options.wrapperClassName);

					// reset position to original
					$this.removeData('hcStickyInit').css({
						position: $wrapper.css('position'),
						top: $wrapper.css('top'),
						bottom: $wrapper.css('bottom'),
						left: $wrapper.css('left'),
						right: $wrapper.css('right')
					}).removeClass(options.className);

					// remove events
					$window.off('resize', options.fn.resize).off('scroll', options.fn.scroll);

					// destroy wrapper
					$this.unwrap();
				}
			});

			// on/off settings
			if (options && typeof options.on != 'undefined') {
				if (options.on) {
					this.hcSticky('on');
				} else {
					this.hcSticky('off');
				}
			}

			// stop on commands
			if (typeof options == 'string') return this;

			// do our thing
			return this.each(function(){

				var $this = $(this),
					options = $this.pluginOptions('hcSticky');

				var $wrapper = (function(){ // wrapper exists
						var $this_wrapper = $this.parent('.' + options.wrapperClassName);
						if ($this_wrapper.length > 0) {
							$this_wrapper.css({
								'height': $this.outerHeight(true),
								'width': (function(){
									// check if wrapper already has width in %
									var width = $this_wrapper.style('width');
									if (width.indexOf('%') >= 0 || width == 'auto') {
										if ($this.css('box-sizing') == 'border-box' || $this.css('-moz-box-sizing') == 'border-box') {
											$this.css('width', $this_wrapper.width());
										} else {
											$this.css('width', $this_wrapper.width() - parseInt($this.css('padding-left') - parseInt($this.css('padding-right'))));
										}
										return width;
									} else {
										return $this.outerWidth(true);
									}
								})()
							});
							return $this_wrapper;
						} else {
							return false;
						}
					})() || (function(){ // wrapper doesn't exist

						var this_css = $this.style(['width', 'margin-left', 'left', 'right', 'top', 'bottom', 'float', 'display']);
						var display = $this.css('display');

						var $this_wrapper = $('<div>', {
							'class': options.wrapperClassName
						}).css({
							'display': display,
							'height': $this.outerHeight(true),
							'width': (function(){
								if (this_css['width'].indexOf('%') >= 0 || (this_css['width'] == 'auto' && display != 'inline-block' && display != 'inline')) { // check if element has width in %
									$this.css('width', parseFloat($this.css('width')));
									return this_css['width'];
								} else if (this_css['width'] == 'auto' && (display == 'inline-block' || display == 'inline')) {
									return $this.width();
								} else {
									// check if margin is set to 'auto'
									return (this_css['margin-left'] == 'auto') ? $this.outerWidth() : $this.outerWidth(true);
								}
							})(),
							'margin': (this_css['margin-left']) ? 'auto' : null,
							'position': (function(){
								var position = $this.css('position');
								return position == 'static' ? 'relative' : position;
							})(),
							'float': this_css['float'] || null,
							'left': this_css['left'],
							'right': this_css['right'],
							'top': this_css['top'],
							'bottom': this_css['bottom'],
							'vertical-align': 'top'
						});

						$this.wrap($this_wrapper);

						// ie7 inline-block fix
						if (ie === 7) {
							if ($('head').find('style#hcsticky-iefix').length === 0) {
								$('<style id="hcsticky-iefix">.' + options.wrapperClassName + ' {zoom: 1;}</style>').appendTo('head');
							}
						}

						// return appended element
						return $this.parent();
					})();


				// check if we should go further
				if ($this.data('hcStickyInit')) return;
				// leave our mark
				$this.data('hcStickyInit', true);


				// check if referring element is document
				var stickTo_document = options.stickTo && (options.stickTo == 'document' || (options.stickTo.nodeType && options.stickTo.nodeType == 9) || (typeof options.stickTo == 'object' && options.stickTo instanceof (typeof HTMLDocument != 'undefined' ? HTMLDocument : Document))) ? true : false;

				// select container;)
				var $container = options.stickTo
					? stickTo_document
						? $document
						: typeof options.stickTo == 'string'
							? $(options.stickTo)
							: options.stickTo
					: $wrapper.parent();

				// clear sticky styles
				$this.css({
					top: 'auto',
					bottom: 'auto',
					left: 'auto',
					right: 'auto'
				});

				// attach event on entire page load, maybe some images inside element has been loading, so chek height again
				$document.ready(function(){
					if ($this.outerHeight(true) > $container.height()) {
						$wrapper.css('height', $this.outerHeight(true));
						$this.hcSticky('reinit');
					}
				});

				// functions for attachiung and detaching sticky
				var _setFixed = function(args) {
						// check if already floating
						if ($this.hasClass(options.className)) return;

						// apply styles
						args = args || {};
						$this.css({
							position: 'fixed',
							top: args.top || 0,
							left: args.left || $wrapper.offset().left
						}).addClass(options.className);

						// start event
						options.onStart.apply($this[0]);
						// add class to wrpaeer
						$wrapper.addClass('sticky-active');
					},
					_reset = function(args) {
						args = args || {};
						args.position = args.position || 'absolute';
						args.top = args.top || 0;
						args.left = args.left || 0;

						// check if we should apply css
						if ($this.css('position') != 'fixed' && parseInt($this.css('top')) == args.top) return;

						// apply styles
						$this.css({
							position: args.position,
							top: args.top,
							left: args.left
						}).removeClass(options.className);

						// stop event
						options.onStop.apply($this[0]);
						// remove class from wrpaeer
						$wrapper.removeClass('sticky-active');
					};

				// sticky scroll function
				var onScroll = function(init) {

					// check if we need to run sticky
					if (!options.on || $this.outerHeight(true) >= $container.height()) return;

					var top_spacing = (options.innerSticker) ? $(options.innerSticker).position().top : ((options.innerTop) ? options.innerTop : 0),
						wrapper_inner_top = $wrapper.offset().top,
						bottom_limit = $container.height() - options.bottomEnd + (stickTo_document ? 0 : wrapper_inner_top),
						top_limit = $wrapper.offset().top - options.top + top_spacing,
						this_height = $this.outerHeight(true) + options.bottom,
						window_height = $window.height(),
						offset_top = $window.scrollTop(),
						this_document_top = $this.offset().top,
						this_window_top = this_document_top - offset_top,
						bottom_distance;


					// if sticky has been restarted with on/off wait for it to reach top or bottom
					if (typeof options.remember != 'undefined' && options.remember) {

						var position_top = this_document_top - options.top - top_spacing;

						if (this_height - top_spacing > window_height && options.followScroll) { // element bigger than window with follow scroll on

							if (position_top < offset_top && offset_top + window_height <= position_top + $this.height()) {
								// element is in the middle of the screen, let our primary calculations do the work
								options.remember = false;
							}

						} else { // element smaller than window or follow scroll turned off

							if (options.remember.offsetTop > position_top) {
								// slide up
								if (offset_top <= position_top) {
									_setFixed({
										top: options.top - top_spacing
									});
									options.remember = false;
								}
							} else {
								// slide down
								if (offset_top >= position_top) {
									_setFixed({
										top: options.top - top_spacing
									});
									options.remember = false;
								}
							}

						}

						return;
					}


					if (offset_top > top_limit) {

						// http://geek-and-poke.com/geekandpoke/2012/7/27/simply-explained.html

						if (bottom_limit + options.bottom - (options.followScroll && window_height < this_height ? 0 : options.top) <= offset_top + this_height - top_spacing - ((this_height - top_spacing > window_height - (top_limit - top_spacing) && options.followScroll) ? (((bottom_distance = this_height - window_height - top_spacing) > 0) ? bottom_distance : 0) : 0)) {
							// bottom reached end
							_reset({
								top: bottom_limit - this_height + options.bottom - wrapper_inner_top
							});
						} else if (this_height - top_spacing > window_height && options.followScroll) {

							if (this_window_top + this_height <= window_height) { // element bigger than window with follow scroll on

								if (getScroll.direction == 'down') {
									// scroll down
									_setFixed({
										top: window_height - this_height
									});
								} else {
									// scroll up
									if (this_window_top < 0 && $this.css('position') == 'fixed') {
										_reset({
											top: this_document_top - (top_limit + options.top - top_spacing) - getScroll.distanceY
										});
									}
								}

							} else { // element smaller than window or follow scroll turned off

								if (getScroll.direction == 'up' && this_document_top >= offset_top + options.top - top_spacing) {
									// scroll up
									_setFixed({
										top: options.top - top_spacing
									});
								} else if (getScroll.direction == 'down' && this_document_top + this_height > window_height && $this.css('position') == 'fixed') {
									// scroll down
									_reset({
										top: this_document_top - (top_limit + options.top - top_spacing) - getScroll.distanceY
									});
								}

							}
						} else {
							// starting (top) fixed position
							_setFixed({
								top: options.top - top_spacing
							});
						}
					} else {
						// reset
						_reset();
					}

				};


				// store resize data in case responsive is on
				var resize_timeout = false,
					$resize_clone = false;

				var onResize = function() {

					// check if sticky is attached to scroll event
					attachScroll();

					// check for off resolutions
					checkResolutions();

					// check if we need to run sticky
					if (!options.on) return;

					var setLeft = function(){
						// set new left position
						if ($this.css('position') == 'fixed') {
							$this.css('left', $wrapper.offset().left);
						} else {
							$this.css('left', 0);
						}
					};

					// check for width change (css media queries)
					if (options.responsive) {
						// clone element and make it invisible
						if (!$resize_clone) {
							$resize_clone = $this.clone().attr('style', '').css({
								visibility: 'hidden',
								height: 0,
								overflow: 'hidden',
								paddingTop: 0,
								paddingBottom: 0,
								marginTop: 0,
								marginBottom: 0
							});
							$wrapper.after($resize_clone);
						}

						var wrapper_width = $wrapper.style('width');
						var resize_clone_width = $resize_clone.style('width');

						if (resize_clone_width == 'auto' && wrapper_width != 'auto') {
							resize_clone_width = parseInt($this.css('width'));
						}

						// recalculate wrpaeer width
						if (resize_clone_width != wrapper_width) {
							$wrapper.width(resize_clone_width);
						}

						// clear previous timeout
						if (resize_timeout) {
							clearTimeout(resize_timeout);
						}
						// timedout destroing of cloned elements so we don't clone it again and again while resizing the window
						resize_timeout = setTimeout(function() {
							// clear timeout id
							resize_timeout = false;
							// destroy cloned element
							$resize_clone.remove();
							$resize_clone = false;
						}, 250);
					}

					// set new left position
					setLeft();

					// recalculate inner element width (maybe original width was in %)
					if ($this.outerWidth(true) != $wrapper.width()) {
						var this_w = ($this.css('box-sizing') == 'border-box' || $this.css('-moz-box-sizing') == 'border-box')
							? $wrapper.width()
							: $wrapper.width() - parseInt($this.css('padding-left')) - parseInt($this.css('padding-right'));
						// subtract margins
						this_w = this_w - parseInt($this.css('margin-left')) - parseInt($this.css('margin-right'));
						// set new width
						$this.css('width', this_w);
					}
				};


				// remember scroll and resize callbacks so we can attach and detach them
				$this.pluginOptions('hcSticky', {fn: {
					scroll: onScroll,
					resize: onResize
				}});


				// check for off resolutions
				var checkResolutions = function(){
					if (options.offResolutions) {
						// convert to array
						if (!$.isArray(options.offResolutions)) {
							options.offResolutions = [options.offResolutions];
						}

						var isOn = true;

						$.each(options.offResolutions, function(i, rez){
							if (rez < 0) {
								// below
								if ($window.width() < rez * -1) {
									isOn = false;
									$this.hcSticky('off');
								}
							} else {
								// abowe
								if ($window.width() > rez) {
									isOn = false;
									$this.hcSticky('off');
								}
							}
						});

						// turn on again
						if (isOn && !options.on) {
							$this.hcSticky('on');
						}
					}
				};
				checkResolutions();


				// attach resize function to event
				$window.on('resize', onResize);


				// attaching scroll function to event
				var attachScroll = function(){
					// check if element height is bigger than the content
					if ($this.outerHeight(true) < $container.height()) {
						var isAttached = false;
						if ($._data(window, 'events').scroll != undefined) {
							$.each($._data(window, 'events').scroll, function(i, f){
								if (f.handler == options.fn.scroll) {
									isAttached = true;
								}
							});
						}
						if (!isAttached) {
							// run it once to disable glitching
							options.fn.scroll(true);
							// attach function to scroll event only once
							$window.on('scroll', options.fn.scroll);
						}
					}
				};
				attachScroll();

			});
		}
	});

})(jQuery, this);



// jQuery HC-PluginOptions
// =============
// Version: 1.0
// Copyright: Some Web Media
// Author: Some Web Guy
// Author URL: http://twitter.com/some_web_guy
// Website: http://someweblog.com/
// License: Released under the MIT License www.opensource.org/licenses/mit-license.php

(function($, undefined) {
	"use strict";

	$.fn.extend({

		pluginOptions: function(pluginName, defaultOptions, userOptions, commands) {

			// create object to store data
			if (!this.data(pluginName)) this.data(pluginName, {});

			// return options
			if (pluginName && typeof defaultOptions == 'undefined') return this.data(pluginName).options;

			// update
			userOptions = userOptions || (defaultOptions || {});

			if (typeof userOptions == 'object' || userOptions === undefined) {

				// options
				return this.each(function(){
					var $this = $(this);

					if (!$this.data(pluginName).options) {
						// init our options and attach to element
						$this.data(pluginName, {options: $.extend(defaultOptions, userOptions || {})});
						// attach commands if any
						if (commands) {
							$this.data(pluginName).commands = commands;
						}
					} else {
						// update existing options
						$this.data(pluginName, $.extend($this.data(pluginName), {options: $.extend($this.data(pluginName).options, userOptions || {})}));
					}
				});

			} else if (typeof userOptions == 'string') {

				return this.each(function(){
				  if (typeof $(this).data(pluginName).commands != 'undefined'
				      && typeof $(this).data(pluginName).commands[userOptions] != 'undefined') {
				    
					  $(this).data(pluginName).commands[userOptions].call(this);
				  }
				});

			} else {

				return this;

			}

		}

	});

})(jQuery);;


/*
 * Simple script for building the theme
 * bottom header image using canvas element.
 * 
 * @dependencies 
 *  jQuery jcanvas asset
 *  VTCore Zeus
 *  
 * @author jason.xie@victheme.com
 */
jQuery(document).ready(function($) {
"use strict";

  var el = $('#header-underline');

   $.fn.buildHeaderLine = function() {

     // Resize the canvas dimension based on viewport width
     this
       .attr('width', $('#page').width() + 'px')
       .attr('height', this.height()+ 'px')
       .width($('#page').width())
       .height(this.height());
     
     
     // Build the line configuration object
     var Line = {
           element: this,
           width: this.width(),
           height: this.height(),
           left: 0,
           offset: (this.width() / 100),
           parentBackground: this.parent().css('backgroundColor'),
           layers: this.data('layers'),
           tipOffset: (typeof $('#logo').position() != 'undefined') ? $('#logo').position().left + 60 : 60
         };
     
     // Reset first in case this was called from resizing events
     Line.element.clearCanvas({
       x: 0, 
       y: 0, 
       width: Line.width,
       height: Line.height
     }).removeLayers();
     

     // Setup the layer masks first
     Line.element.drawPath({
       layer: true,
       mask: true,
       p1: {
         type: 'line',
         x1: 0, y1: Line.height / 2,
         x2: Line.tipOffset, y2: Line.height / 2,
         x3: Line.tipOffset + 5, y3: 0,
         x4: Line.tipOffset + 200, y4: 0,
         x5: Line.tipOffset + 205, y5: Line.height / 2,
         x6: Line.width, y6: Line.height / 2,
         x7: Line.width, y7: Line.height,
         x8: 0, y8: Line.height,
         x9: 0, y9: Line.height / 2
       }
       
     });
     
     
     // Build the layer content
     $.each(Line.layers, function(id, value) {

       var LayerID = 'layer-' + id;
       
       // Draw the rectangle layer
       Line.element.drawRect({
         layer: true,
         name: LayerID,
         fillStyle: value.color,
         x: 0,
         y: 0,
         width: Line.width,
         height: Line.height,
         fromCenter: false,
       })
       
       // Move the layer to the right and animate
       .animateLayer(LayerID, {
         x: Line.left,
       }, 1000);
       
       // Update next layer left position
       Line.left += value.offset * Line.offset;
     });
     
     // Apply the masks to all layers
     Line.element.restoreCanvas({
       layer: true
     }); 
   } 
   
   // Initial build
   el.buildHeaderLine();
   
   
   $(window)
     .on('resize', function() {
       setTimeout(function() {
         el.buildHeaderLine();
       }, 100);
       
     });
 
});;

/*
 * Simple script for building the theme Maps in the footer area
 * This is not a script for generic usage. Don't attempt to use 
 * this outside the theme, it will not work properly.
 * 
 * @author jason.xie@victheme.com
 */
jQuery(document).ready(function($) {
"use strict";  

  // Build the object
  var FooterMaps = {
    el: $('#footermaps'),
    parent: $('#footer'),
  }
  
  if (FooterMaps.el.length == 0) {
    return;
  }
  
  // Build Config
  // @todo add more options!
  FooterMaps.options = {
    mapkey: FooterMaps.el.data('mapkey') || false,
    address: FooterMaps.el.data('address') || false,
    apikeys: FooterMaps.el.data('apikeys') || false,
    center: FooterMaps.el.data('center') || [51.505, -0.09],
    zoom: FooterMaps.el.data('zoom') || 15,
    dragging: FooterMaps.el.data('dragging') || false,
    zoomControl: FooterMaps.el.data('zoomcontrol') || false,
    attributionControl: FooterMaps.el.data('attributioncontrol') || false,
    doubleClickZoom: FooterMaps.el.data('doubleclickzoom') || false,
    touchZoom: FooterMaps.el.data('touchzoom') || false,
    scrollWheelZoom: FooterMaps.el.data('scrollwheelzoom') || false, 
    boxZoom: FooterMaps.el.data('boxzoom') || false,
    grayscale: FooterMaps.el.data('grayscale') || false,
    masking: FooterMaps.el.data('masking') || false,
    maskColor: FooterMaps.el.data('maskcolor') || false
  }
  
  // Dynamic resize the maps
  FooterMaps.el.height(FooterMaps.parent.outerHeight());
  FooterMaps.el.width(FooterMaps.parent.outerWidth());
  
  // Calculate the center offsets
  FooterMaps.el.centerOffset = {
      x: 0, // FooterMaps.el.width() / 6 ,
      y: FooterMaps.el.height() / 2 - 50
  }

  FooterMaps.markerOptions = {
      zIndexOffset: 5,
  };
  
  if (FooterMaps.el.data('icon')) {
    FooterMaps.icon = L.icon({
      iconUrl: FooterMaps.el.data('icon')
    });
    
    FooterMaps.markerOptions.icon = FooterMaps.icon;
  }
  
  // Initialize Maps
  FooterMaps.map = L.map(FooterMaps.el.attr('id'), FooterMaps.options);
  
  // Try mapbox
  if (FooterMaps.options.mapKey) {
    FooterMaps.options.mapTiles = 'http://{s}.tiles.mapbox.com/v3/' + FooterMaps.options.mapKey + '/{z}/{x}/{y}.png';
  }
  
  // Fallback to OSM
  else {
    FooterMaps.options.mapTiles = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
  }
    
  // Get tile image
  L.tileLayer.Mask(FooterMaps.options.mapTiles, FooterMaps.options).addTo(FooterMaps.map);

  // Use the default centering as the marker coordinates
  if (FooterMaps.options.center) {
    FooterMaps.coordinates = FooterMaps.options.center;
    
    // Place marker on maps and pan the maps
    if (FooterMaps.icon) {
      FooterMaps.marker = L.marker(FooterMaps.coordinates, FooterMaps.markerOptions).addTo(FooterMaps.map);
      FooterMaps.map.panBy([-FooterMaps.el.centerOffset.x, FooterMaps.el.centerOffset.y]);
    }
  }
  
  // Geocode the supplied address and Reposition Map if user supplied address
  if (FooterMaps.options.address) {
    
    // Try to use mapbox first
    if (FooterMaps.options.mapkey) {
      $.ajax({
        type: 'GET',
        url : 'http://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/' + FooterMaps.options.address.replace(' ', '+') + '.json?access_token=' + FooterMaps.options.apikeys
      })
      .done(function(data){
          if (data.features.length > 0 && data.features[0].center.length > 0) {
            FooterMaps.geocoded = data;
            FooterMaps.coordinates = [FooterMaps.geocoded.features[0].center[1], FooterMaps.geocoded.features[0].center[0]];
            FooterMaps.map.setView(FooterMaps.coordinates, FooterMaps.options.zoom);
            
            // Refresh the icon
            if (FooterMaps.icon) {
              FooterMaps.marker = L.marker(FooterMaps.coordinates, FooterMaps.markerOptions).addTo(FooterMaps.map);
              FooterMaps.map.panBy([-FooterMaps.el.centerOffset.x, FooterMaps.el.centerOffset.y]);
            }
          }
      });
    }
    
    // Fallback to osm
    else {
      $.ajax({   
        type: 'GET',
        url : 'http://nominatim.openstreetmap.org/search?q=' + FooterMaps.options.address.replace(' ', '+') + '&format=json',
      })
      .done(function(data){ 
        if (data[0]) {
          FooterMaps.geocoded = data[0];
          FooterMaps.coordinates = [FooterMaps.geocoded.lat, FooterMaps.geocoded.lon];
          FooterMaps.map.setView(FooterMaps.coordinates, FooterMaps.options.zoom);
          
          // Refresh the icon
          if (FooterMaps.icon) {
            FooterMaps.marker = L.marker(FooterMaps.coordinates, FooterMaps.markerOptions).addTo(FooterMaps.map);
            FooterMaps.map.panBy([-FooterMaps.el.centerOffset.x, FooterMaps.el.centerOffset.y]);
          }
        }
      });    
    }
  }
  
  
  $(window)
    .on('resize', function() {
      // Dynamic resize the maps
      FooterMaps.el.height(FooterMaps.parent.outerHeight());
      FooterMaps.el.width(FooterMaps.parent.outerWidth());
      
      setTimeout(function() {
        
        // Calculate the center offsets
        FooterMaps.el.centerOffset = {
            x: 0, // FooterMaps.el.width() / 6,
            y: FooterMaps.el.height() / 2 - 50
        }
        
        if (FooterMaps.coordinates) { 
          FooterMaps.map.setView(FooterMaps.coordinates, FooterMaps.options.zoom);
          FooterMaps.map.panBy([-FooterMaps.el.centerOffset.x, FooterMaps.el.centerOffset.y]);
        }
      }, 300);
      
    });

});;

/*
 * Simple script for indenting element
 * 
 * @experimental state!
 * @known bug, somehow offset is returning the same position for all element?
 * @author jason.xie@victheme.com
 */
jQuery(document).ready(function($) {
"use strict";  
  
  $.fn.VTCoreInlineIndent = function() {
    var _el = {
        float  : $('.float-target'),
        indent : $('.indent-target > *'),
    };
  
    _el.floatData = {
        height    : _el.float.height(),
        marginTop : _el.indent.eq(0).position().top + _el.indent.eq(0).height()
    };
    
    _el.floatData.endPosition = _el.float.offset().top + _el.floatData.height + _el.floatData.marginTop;
    
    _el.actions = {
        indentElement : function() {
          
          _el.indent.filter(':gt(0)').on('each', function(key, val) {
            var self = $(this);
            
            if (_el.indent.eq(key).offset().top < _el.floatData.endPosition) {
              self.addClass('col-sm-10 nopadding');
            }
            else {
              self.addClass('clearboth');
            }
          });
          _el.float.css('marginTop', _el.floatData.marginTop);
        },
        resetElement : function() {
          _el.indent.removeClass('col-sm-10 nopadding clearboth');
          _el.float.css('marginTop', '');
        }
    }
    
    return _el.actions;
  }
   
  if ($('.float-target').length != 0 && $('.indent-target > *').length != 0) { 
    $(window)
      .on('load.indentel pageready.indentel resize_end.indentel', function() {
        setTimeout(function() {
          $.fn.VTCoreInlineIndent().indentElement();
        }, 100);
      });
  }

});;


/*
 * 
 * The main theme controller javascript.
 * This file will load and configure other
 * javascript settings related to the theme.
 * 
 * @author jason.xie@victheme.com
 */
jQuery(document).ready(function ($) {

  "use strict";

  var VT = {
    $page: $('#page')
  };

  /**
   * Window events
   */
  $(window)
    .on('load', function() {

      // Piggy backing to pageready event
      if (!$('#page.animsition').length) {
        $(window).trigger('pageready');
      }

    })

    /**
     * Page Ready will be called after animsition
     * or if animsition not enabled after window load
     * event.
     */
    .on('pageready', function() {

      // Booting EqualheightRow Element
      if (VT.$page.find('.equalheightRow').length) {
        VT.equalheight = {
          init: function() {
            this.$el = VT.$page.find('.equalheightRow');
            this.reposition();
          },
          reposition: function() {
            this.$el.resetEqualHeight(800);
          }
        }

        VT.equalheight.init();
      }

      // Booting Headline background
      if (VT.$page.find('.headline-background').length) {
        VT.headlineBackground = {
          init: function() {
            this.$el = VT.$page.find('.headline-background');
            return this;
          },
          reposition: function() {
            this.$el.height($(window).height());
          }
        }

        VT.headlineBackground.init().reposition();
      }

      // Booting scroll animation
      if (VT.$page.find('.scroll-animated').length) {
        VT.scrollAnimated = {
          init: function() {
            this.$el = VT.$page.find('.scroll-animated');
            return this;
          },
          reposition: function() {
            this.$el.filter(':not(.scroll-animated-completed)').filter(':in-viewport').on('each', function () {
              $(this)
                .addClass($(this).data('animation'))
                .removeClass('scroll-animated')
                .addClass('scroll-animated-completed');
            });

            return this;
          },
          reset: function() {
            this.$el.filter('.scroll-animated-completed').on('each', function () {
              $(this)
                .removeClass($(this).data('animation'))
                .addClass('scroll-animated')
                .removeClass('scroll-animated-completed');
            });
            return this;
          }
        }

        VT.scrollAnimated.init();
      }

      // Booting data aspect
      if (VT.$page.find('[data-aspect="true"]').length) {
        VT.$page.find('[data-aspect="true"]').VTCoreAspectRatio();
      }

      // Booting sticky header
      if (VT.$page.find('#header.with-sticky').length) {

        VT.sticky = {
          init: function () {
            this.$sticky = VT.$page.find('#header.with-sticky');

            this.$sticky.hcSticky({
              top: -1,
              responsive: false,
              onStart: function () {
                VT.sticky.reposition();
              },
              onStop: function () {
                VT.sticky.reposition();
              },
              offResolutions: -640
            });
            return this;
          },
          reposition: function () {

            this.$sticky
              .parent()
              .height(this.$sticky.height());

            var that = this;

            this.$sticky
              .find('.vertical-target')
              .each(function () {
                that.$sticky
                  .vertCentCentering($(this), $(this).data('vertical-offset'));
              });

            VT.slick && VT.slick.reposition();
            return this;
          },
          off: function () {
            this.$sticky.hcSticky('off');
            return this;
          },
          on: function () {
            this.$sticky.hcSticky('on');
          },
          reinit: function() {
            this.$sticky.hcSticky('reinit');
            return this;
          }
        }

        VT.sticky.init();
      }

      // Booting slick nav menu
      if (VT.$page.find('#header.with-slicknav').length) {

        VT.slick = {
          init: function () {
            this.$slick = VT.$page.find('#header.with-slicknav .slicknav');
            this.$slick
              .slicknav({
                label: '',
                prependTo: '',
                appendTo: '#header',
                open: function () {
                  VT.sticky && VT.sticky.off();
                },
                close: function () {
                  ($(window).width() > 640) && VT.sticky && VT.sticky.on();
                }
              });

            return this;
          },
          format: function () {
            VT.$page.find('.slicknav_nav')
              .find('.dropdown, .dropdown-menu, .dropdown-toggle')
              .removeClass('dropdown dropdown-menu dropdown-toggle');

            VT.$page.find('.slicknav_nav')
              .find('.caret').remove();

            this.reposition();

            return this;
          },
          reposition: function () {
            this.topPos = (VT.$page.find('.mainheader').outerHeight() - VT.$page.find('.slicknav_btn').outerHeight()) / 2;
            VT.$page.find('.slicknav_btn').css('top', this.topPos);
            return this;
          },
          ubermenu: function() {
            VT.$page.find('#megaUber').addClass('slicknav');
            return this;
          }
        }

        VT.slick.ubermenu().init().format().reposition();

      }

      // Booting comment toggle
      if (VT.$page.find('#post-comment-toggle').length) {
        VT.$page.find('#post-comment-toggle')
          .on("click", function () {

            if (VT.$page.find('#post-comment-form').hasClass('slideup')) {

              VT.$page.find('#cancel-comment-reply-link').trigger('click');
              VT.$page.find('#post-comment-form')
                .addClass('slidedown')
                .removeClass('slideup')
                .slideDown();

              $(this).data('open', $(this).html());
              $(this).html($(this).data('hide'));
            }

            else {
              VT.$page.find('#post-comment-form').addClass('slideup').removeClass('slidedown').slideUp();
              $(this).html($(this).data('open'));
            }

          });
      }

      // Booting comment reply
      if (VT.$page.find('.comment-reply-link').length) {
        VT.$page.find('.comment-reply-link')
          .on("click", function () {
            if (VT.$page.find('#post-comment-form').hasClass('slidedown')) {
              VT.$page.find('#post-comment-toggle').trigger('click');
            }
          });
      }

      // Booting floating pager
      if (VT.$page.find('.news-with-stickem').length) {
        VT.newsStick = {
          init: function() {

            this.$news = VT.$page.find('.news-with-stickem');
            this.$news
              .stickem({
                item: 'a.page-numbers'
              });

            return this;
          },
          reposition: function() {
            this.$news
              .find('a.prev')
              .css('left', this.$news.offset().left - this.$news.find('a.prev').width() / 2);

            this.$news
              .find('a.next')
              .css('left', this.$news.offset().left + this.$news.width() - this.$news.find('a.next').width() / 2);

            return this;
          }
        }

        VT.newsStick.init().reposition();
      }

      // Booting footer bar
      if (VT.$page.find('#footer-bar').length) {
        VT.footerBar = {
          init: function() {
            this.$footerBar = VT.$page.find('#footer-bar');
            this.$container = VT.$page.find('.container-fluid.dynamic-sidebar');
            return this;
          },
          reposition: function() {
            this.$footerBar
              .css({
                marginLeft: this.$container.offset().left - VT.$page.offset().left + 10
              });
            return this;
          }
        }

        VT.footerBar.init().reposition();
      }

      // Booting news masonry
      if (VT.$page.find('.news-teasers-masonry').length) {
        VT.newsMasonry = {
          init: function() {
            this.$news = VT.$page.find('.news-teasers-masonry');
            this.$news
              .isotope({
                layoutMode: 'packery',
                itemSelector: '.isotope-items',
                stamp : '.stamp'
              });

            return this;
          },
          reposition: function() {
            this.$news.isotope('layout');
            return $this;
          }
        }

        VT.newsMasonry.init();

      }

      // Booting limit height nice scroll
      // if (VT.$page.find('.limitHeight').length) {
      // 
      //   VT.limitHeight = {
      //     init: function() {
      //       this.$el = VT.$page.find('.limitHeight');
      //       this.$el.each(function() {
      //         $(this).niceScroll($(this).data());
      //       });
      //       return this;
      //     },
      //     reposition: function() {
      //       this.$el.getNiceScroll().resize();
      // 
      // 
      //       this.$el.trigger('focus');
      //       return this;
      //     }
      //   }
      // 
      //   VT.limitHeight.init();
      // }

      // Booting stickem
      // if (VT.$page.find('.stickem-element').length) {
      //   VT.stickEm = {
      //     init: function() {
      //       this.$el = VT.$page.find('.stickem-element');
      //       this.$content = this.$el.find('.stickem');
      //       this.initialize();
      //       return this;
      //     },
      //     initialize: function() {
      //       this.formatContainer();
      //       this.offset = VT.sticky && VT.sticky.$sticky.height() || 0;
      //       this.$content.each(function () {
      //         $(this).width($(this).parent().width() - 1);
      //       });
      // 
      //       this.$el.stickem({
      //         start: this.offset,
      //         end: 0
      //       });
      //       return this;
      //     },
      //     reposition: function() {
      //       this.$el.destroy();
      //       this.initialize();
      //       return this;
      //     },
      //     formatContainer: function() {
      //       if (this.$content.parent() != this.$el
      //           && $(window).width() > 480) {
      //         this.$content.parent().height(this.$el.innerHeight());
      //       }
      //       return this;
      //     },
      //     resetContainer: function() {
      //       this.$content.parent().css('height', '');
      //       return this;
      //     }
      // 
      //   }
      // 
      //   VT.stickEm.init();
      // }
    })


    .on('scroll layoutComplete', function() {

      VT.scrollAnimated && VT.scrollAnimated.reposition();

    })

    .on('resize', function() {

      // Initialize equalheight
      VT.equalheight && VT.equalheight.reposition();

      // Reinit Sticky header
      VT.sticky && VT.sticky.reinit();

      // Resize headline background
      VT.headlineBackground && VT.headlineBackground.reposition();

      // Reposition floating pager
      VT.newsStick && VT.newsStick.reposition();

      // Reposition Footer Bar
      VT.footerBar && VT.footerBar.reposition();

      // Reposition Slick
      VT.slick && VT.slick.reposition();

      // Reposition nicescroll limit height only
      VT.limitHeight && VT.limitHeight.reposition();

      // Reposition default stickem element
      VT.stickEm && VT.stickEm.reposition();

      // Fix counter up kill vc animation
      if (VT.$page.find('.gabby_animate_when_almost_visible:not(.gabby_start_animation)').length
        && typeof jQuery.fn.waypoint3 !== 'undefined') {
        VT.$page.find('.gabby_animate_when_almost_visible:not(.gabby_start_animation)').waypoint3(function () {
          $(this).addClass('gabby_start_animation');
        }, { offset:'85%' });
      }
      
    })

    /**
     * Note this is invoked before equalheight
     * starts but after the resize complete
     * via resize_end event
     */
    .on('equalheight-reset', function() {
      VT.stickEm && VT.stickEm.resetContainer();
    })

    /**
     * Note that this will be invoked AFTER
     * resize complete via resize_end events
     */
    .on('equalheight-complete', function() {

      // Do final repair for potentially broken
      // element when resizing occurs
      VT.stickEm && VT.stickEm.reposition();

      VT.limitHeight && VT.limitHeight.reposition();
    });



  $(document)
    .on('animsitionPageIn', function() {

      // Piggy backing to page ready event
      $(window).trigger('pageready');
    })
    // Fixing portfolio
    .on('layoutComplete', function() {
      VT.scrollAnimated && VT.scrollAnimated.init() && VT.scrollAnimated.reposition();
    })

    .on('ajaxComplete', function() {
      // Refresh content
      VT.scrollAnimated && VT.scrollAnimated.init() && VT.scrollAnimated.reposition();
    });

 });