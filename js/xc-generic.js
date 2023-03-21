var xc = xc || {};

xc.reEscape = new RegExp('(\\' + ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'].join('|\\') + ')', 'g');

xc.showMessage = function (message) {
    xc.showPopup(message, "success");
}

xc.showErrorMessage = function (message) {
    xc.showPopup(message, "error");
}

xc.showPopup = function (message, classname) {
    var popup = jQuery(".popup");
    if (!popup.length) {
        popup = jQuery("<div class='popup' ></div>");
        jQuery("body").append(popup);
    }
    var flash = jQuery(".flash." + classname);
    if (!flash.length) {
        flash = jQuery("<div class='flash " + classname + "' ><div class='content'/></div>");
        xc.addDismissButton(flash);
        popup.append(flash);
    }

    flash.children(".content").append(jQuery("<p>" + message + "</p>"));
}

xc.fadeRemove = function (element) {
    element.fadeOut(
        500, "linear", function () {
            element.remove();
        }
    );
}

xc.addDismissButton = function (element) {
    var closediv = jQuery("<div class='close'/>");
    var closebutton = jQuery("<a>X</a>");
    closebutton.click(
        function () {
            xc.fadeRemove(element);
        }
    );
    closediv.append(closebutton);
    element.prepend(closediv);
}

xc.playFrom = function (xcid, time) {
    var player = jQuery('.jp-player-' + xcid).first();
    player.jPlayer('pause', time);
    // Slow player present as well?
    if (jQuery('.jp-player-' + xcid).length == 2) {
        var slowPlayer = jQuery('.jp-player-' + xcid).last();
        var factor = (slowPlayer.data('factor') === undefined) ? 1 : parseInt(slowPlayer.data('factor'));
        slowPlayer.jPlayer('pause', time * factor);
    }
}

jQuery(document).ready(
    function () {
        //////////////////////////////////////////////
        // Attach species search autocomplete handlers
        //////////////////////////////////////////////
        var forms = jQuery('form.species-completion');

        forms.each(
            function () {
                var f = jQuery(this);
                var inputs = f.find(".species-input");
                // there can be multiple species completion fields in the
                // same form...
                inputs.each(
                    function () {
                        var input = jQuery(this);
                        var speciesOptions = {
                            serviceUrl: '/api/internal/completion/species',
                            onSelect: function (value, data) {
                                var fnName = input.attr('data-onselect');
                                if (!fnName || !window[fnName]) {
                                    return;
                                }
                                window[fnName](value, data);
                            },
                            minChars: 3,
                            deferRequestBy: 200
                        };
                        var ac = input.autocomplete(speciesOptions)
                        var options = {
                            fnFormatResult: function (value, data, currentValue) {
                                var pattern = '(' + currentValue.replace(xc.reEscape, '\\$1') + ')';
                                var displayName = value;
                                if (data.common_name) {
                                    displayName = data.common_name + ' (' + displayName + ')';
                                }
                                var highlighted = displayName.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>');
                                return "<span class=\"name\">" + highlighted + "</span><span class=\"quantity\">" + data.recordings + "</span>";
                            }
                        };
                        if (input.hasClass('multiple')) {
                            options.delimiter = ',';
                        }
                        ac.setOptions(options);
                    }
                );
            }
        );

        ///////////////////////////////////////////////////////////////////////////
        // set up handlers for implementing the 'placeholder' form functionality in
        // older browsers
        ///////////////////////////////////////////////////////////////////////////
        jQuery('input[placeholder], textarea[placeholder]').placeholder();


        ///////////////////////////////////////////////////
        // set up handlers for displaying 'fancybox' images
        ///////////////////////////////////////////////////
        jQuery('.fancybox, a[rel=lightbox]').fancybox();

        jQuery('.tooltip').each(
            function () {
                if (jQuery(this).attr('data-qtip-content')) {
                    jQuery(this).qtip(
                        {
                            content: {
                                text: jQuery(this).attr('data-qtip-content'),
                                title: {text: jQuery(this).attr('data-qtip-header')}
                            },
                            position: {at: 'bottom center', my: 'top center', viewport: jQuery(window)},
                            show: {solo: true},
                            hide: {delay: 250, fixed: true}
                        }
                    );
                }

            }
        )

        // if the user had selected an auto-complete field but then manually edited it
        // afterwards, we don't want to keep the hidden form field set to the value
        // set when autocompletion triggered.
        jQuery('#quick-search-input').change(
            function () {
                jQuery('#species_nr').val('');
            }
        );
        jQuery('ul.sf-menu').superfish({autoArrows: false});

        jQuery(".flash.error, .flash.warning, .flash.success").each(
            function () {
                var self = jQuery(this);
                xc.addDismissButton(self);
            }
        );
    }
);
