var xc = xc || {};

xc.ContentType = {
    FOREGROUND: 0,
    BACKGROUND: 1,
    LOCATION: 2
};

// override the InfoWindow close function to shut down the currently-playing
// track (if any) when the window is closed
(function () {
    var oldClose = google.maps.InfoWindow.prototype.close;
    google.maps.InfoWindow.prototype.close = function () {
        if (this.player) {
            var player = jQuery('#' + this.player);
            player.jPlayer("stop");
            player.jPlayer("destroy");
            player.remove();
        }
        oldClose.apply(this);
    };
})();

xc.createMap = function (elementId, kml, cluster) {
    var defaultOptions = {
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        scrollwheel: false,
        center: new google.maps.LatLng(0,0),
        zoom: 1,
        controlSize: 28
    };
    var m = new google.maps.Map(document.getElementById(elementId), defaultOptions);
    if (kml) {
        m.kml = new google.maps.KmlLayer(kml, {clickable: false, map: m, preserveViewport: true});
    }

    m.cluster = cluster;
    m.markerClusterer = null;
    if (m.cluster) {
        m.markerClusterer = new MarkerClusterer(m, m.allMarkers, {gridSize: 30, imagePath:'/static/img/m'});

        function pointsEqual(markers)
        {
            var pos = null;
            for (i = 0; i < markers.length; i++)
            {
                marker = markers[i];
                if (!pos) {
                    pos = marker.getPosition();
                } else if (!pos.equals(marker.getPosition())) {
                    return false;
                }
            }
            return true;
        }

        google.maps.event.addListener(
            m.markerClusterer, 'click', function (cluster) {
                maxZoom = m.mapTypes[m.getMapTypeId()].maxZoom;
                markers = cluster.getMarkers();

                if ((m.getZoom() == maxZoom) || pointsEqual(markers)) {
                    m.openInfoWindowForCluster(markers, cluster.getCenter());
                }
            }
        );
    }

    m.allMarkers = [];
    m.curInfoWindow = null;

    m.openInfoWindow = function (info, marker) {
        if (this.curInfoWindow) {
            this.curInfoWindow.close();
        }
        info.open(this, marker);
        this.curInfoWindow = info;
        google.maps.event.addListener(
            this, 'click', function () {
                if (this.curInfoWindow) {
                    this.curInfoWindow.close();
                }
                this.curInfoWindow = null;
            }
        );
        google.maps.event.addListener(
            info, 'closeclick', function () {
                info.close();
                this.curInfoWindow = null;
            }
        );
    };

    m.openInfoWindowForCluster = function (markers, pos) {
        div = document.createElement("div");
        div.className = "info-window-content";
        list = document.createElement("ul");
        div.appendChild(list);
        for (i = 0; i < markers.length; i++)
        {
            marker = markers[i];

            listitem = document.createElement("li");
            img = document.createElement("img");
            img.src = marker.getIcon().url;
            img.style.verticalAlign = 'middle';
            img.style.paddingRight = '0.5em';
            listitem.appendChild(img);
            link = document.createElement("a");
            link.appendChild(document.createTextNode(marker.getTitle()));
            link.href="javascript:;";
            // if the click event is triggered immediately, it doesn't show up
            // on the map, so use a small timeout...
            link.onclick = function (marker) {
                return function () {
                    setTimeout(
                        function () {
                            marker.xcactivate()}, 100
                    );}}(marker);
            listitem.appendChild(link);
            list.appendChild(listitem);
        }
        info = new google.maps.InfoWindow({position: pos, content: div});
        this.openInfoWindow(info, null);
    };

    m.addMarker = function (options, id, contentType) {
        var self = this;
        var marker = new google.maps.Marker(options);
        this.allMarkers.push(marker);
        if (this.markerClusterer) {
            this.markerClusterer.addMarker(marker);
        }

        var content = "";
        if (contentType == xc.ContentType.LOCATION) {
            /* just use the tooltip title */
            content = '<div class="info-window-content">' + options.title + '</div>';
        } else {
            /* load the tooltip content dynamically */
            content = '<div class="loading-placeholder"><p>Loading...</p><p><img src="/static/img/ajax-loading.gif"/></p></div>';
        }
        marker.xcactivate = function () {
            var info = new google.maps.InfoWindow({content: content, position: this.getPosition()});
            m.openInfoWindow(info, this);
            if (contentType != xc.ContentType.LOCATION) {
                jQuery.get(
                    "/api/internal/ajax-player", {nr: id, ct: contentType},
                    'json'
                )
                    .done(
                        function (data) {
                              var dcontent = jQuery(data.content);
                              controls = dcontent.find(".jp-type-single");
                              var div = jQuery("<div class='info-window-content'></div>");
                              div.append(dcontent);
                              info.setContent(div.get(0));
                            if (controls.length) {
                                info.player = xcCreatePlayerForControls(controls.get(0));
                            }
                        }
                    )
                    .fail(
                        function (data) {
                              info.setContent("<div class='error'>Unable to load player</div>");
                        }
                    );
            }
            google.maps.event.trigger(this, "activate");
        }

        function markersWithinPixelDistance(marker1, marker2, tolerance)
        {
            var map = marker1.getMap();
            var projection = self.getProjection();
            // apparently this gives you 'world coordinates' that range from 0
            // to 255 independant of zoom level
            p1 = projection.fromLatLngToPoint(marker1.getPosition())
                p2 = projection.fromLatLngToPoint(marker2.getPosition())

                // scale by the zoom level, see
                // https://google-developers.appspot.com/maps/documentation/javascript/examples/map-coordinates
                var numTiles = 1 << self.getZoom();
            px1 = new google.maps.Point(p1.x * numTiles, p1.y * numTiles);
            px2 = new google.maps.Point(p2.x * numTiles, p2.y * numTiles);

            return ((Math.abs(px1.x - px2.x) < tolerance)
                    && (Math.abs(px1.y - px2.y) < tolerance));
        }

        google.maps.event.addListener(
            marker, 'click', function () {
                var clustered = [];
                for (i = 0; i < m.allMarkers.length; i++)
                {
                    // if there are other markers within 5 pixels of this marker at
                    // the current zoom level, it will be hard to click them
                    // independently, so include them in the clustered list
                    if (markersWithinPixelDistance(marker, self.allMarkers[i], 5)) {
                        clustered.push(self.allMarkers[i]);
                    }
                }
                if (clustered.length == 1) {
                    marker.xcactivate();
                } else {
                    m.openInfoWindowForCluster(clustered, marker.getPosition());
                }
            }
        );

        this._registerMarkerHandlers(marker);
    };

    m._registerMarkerHandlers = function (marker) {
        for (var i = 0; i < this.markerHandlers.length; i++)
        {
            var handler = this.markerHandlers[i];
            google.maps.event.addListener(marker, handler.event, handler.handler)
        }
    };

    m.addMarkers = function (markers, specs) {
        var bounds = new google.maps.LatLngBounds();

        // add markers and calculate bounds for viewport
        for (var i = 0; i < markers.length; i++)
        {
            var m = markers[i];
            var p = new google.maps.LatLng(m.lat, m.lon);
            var iconSpec = specs[m.m];
            var img = new google.maps.MarkerImage(
                iconSpec.url,
                new google.maps.Size(
                    iconSpec.width,
                    iconSpec.height
                ),
                null,
                new google.maps.Point(
                    iconSpec.anchorX,
                    iconSpec.anchorY
                )
            );
            bounds.extend(p);

            var options = {position:p,
                title: m.title,
                icon:img,
                zIndex:m.z,
                map: this};
            if (m.animate) {
                options.animation = google.maps.Animation.DROP;
            }

            this.addMarker(options, m.id, m.ct);
        }

        return bounds;
    };

    m.setMarkers = function (markers, specs, fitToBounds) {
        var fitToBounds = typeof fitToBounds !== 'undefined' ? fitToBounds : false;
        for(var i = 0; i < this.allMarkers.length; i++) {
            this.allMarkers[i].setMap(null);
        }

        if (this.markerClusterer) {
            this.markerClusterer.clearMarkers();
        }
        this.allMarkers = [];

        var bounds = this.addMarkers(markers, specs);

        if (markers.length && fitToBounds) {
            this.fitBounds(bounds);

            // ensure that if there are only a few closely-spaced markers on this map,
            // that it doesn't start out zoomed in too tightly, because it's hard to
            // tell where in the world you are when you're zoomed in too far.
            google.maps.event.addListenerOnce(
                m, "zoom_changed", function () {
                    if (m.getZoom() > 6) {
                        m.setZoom(6);
                    }
                }
            );
        }
    };

    m.markerHandlers = [];
    m.registerMarkerEventHandler = function (eventName, func) {
        this.markerHandlers.push({event: eventName, handler: func});
        for (var i = 0; i < this.allMarkers.length; i++)
        {
            var marker = this.allMarkers[i];
            // register new handler on existing markers
            google.maps.event.addListener(marker, eventName, func)
        }
    };

    return m;
};

