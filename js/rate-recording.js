// rating should be 1-5
function RateRecording(id, rating)
{
    var qbutton = jQuery('#rating-' + id + '-' + rating);
    qbutton.siblings('li').each(
        function () {
            jQuery(this).removeClass('pending');
        }
    );
    qbutton.addClass('pending');
    jQuery.post(
        "/api/internal/rate-recording", {snd_nr: id, quality: rating},
        function (data) {
            if (data.success) {
                qbutton.siblings('li').each(
                    function () {
                        jQuery(this).removeClass('selected');
                    }
                );
                qbutton.addClass('selected');
            }
        }, 'json'
    ).always(
        function () {
            qbutton.removeClass('pending')}
    );
    return false;
}
