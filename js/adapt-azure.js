/*
* adapt-azure
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Mike Stevens <mesgraphix@gmail.com>
*/

define(function(require) {

    var ComponentView = require('coreViews/componentView');
    var Adapt = require('coreJS/adapt');

    var azure = ComponentView.extend({
        defaults:function() {
            return {
                player:null
            }
        },
        
        events: function() {
            return Adapt.device.touch == true ? {
                'touchmove': 'onEnded',
                'touchmove': 'trackplayAMP',
                'click .azure-inline-transcript-button': 'onToggleInlineTranscript'
            } : {
                'mousemove': 'onEnded',
                'mousemove': 'trackplayAMP',
                'click .azure-inline-transcript-button': 'onToggleInlineTranscript'
            }
        },

        initialize: function() {
            ComponentView.prototype.initialize.apply(this);

            _.bindAll(this, 'onInview', 'onPlay', 'onEnded' );
            Adapt.on("azureVideoComplete", () => {
                console.log("[Azure] Received completion signal from iframe.");
                this.setCompletionStatus();  // â¬…ï¸ This marks the video complete reliably
            });

            /*if (window.onAzureIframeAPIReady === undefined) {
                window.onAzureIframeAPIReady = function() {
                    Adapt.azureAPIReady = true;
                    Adapt.trigger('azureAPIReady');
                };
                $.getScript('assets/www-widgetapi.js');
            }*/

            //FIREFOX CLOSED CAPTIONS SWITCH OF PLAYER
            _.delay(function() {
                const hlsSrc = this.model.get('_media')._source;
                const hlsCapLabel = this.model.get('_media')._caplabel;
                const hlsSrcLabel = this.model.get('_media')._srclang;
                const hlsCaptions = this.model.get('_media')._captions;
                const hlsCapkind = this.model.get('_media')._capkind;
                const hlsAutoplay = this.model.get('_media')._autoplay;
                const hlsFullscreen = this.model.get('_media')._setFullscreen;
                const hlsControls = this.model.get('_media')._controls;
                const hlsPoster = this.model.get('_media')._poster;
                const hlsScrubber = this.model.get('_media')._scrubber;
                const hlsCaptiononauto = this.model.get('_media')._captiononauto;

                if (navigator.userAgent.search("Firefox") >= 0) {
                    $('iframe[src*="assets/azure.htm"]').addClass("hlsfirefox").attr("src","assets/azure-ORIGINAL.htm?url=//" + hlsSrc + "&captions=" + hlsCapLabel + "," + hlsSrcLabel + ",//" + hlsCaptions + "&kind=" + hlsCapkind + "&autoplay=" + hlsAutoplay + "&fullscreen=" + hlsFullscreen + "&controls=" + hlsControls + "&poster=" + hlsPoster + "&scrubber=" + hlsScrubber + "&caponoff=" + hlsCaptiononauto);
                } else {
                    //do nothing
                }
            }.bind(this), 555);
        },

        preRender: function() {
            this.listenTo(Adapt, {
              'device:resize device:changed': this.setIFrameSize
            });
        },

        setIFrameSize: function () {
            //IF MOBILE ADD THE CLASS
            if ($('html').hasClass('touch')) {
                $('iframe').addClass("vjs-touch-enabled");
            } else {
                //DO NOTHING
            }
            this.$('.azuremediaplayer').width(this.$('.azure-widget').width());
            this.$('iframe').width(this.$('.azure-widget').width());
            
            var aspectRatio = (this.model.get("_media")._aspectRatio ? parseFloat(this.model.get("_media")._aspectRatio) : 1.778);//default to 16:9 if not specified
            if (!isNaN(aspectRatio)) {
                this.$('.azuremediaplayer').height(this.$('.azure-widget').width() / aspectRatio);
                this.$('iframe').height(this.$('.azure-widget').width() / aspectRatio);
            }
        },

        postRender: function() {

            //if (Adapt.azureAPIReady === true) {
                this.onAzureIframeAPIReady();
            /*} else {
                Adapt.once('azureAPIReady', this.onAzureIframeAPIReady, this)
            }*/
        },

        remove: function() {
            if(this.player != null) {
                this.player.dispose();
            }

            ComponentView.prototype.remove.call(this);
        },
    
        setupEventListeners: function() {
            var currentazureon = this.model.get('_id');
            this.completionEvent = (!this.model.get('_setCompletionOn')) ? 'play' : this.model.get('_setCompletionOn');
            if (this.completionEvent === "inview") {
                $('.' + currentazureon + ' .azure-widget').on('inview', this.onInview);
            } else if (this.completionEvent === "play") {
                $('.' + currentazureon + ' .azure-widget').on('inview', this.onPlay);
            } else if (this.completionEvent === "ended") {
                $('.' + currentazureon + ' .azure-widget').on('inview', this.onEnded);
            }
        },

        onInview: function(event, visible, visiblePartX, visiblePartY) {
             var currentazureon = this.model.get('_id');
             $('.' + currentazureon + ' .removeazureie').addClass('azureinviewmode');
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    this.$('.component-inner').off('inview');
                    if ( $('.' + currentazureon + ' .removeazureie').hasClass('azureinviewmode') ) {
                        this.setCompletionStatus();
                    }
                }
            }
        },

        //Will not track properly if using same video source
        onPlay: function(event, visible, visiblePartX, visiblePartY) {
            var currentazureon = this.model.get('_id');
            $('.' + currentazureon + ' .removeazureie').addClass('azureplaymode');
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;
                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    $(checkForChanges1);
                }
                var self = this;
                function checkForChanges1() {
                    if ($('.' + currentazureon + ' .azureplaymode').hasClass('vjs-has-started')) {
                        self.setCompletionStatus();
                    } else {
                        setTimeout(checkForChanges1, 500);
                    }
                }
            }
        },

        //Will not track properly if using same video source
        onEnded: function(event, visible, visiblePartX, visiblePartY) {
            var currentazureon = this.model.get('_id');
            $('.' + currentazureon + ' .removeazureie').addClass('azureendmode');
            if (visible) {
                if (visiblePartY === 'top') {
                    this._isVisibleTop = true;

                } else if (visiblePartY === 'bottom') {
                    this._isVisibleBottom = true;
                } else {
                    this._isVisibleTop = true;
                    this._isVisibleBottom = true;
                }

                if (this._isVisibleTop && this._isVisibleBottom) {
                    $(checkForChanges2);
                }
            }
            var self = this;
            function checkForChanges2() {
                if ($('.' + currentazureon + ' .azureendmode').hasClass('vjs-ended')) {
                    self.setCompletionStatus();
                } else {
                    setTimeout(checkForChanges2, 500);
                }
            }
        },
        
        onToggleInlineTranscript: function(event) {
            if (event) event.preventDefault();
            var $transcriptBodyContainer = this.$(".azure-inline-transcript-body-container");
            var $button = this.$(".azure-inline-transcript-button");

            if ($transcriptBodyContainer.hasClass("inline-transcript-open")) {
                $transcriptBodyContainer.slideUp(function() {
                    $(window).resize();
                });
                $transcriptBodyContainer.removeClass("inline-transcript-open");
                $button.html(this.model.get("_transcript").inlineTranscriptButton);
            } else {
                $transcriptBodyContainer.slideDown(function() {
                    $(window).resize();
                }).a11y_focus();
                $transcriptBodyContainer.addClass("inline-transcript-open");
                $button.html(this.model.get("_transcript").inlineTranscriptCloseButton);
                if (this.model.get('_transcript')._setCompletionOnView !== false) {
                    this.setCompletionStatus();
                }
            }
        },

        onAzureIframeAPIReady: function() {

            this.isPlaying = false;
            
            this.setReadyStatus();
            
            this.setupEventListeners();
            
            this.setIFrameSize();
        }

    },
    {
        template: 'azure'
    });
    
    Adapt.register("azure", azure );

    return azure;
});
