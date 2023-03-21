var xc = xc || {};

xc.onplothover = function (event, pos, item) {
    function showTooltip(x, y, contents)
    {
        jQuery("<div class='plot-tooltip' id='plot-tooltip'>" + contents + "</div>").css(
            {
                position: 'absolute',
                display: 'none',
                top: y + 5,
                left: x + 5,
            }
        ).appendTo('body').fadeIn(200);
    }

    if (item) {
        if (previousPoint != item.dataIndex) {
            previousPoint = item.dataIndex;

            jQuery('#plot-tooltip').remove();
            var x = item.datapoint[0],
                y = item.datapoint[1];

            showTooltip(item.pageX, item.pageY, y);
        }
    } else {
        jQuery('#plot-tooltip').remove();
        previousPoint = null;
    }
}

