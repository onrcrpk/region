    var map = L.map('map-upload').setView([51.505, 10], 3.5);

    new L.basemapsSwitcher([
      {
        layer: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).setOpacity(0.8).addTo(map), //DEFAULT MAP
        icon: '/static/js/img/topo.jpg',
        name: 'OpenTopo'
      },
      {
        layer: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
        }).setOpacity(0.8),
        maxZoom: 21,
        icon: '/static/js/img/satellite.jpg',
        name: 'Satellite'
      },
      {
        layer: L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors)'
        }),
        icon: '/static/js/img/osm.png',
        name: 'OSM'
      },
    ], { position: 'bottomright' }).addTo(map);



    const infoBox = document.createElement('div');
    infoBox.className = 'info-box';
    document.getElementById('map-upload').after(infoBox);

    let marker;

    map.on('click', async function (e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      // Display selected coordinates
      const selectedCoordsElem = document.createElement('div');
      selectedCoordsElem.innerHTML = `<strong>Coordinates:</strong> ${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}`;
      infoBox.innerHTML = '';
      infoBox.appendChild(selectedCoordsElem);

      // Add loading message to a separate div element
      const loadingElem = document.createElement('div');
      loadingElem.innerHTML = 'API is loading...';
      infoBox.appendChild(loadingElem);

      // Make a request to the OSM Nominatim API to get the address information
      const nominatimResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`);
      const nominatimData = await nominatimResponse.json();

      // Remove loading message
      loadingElem.remove();

      const country = nominatimData.address.country || '';
      const city = nominatimData.address.province || nominatimData.address.city || nominatimData.address.town || nominatimData.address.municipality || '';
      const street = nominatimData.address.road || '';
      const postalCode = nominatimData.address.postcode || '';
      const fullAddress = nominatimData.display_name || '';

      // Build the HTML content for the info box
      const infoBoxContent = `
    <div><strong>Country:</strong> ${country}</div>
    <div><strong>City:</strong> ${city}</div>
    <div><strong>Full Address:</strong> ${fullAddress}</div>
  `;
      const addressElem = document.createElement('div');
      addressElem.innerHTML = infoBoxContent;
      infoBox.appendChild(addressElem);

      // Remove previous marker, if any
      if (marker) {
        map.removeLayer(marker);
      }

      // Create a custom icon
      var customIcon = L.icon({
        iconUrl: '/static/js/img/marker-icon.png',
        iconSize: [15, 15], // size of the icon
      });

      // Create new marker with custom icon and add to map
      marker = L.marker(e.latlng, { icon: customIcon }).addTo(map);



      // Make a request to the GeoNames API to get nearby places
      const geoNamesResponse = await fetch(`https://secure.geonames.org/findNearbyJSON?lat=${e.latlng.lat}&lng=${e.latlng.lng}&username=onrcrpk`);
      const geoNamesData = await geoNamesResponse.json();

      // Display nearby places from GeoNames API
      if (geoNamesData.geonames.length > 0) {
        const geoNamesPlaces = geoNamesData.geonames.map(place => `${place.name}`);
        const geoNamesPlacesElem = document.createElement('div');
        geoNamesPlacesElem.innerHTML = `<strong>GeoNames API nearby places:</strong> ${geoNamesPlaces.join(', ')}`;
        infoBox.appendChild(geoNamesPlacesElem);
      }

      // Make a request to the GeoNames API to get elevation data
      const elevationResponse = await fetch(`https://secure.geonames.org/srtm1JSON?lat=${e.latlng.lat}&lng=${e.latlng.lng}&username=onrcrpk`);
      const elevationData = await elevationResponse.json();

      // Display elevation data from GeoNames API
      if (elevationData && elevationData.srtm1) {
        const elevation = elevationData.srtm1;
        const elevationElem = document.createElement('div');
        elevationElem.innerHTML = `<strong>Elevation:</strong> ${elevation} meters`;
        infoBox.appendChild(elevationElem);
      } else {
        const elevationErrorElem = document.createElement('div');
        elevationErrorElem.innerHTML = `<strong>Elevation:</strong> Unknown`;
        infoBox.appendChild(elevationErrorElem);
      }
	  

    });

