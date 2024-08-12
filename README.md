# A Mapped History of US Military Interventions
As my final project for the 2024 Lede Program, I built a map visualizing the history of US military interventions between 1945 and 2019. 

## Data Sources
Dataset is from the [Military Intervention Project (MIP)](https://sites.tufts.edu/css/mip-research/mip-dataset/) from Tufts University's Center for Strategic Studies. 

## Methodology

### Cleaning
There were a number of events in the original dataset that was associated with two or more countries. For the purposes of visualization, however, I had to clean the data so that each event was only associated with one country. Depending on the nature of the intervention event, the events were:
1. pared down to include only the main target of the intervention (ex. Korean War was initially associated with North Korea and China: changed it to North Korea) or 
2. split into separate rows such that it accurately represents that the same event occurs in multiple different countries (ex. ). 

### Country data
Country names and ISO alpha-2 country codes were pulled using [GeoNames API](https://www.geonames.org/export/web-services.html) and the coordinates for the countries were pulled using [OpenCage Geocoding API](https://opencagedata.com/). I then used the OpenAI API to search for the exact coodrinates for each intervention incident. 

### Putting it onto a map
I used [Mapbox GL JS](https://docs.mapbox.com/help/tutorials/show-changes-over-time/) and [mapbox-spiderifier](https://github.com/bewithjonam/mapboxgl-spiderifier?tab=readme-ov-file) to handle stacked points. 





