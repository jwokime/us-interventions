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
        data: './data/ai_interventions.geojson', 
        cluster: true, 
        clusterMaxZoom: 14, 
        clusterRadius: 50,
    });

    let sourceData = map.getSource('interv');

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
            'circle-stroke-color': '#000000'
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

    fetch('./data/ai_interventions.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        const allData = JSON.parse(JSON.stringify(geojsonData));

        window.applyFilters = () => {
            const fromYear = parseInt(document.querySelector('#fromSlider').value);
            const toYear = parseInt(document.querySelector('#toSlider').value);
            const presidentCheckboxes = document.querySelectorAll('#president-checklist .president-checkbox');
            const objectiveCheckboxes = document.querySelectorAll('#objective-checklist .objective-checkbox');
            let filteredData;

            const selectedPresidents = Array.from(presidentCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);

            const selectedObjectives = Array.from(objectiveCheckboxes)
                .filter(checkbox => checkbox.checked)
                .map(checkbox => checkbox.value);

            // Apply combined filtering
            if (selectedPresidents.length === 0 || selectedObjectives.length === 0)  {
                filteredData = {
                    type: 'FeatureCollection',
                    features: []
                };
            } else {
                filteredData = {
                    type: 'FeatureCollection',
                    features: allData.features.filter(feature => {
                        const stYear = feature.properties.styear;
                        const endYear = feature.properties.endyear;
    
                        const yearMatch = (stYear >= fromYear && stYear <= toYear) || 
                                          (endYear >= fromYear && endYear <= toYear);
    
                        const presidentMatch = selectedPresidents.includes(feature.properties.PresName);
    
                        const objectiveMatch = selectedObjectives.some(objective => feature.properties[objective] === 1.0);
    
                        return yearMatch && presidentMatch && objectiveMatch;
                    })
                };
            }

            sourceData.setData(filteredData);
        };

        document.getElementById('period-slider').addEventListener('input', window.applyFilters);
        document.getElementById('president-checklist').addEventListener('change', window.applyFilters);
        document.getElementById('objective-checklist').addEventListener('change', window.applyFilters);
    })

    // fetch('./data/interventions.geojson')
    //     .then(response => response.json())
    //     .then(geojsonData => {
    //         const allData = JSON.parse(JSON.stringify(geojsonData));
        
    //     document.getElementById('period-slider').addEventListener('input', (event) => {
    //         const fromYear = document.querySelector('#fromSlider').value;
    //         const toYear = document.querySelector('#toSlider').value;
    //         let filteredData;

    //         filteredData = {
    //             type: 'FeatureCollection',
    //             features: allData.features.filter(feature => {
    //                 const stYear = feature.properties.styear;
    //                 const endYear = feature.properties.endyear;
            
    //                 return (stYear >= fromYear && stYear <= toYear) ||
    //                        (endYear >= fromYear && endYear <= toYear);
    //             })
    //         }

    //         sourceData.setData(filteredData);
    //     });

    //     document.getElementById('president-checklist').addEventListener('change', (event) => {
    //         const checkboxes = document.querySelectorAll('#president-checklist .president-checkbox');
    //         const selected = [];
    //         let filteredData;
    //         console.log(selected);    
    //         checkboxes.forEach(checkbox => {
    //             if (checkbox.checked) {
    //                 selected.push(checkbox.value);
    //             }
    //         });

    //         if(selected.length === 0) {
    //             filteredData = {
    //                 type: 'FeatureCollection',
    //                 features: []
    //             };
    //         } else {
    //             filteredData = {
    //                 type: 'FeatureCollection',
    //                 features: allData.features.filter(feature => {
    //                     return selected.some(pres => feature.properties.PresName === pres);
    //                 })
    //             };
    //         }
    //         console.log(filteredData);    
    //         sourceData.setData(filteredData);
    //     });

    //     document.getElementById('objective-checklist').addEventListener('change', (event) => {
    //         const checkboxes = document.querySelectorAll('#objective-checklist .objective-checkbox');
    //         const selected = [];
    //         let filteredData;
            
    //         checkboxes.forEach(checkbox => {
    //             if (checkbox.checked) {
    //                 selected.push(checkbox.value);
    //             }
    //         });

    //         if(selected.length === 0) {
    //             filteredData = {
    //                 type: 'FeatureCollection',
    //                 features: []
    //             };
    //         } else {
    //             filteredData = {
    //                 type: 'FeatureCollection',
    //                 features: allData.features.filter(feature => {
    //                     return selected.some(objective => feature.properties[objective] === parseFloat(1.0));
    //                 })
    //             };
    //         }
    //         sourceData.setData(filteredData);
    //     });
    // });

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
        spiderPinCustom.style.border = '1px solid #000000';
        spiderPinCustom.style.opacity = '0.8';
        spiderPinCustom.style.borderRadius = '50%';
        
        const feature = spiderLeg.feature;
        const country = feature.countryName;
        const name = feature.Name;
        const year = feature.styear;
        const endyear = feature.endyear === undefined ? 'Present' : feature.endyear;
        const description = feature.Description;
        const objective = feature.Objective;

        var popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
        });

        popup.setHTML(
            `<b>Name: </b>${name}
            <br><b>Country: </b>${country}
            <br><b>Period: </b>${year}-${endyear}
            <br><b>Objective: </b>${objective}
            <br><b>Description: </b>${description}`
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
    const endyear = e.features[0].properties.endyear === undefined ? 'Present' : e.features[0].properties.endyear;

    if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
    }

    popup = new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(
            `<b>Name: </b>${name}
            <br><b>Country: </b>${country}
            <br><b>Period: </b>${year}-${endyear}
            <br><b>Objective: </b>${objective}
            <br><b>Description: </b>${description}`
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