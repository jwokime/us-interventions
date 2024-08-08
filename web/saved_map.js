// map.js

mapboxgl.accessToken = 'pk.eyJ1Ijoiandva2ltZSIsImEiOiJjbHhkaTY1bGwwNm5sMm1wcmM3cjFsd24xIn0.SvKS2uxZVUlcVRl6CDlkwg';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jwokime/clzc9wzbk002z01p6f3m2an56/draft',
    center: [0, 10],
    zoom: 2, 
});

map.boxZoom.disable();  
map.dragRotate.disable();
map.keyboard.disable();

map.on('load', () => {
    map.addSource('interv', {
        type: 'geojson',
        data: '../data/interventions.geojson', 
        cluster: true, 
        clusterMaxZoom: 14, 
        clusterRadius: 50,
    });

    // const filterPointCount = ['!', ['has', 'point_count']];
    // const filterEra = ['==', [number, ['get', 'Era']], 'placeholder'];
    // const filterPresName = ['==', [string, ['get', 'PresName']], 'placeholder'];
    // const filterForeignReg = ['==', [number, ['get', 'ForeignReg']], 'placeholder'];
    // const filterBuildReg = ['==', [number, ['get', 'BuildReg']], 'placeholder'];
    // const filterEmpire = ['==', [number, ['get', 'Empire']], 'placeholder'];
    // const filterTerritory = ['==', [number, ['get', 'Territory']], 'placeholder'];
    // const filterPolicy = ['==', [number, ['get', 'Policy']], 'placeholder'];
    // const filterSocialProt = ['==', [number, ['get', 'SocialProt']], 'placeholder'];
    // const filterEconomic = ['==', [number, ['get', 'Economic']], 'placeholder'];

    // add markers to map
    map.addLayer({
        id: 'clusters', 
        type: 'circle',
        source: 'interv',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': '#f62c2c',
            'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    10,
                    3,
                    20,
                    5,
                    30,
                    10, 
                    40,
                    20,
                    50
                ],
            'circle-opacity': 0.7
        }
    })

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'interv',
      filter: ['has', 'point_count'],
      layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
    });

    map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'interv',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#f62c2c',
            'circle-radius': 5,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
        }
    });

    function mouseClick(e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          });
      
        spiderifier.unspiderfy();
        if (!features.length) {
          return;
        } else {
          map.getSource('interv').getClusterLeaves(
            features[0].properties.cluster_id,
            100,
            0,
            function(err, leafFeatures){
              if (err) {
                return console.error('error while getting leaves of a cluster', err);
              }
              var markers = _.map(leafFeatures, function(leafFeature){
                return leafFeature.properties;
              });
              spiderifier.spiderfy(features[0].geometry.coordinates, markers);
            }
          );
        }
    }

    function mouseMove(e) {
        var features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
    }
    
    map.on('mousemove', mouseMove);
    map.on('click', mouseClick);
    map.on('zoomstart', function(){
        spiderifier.unspiderfy();
    });

});

var spiderifier = new MapboxglSpiderifier(map, {
    customPin: true, 
    initializeLeg: function(spiderLeg) {
        console.log('spiderLeg.feature:', spiderLeg.feature);
        var spiderPinCustom = document.createElement('div');
        spiderPinCustom.className = 'spider-point-circle';
        
        spiderLeg.elements.pin.appendChild(spiderPinCustom);
        
        spiderPinCustom.style.width = '10px';
        spiderPinCustom.style.height = '10px';
        spiderPinCustom.style.marginLeft = '-5px';
        spiderPinCustom.style.marginTop = '-5px';
        spiderPinCustom.style.backgroundColor = '#f62c2c';
        spiderPinCustom.style.border = '1px solid #fff';
        spiderPinCustom.style.opacity = '0.8';
        spiderPinCustom.style.borderRadius = '50%';
        
        const feature = spiderLeg.feature;
        const country = feature.countryName;
        const name = feature.Name;
        const year = feature.styear;
        const description = feature.Description;
        const objective = feature.Objective;

        var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
        });

        popup.setHTML(
            `Country: ${country}
            <br>Name: ${name}
            <br>Year: ${year}
            <br>Description: ${description}
            <br>Objective: ${objective}`
        );
        
        // Associate the popup with the spider leg's marker
        spiderLeg.mapboxMarker.setPopup(popup);

        // Add event listeners to the spider leg's container element
        spiderLeg.elements.container.addEventListener('mouseenter', function(){
            popup.addTo(map);
        });

        spiderLeg.elements.container.addEventListener('mouseleave', function(){
            popup.remove();
        });
    }
});

let popup = null;

map.on('mouseenter', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const country = e.features[0].properties.countryName;
    const name = e.features[0].properties.Name;
    const objective = e.features[0].properties.Objective;
    const description = e.features[0].properties.Description;
    const year = e.features[0].properties.styear;
    // const tsunami =
    //     e.features[0].properties.tsunami === 1 ? 'yes' : 'no';

    if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
    }

    popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(
            `Country: ${country}
            <br>Name: ${name}
            <br>Year: ${year}
            <br>Description: ${description}
            <br>Objective: ${objective}`
        )
        .addTo(map);
});

map.on('mouseleave', 'unclustered-point', () => {
    if (popup) {
        popup.remove();
        popup = null;
    }
});

map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
});
map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
});