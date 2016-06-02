document.documentElement.className += ' js_active ';
document.documentElement.className += 'ontouchstart' in document.documentElement ? ' ga_mobile ' : ' ga_desktop ';

(function () {
	"use strict";
	var prefix = [
		'-webkit-',
		'-o-',
		'-moz-',
		'-ms-',
		""
	];
	for ( var i in
		prefix ) {
		if ( prefix[ i ] + 'transform' in document.documentElement.style ) {
			document.documentElement.className += " ga_transform ";
		}
	}
})();

/*
 On document ready jQuery will fire set of functions.
 If you want to override function behavior then copy it to your theme js file
 with the same name.
 */


var ga_js = function () {
	"use strict";
	ga_twitterBehaviour();
	ga_toggleBehaviour();
	ga_toggleBehaviourOld(); // todo remove on next release
	ga_tabsBehaviour();
	ga_accordionBehaviour();
	ga_teaserGrid();
	ga_carouselBehaviour();
	ga_slidersBehaviour();
	ga_prettyPhoto();
	ga_googleplus();
	ga_pinterest();
	ga_progress_bar();
	ga_plugin_flexslider();
	ga_google_fonts();
	ga_gridBehaviour();
	ga_rowBehaviour();
	jQuery( document ).trigger( 'ga_js' );
	window.setTimeout( ga_waypoints, 1500 );
};
jQuery( document ).ready( function ( $ ) {
	"use strict";
	window.ga_js();
} );

if ( typeof window[ 'ga_plugin_flexslider' ] !== 'function' ) {
	window.ga_plugin_flexslider = function ( $parent ) {
		"use strict";
		var $slider = $parent ? $parent.find( '.gabby_flexslider' ) : jQuery( '.gabby_flexslider' );
		$slider.on('each', function () {
			var this_element = jQuery( this );
			var sliderSpeed = 800,
				sliderTimeout = parseInt( this_element.attr( 'data-interval' ) ) * 1000,
				sliderFx = this_element.attr( 'data-flex_fx' ),
				slideshow = true;
			if ( sliderTimeout == 0 ) {
				slideshow = false;
			}

			this_element.is( ':visible' ) && this_element.flexslider( {
				animation: sliderFx,
				slideshow: slideshow,
				slideshowSpeed: sliderTimeout,
				sliderSpeed: sliderSpeed,
				smoothHeight: true
			} );
		} );
	};
}

/* Twitter
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_twitterBehaviour' ] !== 'function' ) {
	window.ga_twitterBehaviour = function () {
		"use strict";
		jQuery( '.gabby_twitter_widget .tweets' ).on('each', function ( index ) {
			var this_element = jQuery( this ),
				tw_name = this_element.attr( 'data-tw_name' ),
				tw_count = this_element.attr( 'data-tw_count' );

			this_element.tweet( {
				username: tw_name,
				join_text: "auto",
				avatar_size: 0,
				count: tw_count,
				template: "{avatar}{join}{text}{time}",
				auto_join_text_default: "",
				auto_join_text_ed: "",
				auto_join_text_ing: "",
				auto_join_text_reply: "",
				auto_join_text_url: "",
				loading_text: '<span class="loading_tweets">loading tweets...</span>'
			} );
		} );
	};
}

/* Google plus
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_googleplus' ] !== 'function' ) {
	window.ga_googleplus = function () {
		"use strict";
		if ( jQuery( '.gabby_googleplus' ).length > 0 ) {
			(function () {
				var po = document.createElement( 'script' );
				po.type = 'text/javascript';
				po.async = true;
				po.src = 'https://apis.google.com/js/plusone.js';
				var s = document.getElementsByTagName( 'script' )[ 0 ];
				s.parentNode.insertBefore( po, s );
			})();
		}
	}
}

/* Pinterest
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_pinterest' ] !== 'function' ) {
	window.ga_pinterest = function () {
		"use strict";
		if ( jQuery( '.gabby_pinterest' ).length > 0 ) {
			(function () {
				var po = document.createElement( 'script' );
				po.type = 'text/javascript';
				po.async = true;
				po.src = 'http://assets.pinterest.com/js/pinit.js';
				var s = document.getElementsByTagName( 'script' )[ 0 ];
				s.parentNode.insertBefore( po, s );
				//<script type="text/javascript" src="//assets.pinterest.com/js/pinit.js"></script>
			})();
		}
	}
}

/* Progress bar
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_progress_bar' ] !== 'function' ) {
	window.ga_progress_bar = function () {
		"use strict";
		if ( typeof jQuery.fn.waypoint !== 'undefined' ) {

			jQuery( '.ga_progress_bar' ).waypoint( function () {
				jQuery( this ).find( '.ga_single_bar' ).on('each', function ( index ) {
					var $this = jQuery( this ),
						bar = $this.find( '.ga_bar' ),
						val = bar.data( 'percentage-value' );

					setTimeout( function () {
						bar.css( { "width": val + '%' } );
					}, index * 200 );
				} );
			}, { offset: '85%' } );
		}
	}
}

/* Waypoints magic
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_waypoints' ] !== 'function' ) {
	window.ga_waypoints = function () {
		"use strict";
		if ( typeof jQuery.fn.waypoint !== 'undefined' ) {
			jQuery( '.gabby_animate_when_almost_visible:not(.gabby_start_animation)' ).waypoint( function () {
				jQuery( this ).addClass( 'gabby_start_animation' );
			}, { offset: '85%' } );
		}
	}
}

/* Toggle
 * @deprecated since 4.4
 ---------------------------------------------------------- */
// @todo remove on next release
if ( typeof window[ 'ga_toggleBehaviourOld' ] !== 'function' ) {
	/**
	 * @deprecated will be removed in next release
	 */
	window.ga_toggleBehaviourOld = function () {
		"use strict";
		jQuery( ".gabby_toggle" ).unbind( 'click' ).on('click', function ( e ) {
			if ( jQuery( this ).next().is( ':animated' ) ) {
				return false;
			}
			if ( jQuery( this ).hasClass( 'gabby_toggle_title_active' ) ) {
				jQuery( this ).removeClass( 'gabby_toggle_title_active' ).next().slideUp( 500 );
			} else {
				jQuery( this ).addClass( 'gabby_toggle_title_active' ).next().slideDown( 500 );
			}
		} );
		jQuery( '.gabby_toggle_content' ).on('each', function ( index ) {
			if ( jQuery( this ).next().is( 'h4.gabby_toggle' ) == false ) {
				jQuery( '<div class="last_toggle_el_margin"></div>' ).insertAfter( this );
			}
		} );
	}
}

/* Toggle/FAQ
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_toggleBehaviour' ] !== 'function' ) {
	window.ga_toggleBehaviour = function ( $el ) {
		"use strict";
		var event = function ( e ) {
			e && e.preventDefault && e.preventDefault();
			var title = jQuery( this );
			var element = title.closest( '.ga_toggle' );
			var content = element.find( '.ga_toggle_content' );
			if ( element.hasClass( 'ga_toggle_active' ) ) {
				content.slideUp( {
					duration: 300,
					complete: function () {
						element.removeClass( 'ga_toggle_active' );
					}
				} );
			} else {
				content.slideDown( {
					duration: 300,
					complete: function () {
						element.addClass( 'ga_toggle_active' );
					}
				} );
			}
		};
		if ( $el ) {
			if ( $el.hasClass( 'ga_toggle_title' ) ) {
				$el.unbind( 'click' ).on("click", event );
			} else {
				$el.find( ".ga_toggle_title" ).unbind( 'click' ).on("click", event );
			}
		} else {
			jQuery( ".ga_toggle_title" ).unbind( 'click' ).on( 'click', event );
		}
	}
}

/* Tabs + Tours
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_tabsBehaviour' ] !== 'function' ) {
	window.ga_tabsBehaviour = function ( $tab ) {
		"use strict";
		if ( jQuery.ui ) {
			/* jQuery(function ($) {
			 $(document.body).off('click.preview', 'a')
			 }); */ // this causes wp-customizer bug
			var $call = $tab || jQuery( '.gabby_tabs, .gabby_tour' ),
				ver = jQuery.ui && jQuery.ui.version ? jQuery.ui.version.split( '.' ) : '1.10',
				old_version = parseInt( ver[ 0 ] ) == 1 && parseInt( ver[ 1 ] ) < 9;
			// if($call.hasClass('ui-widget')) $call.tabs('destroy');
			$call.on('each', function ( index ) {
				var $tabs,
					interval = jQuery( this ).attr( "data-interval" ),
					tabs_array = [];
				//
				$tabs = jQuery( this ).find( '.gabby_tour_tabs_wrapper' ).tabs( {
					show: function ( event, ui ) {
						gabby_prepare_tab_content( event, ui );
					},
					beforeActivate: function ( event, ui ) {
						ui.newPanel.index() !== 1 && ui.newPanel.find( '.ga_pie_chart:not(.ga_ready)' );
					},
					activate: function ( event, ui ) {
						gabby_prepare_tab_content( event, ui );
					}
				} );
				if ( interval && interval > 0 ) {
					try {
						$tabs.tabs( 'rotate', interval * 1000 );
					} catch ( e ) {
						// nothing.
						window.console && window.console.log && console.log( e );
					}
				}

				jQuery( this ).find( '.gabby_tab' ).on('each', function () {
					tabs_array.push( this.id );
				} );

				jQuery( this ).find( '.gabby_tabs_nav li' ).on('click', function ( e ) {
					e.preventDefault();
					/*if (jQuery.inArray(jQuery(this).attr('href'), tabs_array)) {
					 if (old_version) {
					 $tabs.tabs("select", jQuery(this).attr('href'));
					 } else {
					 $tabs.tabs("option", "active", jQuery(jQuery(this).attr('href')).index() - 1);
					 }
					 return false;
					 }*/
					if ( old_version ) {
						$tabs.tabs( "select", jQuery( 'a', this ).attr( 'href' ) );
					} else {
						$tabs.tabs( "option", "active", jQuery( this ).index() );
					}
					return false;
				} );

				jQuery( this ).find( '.gabby_prev_slide a, .gabby_next_slide a' ).on('click', function ( e ) {
					e.preventDefault();
					if ( old_version ) {
						var index = $tabs.tabs( 'option', 'selected' );
						if ( jQuery( this ).parent().hasClass( 'gabby_next_slide' ) ) {
							index ++;
						}
						else {
							index --;
						}
						if ( index < 0 ) {
							index = $tabs.tabs( "length" ) - 1;
						}
						else if ( index >= $tabs.tabs( "length" ) ) {
							index = 0;
						}
						$tabs.tabs( "select", index );
					} else {
						var index = $tabs.tabs( "option", "active" ),
							length = $tabs.find( '.gabby_tab' ).length;
						
						if ( jQuery( this ).parent().hasClass( 'gabby_next_slide' ) ) {
							index = (index + 1) >= length ? 0 : index + 1;
						} else {
							index = index - 1 < 0 ? length - 1 : index - 1;
						}

						$tabs.tabs( "option", "active", index );
					}

				} );

			} );
		}
	}
}
;

/* Tabs + Tours
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_accordionBehaviour' ] !== 'function' ) {
	window.ga_accordionBehaviour = function () {
		"use strict";
		jQuery( '.gabby_accordion' ).on('each', function ( index ) {
			var $this = jQuery( this );
			var $tabs,
				interval = $this.attr( "data-interval" ),
				active_tab = ! isNaN( jQuery( this ).data( 'active-tab' ) ) && parseInt( $this.data( 'active-tab' ) ) > 0 ? parseInt( $this.data( 'active-tab' ) ) - 1 : false,
				collapsible = active_tab === false || $this.data( 'collapsible' ) === 'yes';
			//
			$tabs = $this.find( '.gabby_accordion_wrapper' ).accordion( {
				header: "> div > h3",
				autoHeight: false,
				heightStyle: "content",
				active: active_tab,
				collapsible: collapsible,
				navigation: true,

				activate: ga_accordionActivate,
				change: function ( event, ui ) {
					if ( jQuery.fn.isotope != undefined ) {
						ui.newContent.find( '.isotope' ).isotope( "layout" );
					}
					ga_carouselBehaviour( ui.newPanel );
				}
			} );
			if ( true === $this.data( 'vcDisableKeydown' ) ) {
				$tabs.data( 'uiAccordion' )._keydown = function () {
				};
			}
			//.tabs().tabs('rotate', interval*1000, true);
		} );
	}
}

/* Teaser grid: isotope
 ---------------------------------------------------------- */
if ( typeof window[ 'ga_teaserGrid' ] !== 'function' ) {
	window.ga_teaserGrid = function () {
		"use strict";
		var layout_modes = {
			fitrows: 'fitRows',
			masonry: 'masonry'
		};
		jQuery( '.gabby_grid .teaser_grid_container:not(.gabby_carousel), .gabby_filtered_grid .teaser_grid_container:not(.gabby_carousel)' ).on('each', function () {
			var $container = jQuery( this );
			var $thumbs = $container.find( '.gabby_thumbnails' );
			var layout_mode = $thumbs.attr( 'data-layout-mode' );
			$thumbs.isotope( {
				// options
				itemSelector: '.isotope-item',
				layoutMode: (layout_modes[ layout_mode ] == undefined ? 'fitRows' : layout_modes[ layout_mode ])
			} );
			$container.find( '.categories_filter a' ).data( 'isotope', $thumbs ).on('click', function ( e ) {
				e.preventDefault();
				var $thumbs = jQuery( this ).data( 'isotope' );
				jQuery( this ).parent().parent().find( '.active' ).removeClass( 'active' );
				jQuery( this ).parent().addClass( 'active' );
				$thumbs.isotope( { filter: jQuery( this ).attr( 'data-filter' ) } );
			} );
			jQuery( window ).on('bind', 'load resize', function () {
				$thumbs.isotope( "layout" );
			} );
		} );

		/*
		 var isotope = jQuery('.gabby_grid ul.thumbnails');
		 if ( isotope.length > 0 ) {
		 isotope.isotope({
		 // options
		 itemSelector : '.isotope-item',
		 layoutMode : 'fitRows'
		 });
		 jQuery(window).on('load', function() {
		 isotope.isotope("layout");
		 });
		 }
		 */
	}
}

if ( typeof window[ 'ga_carouselBehaviour' ] !== 'function' ) {
	window.ga_carouselBehaviour = function ( $parent ) {
		"use strict";
		var $carousel = $parent ? $parent.find( ".gabby_carousel" ) : jQuery( ".gabby_carousel" );
		$carousel.on('each', function () {
			var $this = jQuery( this );
			if ( $this.data( 'carousel_enabled' ) !== true && $this.is( ':visible' ) ) {
				$this.data( 'carousel_enabled', true );
				var carousel_width = jQuery( this ).width(),
					visible_count = getColumnsCount( jQuery( this ) ),
					carousel_speed = 500;
				if ( jQuery( this ).hasClass( 'columns_count_1' ) ) {
					carousel_speed = 900;
				}
				/* Get margin-left value from the css grid and apply it to the carousele li items (margin-right), before carousele initialization */
				var carousele_li = jQuery( this ).find( '.gabby_thumbnails-fluid li' );
				carousele_li.css( { "margin-right": carousele_li.css( "margin-left" ), "margin-left": 0 } );

				jQuery( this ).find( '.wrapper:eq(0)' ).jCarouselLite( {
					btnNext: jQuery( this ).find( '.next' ),
					btnPrev: jQuery( this ).find( '.prev' ),
					visible: visible_count,
					speed: carousel_speed
				} )
					.width( '100%' );//carousel_width

				var fluid_ul = jQuery( this ).find( 'ul.gabby_thumbnails-fluid' );
				fluid_ul.width( fluid_ul.width() + 300 );

				jQuery( window ).on('resize', function () {
					var before_resize = screen_size;
					screen_size = getSizeName();
					if ( before_resize != screen_size ) {
						window.setTimeout( 'location.reload()', 20 );
					}
				} );
			}

		} );
	}
}

if ( typeof window[ 'ga_slidersBehaviour' ] !== 'function' ) {
	window.ga_slidersBehaviour = function () {
		"use strict";
		//var sliders_count = 0;
		jQuery( '.gabby_gallery_slides' ).on('each', function ( index ) {
			var this_element = jQuery( this );
			var ss_count = 0, $imagesGrid;

			/*if ( this_element.hasClass('gabby_slider_fading') ) {
			 var sliderSpeed = 500, sliderTimeout = this_element.attr('data-interval')*1000, slider_fx = 'fade';
			 var current_ss;

			 function slideshowOnBefore(currSlideElement, nextSlideElement, options) {
			 jQuery(nextSlideElement).css({"position" : "absolute" });
			 jQuery(nextSlideElement).find("div.description").animate({"opacity": 0}, 0);
			 }

			 function slideshowOnAfter(currSlideElement, nextSlideElement, options) {
			 jQuery(nextSlideElement).find("div.description").animate({"opacity": 1}, 2000);

			 jQuery(nextSlideElement).css({"position" : "static" });
			 var new_h = jQuery(nextSlideElement).find('img').height();
			 if ( jQuery.isNumeric(new_h) ) {
			 //this_element.animate({ "height" : new_h }, sliderSpeed );
			 }
			 }

			 this_element.find('ul')
			 .before('<div class="ss_nav ss_nav_'+ss_count+'"></div><div class="gabby_fading_nav"><a id="next_'+ss_count+'" href="#next"></a> <a id="prev_'+ss_count+'" href="#prev"></a></div>')
			 .cycle({
			 fx: slider_fx, // choose your transition type, ex: fade, scrollUp, shuffle, etc...
			 pause: 1,
			 speed: sliderSpeed,
			 timeout: sliderTimeout,
			 delay: -ss_count * 1000,
			 before: slideshowOnBefore,
			 after:slideshowOnAfter,
			 pager:  '.ss_nav_'+ss_count
			 });
			 //.find('.description').width(jQuery(this).width() - 20);
			 ss_count++;
			 }
			 else*/
			if ( this_element.hasClass( 'gabby_slider_nivo' ) ) {
				var sliderSpeed = 800,
					sliderTimeout = this_element.attr( 'data-interval' ) * 1000;

				if ( sliderTimeout == 0 ) {
					sliderTimeout = 9999999999;
				}

				this_element.find( '.nivoSlider' ).nivoSlider( {
					effect: 'boxRainGrow,boxRain,boxRainReverse,boxRainGrowReverse', // Specify sets like: 'fold,fade,sliceDown'
					slices: 15, // For slice animations
					boxCols: 8, // For box animations
					boxRows: 4, // For box animations
					animSpeed: sliderSpeed, // Slide transition speed
					pauseTime: sliderTimeout, // How long each slide will show
					startSlide: 0, // Set starting Slide (0 index)
					directionNav: true, // Next & Prev navigation
					directionNavHide: true, // Only show on hover
					controlNav: true, // 1,2,3... navigation
					keyboardNav: false, // Use left & right arrows
					pauseOnHover: true, // Stop animation while hovering
					manualAdvance: false, // Force manual transitions
					prevText: 'Prev', // Prev directionNav text
					nextText: 'Next' // Next directionNav text
				} );
			}
			else if ( this_element.hasClass( 'gabby_image_grid' ) ) {
				if ( jQuery.fn.imagesLoaded ) {
					$imagesGrid = this_element.find( '.gabby_image_grid_ul' ).on('imagesLoaded', function () {
						$imagesGrid.isotope( {
							// options
							itemSelector: '.isotope-item',
							layoutMode: 'fitRows'
						} );
					} );
				} else {
					this_element.find( '.gabby_image_grid_ul' ).isotope( {
						// options
						itemSelector: '.isotope-item',
						layoutMode: 'fitRows'
					} );
				}

			}
		} );
	}
}
if ( typeof window[ 'ga_prettyPhoto' ] !== 'function' ) {
	window.ga_prettyPhoto = function () {
		"use strict";
		try {
			// just in case. maybe prettyphoto isnt loaded on this site
			if ( jQuery && jQuery.fn && jQuery.fn.prettyPhoto ) {
				jQuery( 'a.prettyphoto, .gallery-icon a[href*=".jpg"]' ).prettyPhoto( {
					animationSpeed: 'normal', /* fast/slow/normal */
					padding: 15, /* padding for each side of the picture */
					opacity: 0.7, /* Value betwee 0 and 1 */
					showTitle: true, /* true/false */
					allowresize: true, /* true/false */
					counter_separator_label: '/', /* The separator for the gallery counter 1 "of" 2 */
					//theme: 'light_square', /* light_rounded / dark_rounded / light_square / dark_square */
					hideflash: false, /* Hides all the flash object on a page, set to TRUE if flash appears over prettyPhoto */
					deeplinking: false, /* Allow prettyPhoto to update the url to enable deeplinking. */
					modal: false, /* If set to true, only the close button will close the window */
					callback: function () {
						var url = location.href;
						var hashtag = (url.indexOf( '#!prettyPhoto' )) ? true : false;
						if ( hashtag ) {
							location.hash = "!";
						}
					} /* Called when prettyPhoto is closed */,
					social_tools: ''
				} );
			}
		} catch ( err ) {
			window.console && window.console.log && console.log( err );
		}
	}
}

if ( typeof window[ 'ga_google_fonts' ] !== 'function' ) {
	window.ga_google_fonts = function () {
		"use strict";
		return false; // @todo check this for what this is needed
	}
}
window.vcParallaxSkroll = false;
if ( typeof window[ 'ga_rowBehaviour' ] !== 'function' ) {
	window.ga_rowBehaviour = function () {
		"use strict";
		var $ = window.jQuery;
		var local_function = function () {
			var $elements = $( '[data-vc-full-width="true"]' );
			$.each( $elements, function ( key, item ) {
				var $el = $( this );
				var $el_full = $el.next( '.ga_row-full-width' );
				var el_margin_left = parseInt( $el.css( 'margin-left' ), 10 );
				var el_margin_right = parseInt( $el.css( 'margin-right' ), 10 );
				var offset = 0 - $el_full.offset().left - el_margin_left;
				var width = $( window ).width();
				$el.css( {
					'position': 'relative',
					'left': offset,
					'box-sizing': 'border-box',
					'width': $( window ).width()
				} );
				if ( ! $el.data( 'vcStretchContent' ) ) {
					var padding = (- 1 * offset);
					if ( padding < 0 ) {
						padding = 0;
					}
					var paddingRight = width - padding - $el_full.width() + el_margin_left + el_margin_right;
					if ( paddingRight < 0 ) {
						paddingRight = 0;
					}
					$el.css( { 'padding-left': padding + 'px', 'padding-right': paddingRight + 'px' } );
				}
				$el.attr( "data-vc-full-width-init", "true" );
			} );
		};
		/**
		 * @todo refactor as plugin.
		 * @returns {*}
		 */
		var parallaxRow = function () {
			var vcSkrollrOptions,
				callSkrollInit = false;
			if ( vcParallaxSkroll ) {
				vcParallaxSkroll.destroy();
			}
			$( '.ga_parallax-inner' ).remove();
			$( '[data-5p-top-bottom]' ).removeAttr( 'data-5p-top-bottom data-30p-top-bottom' );
			$( '[data-vc-parallax]' ).on('each', function () {
				var skrollrSpeed,
					skrollrSize,
					skrollrStart,
					skrollrEnd,
					$parallaxElement,
					parallaxImage;
				callSkrollInit = true; // Enable skrollinit;
				if ( $( this ).data( 'vcParallaxOFade' ) == 'on' ) {
					$( this ).children().attr( 'data-5p-top-bottom', 'opacity:0;' ).attr( 'data-30p-top-bottom',
						'opacity:1;' );
				}

				skrollrSize = $( this ).data( 'vcParallax' ) * 100;
				$parallaxElement = $( '<div />' ).addClass( 'ga_parallax-inner' ).appendTo( $( this ) );
				$parallaxElement.height( skrollrSize + '%' );

				parallaxImage = $( this ).data( 'vcParallaxImage' );

				if ( parallaxImage !== undefined ) {
					$parallaxElement.css( 'background-image', 'url(' + parallaxImage + ')' );
				}

				skrollrSpeed = skrollrSize - 100;
				skrollrStart = - skrollrSpeed;
				skrollrEnd = 0;

				$parallaxElement.attr( 'data-bottom-top', 'top: ' + skrollrStart + '%;' ).attr( 'data-top-bottom',
					'top: ' + skrollrEnd + '%;' );
			} );

			if ( callSkrollInit && window.skrollr ) {
				vcSkrollrOptions = {
					forceHeight: false,
					smoothScrolling: false,
					mobileCheck: function () {
						return false;
					}
				};
				vcParallaxSkroll = skrollr.init( vcSkrollrOptions );
				return vcParallaxSkroll;
			}
			return false;
		};
		$( window ).unbind( 'resize.vcRowBehaviour' ).bind( 'resize.vcRowBehaviour', local_function );
		local_function();
		parallaxRow();
	}
}

if ( typeof window[ 'ga_gridBehaviour' ] !== 'function' ) {
	window.ga_gridBehaviour = function () {
		"use strict";
		jQuery.fn.vcGrid && jQuery( '[data-vc-grid]' ).vcGrid();
	}
}
/* Helper
 ---------------------------------------------------------- */
if ( typeof window[ 'getColumnsCount' ] !== 'function' ) {
	window.getColumnsCount = function ( el ) {
		"use strict";
		var find = false,
			i = 1;

		while ( find == false ) {
			if ( el.hasClass( 'columns_count_' + i ) ) {
				find = true;
				return i;
			}
			i ++;
		}
	}
}

var screen_size = getSizeName();
function getSizeName() {
	"use strict";
	var screen_size = '',
		screen_w = jQuery( window ).width();

	if ( screen_w > 1170 ) {
		screen_size = "desktop_wide";
	}
	else if ( screen_w > 960 && screen_w < 1169 ) {
		screen_size = "desktop";
	}
	else if ( screen_w > 768 && screen_w < 959 ) {
		screen_size = "tablet";
	}
	else if ( screen_w > 300 && screen_w < 767 ) {
		screen_size = "mobile";
	}
	else if ( screen_w < 300 ) {
		screen_size = "mobile_portrait";
	}
	return screen_size;
}

function loadScript( url, $obj, callback ) {
    "use strict";
	var script = document.createElement( "script" )
	script.type = "text/javascript";

	if ( script.readyState ) {  //IE
		script.onreadystatechange = function () {
			if ( script.readyState == "loaded" ||
				script.readyState == "complete" ) {
				script.onreadystatechange = null;
				callback();
			}
		};
	} else {  //Others
		/*
		 script.onload = function(){

		 callback();
		 };
		 */
	}

	script.src = url;
	$obj.get( 0 ).appendChild( script );
}

if ( typeof window[ 'gabby_prepare_tab_content' ] !== 'function' ) {
	/**
	 * Prepare html to correctly display inside tab container
	 *
	 * @param event - ui tab event 'show'
	 * @param ui - jquery ui tabs object
	 */
	window.gabby_prepare_tab_content = function ( event, ui ) {
		"use strict";
		var panel = ui.panel || ui.newPanel,
			$pie_charts = panel.find( '.ga_pie_chart:not(.ga_ready)' ),
			$carousel = panel.find( '[data-ride="ga_carousel"]' ),
			$ui_panel, $google_maps;
		ga_carouselBehaviour();
		ga_plugin_flexslider( panel );
		if ( ui.newPanel.find( '.ga_masonry_media_grid, .ga_masonry_grid' ).length ) {
			ui.newPanel.find( '.ga_masonry_media_grid, .ga_masonry_grid' ).on('each', function () {
				var grid = jQuery( this ).data( 'vcGrid' );
				grid && grid.gridBuilder && grid.gridBuilder.setMasonry && grid.gridBuilder.setMasonry();
			} );
		}
		if ( panel.find( '.ga_masonry_media_grid, .ga_masonry_grid' ).length ) {
			panel.find( '.ga_masonry_media_grid, .ga_masonry_grid' ).on('each', function () {
				var grid = jQuery( this ).data( 'vcGrid' );
				grid && grid.gridBuilder && grid.gridBuilder.setMasonry && grid.gridBuilder.setMasonry();
			} );
		}
		$pie_charts.length && jQuery.fn.vcChat && $pie_charts.vcChat();
		$carousel.length && jQuery.fn.carousel && $carousel.carousel( 'resizeAction' );
		$ui_panel = panel.find( '.isotope, .gabby_image_grid_ul' ); // why var name '$ui_panel'?
		$google_maps = panel.find( '.gabby_gmaps_widget' );
		if ( $ui_panel.length > 0 ) {
			$ui_panel.isotope( "layout" );
		}
		if ( $google_maps.length && ! $google_maps.is( '.map_ready' ) ) {
			var $frame = $google_maps.find( 'iframe' );
			$frame.attr( 'src', $frame.attr( 'src' ) );
			$google_maps.addClass( 'map_ready' );
		}
		if ( panel.parents( '.isotope' ).length ) {
			panel.parents( '.isotope' ).on('each', function () {
				jQuery( this ).isotope( "layout" );
			} );
		}
	}
}

var ga_accordionActivate = function ( event, ui ) {
	"use strict";
	if ( ui.newPanel.length && ui.newHeader.length ) {
		var $pie_charts = ui.newPanel.find( '.ga_pie_chart:not(.ga_ready)' ),
			$carousel = ui.newPanel.find( '[data-ride="ga_carousel"]' );
		if ( jQuery.fn.isotope != undefined ) {
			ui.newPanel.find( '.isotope, .gabby_image_grid_ul' ).isotope( "layout" );
		}
		if ( ui.newPanel.find( '.ga_masonry_media_grid, .ga_masonry_grid' ).length ) {
			ui.newPanel.find( '.ga_masonry_media_grid, .ga_masonry_grid' ).on('each', function () {
				var grid = jQuery( this ).data( 'vcGrid' );
				grid && grid.gridBuilder && grid.gridBuilder.setMasonry && grid.gridBuilder.setMasonry();
			} );
		}
		//jQuery('html, body').animate({scrollTop: ui.newHeader.offset().top - 100}, 1000); // #1370 enhancement, #1762 issue.
		ga_carouselBehaviour( ui.newPanel );
		ga_plugin_flexslider( ui.newPanel );
		$pie_charts.length && jQuery.fn.vcChat && $pie_charts.vcChat();
		$carousel.length && jQuery.fn.carousel && $carousel.carousel( 'resizeAction' );
		if ( ui.newPanel.parents( '.isotope' ).length ) {
			ui.newPanel.parents( '.isotope' ).on('each', function () {
				jQuery( this ).isotope( "layout" );
			} );
		}
	}
};;

/*
 * Simple script for building canvas point
 * arc connector between 2 points
 * 
 * markup :
 * 
 * container must have position relative rule
 * and css class : point-connector
 * source point must have css class : startpoint
 * target point must have css class : endpoint
 * 
 * 
 * @todo : Break free from css classes and make this
 *         as fully working jQuery plugin
 *         
 * @author jason.xie@victheme.com
 */
(function($) {
"use strict";
  var CenterPoints = function(element, canvas, active) {
    this.$el = element;
    this.$active = active;
    this.$canvas = canvas;
    return this;
  }

  CenterPoints.prototype = {

    /** Not working yet! **/
    fitBoundaryX: function(value, offset) {
      if (value < offset) {
        return offset;
      }

      if (value > Points.wrappoint.width - offset) {
        return Points.wrappoint.width - offset;
      }

      return value;
    },

    /** Not working yet **/
    fitBoundaryY: function(value, offset) {
      if (value < offset) {
        return offset;
      }

      if (value > Points.wrappoint.height - offset) {
        return Points.wrappoint.height - offset;
      }

      return value;
    },

    /**
     * Building canvas element
     */
    setCanvas: function() {
      this.ctx = this.$canvas.get(0).getContext('2d');
      return this;
    },


    setCircles: function() {
      this.circles = {
        startradius: this.$active.data('circle-start') || this.$el.data('circle-start') || 3,
        endradius: this.$active.data('circle-end') ||  this.$el.data('circle-end') || 4,
        opaqueradius: this.$active.data('circle-opaque') || this.$el.data('circle-opaque') || 10,
        opacity: this.$active.data('circle-opacity') || this.$el.data('circle-opacity') || 0.6
      }

      return this;
    },

    setLine: function() {
      this.line = {
        color: this.$active.data('line-color') || this.$el.data('line-color') || '#158FBF',
        dot: this.$active.data('dot-color') || this.$el.data('dot-color') || '#158FBF',
        width: this.$active.data('line-width') || this.$el.data('line-width') || 1,
        type: this.$active.data('line-type') || this.$el.data('line-type') || 'round'
      }

      return this;
    },

    setPosition: function() {
      this.position = {
        start: this.$active.data('position-start') || 'center',
        end: this.$active.data('position-end') || 'top'
      }

      return this;
    },

    setControlPoint: function() {
      var offsetX = this.$active.data('offset-control-x') || 0,
          offsetY = this.$active.data('offset-control-y') || 100;

      this.control = {
        x: this.start.x + offsetX,
        y: this.start.y + offsetY
      }

      return this;
    },

    setStartPoint: function() {

      // Search for the centering element
      this.$center = this.$el.find('.centerline-image');

      var offsetX = this.$active.data('offset-start-x') || 0,
        offsetY = this.$active.data('offset-start-y') || 0,
        radius = (this.$active.data('circle-opaque') || this.circles.opaqueradius || 0) / 2;

      switch (this.position.start) {
        case 'top' :
          this.start = {
            x: this.$center.offset().left - this.$el.offset().left + this.$center.outerWidth(false) / 2 + offsetX + radius,
            y: this.$center.offset().top - this.$el.offset().top + offsetY + radius
          }
          break;

        case 'left':
          this.start = {
            x: this.$center.offset().left - this.$el.offset().left + offsetX + radius,
            y: this.$center.offset().top - this.$el.offset().top + this.$center.outerHeight(false) / 2 + offsetY + radius
          }

          break;

        case 'bottom' :
          this.start = {
            x: this.$center.offset().left - this.$el.offset().left + this.$center.outerWidth(false) / 2 + offsetX + radius,
            y: this.$center.offset().top - this.$el.offset().top + this.$center.outerHeight(false) + offsetY + radius
          }
          break;
        case 'right' :
          this.start = {
            x: this.$center.offset().left - this.$el.offset().left + this.$center.outerWidth(false) + offsetX + radius,
            y: this.$center.offset().top - this.$el.offset().top + this.$center.outerHeight(false) / 2 + offsetY + radius
          }

          break;
        case 'center' :
          this.start = {
            x: this.$center.offset().left - this.$el.offset().left + this.$center.outerWidth(false) / 2 + offsetX + radius,
            y: this.$center.offset().top - this.$el.offset().top + this.$center.outerHeight(false) / 2 + offsetY + radius
          }

          break;
      }

      return this;

    },

    setEndPoint: function() {

      var offsetX = this.$active.data('offset-end-x') || 0,
        offsetY = this.$active.data('offset-end-y') || 0,
        radius = (this.$active.data('circle-end') || this.circles.endradius || 0) / 2;

      switch (this.position.end) {
        case 'top' :
          this.end = {
            x: this.$active.offset().left - this.$canvas.offset().left + (this.$active.outerWidth(false) / 2) + offsetX + radius,
            y: this.$active.offset().top - this.$canvas.offset().top + offsetY + radius
          }

          break;

        case 'left' :
          this.end = {
            x: this.$active.offset().left - this.$el.offset().left + offsetX + radius,
            y: this.$active.offset().top - this.$el.offset().top + (this.$active.outerHeight(false) / 2) + offsetY + radius
          }
          break;

        case 'right' :
          this.end = {
            x: this.$active.offset().left - this.$el.offset().left  + this.$active.outerWidth(false) + offsetX + radius,
            y: this.$active.offset().top - this.$el.offset().top + (this.$active.outerHeight(false) / 2) + offsetY + radius
          }
          break;

        case 'bottom' :
          this.end = {
            x: this.$active.offset().left - this.$el.offset().left + (this.$active.outerWidth(false) / 2) + offsetX + radius,
            y: this.$active.offset().top - this.$el.offset().top + this.$active.outerHeight(false) + offsetY + radius
          }
          break;
      }

      return this;

    },

    drawLine: function(start, end, control, line) {

      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
      this.ctx.lineWidth = line.width;
      this.ctx.lineCap = line.height;
      this.ctx.miterLimit = line.width;
      this.ctx.strokeStyle = line.color;
      this.ctx.stroke();

      return this;
    },

    drawCircle: function(position, radius, color, opacity) {

      this.ctx.beginPath();
      if (opacity != false) {
        this.ctx.globalAlpha = opacity;
      }

      this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      if (opacity != false) {
        this.ctx.globalAlpha = 1;
      }

      return this;
    },

    clearCanvas: function() {
      this.ctx.clearRect(0, 0, this.$canvas.width(), this.$canvas.height());
      return this;
    },

    setObject: function() {
      this
        .setCanvas()
        .setCircles()
        .setLine()
        .setPosition();

      return this;
    },
    
    drawObject: function() {
      this
        .setStartPoint()
        .setEndPoint()
        .setControlPoint()
        .drawLine(this.start, this.end, this.control, this.line)
        .drawCircle(this.start, this.circles.opaqueradius, this.line.dot, this.circles.opacity)
        .drawCircle(this.start, this.circles.startradius, this.line.dot, false)
        .drawCircle(this.end, this.circles.endradius, this.line.dot, false);

      return this;
    }

  };


  /**
   * Initializing the center line connect
   * @returns {*}
   */
  $.fn.centerLineConnect = function() {

    return this.each(function() {

      var Container = $(this),
          Canvas = $('<canvas class="centerline-canvas" />');

      if (Container.find('.centerline-image').length == 0
          || Container.find('.centerline-content').length == 0) {
        return true;
      }
      
      Container.css('position', 'relative').prepend(Canvas);

      Canvas
        .attr('width', Container.width())
        .attr('height', Container.height())
        .css({
          position: 'absolute',
          zIndex: 1,
          left:  0,
          top: 0
        });


      Container.find('.centerline-content').css('z-index', 10).each( function(delta, element) {
        var Pointer = new CenterPoints(Container, Canvas, $(this), delta);

        Pointer.setObject().drawObject();

        // Store Pointer
        $(this).attr('data-pointer-object', true);
        $(this).data('pointer-object', Pointer);
      });
    }); 
  };


  if ($('#page').length && $('#page').hasClass('animsition')) {
    $(window)
      .on('animsitionPageIn', function() {

        $('.centerline-canvas').remove();
        $('.centerline-connector').centerLineConnect();

        $(window)
          .on('resize sortupdate', function() {
            $('.centerline-canvas').remove();
            $('.centerline-connector').centerLineConnect();
          });

      });

  } else {
	
    $(window)
      .on('load resize sortupdate', function () {
        $('.centerline-canvas').remove();
        $('.centerline-connector').centerLineConnect();
      });
  }

})(window.jQuery);;

/* ========================================================================
 * VC: carousel.js v0.4.5
 * Fork Bootstrap: carousel.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#carousel
 * ========================================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */


;(function($) { "use strict";

  // CAROUSEL CLASS DEFINITION
  // =========================

  var Carousel = function (element, options) {
    this.$element    = $(element)
    this.$indicators = this.$element.find('.ga_carousel-indicators')
    this.options     = options
    this.paused      =
    this.sliding     =
    this.interval    =
    this.$active     =
    this.$items      = null
    this.options.pause == 'hover' && this.$element
      .on('mouseenter', $.proxy(this.pause, this))
      .on('mouseleave', $.proxy(this.cycle, this))
    this._build() // new
  }

  Carousel.DEFAULTS = {
    mode: 'horizontal'
  , partial: false
  , interval: 5000
  , pause: 'hover'
  , wrap: false
  , autoHeight: false
  , perView: 1
  }
  Carousel.prototype.cycle =  function (e) {
    e || (this.paused = false)

    this.interval && clearInterval(this.interval)

    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval))
      this.touch_start_position = 0;
    return this
  }
  Carousel.prototype.getActiveIndex = function () {
    this.$active = this.$element.find('.ga_item.ga_active')
    if(!this.$active.length) this.$active = this.$element.find('.ga_item:first').addClass('ga_active')
    this.$items  = this.$active.parent().children()
    return this.$items.index(this.$active)
  }
  Carousel.prototype.showHideControl = function(index) {
    if(typeof index === 'undefined') var index = this.getActiveIndex()
    this.$left_control[index===0 ? 'hide' : 'show']()
    this.$right_control[index===this.items_count-1 ? 'hide' : 'show']()
  }
  Carousel.prototype.to = function (pos) {
    var that        = this
    var activeIndex = this.getActiveIndex()

    if (pos > (this.$items.length - 1) || pos < 0) return

    if (this.sliding)       return this.$element.one('slid', function () { that.to(pos) })
    if (activeIndex == pos) return this.pause().cycle()

    return this.slide(pos > activeIndex ? 'next' : 'prev', $(this.$items[pos]))
  }

  Carousel.prototype.pause = function (e) {
    e || (this.paused = true)

    if (this.$element.find('.ga_next, .ga_prev').length && $.support.transition.end) {
      this.$element.trigger($.support.transition.end)
      this.cycle(true)
    }

    this.interval = clearInterval(this.interval)

    return this
  }

  Carousel.prototype.next = function () {
    if (this.sliding) return
    return this.slide('next')
  }

  Carousel.prototype.prev = function () {
    if (this.sliding) return
    return this.slide('prev')
  }

  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.ga_item.ga_active')
    var $next     = next || $active[type]()
    var isCycling = this.interval
    var direction = type == 'next' ? 'ga_left' : 'ga_right'
    var fallback  = type == 'next' ? 'first' : 'last'
    var that      = this
    if (!$next.length) {
      if (!this.options.wrap) {
        this.returnSwipedSlide()
        return
      }
      $next = this.$element.find('.ga_item')[fallback]()
    }

    this.sliding = true

    isCycling && this.pause()

    var e = $.Event('slide.vc.carousel', { relatedTarget: $next[0], direction: direction })

    if ($next.hasClass('ga_active')) return

    if (this.$indicators.length) {
      this.$indicators.find('.ga_active').removeClass('ga_active')
      this.$indicators.find('.ga_partial').removeClass('ga_partial')
      this.$element.one('slid', function () {
        var index = that.getActiveIndex(),
            $nextIndicator = $(that.$indicators.children().slice(index, that.getActiveIndex() + that.options.perView))
        $nextIndicator && $nextIndicator.addClass('ga_active')
        that.options.partial && $nextIndicator && (index+1 < that.items_count ? $nextIndicator.last().next().addClass('ga_partial') : $nextIndicator.first().prev().addClass('ga_partial'))
        !that.options.wrap && that.showHideControl(index)
      })
    }
    this.current_index = $next.index()
    if(this.current_index > this.items_count) {
      this.current_index = 0
    } else if(this.current_index < 0) {
      this.current_index = this.items_count -1
    }
    if(this.options.autoHeight) {
      this.current_pos_value = -1 * this._step * this.current_index
    } else {
      this.current_pos_value = -1 * $next.position()[this.animation_position]
    }
    if(this.options.partial && this.current_index >= this.items_count-1) {
      this.current_pos_value += this._step*(1-this.partial_part)
    }
    if ($.support.transition && this.$element.hasClass('ga_slide')) {
      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return
      this.$slideline_inner
        .addClass('ga_transition')
        .css(this.animation_position,  this.current_pos_value + that.pos_units)
      if(!this.options.autoHeight) this.recalculateSlidelineHeight($next.height(), true)
      this.$slideline_inner.one($.support.transition.end, function(){
        $next.addClass('ga_active')
        $active.removeClass('ga_active')
        that.$slideline_inner.removeClass([type, 'ga_transition'].join(' '))
        that.sliding = false
        that.removeSwipeAnimationSpeed()
        setTimeout(function () { that.$element.trigger('slid') }, 0)
      }).emulateTransitionEnd(this.transition_speed)
    } else {
      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return
      $active.removeClass('ga_active')
      $next.addClass('ga_active')
      this.sliding = false
      this.$slideline_inner.css(this.animation_position, this.current_pos_value + that.pos_units)
    }
    isCycling && this.cycle()
    return this
  }
  Carousel.prototype.setSwipeAnimationSpeed = function() {
    this.$slideline_inner.addClass('ga_swipe-transition')
  }
  Carousel.prototype.removeSwipeAnimationSpeed = function() {
    this.$slideline_inner.removeClass('ga_swipe-transition')

  }
    /**
     * Velocity
     * @param   {Number}    delta_time
     * @param   {Number}    delta_x
     * @param   {Number}    delta_y
     * @returns {Object}    velocity
     */
    Carousel.prototype.velocity =  function(time, x) {
      return {
          x: Math.abs(x / time) || 0
      }
    }
    Carousel.prototype.recalculateSlidelineHeight = function(height, animate) {
      if(animate === true) {
        this.$slideline.animate({height: height})
      } else {
        this.$slideline.height(height)
      }
    }
    /**
     * Change layout size after resizing of window.
     */
    Carousel.prototype.resizeAction = function() {
      var max_height = 0,
          new_slideline_height = 0
      if(this.options.mode === 'horizontal') {
        this.el_effect_size = this.$element.width() * ( this.options.partial ? this.partial_part : 1 )
        this.$slideline.width(this.items_count*this.el_effect_size)
      }

      if (this.options.autoHeight) {
        this.$items.height('auto')
        this.$items.each(function(){
          var item_height = $(this).height()
          if(item_height > max_height) max_height = item_height
        })
        this.$items.height(max_height)
        this.recalculateSlidelineHeight(this.$active.height())
      } else {
        this.recalculateSlidelineHeight(this.$active.height())
      }
      if(this.options.mode === 'vertical') {
        this._step = this.$active.height()
        new_slideline_height = this.$active.height() * this.options.perView * (this.options.partial ? (1 + 1-this.partial_part) : 1)
        this.recalculateSlidelineHeight(new_slideline_height, false)
        this.$slideline_inner.css({top: -1 * this.$active.position().top})
        this.el_effect_size = this._step
      }
    }
    Carousel.prototype.returnSwipedSlide = function() {
      var params = {}
      params[this.animation_position] = this.current_pos_value + this.pos_units
      this.$slideline_inner.animate(params)
    }
    Carousel.prototype._build = function() {
      var el                      = this.$element.get(0),
          _touch_start_position   = false,
          _touch_start_time       = 0,
          _pos_before_touch      = 0,
          _diff                   = 0,
          _moved                  = false,
          that                    = this,
          mode                    = this.options.mode
      this.getActiveIndex()

      this.el_width               = 0
      this.items_count            = this.$items.length

      this.$slideline             = this.$element.find('.ga_carousel-slideline')
      this.slideline              = this.$slideline.get(0)
      this.$slideline_inner       = this.$slideline.find('> div')
      this.slideline_inner        = this.$slideline_inner.get(0)

      this.partial_part           = 0.8
      this._slide_width           = 0
      this.swipe_velocity         = 0.7
      this.current_pos_value      = 0
      this.current_index          = 0 // TODO: default start position by options
      this.el_effect_size         = 0
      this.transition_speed       = 600

      this.$left_control = this.$element.find('.ga_left.ga_carousel-control')
      this.$right_control = this.$element.find('.ga_right.ga_carousel-control')

      // Enable autoHeight if partial
      if(this.options.partial) this.options.autoHeight = true
      // Add Css classes for perView > 1
      if(this.options.perView > 1) this.$element.addClass('ga_per-view-more ga_per-view-' + this.options.perView)

      if( mode === 'horizontal') {

        if (this.options.perView != 'css') {
          this.pos_units = '%'
          this._step = 100.00/this.items_count/this.options.perView
          this.$items.width(this._step + this.pos_units)
        }
        else {
          this.pos_units = 'px';
          this._step = this.$items.width();
        }
        this.animation_position = 'left'
        this.touch_direction = 'pageX'
      } else {
        this.pos_units = 'px'
        this.animation_position = 'top'
        this.touch_direction = 'pageY'
      }
      // Hide first control if this.current_index === 0
      !that.options.wrap && this.showHideControl()
      // Add partial css class if partial
      if(this.options.partial) this.$element.addClass('ga_partial')
      // Set indicator
      if(this.$indicators.length) {
        var $active_indecators = that.$indicators.children()
                                                 .slice(this.current_index, this.current_index + this.options.perView)
                                                 .addClass('ga_active')
        this.options.partial && $active_indecators.last().next().addClass('ga_partial')
      }
      $(window).resize(this.resizeAction.bind(this)); this.resizeAction()

      el.addEventListener("touchstart", function(e){
        _touch_start_position = parseFloat(e[that.touch_direction])
        _touch_start_time = e.timeStamp
        _pos_before_touch = that.$slideline_inner.position()[that.animation_position]
      }.bind(this), false)
      el.addEventListener('touchmove', function(e){
        _diff = parseFloat(e[that.touch_direction]) - _touch_start_position
        _moved = Math.abs(_diff) > 0
        if(!_moved) return true
        e.preventDefault()
        that.slideline_inner.style[that.animation_position] = (_pos_before_touch + _diff) + 'px'
      }, false)
      el.addEventListener('touchend', function(e){
        var time,part,velocity
        if(_moved) {
          time= (e.timeStamp-_touch_start_time)/1000
          part = _diff/ that.el_effect_size
          velocity = that.velocity(time, part)
          if((velocity.x > that.swipe_velocity && part < 0) || part <= -0.7) {
            that.setSwipeAnimationSpeed()
            that.next()
          } else if(velocity.x > that.swipe_velocity || part >= 0.7) {
            that.setSwipeAnimationSpeed()
            that.prev()
          } else {
            that.returnSwipedSlide()
          }
          _moved = false
        }
      }, false)
      this.$element.addClass('ga_build')
      return this
    }
  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  var old = $.fn.carousel

  $.fn.carousel = function (option, value) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('vc.carousel')
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option)
      var action  = typeof option == 'string' ? option : options.slide

      if (!data) $this.data('vc.carousel', (data = new Carousel(this, options)))
      if (typeof option == 'number') data.to(option)
      else if (action) data[action](value)
      else if (options.interval) data.pause().cycle()
    })
  }

  $.fn.carousel.Constructor = Carousel


  // CAROUSEL NO CONFLICT
  // ====================

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old
    return this
  }


  // CAROUSEL DATA-API
  // =================

  $(document).off('click.vc.carousel.data-api').on('click.vc.carousel.data-api', '[data-slide], [data-slide-to]', function (e) {
    var $this   = $(this), href
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
    var options = $.extend({}, $target.data(), $this.data())
    var slideIndex = $this.attr('data-slide-to')
    if (slideIndex) options.interval = false
    $target.carousel(options)

    if (slideIndex = $this.attr('data-slide-to')) {
      $target.data('vc.carousel').to(slideIndex)
    }

    e.preventDefault()
  })

  $(window).on('load', function () {
    $('[data-ride="ga_carousel"]').each( function () {
      var $carousel = $(this)
      $carousel.carousel($carousel.data())
    })
  })

})(window.jQuery);;

/* ========================================================================
 * Bootstrap: transition.js v3.0.0
 * http://twbs.github.com/bootstrap/javascript.html#transitions
 * ========================================================================
 * Copyright 2013 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ======================================================================== */


+function ($) { "use strict";

  // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
  // ============================================================

  function transitionEnd() {
    var el = document.createElement('bootstrap')

    var transEndEventNames = {
      'WebkitTransition' : 'webkitTransitionEnd'
    , 'MozTransition'    : 'transitionend'
    , 'OTransition'      : 'oTransitionEnd otransitionend'
    , 'transition'       : 'transitionend'
    }

    for (var name in transEndEventNames) {
      if (el.style[name] !== undefined) {
        return { end: transEndEventNames[name] }
      }
    }
  }

  // http://blog.alexmaccaw.com/css-transitions
  $.fn.emulateTransitionEnd = function (duration) {
    var called = false, $el = this
    $(this).one($.support.transition.end, function () { called = true })
    var callback = function () { if (!called) $($el).trigger($.support.transition.end) }
    setTimeout(callback, duration)
    return this
  }

  $(function () {
    $.support.transition = transitionEnd()
  })

}(window.jQuery);;

/*
 * Simple script for drawing lines connecting memoryline
 * content
 *
 * @author jason.xie@victheme.com
 */
(function($) {
  /**
   * Object for detecting and storing coordinates for
   * each dots. use this on each memory line child entry.
   *
   * @param element
   *   the memory child jQuery object
   *
   * @param canvas
   *   the designated canvas object
   *
   * @constructor
   */
  var MemoryLinesDot = function(element, container) {
    this.$el = element;
    this.$container = container
  }



  /**
   * Memory line dot methods.
   * @type {{setCanvas: Function, setPosition: Function, setOffsets: Function, setDotPosition: Function, drawDots: Function}}
   */
  MemoryLinesDot.prototype = {

    setDirection: function(direction) {
      this.direction = this.$el.data('dot-direction') || direction || 'forward';
      return this;
    },

    setOffset: function() {
      this.offset = {
        x: this.$el.data('dot-offset-x') || 0,
        y: this.$el.data('dot-offset-y') || 0
      }

      return this;
    },

    setLine: function() {
      this.line = {
        color: this.$el.data('line-color') || '#f0f0f0',
        width: this.$el.data('line-width') || 10,
        type: this.$el.data('line-type') || 'round'
      }

      return this;
    },

    setDot: function() {

      this.dot = {
        radius: this.$el.data('dot-radius') || 8,
        color: this.$el.data('dot-color') || '#ff6c00'
      }

      this.dot.x = this.$el.offset().left - this.$container.offset().left + this.offset.x + this.dot.radius,
      this.dot.y = this.$el.offset().top - this.$container.offset().top + this.offset.x - this.dot.radius /2

      this.checkBoundary();

      return this;
    },

    checkBoundary: function() {
      // consider as inner padding of canvas
      this.gap = 20;

      if (this.dot.x < this.dot.radius + this.gap) {
        this.dot.x = this.dot.radius + this.gap;
      }
      else if (this.dot.x > this.$container.innerWidth() + this.gap- this.dot.radius) {
        this.dot.x = this.$container.innerWidth() + this.gap - this.dot.radius;
      }

      if (this.dot.y < this.dot.radius + this.gap) {
        this.dot.y = this.dot.radius + this.gap;
      }
      else if (this.dot.y > this.$container.innerHeight() + this.gap - this.dot.radius) {
        this.dot.y = this.$container.innerHeight() - this.dot.radius + this.gap;
      }

      return this;
    },

    process: function() {
      this
        .setDirection()
        .setOffset()
        .setLine()
        .setDot();

      return this;
    }
  }


  /*
   * Object for grouping all the memory line child elements
   * and building the dots and lines
   *
   * @param element
   *   jQuery object for the main wrapper element
   *
   * @param canvas
   *   jQuery object for the canvas element
   *
   * @param children
   *   jQuery object for group of children elements
   *   use jQuery find to get all the element and pass
   *   it to the object
   *
   * @constructor
   */
  var MemoryLinesConnector = function(element, canvas, children) {
    this.$el = element;
    this.$canvas = canvas;
    this.$children = children;

    this.dots = {};

    this.line = {
      color: this.$el.data('line-color') || '#f0f0f0',
      width: this.$el.data('line-width') || 10,
      type: this.$el.data('line-type') || 'round'
    }

    this.offset = {
      x: this.$el.data('line-offset-x') || 0,
      y: this.$el.data('line-offset-y') || 2
    }

    return this;
  }


  /**
   * Collection of object methods
   * @type {{setCanvas: Function, setSource: Function, setTarget: Function, addDot: Function, getDot: Function, checkHorizontal: Function, setRadius: Function, setDirection: Function, setArc: Function, clearCanvas: Function, drawLine: Function, drawCurve: Function, drawMode: Function, drawConnector: Function, drawObject: Function}}
   */
  MemoryLinesConnector.prototype = {

    setCanvas: function() {
      this.ctx = this.$canvas.get(0).getContext('2d');
      return this;
    },

    setSource: function(dot) {
      this.source = dot;
      return this;
    },

    setTarget: function(dot) {
      this.target = dot;
      return this;
    },

    addDot: function(delta, dot) {
      this.dots[delta] = dot;
      return this;
    },

    getDot: function(delta) {
      return this.dots[delta] || false;
    },

    checkHorizontal: function() {

      // Only do horizontal mode if the target is aligned
      // horizontally with source and both width is equal
      // to canvas width
      if ((this.source.$el.outerWidth(true) == this.$canvas.innerWidth())
          && (this.target.$el.outerWidth(true) == this.$canvas.innerWidth())
          && this.source.dot.x == this.target.dot.x) {

        this.setDirection('horizontal')
      }

      // Target and source in the same y coordinates
      else if (this.source.dot.y == this.target.dot.y) {
        this.setDirection('horizontal');
      }

      if ($(window).width() < 769) {
        this.setDirection('horizontal');
      }

      return this;
    },

    setRadius: function(radius) {
      this.radius = radius || Math.abs((this.target.dot.y - this.source.dot.y) / 2);
      return this;
    },

    setDirection: function(direction) {
      this.direction = direction || this.source.direction;
      return this;
    },


    setArc: function() {

      this.setRadius();

      // This gap will act as inner canvas padding for preventing bleeding
      this.gap = 20;
      this.lineX = this.source.line.width || this.line.width;

      switch (this.direction) {

        // Arc to the right
        case 'forward' :
          this.dotX = Math.max(this.target.dot.x, this.source.dot.x) + this.radius;

          // Stop Bleeding
          if(this.dotX > this.$canvas.outerWidth() + this.gap - this.offset.x - this.lineX) {
            this.dotX = this.$canvas.outerWidth() - this.offset.x - this.lineX + this.gap;
          }

          break;

        // Arc to left
        case 'reverse' :
          this.dotX = Math.min(this.source.dot.x, this.target.dot.x) - this.radius;

          // Stop Bleeding
          if (this.dotX < this.offset.x + this.lineX + this.gap) {
            this.dotX = this.lineX + this.offset.x + this.gap;
          }

          break;
      }

      this.arc = {
        one: {
          initial: {
            x: this.source.dot.x,
            y: this.source.dot.y
          },
          start: {
            x: this.dotX,
            y: this.source.dot.y
          },
          end: {
            x: this.dotX,
            y: this.target.dot.y - this.radius
          },
          radius: this.radius
        },
        two: {
          initial: {
            x: this.target.dot.x,
            y: this.target.dot.y
          },
          start: {
            x: this.dotX,
            y: this.target.dot.y
          },
          end: {
            x: this.dotX,
            y: this.target.dot.y - this.radius
          },
          radius: this.radius
        }
      }

      return this;
    },

    clearCanvas: function() {
      this.ctx || this.setCanvas();
      this.ctx.clearRect(0, 0, this.$canvas.width(), this.$canvas.height());
      return this;
    },

    drawDot: function(dot) {
      this.ctx || this.setCanvas();
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, dot.radius, 0, 2 * Math.PI, false);
      this.ctx.fillStyle = dot.color;
      this.ctx.fill();
      return this;
    },

    drawCurve: function(arc, line) {

      this.ctx || this.setCanvas();
      this.ctx.globalCompositeOperation = 'destination-over';
      this.ctx.beginPath();
      this.ctx.moveTo(arc.initial.x, arc.initial.y);
      this.ctx.lineWidth = line.width;
      this.ctx.lineCap = line.type;
      this.ctx.miterLimit = line.width;
      this.ctx.strokeStyle = line.color;
      this.ctx.arcTo(arc.start.x, arc.start.y, arc.end.x, arc.end.y, arc.radius);
      this.ctx.stroke();
      this.ctx.globalCompositeOperation = 'source-over';

      return this;
    },

    drawLine: function(start, end, line) {
      this.ctx || this.setCanvas();
      this.ctx.globalCompositeOperation = 'destination-over';
      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.lineWidth = line.width;
      this.ctx.lineCap = line.height;
      this.ctx.miterLimit = line.width;
      this.ctx.strokeStyle = line.color;
      this.ctx.stroke();
      this.ctx.globalCompositeOperation = 'source-over';

      return this;
    },


    drawConnector: function() {
      this
        .setDirection()
        .checkHorizontal();

      switch(this.direction) {

        // Use simple line for horizontal mode only for simplicity sake
        case 'horizontal' :

          // Draw simple line from source to target
          this.drawLine(this.source.dot, this.target.dot, this.source.line || this.line);

          break;

        default:
          this
            .setArc()

            // Draw the top half of the arc from the source to half of the target
            .drawCurve(this.arc.one, this.source.line || this.line)

            // Draw the bottom half of the arc from the target to half of the source
            .drawCurve(this.arc.two, this.source.line || this.line);

          break;
      }
      return this;
    },

    drawObject: function() {
      var that = this;

      this.$children.each(function(delta, element) {

        var Target = new MemoryLinesDot($(this), that.$el);
        var Source = that.getDot(delta - 1);

        // Draw single dot, the next dot is drawn on next loop
        that
          .addDot(delta, Target.process())
          .drawDot(Target.dot);

        // Draw connector when we got 2 dot points
        Source && that.setSource(Source).setTarget(Target).drawConnector();

        Target = null;
        Source = null;
        delete Target;
        delete Source;
      });

      return this;

    }

  }


  /**
   * jQuery method for calling the object
   * @param options
   * @returns {*}
   */
  $.fn.memoryLineConnect = function(options) {

    return this.each(function() {

      var MemoryLine = $(this),
          Children = MemoryLine.find('.memoryline-content'),
          Canvas = $('<canvas class="memoryline-canvas" />');

      MemoryLine.css('position', 'relative');
      Children.css({zIndex: 3});
      Canvas
        .attr('width', MemoryLine.width())
        .attr('height', MemoryLine.height())
        .css({
          position: 'absolute',
          left:  0,
          top: 0,
          zIndex: 1
        })
        .prependTo(MemoryLine);


      var MemoryLineObject = new MemoryLinesConnector(MemoryLine, Canvas, Children);
      MemoryLineObject.drawObject();

      Canvas.data('memory-line-object', MemoryLineObject);

      delete MemoryLine;
      delete MemoryLineObject;
      delete Canvas;

      MemoryLine = null;
      MemoryLineObject = null;
      Canvas = null;
    });
  };

  if ($('#page').length && $('#page').hasClass('animsition')) {
    $(window)
      .on('animsitionPageIn', function() {

        $('.memoryline-canvas').remove();
        $('.memoryline-connector').memoryLineConnect();

        $(window)
          .on('resize sortupdate', function() {
            $('.memoryline-canvas').remove();
            $('.memoryline-connector').memoryLineConnect();
          });

      });

  } else {
	
    $(window)
      .on('load resize sortupdate', function () {
        $('.memoryline-canvas').remove();
        $('.memoryline-connector').memoryLineConnect();
      });
  }

})(jQuery);

/*
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 */
(function(root, factory) {
"use strict";
  /* CommonJS */
  if (typeof exports == 'object')  module.exports = factory()

  /* AMD module */
  else if (typeof define == 'function' && define.amd) define(factory)

  /* Browser global */
  else root.Spinner = factory()
}
(this, function() {
  "use strict";

  var prefixes = ['webkit', 'Moz', 'ms', 'O'] /* Vendor prefixes */
    , animations = {} /* Animation rules keyed by their name */
    , useCssAnimations /* Whether to use CSS animations or setTimeout */

  /**
   * Utility function to create elements. If no tag name is given,
   * a DIV is created. Optionally properties can be passed.
   */
  function createEl(tag, prop) {
    var el = document.createElement(tag || 'div')
      , n

    for(n in prop) el[n] = prop[n]
    return el
  }

  /**
   * Appends children and returns the parent.
   */
  function ins(parent /* child1, child2, ...*/) {
    for (var i=1, n=arguments.length; i<n; i++)
      parent.appendChild(arguments[i])

    return parent
  }

  /**
   * Insert a new stylesheet to hold the @keyframe or VML rules.
   */
  var sheet = (function() {
    var el = createEl('style', {type : 'text/css'})
    ins(document.getElementsByTagName('head')[0], el)
    return el.sheet || el.styleSheet
  }())

  /**
   * Creates an opacity keyframe animation rule and returns its name.
   * Since most mobile Webkits have timing issues with animation-delay,
   * we create separate rules for each line/segment.
   */
  function addAnimation(alpha, trail, i, lines) {
    var name = ['opacity', trail, ~~(alpha*100), i, lines].join('-')
      , start = 0.01 + i/lines * 100
      , z = Math.max(1 - (1-alpha) / trail * (100-start), alpha)
      , prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase()
      , pre = prefix && '-' + prefix + '-' || ''

    if (!animations[name]) {
      sheet.insertRule(
        '@' + pre + 'keyframes ' + name + '{' +
        '0%{opacity:' + z + '}' +
        start + '%{opacity:' + alpha + '}' +
        (start+0.01) + '%{opacity:1}' +
        (start+trail) % 100 + '%{opacity:' + alpha + '}' +
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
    var s = el.style
      , pp
      , i

    prop = prop.charAt(0).toUpperCase() + prop.slice(1)
    for(i=0; i<prefixes.length; i++) {
      pp = prefixes[i]+prop
      if(s[pp] !== undefined) return pp
    }
    if(s[prop] !== undefined) return prop
  }

  /**
   * Sets multiple style properties at once.
   */
  function css(el, prop) {
    for (var n in prop)
      el.style[vendor(el, n)||n] = prop[n]

    return el
  }

  /**
   * Fills in default values.
   */
  function merge(obj) {
    for (var i=1; i < arguments.length; i++) {
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
    var o = { x:el.offsetLeft, y:el.offsetTop }
    while((el = el.offsetParent))
      o.x+=el.offsetLeft, o.y+=el.offsetTop

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
    lines: 12,            // The number of lines to draw
    length: 7,            // The length of each line
    width: 5,             // The line thickness
    radius: 10,           // The radius of the inner circle
    rotate: 0,            // Rotation offset
    corners: 1,           // Roundness (0..1)
    color: '#000',        // #rgb or #rrggbb
    direction: 1,         // 1: clockwise, -1: counterclockwise
    speed: 1,             // Rounds per second
    trail: 100,           // Afterglow percentage
    opacity: 1/4,         // Opacity of the lines
    fps: 20,              // Frames per second when using setTimeout()
    zIndex: 2e9,          // Use a high z-index by default
    className: 'spinner', // CSS class to assign to the element
    top: '50%',           // center vertically
    left: '50%',          // center horizontally
    position: 'absolute'  // element position
  }

  /** The constructor */
  function Spinner(o) {
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

      var self = this
        , o = self.opts
        , el = self.el = css(createEl(0, {className: o.className}), {position: o.position, width: 0, zIndex: o.zIndex})
        , mid = o.radius+o.length+o.width

      css(el, {
        left: o.left,
        top: o.top
      })
        
      if (target) {
        target.insertBefore(el, target.firstChild||null)
      }

      el.setAttribute('role', 'progressbar')
      self.lines(el, self.opts)

      if (!useCssAnimations) {
        // No CSS animation support, use setTimeout() instead
        var i = 0
          , start = (o.lines - 1) * (1 - o.direction) / 2
          , alpha
          , fps = o.fps
          , f = fps/o.speed
          , ostep = (1-o.opacity) / (f*o.trail / 100)
          , astep = f/o.lines

        ;(function anim() {
          i++;
          for (var j = 0; j < o.lines; j++) {
            alpha = Math.max(1 - (i + (o.lines - j) * astep) % f * ostep, o.opacity)

            self.opacity(el, j * o.direction + start, alpha, o)
          }
          self.timeout = self.el && setTimeout(anim, ~~(1000/fps))
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
      var i = 0
        , start = (o.lines - 1) * (1 - o.direction) / 2
        , seg

      function fill(color, shadow) {
        return css(createEl(), {
          position: 'absolute',
          width: (o.length+o.width) + 'px',
          height: o.width + 'px',
          background: color,
          boxShadow: shadow,
          transformOrigin: 'left',
          transform: 'rotate(' + ~~(360/o.lines*i+o.rotate) + 'deg) translate(' + o.radius+'px' +',0)',
          borderRadius: (o.corners * o.width>>1) + 'px'
        })
      }

      for (; i < o.lines; i++) {
        seg = css(createEl(), {
          position: 'absolute',
          top: 1+~(o.width/2) + 'px',
          transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
          opacity: o.opacity,
          animation: useCssAnimations && addAnimation(o.opacity, o.trail, start + i * o.direction, o.lines) + ' ' + 1/o.speed + 's linear infinite'
        })

        if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2+'px'}))
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
      var r = o.length+o.width
        , s = 2*r

      function grp() {
        return css(
          vml('group', {
            coordsize: s + ' ' + s,
            coordorigin: -r + ' ' + -r
          }),
          { width: s, height: s }
        )
      }

      var margin = -(o.width+o.length)*2 + 'px'
        , g = css(grp(), {position: 'absolute', top: margin, left: margin})
        , i

      function seg(i, dx, filter) {
        ins(g,
          ins(css(grp(), {rotation: 360 / o.lines * i + 'deg', left: ~~dx}),
            ins(css(vml('roundrect', {arcsize: o.corners}), {
                width: r,
                height: o.width,
                left: o.radius,
                top: -o.width>>1,
                filter: filter
              }),
              vml('fill', {color: getColor(o.color, i), opacity: o.opacity}),
              vml('stroke', {opacity: 0}) // transparent stroke to fix color bleeding upon opacity change
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
      if (c && i+o < c.childNodes.length) {
        c = c.childNodes[i+o]; c = c && c.firstChild; c = c && c.firstChild
        if (c) c.opacity = val
      }
    }
  }

  var probe = css(createEl('group'), {behavior: 'url(#default#VML)'})

  if (!vendor(probe, 'transform') && probe.adj) initVML()
  else useCssAnimations = vendor(probe, 'animation')

  return Spinner

}));

/**
 * Copyright (c) 2011-2014 Felix Gnass
 * Licensed under the MIT license
 */

/*

Basic Usage:
============

$('#el').spin(); // Creates a default Spinner using the text color of #el.
$('#el').spin({ ... }); // Creates a Spinner using the provided options.

$('#el').spin(false); // Stops and removes the spinner.

Using Presets:
==============

$('#el').spin('small'); // Creates a 'small' Spinner using the text color of #el.
$('#el').spin('large', '#fff'); // Creates a 'large' white Spinner.

Adding a custom preset:
=======================

$.fn.spin.presets.flower = {
  lines: 9
  length: 10
  width: 20
  radius: 0
}

$('#el').spin('flower', 'red');

*/

(function(factory) {
"use strict";
  if (typeof exports == 'object') {
    // CommonJS
    factory(require('jquery'), require('spin'))
  }
  else if (typeof define == 'function' && define.amd) {
    // AMD, register as anonymous module
    define(['jquery', 'spin'], factory)
  }
  else {
    // Browser globals
    if (!window.Spinner) throw new Error('Spin.js not present')
    factory(window.jQuery, window.Spinner)
  }

}(function($, Spinner) {
"use strict";
  $.fn.spin = function(opts, color) {

    return this.each(function() {
      var $this = $(this),
        data = $this.data();

      if (data.spinner) {
        data.spinner.stop();
        delete data.spinner;
      }
      if (opts !== false) {
        opts = $.extend(
          { color: color || $this.css('color') },
          $.fn.spin.presets[opts] || opts
        )
        data.spinner = new Spinner(opts).spin(this)
      }
    })
  }

  $.fn.spin.presets = {
    tiny: { lines: 8, length: 2, width: 2, radius: 3 },
    small: { lines: 8, length: 4, width: 3, radius: 5 },
    large: { lines: 10, length: 8, width: 4, radius: 8 }
  }

}));;

(function ($) {
"use strict";
  $.fn.customScrollbar = function (options, args) {

    var defaultOptions = {
      skin: undefined,
      hScroll: true,
      vScroll: true,
      updateOnWindowResize: false,
      animationSpeed: 300,
      onCustomScroll: undefined,
      swipeSpeed: 1,
      wheelSpeed: 40,
      fixedThumbWidth: undefined,
      fixedThumbHeight: undefined,
      preventDefaultScroll: false
    }

    var Scrollable = function (element, options) {
      this.$element = $(element);
      this.options = options;
      this.addScrollableClass();
      this.addSkinClass();
      this.addScrollBarComponents();
      if (this.options.vScroll)
        this.vScrollbar = new Scrollbar(this, new VSizing());
      if (this.options.hScroll)
        this.hScrollbar = new Scrollbar(this, new HSizing());
      this.$element.data("scrollable", this);
      this.initKeyboardScrolling();
      this.bindEvents();
    }

    Scrollable.prototype = {

      addScrollableClass: function () {
        if (!this.$element.hasClass("scrollable")) {
          this.scrollableAdded = true;
          this.$element.addClass("scrollable");
        }
      },

      removeScrollableClass: function () {
        if (this.scrollableAdded)
          this.$element.removeClass("scrollable");
      },

      addSkinClass: function () {
        if (typeof(this.options.skin) == "string" && !this.$element.hasClass(this.options.skin)) {
          this.skinClassAdded = true;
          this.$element.addClass(this.options.skin);
        }
      },

      removeSkinClass: function () {
        if (this.skinClassAdded)
          this.$element.removeClass(this.options.skin);
      },

      addScrollBarComponents: function () {
        this.assignViewPort();
        if (this.$viewPort.length == 0) {
          this.$element.wrapInner("<div class=\"viewport\" />");
          this.assignViewPort();
          this.viewPortAdded = true;
        }
        this.assignOverview();
        if (this.$overview.length == 0) {
          this.$viewPort.wrapInner("<div class=\"overview\" />");
          this.assignOverview();
          this.overviewAdded = true;
        }
        this.addScrollBar("vertical", "prepend");
        this.addScrollBar("horizontal", "append");
      },

      removeScrollbarComponents: function () {
        this.removeScrollbar("vertical");
        this.removeScrollbar("horizontal");
        if (this.overviewAdded)
          this.$element.find(".overview").children().unwrap();
        if (this.viewPortAdded)
          this.$element.find(".viewport").children().unwrap();
      },

      removeScrollbar: function (orientation) {
        if (this[orientation + "ScrollbarAdded"])
          this.$element.find(".scroll-bar." + orientation).remove();
      },

      assignViewPort: function () {
        this.$viewPort = this.$element.find(".viewport");
      },

      assignOverview: function () {
        this.$overview = this.$viewPort.find(".overview");
      },

      addScrollBar: function (orientation, fun) {
        if (this.$element.find(".scroll-bar." + orientation).length == 0) {
          this.$element[fun]("<div class='scroll-bar " + orientation + "'><div class='thumb'></div></div>")
          this[orientation + "ScrollbarAdded"] = true;
        }
      },

      resize: function (keepPosition) {
        if (this.vScrollbar)
          this.vScrollbar.resize(keepPosition);
        if (this.hScrollbar)
          this.hScrollbar.resize(keepPosition);
      },

      scrollTo: function (element) {
        if (this.vScrollbar)
          this.vScrollbar.scrollToElement(element);
        if (this.hScrollbar)
          this.hScrollbar.scrollToElement(element);
      },

      scrollToXY: function (x, y) {
        this.scrollToX(x);
        this.scrollToY(y);
      },

      scrollToX: function (x) {
        if (this.hScrollbar)
          this.hScrollbar.scrollOverviewTo(x, true);
      },

      scrollToY: function (y) {
        if (this.vScrollbar)
          this.vScrollbar.scrollOverviewTo(y, true);
      },

      scrollByX: function (x) {
        if (this.hScrollbar)
          this.scrollToX(this.hScrollbar.overviewPosition() + x);
      },

      scrollByY: function (y) {
        if (this.vScrollbar)
          this.scrollToY(this.vScrollbar.overviewPosition() + y);
      },

      remove: function () {
        this.removeScrollableClass();
        this.removeSkinClass();
        this.removeScrollbarComponents();
        this.$element.data("scrollable", null);
        this.removeKeyboardScrolling();
        if (this.vScrollbar)
          this.vScrollbar.remove();
        if (this.hScrollbar)
          this.hScrollbar.remove();
      },

      setAnimationSpeed: function (speed) {
        this.options.animationSpeed = speed;
      },

      isInside: function (element, wrappingElement) {
        var $element = $(element);
        var $wrappingElement = $(wrappingElement);
        var elementOffset = $element.offset();
        var wrappingElementOffset = $wrappingElement.offset();
        return (elementOffset.top >= wrappingElementOffset.top) && (elementOffset.left >= wrappingElementOffset.left) &&
          (elementOffset.top + $element.height() <= wrappingElementOffset.top + $wrappingElement.height()) &&
          (elementOffset.left + $element.width() <= wrappingElementOffset.left + $wrappingElement.width())
      },

      initKeyboardScrolling: function () {
        var _this = this;

        this.elementKeydown = function (event) {
          if (document.activeElement === _this.$element[0]) {
            if (_this.vScrollbar)
              _this.vScrollbar.keyScroll(event);
            if (_this.hScrollbar)
              _this.hScrollbar.keyScroll(event);
          }
        }

        this.$element
          .attr('tabindex', '-1')
          .keydown(this.elementKeydown);
      },

      removeKeyboardScrolling: function () {
        this.$element
          .removeAttr('tabindex')
          .unbind("keydown", this.elementKeydown);
      },

      bindEvents: function () {
        if (this.options.onCustomScroll)
          this.$element.on("customScroll", this.options.onCustomScroll);
      }

    }

    var Scrollbar = function (scrollable, sizing) {
      this.scrollable = scrollable;
      this.sizing = sizing
      this.$scrollBar = this.sizing.scrollBar(this.scrollable.$element);
      this.$thumb = this.$scrollBar.find(".thumb");
      this.setScrollPosition(0, 0);
      this.resize();
      this.initMouseMoveScrolling();
      this.initMouseWheelScrolling();
      this.initTouchScrolling();
      this.initMouseClickScrolling();
      this.initWindowResize();
    }

    Scrollbar.prototype = {

      resize: function (keepPosition) {
        this.overviewSize = this.sizing.size(this.scrollable.$overview);
        this.calculateViewPortSize();
        this.sizing.size(this.scrollable.$viewPort, this.viewPortSize);
        this.ratio = this.viewPortSize / this.overviewSize;
        this.sizing.size(this.$scrollBar, this.viewPortSize);
        this.thumbSize = this.calculateThumbSize();
        this.sizing.size(this.$thumb, this.thumbSize);
        this.maxThumbPosition = this.calculateMaxThumbPosition();
        this.maxOverviewPosition = this.calculateMaxOverviewPosition();
        this.enabled = (this.overviewSize > this.viewPortSize);
        if (this.scrollPercent === undefined)
          this.scrollPercent = 0.0;
        if (this.enabled)
          this.rescroll(keepPosition);
        else
          this.setScrollPosition(0, 0);
        this.$scrollBar.toggle(this.enabled);
      },

      calculateViewPortSize: function () {
        var elementSize = this.sizing.size(this.scrollable.$element);
        if (elementSize > 0 && !this.maxSizeUsed) {
          this.viewPortSize = elementSize;
          this.maxSizeUsed = false;
        }
        else {
          var maxSize = this.sizing.maxSize(this.scrollable.$element);
          this.viewPortSize = Math.min(maxSize, this.overviewSize);
          this.maxSizeUsed = true;
        }
      },

      calculateThumbSize: function () {
        var fixedSize = this.sizing.fixedThumbSize(this.scrollable.options)
        var size;
        if (fixedSize)
          size = fixedSize;
        else
          size = this.ratio * this.viewPortSize
        return Math.max(size, this.sizing.minSize(this.$thumb));
      },

      initMouseMoveScrolling: function () {
        var _this = this;
        this.$thumb.on("mousedown", function (event) {
          if (_this.enabled)
            _this.startMouseMoveScrolling(event);
        });
        this.documentMouseup = function (event) {
          _this.stopMouseMoveScrolling(event);
        };
        $(document).mouseup(this.documentMouseup);
        this.documentMousemove = function (event) {
          _this.mouseMoveScroll(event);
        };
        $(document).mousemove(this.documentMousemove);
        this.$thumb.on("click", function (event) {
          event.stopPropagation();
        });
      },

      removeMouseMoveScrolling: function () {
        this.$thumb.unbind();
        $(document).unbind("mouseup", this.documentMouseup);
        $(document).unbind("mousemove", this.documentMousemove);
      },

      initMouseWheelScrolling: function () {
        var _this = this;
        this.scrollable.$element.mousewheel(function (event, delta, deltaX, deltaY) {
          if (_this.enabled) {
            var scrolled = _this.mouseWheelScroll(deltaX, deltaY);
            _this.stopEventConditionally(event, scrolled);
          }
        });
      },

      removeMouseWheelScrolling: function () {
        this.scrollable.$element.unbind("mousewheel");
      },

      initTouchScrolling: function () {
        if (document.addEventListener) {
          var _this = this;
          this.elementTouchstart = function (event) {
            if (_this.enabled)
              _this.startTouchScrolling(event);
          }
          this.scrollable.$element[0].addEventListener("touchstart", this.elementTouchstart);
          this.documentTouchmove = function (event) {
            _this.touchScroll(event);
          }
          this.scrollable.$element[0].addEventListener("touchmove", this.documentTouchmove);
          this.elementTouchend = function (event) {
            _this.stopTouchScrolling(event);
          }
          this.scrollable.$element[0].addEventListener("touchend", this.elementTouchend);
        }
      },

      removeTouchScrolling: function () {
        if (document.addEventListener) {
          this.scrollable.$element[0].removeEventListener("touchstart", this.elementTouchstart);
          document.removeEventListener("touchmove", this.documentTouchmove);
          this.scrollable.$element[0].removeEventListener("touchend", this.elementTouchend);
        }
      },

      initMouseClickScrolling: function () {
        var _this = this;
        this.scrollBarClick = function (event) {
          _this.mouseClickScroll(event);
        };
        this.$scrollBar.click(this.scrollBarClick);
      },

      removeMouseClickScrolling: function () {
        this.$scrollBar.unbind("click", this.scrollBarClick);
      },

      initWindowResize: function () {
        if (this.scrollable.options.updateOnWindowResize) {
          var _this = this;
          this.windowResize = function () {
            _this.resize();
          };
          $(window).resize(this.windowResize);
        }
      },

      removeWindowResize: function () {
        $(window).unbind("resize", this.windowResize);
      },

      isKeyScrolling: function (key) {
        return this.keyScrollDelta(key) != null;
      },

      keyScrollDelta: function (key) {
        for (var scrollingKey in this.sizing.scrollingKeys)
          if (scrollingKey == key)
            return this.sizing.scrollingKeys[key](this.viewPortSize);
        return null;
      },

      startMouseMoveScrolling: function (event) {
        this.mouseMoveScrolling = true;
        $("body").addClass("not-selectable");
        this.setUnselectable($("body"), "on");
        this.setScrollEvent(event);
        event.preventDefault();
      },

      stopMouseMoveScrolling: function (event) {
        this.mouseMoveScrolling = false;
        $("body").removeClass("not-selectable");
        this.setUnselectable($("body"), null);
      },

      setUnselectable: function (element, value) {
        if (element.attr("unselectable") != value) {
          element.attr("unselectable", value);
          element.find(':not(input)').attr('unselectable', value);
        }
      },

      mouseMoveScroll: function (event) {
        if (this.mouseMoveScrolling) {
          var delta = this.sizing.mouseDelta(this.scrollEvent, event);
          this.scrollThumbBy(delta);
          this.setScrollEvent(event);
        }
      },

      startTouchScrolling: function (event) {
        if (event.touches && event.touches.length == 1) {
          this.setScrollEvent(event.touches[0]);
          this.touchScrolling = true;
          event.stopPropagation();
        }
      },

      touchScroll: function (event) {
        if (this.touchScrolling && event.touches && event.touches.length == 1) {
          var delta = -this.sizing.mouseDelta(this.scrollEvent, event.touches[0]) * this.scrollable.options.swipeSpeed;
          var scrolled = this.scrollOverviewBy(delta);
          if (scrolled)
            this.setScrollEvent(event.touches[0]);
          this.stopEventConditionally(event, scrolled);
        }
      },

      stopTouchScrolling: function (event) {
        this.touchScrolling = false;
        event.stopPropagation();
      },

      mouseWheelScroll: function (deltaX, deltaY) {
        var delta = -this.sizing.wheelDelta(deltaX, deltaY) * this.scrollable.options.wheelSpeed;
        if (delta != 0)
          return this.scrollOverviewBy(delta);
      },

      mouseClickScroll: function (event) {
        var delta = this.viewPortSize - 20;
        if (event["page" + this.sizing.scrollAxis()] < this.$thumb.offset()[this.sizing.offsetComponent()])
        // mouse click over thumb
          delta = -delta;
        this.scrollOverviewBy(delta);
      },

      keyScroll: function (event) {
        var keyDown = event.which;
        if (this.enabled && this.isKeyScrolling(keyDown)) {
          var scrolled = this.scrollOverviewBy(this.keyScrollDelta(keyDown));
          this.stopEventConditionally(event, scrolled);
        }
      },

      scrollThumbBy: function (delta) {
        var thumbPosition = this.thumbPosition();
        thumbPosition += delta;
        thumbPosition = this.positionOrMax(thumbPosition, this.maxThumbPosition);
        var oldScrollPercent = this.scrollPercent;
        this.scrollPercent = thumbPosition / this.maxThumbPosition;
        if (oldScrollPercent != this.scrollPercent) {
          var overviewPosition = (thumbPosition * this.maxOverviewPosition) / this.maxThumbPosition;
          this.setScrollPosition(overviewPosition, thumbPosition);
          this.triggerCustomScroll(oldScrollPercent);
          return true
        }
        else
          return false;
      },

      thumbPosition: function () {
        return this.$thumb.position()[this.sizing.offsetComponent()];
      },

      scrollOverviewBy: function (delta) {
        var overviewPosition = this.overviewPosition() + delta;
        return this.scrollOverviewTo(overviewPosition, false);
      },

      overviewPosition: function () {
        return -this.scrollable.$overview.position()[this.sizing.offsetComponent()];
      },

      scrollOverviewTo: function (overviewPosition, animate) {
        overviewPosition = this.positionOrMax(overviewPosition, this.maxOverviewPosition);
        var oldScrollPercent = this.scrollPercent;
        this.scrollPercent = overviewPosition / this.maxOverviewPosition;
        if (oldScrollPercent != this.scrollPercent) {
          var thumbPosition = this.scrollPercent * this.maxThumbPosition;
          if (animate)
            this.setScrollPositionWithAnimation(overviewPosition, thumbPosition);
          else
            this.setScrollPosition(overviewPosition, thumbPosition);
          this.triggerCustomScroll(oldScrollPercent);
          return true;
        }
        else
          return false;
      },

      positionOrMax: function (p, max) {
        if (p < 0)
          return 0;
        else if (p > max)
          return max;
        else
          return p;
      },

      triggerCustomScroll: function (oldScrollPercent) {
        this.scrollable.$element.trigger("customScroll", {
            scrollAxis: this.sizing.scrollAxis(),
            direction: this.sizing.scrollDirection(oldScrollPercent, this.scrollPercent),
            scrollPercent: this.scrollPercent * 100
          }
        );
      },

      rescroll: function (keepPosition) {
        if (keepPosition) {
          var overviewPosition = this.positionOrMax(this.overviewPosition(), this.maxOverviewPosition);
          this.scrollPercent = overviewPosition / this.maxOverviewPosition;
          var thumbPosition = this.scrollPercent * this.maxThumbPosition;
          this.setScrollPosition(overviewPosition, thumbPosition);
        }
        else {
          var thumbPosition = this.scrollPercent * this.maxThumbPosition;
          var overviewPosition = this.scrollPercent * this.maxOverviewPosition;
          this.setScrollPosition(overviewPosition, thumbPosition);
        }
      },

      setScrollPosition: function (overviewPosition, thumbPosition) {
        this.$thumb.css(this.sizing.offsetComponent(), thumbPosition + "px");
        this.scrollable.$overview.css(this.sizing.offsetComponent(), -overviewPosition + "px");
      },

      setScrollPositionWithAnimation: function (overviewPosition, thumbPosition) {
        var thumbAnimationOpts = {};
        var overviewAnimationOpts = {};
        thumbAnimationOpts[this.sizing.offsetComponent()] = thumbPosition + "px";
        this.$thumb.animate(thumbAnimationOpts, this.scrollable.options.animationSpeed);
        overviewAnimationOpts[this.sizing.offsetComponent()] = -overviewPosition + "px";
        this.scrollable.$overview.animate(overviewAnimationOpts, this.scrollable.options.animationSpeed);
      },

      calculateMaxThumbPosition: function () {
        return Math.max(0, this.sizing.size(this.$scrollBar) - this.thumbSize);
      },

      calculateMaxOverviewPosition: function () {
        return Math.max(0, this.sizing.size(this.scrollable.$overview) - this.sizing.size(this.scrollable.$viewPort));
      },

      setScrollEvent: function (event) {
        var attr = "page" + this.sizing.scrollAxis();
        if (!this.scrollEvent || this.scrollEvent[attr] != event[attr])
          this.scrollEvent = {pageX: event.pageX, pageY: event.pageY};
      },

      scrollToElement: function (element) {
        var $element = $(element);
        if (this.sizing.isInside($element, this.scrollable.$overview) && !this.sizing.isInside($element, this.scrollable.$viewPort)) {
          var elementOffset = $element.offset();
          var overviewOffset = this.scrollable.$overview.offset();
          var viewPortOffset = this.scrollable.$viewPort.offset();
          this.scrollOverviewTo(elementOffset[this.sizing.offsetComponent()] - overviewOffset[this.sizing.offsetComponent()], true);
        }
      },

      remove: function () {
        this.removeMouseMoveScrolling();
        this.removeMouseWheelScrolling();
        this.removeTouchScrolling();
        this.removeMouseClickScrolling();
        this.removeWindowResize();
      },

      stopEventConditionally: function (event, condition) {
        if (condition || this.scrollable.options.preventDefaultScroll) {
          event.preventDefault();
          event.stopPropagation();
        }
      }

    }

    var HSizing = function () {
    }

    HSizing.prototype = {
      size: function ($el, arg) {
        if (arg)
          return $el.width(arg);
        else
          return $el.width();
      },

      minSize: function ($el) {
        return parseInt($el.css("min-width")) || 0;
      },

      maxSize: function ($el) {
        return parseInt($el.css("max-width")) || 0;
      },

      fixedThumbSize: function (options) {
        return options.fixedThumbWidth;
      },

      scrollBar: function ($el) {
        return $el.find(".scroll-bar.horizontal");
      },

      mouseDelta: function (event1, event2) {
        return event2.pageX - event1.pageX;
      },

      offsetComponent: function () {
        return "left";
      },

      wheelDelta: function (deltaX, deltaY) {
        return deltaX;
      },

      scrollAxis: function () {
        return "X";
      },

      scrollDirection: function (oldPercent, newPercent) {
        return oldPercent < newPercent ? "right" : "left";
      },

      scrollingKeys: {
        37: function (viewPortSize) {
          return -10; //arrow left
        },
        39: function (viewPortSize) {
          return 10; //arrow right
        }
      },

      isInside: function (element, wrappingElement) {
        var $element = $(element);
        var $wrappingElement = $(wrappingElement);
        var elementOffset = $element.offset();
        var wrappingElementOffset = $wrappingElement.offset();
        return (elementOffset.left >= wrappingElementOffset.left) &&
          (elementOffset.left + $element.width() <= wrappingElementOffset.left + $wrappingElement.width());
      }

    }

    var VSizing = function () {
    }

    VSizing.prototype = {

      size: function ($el, arg) {
        if (arg)
          return $el.height(arg);
        else
          return $el.height();
      },

      minSize: function ($el) {
        return parseInt($el.css("min-height")) || 0;
      },

      maxSize: function ($el) {
        return parseInt($el.css("max-height")) || 0;
      },

      fixedThumbSize: function (options) {
        return options.fixedThumbHeight;
      },

      scrollBar: function ($el) {
        return $el.find(".scroll-bar.vertical");
      },

      mouseDelta: function (event1, event2) {
        return event2.pageY - event1.pageY;
      },

      offsetComponent: function () {
        return "top";
      },

      wheelDelta: function (deltaX, deltaY) {
        return deltaY;
      },

      scrollAxis: function () {
        return "Y";
      },

      scrollDirection: function (oldPercent, newPercent) {
        return oldPercent < newPercent ? "down" : "up";
      },

      scrollingKeys: {
        38: function (viewPortSize) {
          return -10; //arrow up
        },
        40: function (viewPortSize) {
          return 10; //arrow down
        },
        33: function (viewPortSize) {
          return -(viewPortSize - 20); //page up
        },
        34: function (viewPortSize) {
          return viewPortSize - 20; //page down
        }
      },

      isInside: function (element, wrappingElement) {
        var $element = $(element);
        var $wrappingElement = $(wrappingElement);
        var elementOffset = $element.offset();
        var wrappingElementOffset = $wrappingElement.offset();
        return (elementOffset.top >= wrappingElementOffset.top) &&
          (elementOffset.top + $element.height() <= wrappingElementOffset.top + $wrappingElement.height());
      }

    }

    return this.each(function () {
      if (options == undefined)
        options = defaultOptions;
      if (typeof(options) == "string") {
        var scrollable = $(this).data("scrollable");
        if (scrollable)
          scrollable[options](args);
      }
      else if (typeof(options) == "object") {
        options = $.extend(defaultOptions, options);
        new Scrollable($(this), options);
      }
      else
        throw "Invalid type of options";
    });

  }
;
})
(jQuery);


(function ($) {
"use strict";
  var types = ['DOMMouseScroll', 'mousewheel'];

  if ($.event.fixHooks) {
    for (var i = types.length; i;) {
      $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
  }

  $.event.special.mousewheel = {
    setup: function () {
      if (this.addEventListener) {
        for (var i = types.length; i;) {
          this.addEventListener(types[--i], handler, false);
        }
      } else {
        this.onmousewheel = handler;
      }
    },

    teardown: function () {
      if (this.removeEventListener) {
        for (var i = types.length; i;) {
          this.removeEventListener(types[--i], handler, false);
        }
      } else {
        this.onmousewheel = null;
      }
    }
  };

  $.fn.extend({
    mousewheel: function (fn) {
      return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },

    unmousewheel: function (fn) {
      return this.unbind("mousewheel", fn);
    }
  });


  function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call(arguments, 1), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";

    // Old school scrollwheel delta
    if (orgEvent.wheelDelta) {
      delta = orgEvent.wheelDelta / 120;
    }
    if (orgEvent.detail) {
      delta = -orgEvent.detail / 3;
    }

    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;

    // Gecko
    if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
      deltaY = 0;
      deltaX = delta;
    }

    // Webkit
    if (orgEvent.wheelDeltaY !== undefined) {
      deltaY = orgEvent.wheelDeltaY / 120;
    }
    if (orgEvent.wheelDeltaX !== undefined) {
      deltaX = orgEvent.wheelDeltaX / 120;
    }

    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);

    return ($.event.dispatch || $.event.handle).apply(this, args);
  }

})(jQuery);