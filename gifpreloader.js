/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, browser:true, devel:true, indent:4, maxerr:50, white:false */
/*global jQuery MutationSummary */
/*
 * GifPreloader
 * https://github.com/xadet/GifPreloader
 *
 * Includes jQuery
 * http://jquery.com/
 *
 * Includes mutation-summary
 * https://code.google.com/p/mutation-summary/
 *
 * Copyright 2013 Jack Wakefield
 * Released under the MIT license
 */
(function($, window, document, undefined) {
	'use strict';

	var pluginName = 'gifPreloader';

    /**
     * Initialise the plugin.
     * @param {DOMElement} element The image element.
     */
    function Plugin(element) {
        this.element = element;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {
        /**
         * Store the related elements and retrieve the image data.
         */
        init: function() {
            var self = this;

            this.$image = $(this.element);
            this.source = this.$image.prop('src');
            this.$placeholder = null;
            this.reloadedImage = false;

            this.$image.load(function() {
                self.imageLoaded();
            });

            // ensure the image isn't cached and that the image is an absolute or relative path
            // and not inline data
            if (!this.hasImageLoaded() && (this.source.substr(0, 4) === 'http' ||
                this.source.substr(0, 1) === '/')) {
                this.retrieveImageHeader();
            }
        },

        /**
         * Retrieves the image header data. If the image is deemed to be a GIF, create the
         * placeholder.
         */
        retrieveImageHeader: function() {
            var self = this;

            $.ajax({
                url: this.source,
                headers: {'Range': 'bytes=0-9'},
                xhrFields : {
                    responseType : 'arraybuffer'
                },
                dataType : 'binary',
                success: function(data) {
                    // create the dataview from the retrieved date
                    self.dataView = new DataView(data, 0, 10);

                    // ensure the image if a GIF and create the placeholder
                    if (self.getImageHeader() === 'GIF') {
                        self.createPlaceholder();
                    }
                }
            });
        },

        /**
         * Called when the image has been loaded.
         */
        imageLoaded: function() {
            if (this.$placeholder !== null) {
                if (!this.reloadedImage) {
                    // if the image has not been loaded before, reset the src attributes to re-play
                    // the animation
                    this.reloadedImage = true;
                    this.$image.attr('src', this.source);
                } else {
                    // if the image has been loaded before then remove the placeholder and unwrap
                    // the image element as the animation has been restarted
                    this.$placeholder.remove();
                    this.$image.unwrap();
                }
            }
        },

        /**
         * Create the loading placeholder over the image.
         */
        createPlaceholder: function() {
            // ensure the image hasn't been loaded
            if (!this.hasImageLoaded()) {
                // set the width and height attributes to the image size if they are not present
                // to allow the overlay to have fixed dimensions
                if (!this.$image.attr('width') && !this.$image.attr('height')) {
                    this.$image.attr('width', this.getImageWidth());
                    this.$image.attr('height', this.getImageHeight());
                    this.$image.css('min-width', '');
                    this.$image.css('max-width', '');
                    this.$image.css('min-height', '');
                    this.$image.css('max-height', '');
                }

                // create the overlay container element to wrap around the image
                this.$container = $('<div>')
                    .css('position', 'relative')
                    .css('width', this.$image.width())
                    .css('height', this.$image.height());

                // create the placeholder element
                this.$placeholder = $('<div class="preloader-placeholder">')
                    .css('width', this.$image.width())
                    .css('height', this.$image.height())
                    .css('line-height', this.$image.height() + 'px')
                    .html('Loading...');

                // wrap the container around the image and add the placeholder to the front of
                // the container
                this.$image.wrap(this.$container);
                this.$image.parent().append(this.$placeholder);
            }
        },

        /**
         * Retrieve the image header.
         * @return {string} The image header.
         */
        getImageHeader: function() {
            if (this.dataView === null) {
                return '';
            }

            return String.fromCharCode(this.dataView.getUint8(0)) +
                String.fromCharCode(this.dataView.getUint8(1)) +
                String.fromCharCode(this.dataView.getUint8(2));
        },

        /**
         * Retrieve the image width.
         * @return {int} The image width.
         */
        getImageWidth: function() {
            if (this.dataView === null) {
                return 0;
            }

            return this.dataView.getUint16(6, true);
        },

        /**
         * Retrieve the image height.
         * @return {int} The image height.
         */
        getImageHeight: function() {
            if (this.dataView === null) {
                return 0;
            }

            return this.dataView.getUint16(8, true);
        },

        /**
         * Determines whether the image has loaded.
         * @return {Boolean} A value determining whether the image has loaded.
         */
        hasImageLoaded: function() {
            return this.element.complete || this.element.readyState === 'complete' ||
                this.element.readyState === 4;
        }
    };

    $.fn[pluginName] = function() {
        return this.each(function() {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin(this));
            }
        });
    };

    // create a mutation summary to be notified of when image elements are added to the DOM
    new MutationSummary({
        callback: function(summaries) {
            var imageSummary = summaries[0];

            imageSummary.added.forEach(function(element) {
                $(element).gifPreloader();
            });
        },
        queries: [{ element: 'img' }]
    });

    $('img').gifPreloader();
})(jQuery, window, document);
