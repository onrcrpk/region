var map = L.map('map-canvas2').setView([51.505, -0.09], 1);
map.addControl(new L.Control.Fullscreen());


new L.basemapsSwitcher([
  {
    layer: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).setOpacity(0.69).addTo(map), //DEFAULT MAP
    icon: '/static/img/topo.jpg',
    name: 'OpenTopo'
  },
  {
    layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    }).setOpacity(0.8),
    maxZoom: 21,
    icon: '/static/img/satellite.jpg',
    name: 'Satellite'
  },
  {
    layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors)'
    }),
    icon: '/static/img/osm.png',
    name: 'OSM'
  },
], { position: 'bottomright' }).addTo(map);


var rectangle = null;
// Define markers layer
const markers = new L.markerClusterGroup({
  spiderfyOnMaxZoom: false,
  showCoverageOnHover: true,
  zoomToBoundsOnClick: false
});

// Add markers layer to map
map.addLayer(markers);
// Initialize variables for tracking mouse events
let isDragging = false;
let startLatLng;
let endLatLng;
// Add event listeners for mouse events
map.on('mousedown', function (e) {
  if (e.originalEvent.shiftKey) {
    isDragging = true;
    startLatLng = e.latlng;
  }
});
map.on('mousemove', function (e) {
  if (isDragging) {
    endLatLng = e.latlng;

    // Draw rectangle on map
    if (!rectangle) {
      rectangle = L.rectangle(L.latLngBounds(startLatLng, endLatLng), {
        color: 'black',
        weight: 2,
        fillOpacity: 0.2
      }).addTo(map);
    } else {
      rectangle.setBounds(L.latLngBounds(startLatLng, endLatLng));
    }
  }
});
map.on('mouseup', function (e) {
  if (isDragging) {
    isDragging = false;
    endLatLng = e.latlng;

    // Construct API URL based on selected area
    const bounds = L.latLngBounds(startLatLng, endLatLng);
    //const url = `https://xeno-canto.org/api/internal/region-results?yn=${bounds._northEast.lat}&xe=${bounds._northEast.lng}&ys=${bounds._southWest.lat}&xw=${bounds._southWest.lng}&query=`;
    const url = `/api/internal/region-results?yn=${bounds._northEast.lat}&xe=${bounds._northEast.lng}&ys=${bounds._southWest.lat}&xw=${bounds._southWest.lng}&query=`;

    // Remove rectangle from map
    if (rectangle) {
      map.removeLayer(rectangle);
      rectangle = null;
    }

    // Fetch data from API
    fetch(url)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        // Clear previous markers
        markers.clearLayers();
        var markersData = data.markers;
        
        // Loop through markers data and add to cluster layer
        for (var i = 0; i < markersData.length; i++) {
          var markerData = markersData[i];
          var markerIcon = L.icon({
            iconUrl: '/static/css/images/marker-icon.png',
            iconSize: [15, 15], // adjust size as needed
          });
          var marker = L.marker([markerData.lat, markerData.lon], { icon: markerIcon });
          marker.bindPopup(markerData.title);
          markers.addLayer(marker);
        }
      });
  }
  markers.on('clusterclick', function(evt) {
    // Check if cluster is at maximum zoom level
    var maxZoom = map.getBoundsZoom(evt.layer.getBounds());
    if (maxZoom === map.getMaxZoom()) {
      // If at max zoom, show list of markers
      var clusterMarkers = evt.layer.getAllChildMarkers();
      var popupContent =
        '<div class="container"><table class="table table-striped">' +
        '<thead><tr><th>Recordings</th></tr></thead>' +
        '<tbody>';
      clusterMarkers.forEach(function(marker) {
        var title = marker.getPopup().getContent();
        popupContent += '<tr><td>' + title + '</td></tr>';
      });
      popupContent += '</tbody></table></div>';
      var popup = L.popup()
        .setLatLng(evt.latlng)
        .setContent(popupContent)
        .openOn(map);
    } else {
      // If not at max zoom, zoom to cluster
      map.flyToBounds(evt.layer.getBounds());
    }
  });
});


// Custom Bounding Box Control
L.Control.BoundingBox = L.Control.extend({
  onAdd: function(map) {
      // Start drawing bounding box immediately
      this.startDrawingBoundingBox();
      
      // Return an empty container
      const container = L.DomUtil.create('div', 'hidden-control');
      return container;
  },

  startDrawingBoundingBox: function() {
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      const drawControl = new L.Control.Draw({
          draw: {
              rectangle: {
                  shapeOptions: {
                      color: '#3388ff',
                      fillOpacity: 0.2
                  }
              },
              polygon: false,
              circle: false,
              marker: false,
              circlemarker: false
          },
          edit: false,
          remove: false
      });

      map.addControl(drawControl);

      map.on('draw:created', function(event) {
          const layer = event.layer;
          drawnItems.clearLayers();
          drawnItems.addLayer(layer);

          const bounds = layer.getBounds();
          const southwest = bounds.getSouthWest();
          const northeast = bounds.getNorthEast();

          const coordinates = {
              swLat: southwest.lat,
              swLng: southwest.lng,
              neLat: northeast.lat,
              neLng: northeast.lng
          };

          // Now you can use the 'coordinates' object to call your API
          // with the bounding box coordinates
          console.log(coordinates);

          // Clear the drawn bounding box
          map.removeLayer(drawnItems);
      });
  }
});

L.control.boundingBox = function(options) {
  return new L.Control.BoundingBox(options);
};

L.control.boundingBox({ position: 'topleft' }).addTo(map);

