var xcmap = null;
var newLocationMarker = null;
var elevationService = new google.maps.ElevationService();
var geocoder = new google.maps.Geocoder();
var selectedMarker = null;
var unselectedIcon = null;
var unselectedZIndex = 0;
var selectedZIndex = 100;
var selectedIcon = new google.maps.MarkerImage('/static/img/markers/a-14.png', new google.maps.Size(14, 14), null, new google.maps.Point(7, 7));
var defaultUnselectedIcon = new google.maps.MarkerImage('/static/img/markers/q-14.png', new google.maps.Size(14, 14), null, new google.maps.Point(7, 7));
var existingLocationIcon = new google.maps.MarkerImage('/static/img/markers/u-14.png', new google.maps.Size(14, 14), null, new google.maps.Point(7, 7));

function clearCurrentLocation() {
    // clear existing data from hidden form fields
    // jQuery('#loc-country').val('');
    // jQuery('#loc-country-code').val('');
    // jQuery('#loc-title').val('');
    //jQuery('#upload-step-submit').attr('disabled', 'disabled');
    // jQuery('#loc-existing-location').val('false');
    jQuery('#loc-latitude').val('');
    jQuery('#loc-longitude').val('');
    // jQuery('#loc-elevation').val('');
    jQuery('#input-map-coords').val('');
    jQuery('#coords-form').html(none);
    jQuery('#current-selection-clear').hide();

    // remove new markers
    if (newLocationMarker) {
        newLocationMarker.setMap(null);
        newLocationMarker = null;
    }
}

function updateCurrentLocationDisplay() {
    var title = jQuery('#loc-title').val();
    var country = jQuery('#loc-country').val();
    var lat = jQuery('#loc-latitude').val();
    var lng = jQuery('#loc-longitude').val();

    var components = [];
    if (title) {
        components.push(title);
    }
    if (country) {
        components.push(country);
    }
    var coords = Math.round(lat * 10000) / 10000 + ', ' + Math.round(lng * 10000) / 10000;
    jQuery('#input-map-coords').val(coords);
    jQuery('#coords-form').html(coords);
    jQuery('#current-selection-clear').show();

    jQuery("#upload-step-submit").removeAttr('disabled');
}

function getAddressComponentType(geocoderResults, t, name) {
    name = name || "long_name";
    for (var i = 0; i < geocoderResults.length; i++) {
        var result = geocoderResults[i];
        for (var j = 0; j < result.address_components.length; j++) {
            component = result.address_components[j];

            if (jQuery.inArray(t, component.types) != -1) {
                return component[name];
            }
        }
    }
}

function selectLocation(marker, defaultTitle, skipMapQuery) {
    if (defaultTitle) {
        // quick hack to decode any potential html entities
        defaultTitle = jQuery('<div />').html(defaultTitle).text();
    }

    if (!marker || marker == selectedMarker) {
        return;
    }

    if (selectedMarker) {
        if (!unselectedIcon) {
            unselectedIcon = defaultUnselectedIcon;
        }
        selectedMarker.setIcon(unselectedIcon);
        selectedMarker.setZIndex(unselectedZIndex);
        selectedMarker = null;
        if (selectedMarker && (selectedMarker == newLocationMarker))
            selectedMarker.setMap(null);
    }
    selectedMarker = marker;
    // save the old zindex
    unselectedZIndex = marker.getZIndex();
    selectedMarker.setZIndex(selectedZIndex);

    if (!marker) {
        return;
    }
    unselectedIcon = marker.getIcon();
    selectedMarker.setIcon(selectedIcon);

    var latLng = marker.position;
    var geocodeResponse = false;
    var elevationResponse = false;

    jQuery("#loc-latitude").val(latLng.lat());
    jQuery("#loc-longitude").val(latLng.lng());

    if (skipMapQuery) {
        updateCurrentLocationDisplay();
        return;
    }

    elevationService.getElevationForLocations({'locations': [latLng]}, function (results, status) {
        elevationResponse = true;
        if (status == google.maps.ElevationStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var rounded = result.elevation;
                if (rounded > 1000)
                    rounded = Math.round(rounded / 100) * 100;
                else if (rounded > 500)
                    rounded = Math.round(rounded / 50) * 50;
                else if (rounded > 200)
                    rounded = Math.round(rounded / 20) * 20;
                else
                    rounded = Math.round(rounded / 10) * 10;
                jQuery("#loc-elevation").val(rounded);
                break;
            }
        }
        if (geocodeResponse)
            updateCurrentLocationDisplay();
    });

    geocoder.geocode({'location': latLng}, function (results, status) {
        geocodeResponse = true;
        if (status == google.maps.GeocoderStatus.OK) {
            var country = getAddressComponentType(results, 'country');
            var countryCode = getAddressComponentType(results, 'country', 'short_name');
            if (!defaultTitle) {
                var title = [];

                var locality = getAddressComponentType(results, 'locality');

                var component;

                // local name, try different types since sometimes certain
                // components are not available
                if (!(component = getAddressComponentType(results, 'natural_feature'))) {
                    if (!(component = getAddressComponentType(results, 'establishment'))) {
                        if (!(component = getAddressComponentType(results, 'park'))) {
                            component = getAddressComponentType(results, 'administrative_area_level_3');
                        }
                    }
                }
                if (component && locality) {
                    if (component.toLowerCase() != locality.toLowerCase())
                        component += " (near  " + locality + ")"
                } else if (locality)
                    component = locality;

                if (component)
                    title.push(component);

                // 'county'
                component = getAddressComponentType(results, 'administrative_area_level_2');
                if (component)
                    title.push(component);

                // 'state'
                component = getAddressComponentType(results, 'administrative_area_level_1');
                if (component)
                    title.push(component);

                jQuery("#loc-title").val(title.join(', '));
            } else {
                jQuery("#loc-title").val(defaultTitle);
            }
            jQuery("#loc-country").val(country);
            jQuery("#loc-country-code").val(countryCode);
        } else {
            jQuery("#loc-title").val("");
            jQuery("#loc-country").val("");
            jQuery("#loc-country-code").val("");
        }

        if (elevationResponse)
            updateCurrentLocationDisplay();
    });
}

function newMarker(options) {
    if (!options)
        options = {};
    if (!options.icon)
        options.icon = defaultUnselectedIcon;
    if (!options.zIndex)
        options.zIndex = 10;
    options.map = xcmap;
    var marker = new google.maps.Marker(options);

    google.maps.event.addListener(marker, 'click', function () {
        clearCurrentLocation();
        selectLocation(this, this.title);
    });

    return marker;
}

function locationMapClicked(event) {
    clearCurrentLocation();
    newLocationMarker = newMarker({position: event.latLng});
    selectLocation(newLocationMarker);
}

function locationMarkerActivated() {
    clearCurrentLocation();
    jQuery("#loc-existing-location").val('true');
    selectLocation(this, this.title);
}

function validCoordinates(lat, lon) {
    var validLat = /^(-?[1-8]?\d(?:\.\d{1,18})?|90(?:\.0{1,18})?)$/.test(lat);
    var validLon = /^(-?(?:1[0-7]|[1-9])?\d(?:\.\d{1,18})?|180(?:\.0{1,18})?)$/.test(lon);

    if (validLat && validLon) {
        return true;
    }
    return false;
}


jQuery(document).ready(function () {
    xcmap = xc.initMap();
    google.maps.event.addListener(xcmap, "click", locationMapClicked);
    xcmap.registerMarkerEventHandler("activate", locationMarkerActivated);

    var searchMarkers = null;
    var nearbyMarkers = null;

    function clearSearchMarkers() {
        if (searchMarkers) {
            for (var i = 0; i < searchMarkers.length; i++) {
                searchMarkers[i].setMap(null);
            }
        }
        searchMarkers = [];
    }

    jQuery('#map-search').bind('submit', function () {
        clearSearchMarkers();

        var addr = jQuery('#map-search-input').val()
        var responses = {
            n: 0,
            searchBounds: new google.maps.LatLngBounds(),
            done: function () {
                this.n++;
                if (this.n == 2)
                    xcmap.fitBounds(this.searchBounds);
            }
        };

        geocoder.geocode({'address': addr}, function (results, status) {
            geocodeResponse = true;
            if (status == google.maps.GeocoderStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    var geometry = results[i].geometry
                    searchMarkers.push(newMarker({
                        title: results[i].formattedAddress,
                        position: geometry.location,
                        zIndex: 60
                    }));
                    if (!geometry.bounds)
                        responses.searchBounds.extend(geometry.location);
                    else
                        responses.searchBounds.union(geometry.bounds);
                }

            }
            responses.done();
        });

        // also get matching locations for the XC database
        jQuery.get(locationApiUrl, {query: 'loc:"' + addr + '"'},
            function (data) {
                if (!data.error) {
                    for (var i = 0; i < data.results.length; i++) {
                        var p = new google.maps.LatLng(data.results[i].lat, data.results[i].lng);
                        searchMarkers.push(newMarker({title: data.results[i].name, position: p, zIndex: 60}));
                        responses.searchBounds.extend(p);
                    }
                }
                responses.done();
            }, 'json');

        // don't submit form
        return false;
    });

    function enableDisableMap() {
        if (jQuery('#loc-checkbox').is(':checked')) {
            var button = jQuery('#upload-step-submit');

            // clear existing data from hidden form fields
            clearCurrentLocation();
            selectLocation(null);

            // allow user to submit without a location
            button.removeAttr('disabled');
            jQuery('#map-container').hide();
        } else {
            jQuery('#map-container').show();
           //jQuery("#upload-step-submit").attr('disabled', 'disabled');
        }
        // Bit ugly, but date picker doesn't like dynamic forms
        jQuery('#recording-date').Zebra_DatePicker({direction: false, readonly_element: false, format: 'Y-m-d'});

    }

    jQuery('#loc-checkbox').change(function () {
        enableDisableMap()
    });
    enableDisableMap();

    jQuery('#current-selection-clear').click(function () {
        clearCurrentLocation();
        selectLocation(null);
    });

    google.maps.event.addListener(xcmap, "zoom_changed", delayedRefreshResults);
    google.maps.event.addListener(xcmap, "bounds_changed", delayedRefreshResults);

    var refreshTimeout = 0;

    function delayedRefreshResults() {
        if (refreshTimeout)
            window.clearTimeout(refreshTimeout);
        refreshTimeout = window.setTimeout(refreshNearbyResults, 200)
    }

    function refreshNearbyResults() {
        if (nearbyMarkers) {
            for (var i = 0; i < nearbyMarkers.length; i++) {
                nearbyMarkers[i].setMap(null);
            }
        }

        nearbyMarkers = [];

        if (xcmap.getZoom() >= 7) {
            var bounds = xcmap.getBounds();
            jQuery.get(locationApiUrl, {query: 'box:' + bounds.toUrlValue(3)},
                function (data) {
                    if (!data.error) {
                        for (var i = 0; i < data.results.length; i++) {
                            nearbyMarkers.push(newMarker({
                                title: data.results[i].name,
                                icon: existingLocationIcon,
                                position: new google.maps.LatLng(data.results[i].lat, data.results[i].lng)
                            }));
                        }

                    }
                }, 'json')
        }
    }

    jQuery('#map-search-input').autocomplete({
        serviceUrl: completionLocationUrl,
        params: {'coords': 1},
        onSelect: function (value, data) {
            clearSearchMarkers();
            var p = new google.maps.LatLng(data.lat, data.lng);
            var marker = newMarker({title: value, position: p, zIndex: 60});
            searchMarkers.push(marker);
            xcmap.setZoom(7);
            xcmap.panTo(p);
            selectLocation(marker, value);
        }
    });

    jQuery("#map-coords-display").click(function () {
        var strCoords = jQuery("#input-map-coords").val();
        var coords = strCoords.split(',').map(function (item) {
            return item.trim();
        });
        if (coords.length == 2 && validCoordinates(coords[0], coords[1])) {
            var event = {latLng: new google.maps.LatLng(coords[0], coords[1])};
            locationMapClicked.call(xcmap, event);
            xcmap.panTo(event.latLng);
            jQuery('#input-map-coords').val(coords[0] + ',' + coords[1]);
        } else {
            jQuery('#input-map-coords').val('');
        }
    });

    jQuery('#input-map-coords').keydown(function (event) {
        var keyCode = (event.keyCode ? event.keyCode : event.which);
        if (keyCode == 13) {
            jQuery("#map-coords-display").trigger('click');
        }
    });

    /* timePicker is from https://github.com/perifer/timePicker */
    jQuery('#recording-time').timePicker({step: 30});
    jQuery('#recording-date').Zebra_DatePicker({direction: false, readonly_element: false, format: 'Y-m-d'});
});