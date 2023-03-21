jQuery.noConflict();
jQuery.jPlayer.timeFormat.padMin = false;

function xcCreatePlayerForControls(controls) {
    var filepath = jQuery(controls).attr("data-xc-filepath");
    var xcid = jQuery(controls).attr("data-xc-id");
    var slowFactor = jQuery(controls).attr("data-xc-factor");
    var controlsId = jQuery(controls).attr("id");
    var playerId = "p_" + controlsId;
    var player = jQuery('#' + playerId);
    if (!player.length) {
        player = jQuery(document.createElement("div"));
        player.addClass("jp-player");
        player.addClass("jp-player-" + xcid);
        player.attr("id", playerId);
        player.attr("data-factor", slowFactor);
        player.attr("data-init-error", "");
        jQuery(document.body).append(player);
    }
    initializeXCPlayer(playerId, controlsId, xcid, filepath);
    return playerId;
}

var noSolutionNotified = false;

/* FIXME: find a way to translate these... */
function noSolutionMessage(event) {
    var nativeMp3 = event.jPlayer.html.audio.available && event.jPlayer.html.canPlay.mp3;
    var message = "Your browser does not support playing the audio files on xeno-canto. While you can still download the files to play them on your computer, the audio players on the website will not work properly. ";
    if (!event.jPlayer.flash.available && !nativeMp3)
        message += "Possible solutions include upgrading to a recent browser that supports the MP3 format, installing or upgrading <a href='http://get.adobe.com/flashplayer/'>Flash Player</a>, or disabling flash blockers for this site."
    else if (!event.jPlayer.flash.available)
        message += "Try installing or upgrading <a href='http://get.adobe.com/flashplayer/'>Flash Player</a> or disabling any flash blockers for this site."
    else if (!nativeMp3)
        message += "Try upgrading to a recent browser that supports the MP3 format."

    return message;
}

function initializeXCPlayer(playerId, controlsId, xcid, filename) {
    var player = jQuery('#' + playerId);
    player.jPlayer({
        ready: function () {
            jQuery(this).jPlayer("setMedia", {
                mp3: filename
            });
        },
        play: function (event) { // only play one audio clip at a time
            var error = player.data("init-error");
            if (!error) {
                // force playhead to start at beginning (mini-players other start at click position)
                if (event.jPlayer.status.currentTime == 0 && event.jPlayer.status.paused === false) {
                    jQuery(this).jPlayer("playHead", 0);
                }
                jQuery(this).jPlayer("pauseOthers");
                jQuery.post("/api/internal/play-ping", {XC: xcid});
            } else {
                xc.showErrorMessage('XC' + xcid + ': ' + player.data("init-error"));
            }
        },
        error: function (event) {
            var message = event.jPlayer.error.message;
            if (event.jPlayer.error.type == jQuery.jPlayer.error.NO_SOLUTION) {
                noSolutionNotified = true;
                return;
            }

            if (noSolutionNotified) {
                message = noSolutionMessage(event);
            }

            player.data("init-error", message);
        },
        cssSelectorAncestor: '#' + controlsId,
        swfPath: "/static/js/jplayer",
        solution: "html,flash",
        supplied: "mp3",
        errorAlerts: false,
        warningAlerts: false,
        wmode: "window"
    });
}

jQuery(document).ready(function() {
    // Load jPlayer for non-mini players
    jQuery(".jp-type-single").each(function () {
            xcCreatePlayerForControls(this);
        }
    );

    // Light version for mini-players that circumvents jPlayer
    var isPlaying;
    var playButton;
    var pauseButton;

    jQuery('button.xc-mini-player').click(
        function () {
            var audioId = this.id.replace('btn_', '');
            var audio = jQuery('audio#' + audioId);
            var icon = jQuery(this).data("icon");
            playButton = '/static/img/play-' + icon + '.svg'
            pauseButton = '/static/img/pause-' + icon + '.svg';

            if (audio[0].error != null) {
                xc.showErrorMessage('XC' + this.id.split('_')[3] + ': Media URL could not be loaded.');
            } else if (audioId != isPlaying) {
                // Pause all other audio
                jQuery("audio").each(function(){
                    this.pause();
                });
                isPlaying = audioId;
                audio[0].play();
            } else {
                isPlaying = false;
                audio[0].pause();
            }
        }
    );

    jQuery("audio").on({
        play: function() {
            jQuery(this).next().children().attr('src', pauseButton);
            // jPlayer posts itself, so only update count for mini-player
            if (jQuery(this).hasClass('xc-mini-player')) {
                jQuery.post("/api/internal/play-ping", {XC: this.id.split('_')[2]});
            }
        },
        pause: function() {
            jQuery(this).next().children().attr('src', playButton);
        }
    })

    function play() {
        jQuery("audio.xc-mini-player").trigger("play");
    }

    function pause() {
        jQuery("audio.xc-mini-player").trigger("pause");
    }
});