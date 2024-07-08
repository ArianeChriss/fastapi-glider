//export * from './lodash.js';
import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
//import KML from 'https://cdn.skypack.dev/ol/format/KML.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import Polyline from 'https://cdn.skypack.dev/ol/format/Polyline.js';
import LineString from 'https://cdn.skypack.dev/ol/geom/LineString.js';
import {useGeographic} from 'https://cdn.skypack.dev/ol/proj.js';
import {Circle, Fill, Stroke, Style, Text} from 'https://cdn.skypack.dev/ol/style.js';
import Cluster from 'https://cdn.skypack.dev/ol/source/Cluster.js';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay.js';
import Event from 'https://cdn.skypack.dev/ol/events/Event.js';
import debounce from './lodash.js';

//import GeometryCollection from 'https://cdn.skypack.dev/ol/geom/GeometryCollection.js';
//import {fromLonLat} from 'https://cdn.skypack.dev/ol/proj';


//import * as netcdf4Async from 'https://esm.run/netcdf4-async';
//import * as hdf5 from './index.js';//'https://cdn.jsdelivr.net/npm/jsfive@0.3.10/dist/browser/hdf5.js';
//import h5lt from 'hdf5';

//const NetCDFReader = require('./node_modules/netcdfjs/src/parser.js');
//import { NetCDFReader } from './index.js';
//import * as Featureloader from 'https://cdn.skypack.dev/ol/featureloader.js';
//import NetCDFReader from './netcdfjs/lib-esm/parser';

//import * as CsvReadableStream from './csv-parser.js';
//import * as Fs from './fs.js';

useGeographic();

const addData = document.getElementById("addData");
//const mapEl = document.getElementBy
//const info = document.getElementById('info');
const infoContainer = document.getElementById('popup');
const infoContent = document.getElementById('popup-content');
const infoCloser = document.getElementById('popup-closer');
const layersList = document.getElementById('layersList');
var typeValue = null;
var source = new VectorSource();
const myDom = {
  points: {
    text: 'Normal',
    align: 'Left',
    baseline: 'Bottom',
    rotation: 0,
    font: 'Open Sans',
    weight: 'Normal',
    size: '16px',
    height: 1,
    offsetX: 2,
    offsetY: 2,
    color: '#111111',
    outline: '#ffffff',
    outlineWidth: 3,
    maxreso: 1200
  },
}

const overlay = new Overlay({
  element: infoContainer,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

class ArrowGeometry extends LineString {
  constructor(coordinates) {
    super(coordinates);
  }
}

const openSans = document.createElement('link');
openSans.href = 'https://fonts.googleapis.com/css?family=Open+Sans';
openSans.rel = 'stylesheet';
document.head.appendChild(openSans);
//var mapLayers = [];

const getText = function (feature, resolution, dom) {
  const type = dom.text.value;
  const maxResolution = dom.maxreso.value;
  let text = feature.get('name');

  if (resolution > maxResolution) {
    text = '';
  } else if (type == 'hide') {
    text = '';
  } else if (type == 'shorten') {
    text = text.trunc(12);
  } else if (
    type == 'wrap' &&
    (!dom.placement || dom.placement.value != 'line')
  ) {
    text = stringDivider(text, 16, '\n');
  }

  return text;
};

const createTextStyle = function (feature, resolution, dom) {
  const align = dom.align.value;
  const baseline = dom.baseline.value;
  const size = dom.size.value;
  const height = dom.height.value;
  const offsetX = parseInt(dom.offsetX.value, 10);
  const offsetY = parseInt(dom.offsetY.value, 10);
  const weight = dom.weight.value;
  const placement = dom.placement ? dom.placement.value : undefined;
  const maxAngle = dom.maxangle ? parseFloat(dom.maxangle.value) : undefined;
  const overflow = dom.overflow ? dom.overflow.value == 'true' : undefined;
  const rotation = parseFloat(dom.rotation.value);
  const font = weight + ' ' + size + '/' + height + ' ' + dom.font.value;
  const fillColor = dom.color.value;
  const outlineColor = dom.outline.value;
  const outlineWidth = parseInt(dom.outlineWidth.value, 10);

  return new Text({
    textAlign: align == '' ? undefined : align,
    textBaseline: baseline,
    font: font,
    text: getText(feature, resolution, dom),
    fill: new Fill({color: fillColor}),
    stroke: new Stroke({color: outlineColor, width: outlineWidth}),
    offsetX: offsetX,
    offsetY: offsetY,
    placement: placement,
    maxAngle: maxAngle,
    overflow: overflow,
    rotation: rotation,
  });
};
/*
// Get the needle image element
const needle = document.getElementById('needle');

// Variables to track mouse position and initial rotation
let isDragging = false;
let initialRotation;

// Function to calculate angle from center to mouse position
function getRotationFromMouse(event) {
  const compassRect = document.querySelector('.compass').getBoundingClientRect();
  const center = {
    x: compassRect.left + compassRect.width / 2,
    y: compassRect.top + compassRect.height / 2
  };

  const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x);
  return angle * (180 / Math.PI);
}

// Event listeners for mouse down, move, and up
/*$('#needle').on('mousedown', function(event) {
  isDragging = true;
  initialRotation = getRotationFromMouse(event);
});*/
/*
$('#needle').on('dragstart', function(event) {
  initialRotation = getRotationFromMouse(event);
})

$('#needle').on('drag', function(event) {
  var angle = getRotationFromMouse(event);
  needle.style.transform = 'rotate(${angle}deg)';
})

//$('#needle').on()

/*
document.on('mousemove', function(event) {
  if (isDragging) {
    const currentRotation = getRotationFromMouse(event);
    const rotationDelta = currentRotation - initialRotation;

    needle.style.transform = `translate(-50%, -50%) rotate(${rotationDelta}deg)`;
  }
});

document.on('mouseup', function() {
  isDragging = false;
});*/

// Get the needle image element
const needle = document.getElementById('needle');
let isDragging = false;

// Function to calculate angle from center to mouse position
function getAngle(event) {
  const compassRect = document.querySelector('.compass').getBoundingClientRect();
  const center = {
    x: compassRect.left + compassRect.width / 2,
    y: compassRect.top + compassRect.height / 2
  };
  const mouse = {
    x: event.clientX,
    y: event.clientY
  }
  var angle = 0;
  const ray = Math.sqrt(((mouse.x - center.x)**2) + ((mouse.y - center.y)**2));
  if (mouse.x == center.x) {
    if (mouse.y >= center.y) {
      angle = 0;
    }
    else {
      angle = 180;
    }
  }
  else if (mouse.x < center.x) {
    if (mouse.y == center.y) {
      angle = -90;
    }
    else if (mouse.y > center.y) {    // X-, Y-
      var divide = (mouse.x - center.x) / ray;
      angle = (Math.abs(Math.acos(divide)) * (180 / Math.PI)) - 270;
    }
    else {     // X-, Y+
      var divide = (mouse.x - center.x) / ray;
      angle = -1 * ((Math.abs(Math.acos(divide)) * (180 / Math.PI)) - 90);
    }
  }
  else {
    if (mouse.y == center.y) {
      angle = 90;
    }
    else if (mouse.y > center.y) {  // X+, Y-
      var divide = (mouse.x - center.x) / ray;
      angle = 90 - (-1 * Math.abs(Math.acos(divide)) * (180 / Math.PI));
    }
    else {      // X+, Y+
      var divide = (mouse.x - center.x) / ray;
      angle = 90 - (Math.abs(Math.acos(divide)) * (180 / Math.PI));
    }
  }
  return angle;
}

// Function to update needle rotation
function updateRotation(event) {
  const newAngle = getAngle(event);
  needle.style.transform = `translate(-50%, -50%) rotate(${newAngle}deg)`;
}

// Event listeners for mouse down, move, and up
needle.addEventListener('mousedown', function(event) {
  isDragging = true;
});

document.addEventListener('mousemove', function(event) {
  if (isDragging) {
    updateRotation(event);
  }
});

document.addEventListener('mouseup', function() {
  isDragging = false;
});



function pointStyleFunction(feature, resolution) {
  return new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({color: 'rgba(255, 0, 0, 0.1)'}),
      stroke: new Stroke({color: 'red', width: 1}),
    }),
    text: createTextStyle(feature, resolution, myDom.points),
  });
}

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  overlays: [overlay],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
function upload_data() {
  /*if (typeValue == ".nc v3") {
    var uploaded = document.createElement("input");
    uploaded.type = "file";
    uploaded.accept = ".nc";
    uploaded.onchange = e => {
      var uploadNC = e.target.files[0];
      if (uploadNC) {
        var reader = new FileReader();
        reader.onload = function() {
          var ncReader = new NetCDFReader(reader.result);
          // figure out the actual displays later I guess
        }
        reader.readAsArrayBuffer(uploadNC);
      }
    }
    uploaded.click();
  }
  else if (typeValue == ".nc v4") {
    var uploaded = document.createElement("input");
    uploaded.type = "file";
    uploaded.accept = ".nc";
    uploaded.onchange = e => {
      var uploadNC = e.target.files[0];
      if (uploadNC) {
        var reader = new FileReader();
        reader.onload = function() {
          var file = new hdf5.File(reader.result, uploaded.name);
          try {
            var lats = file.get("lat").value;
            var longs = file.get("lon").value;
          }
          catch (error) {
            var lats = file.get("latitude").value;
            var longs = file.get("longitude").value;
          }
          var coords = []
          for (var i = 0; i < lats.length; i++) {
            var tempLat = parseFloat(lats[i]);
            var tempLong = parseFloat(longs[i])
            if ((parseFloat(-90) <= tempLat) && (tempLat <= parseFloat(90)) && 
                  ((parseFloat(-180) <= tempLong) && (tempLong <= parseFloat(180)))) {
              coords.push([tempLong, tempLat]);
            }
          }
          var addFeature = new Feature({
            geometry: new LineString(coords),
            layout: "XY"
          })
          addFeature.setStyle(new Style({
            stroke: new Stroke({
              color: '#3399CC',
              width: 8,
            })
          }))
          map.addLayer(new VectorLayer({
            source: new VectorSource({
              features: [addFeature]
            }),
          }))
        }
      };
      reader.readAsArrayBuffer(uploadNC);
    }
    uploaded.click();
  }*/
  if ((typeValue == ".kml") || (typeValue == ".csv")) {
    var uploaded = document.createElement("input");
    uploaded.type = "file";
    if (typeValue == ".kml") {
      uploaded.accept = ".kml";
    }
    else {
      uploaded.accept = ".csv";
    }
    uploaded.onchange = e => {
      var uploadKML = e.target.files[0];
      if (uploadKML) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            var coords = []
            var points = JSON.parse(this.responseText);
            //var pointFeats = [];
            //console.log(points);
            for (var point of points.coordinates) {
              coords.push([parseFloat(point[0]), parseFloat(point[1])])
              /*pointFeats.push(new Feature({
                geometry: new Point([parseFloat(point[0]), parseFloat(point[1])]),
                layout: "XY"
              }))*/
            }
            var addFeatureLine = new Feature({
              geometry: new LineString(coords),
              layout: "XY"
            })
            addFeatureLine.setStyle(new Style({
              stroke: new Stroke({
                color: '#3399CC',
                width: 8,
              })
            }))
            var addFeatureEndpoint = new Feature({
              geometry: new Point(coords.slice(-1)[0]),
              layout: "XY",
              display_data: coords.slice(-1)[0][0].toFixed(6) + ", " + coords.slice(-1)[0][1].toFixed(6)
            })
            //var coordsLast = [parseFloat(coords.slice(-1)[0][0]).toFixed(6), parseFloat(coords.slice(-1)[0][1]).toFixed(6)];
            addFeatureEndpoint.setStyle(new Style({        
              image: new Circle({
                radius: 8,
                fill: new Fill({color: 'rgba(25, 96, 110, 1)'}),
              }),
              /*text: new Text({
                font: 'bold 16px sans-serif',
                text: coordsLast.toString(),
                textAlign: 'left',
                textBaseline: 'bottom',
                fill: new Fill({color: 'rgba(0, 0, 0, 1)'}),
                stroke: new Stroke({color: 'rgba(255, 255, 255, 1)'})
              })*/
            }))
            source.addFeature(addFeatureLine);
            source.addFeature(addFeatureEndpoint);
            //console.log(source);
            map.addLayer(new VectorLayer({
              source: source,
              title: uploadKML.name
            }))
            update_layers();
            //console.log(map);
            //console.log(map.getLayers());
          }
        }
        if (typeValue == ".kml") {
          xhttp.open("POST", "upload/kml", true);
        }
        else if (typeValue == ".csv") {
          xhttp.open("POST", "upload/csv", true);
        }
        const fileData = new FormData();
        fileData.append("file", uploadKML);
        xhttp.send(fileData);
      }
    }
    uploaded.click();
  }
  /*else if (typeValue == ".csv") {
    var uploaded = document.createElement("input");
    uploaded.type = "file";
    uploaded.accept = ".csv";
    uploaded.onchange = e => {
      var uploadCSV = e.target.files[0];
      if (uploadCSV) {
        var reader = new FileReader();
        reader.onload = function() {
          let inputStream = Fs.createReadStream(reader.result)
	          .pipe(new AutoDetectDecoderStream({ defaultEncoding: '1255' })); // If failed to guess encoding, default to 1255
          inputStream
            .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, asObject: true }))
            .on('data', function (row) {
                console.log('A row arrived: ', row);
            }).on('end', function () {
                console.log('No more rows!');
            });
          /*var coords = []
          for (var i = 0; i < lats.length; i++) {
            var tempLat = parseFloat(lats[i]);
            var tempLong = parseFloat(longs[i])
            if ((parseFloat(-90) <= tempLat) && (tempLat <= parseFloat(90)) && 
                  ((parseFloat(-180) <= tempLong) && (tempLong <= parseFloat(180)))) {
              coords.push([tempLong, tempLat]);
            }
          }
          var addFeature = new Feature({
            geometry: new LineString(coords),
            layout: "XY"
          })
          addFeature.setStyle(new Style({
            stroke: new Stroke({
              color: '#3399CC',
              width: 8,
            })
          }))
          map.addLayer(new VectorLayer({
            source: new VectorSource({
              features: [addFeature]
            }),
          }))   ENDING OF COMMENT WAS ORIGINALLY HERE
        }
      };
      reader.readAsDataURL(uploadCSV);
    }
    uploaded.click();
  }*/
}

function make_url(start, duration) {
  var urlString = "https://tds.marine.rutgers.edu/thredds/ncss/grid/roms/doppio/2017_da/avg/runs/Averages_RUN_";
  const date = new Date();
  let fileDate = date.toISOString();
  var fileDateString = fileDate.slice(0, 11) + "00:00:00Z?";
  urlString += fileDateString;// + "?var=ubar_eastward&var=vbar_northward&north=46.637&west=-80.546&east=-59.669&south=32.215&horizStride=1&time_start=" + start + "&time_end=";
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      return;
    }
  }
  xhttp.open("GET", "/opendap/data", true);
  xhttp.send();
  console.log(urlString);
}

function render_arrows() {
  var layers = map.getLayers();
  var numLayers = layers.getLength();
  for (var i = 1; i < numLayers; i++) {
    if (layers.item(i).get('title') == "currents") {
      map.removeLayer(layers.item(i));
      break;
    }
  }
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
    }
  }
  //generate url
  xhttp.open("POST", "", true);
  xhttp.send(fileData);
  // send xhttp request to get current data based on input start
  //    date and duration
  // divide map into x number of points, represented by pixels
  // on map change, find latitude/longitude coordinates corresponding
  //    to pixel location
  // find nearest point in doppio model to provide current strength
  //    and direction
  //    - nearest point must be WITHIN a certain latitude/longitude
  //          distance
  //    - check resolution of doppio model
  // based on strength, render same scale arrow with varying value
  //    between black and white
  //    - use a new vector layer with title of "currents"
  return;
}
const debounced_render_arrows = debounce(render_arrows, 300);

function update_layers() {
  var layers = map.getLayers();
  var numLayers = layers.getLength();
  var displayed = [...layersList.getElementsByTagName("li")];
  for(var i = 1; i < numLayers; i++) {
    var inList = false;
    for (var displayedLayer of displayed) {
      if (layers.item(i).get('title') == displayedLayer.innerText) {
        inList = true;
      }
    }
    if (!inList) {
      var newLayer = document.createElement("li");
      newLayer.className = "list-group-item";
      newLayer.innerText = layers.item(i).get('title');
      layersList.appendChild(newLayer);
    }
  }
}

function change_utc() {
  const now = new Date();
  const start = document.getElementById("startDateTime");
  const utc = document.getElementById("UTC");
  if (utc.checked == true) {
    const utcString = now.toISOString().slice(0, 16);
    start.value = utcString;
  }
  else {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const localString = `${year}-${month}-${day}T${hours}:${minutes}`;
    start.value = localString;
  }
}


var modelChangeX = 0;                                           // THESE VARIABLES NEED TO BE CHANGED WITH MODEL IMPLEMENTATION
var modelChangeY = 0;                                           // AND EVALUATED WITHIN FOR LOOP
var modelChangeDist = 1;

var directions = {
  0: "E",
  45: "NE",
  90: "N",
  135: "NW",
  180: "W",
  225: "SW",
  270: "S",
  315: "SE",
}

function rec_calc(graphic, origCoords, totTime, timePassed, soFar) {
  for (var j = 0; j < 360; j += 45) {
    modelChangeX = modelChangeDist * Math.cos(j * Math.PI / 180);
    modelChangeY = modelChangeDist * Math.sin(j * Math.PI / 180);
    var newCoords = [
      origCoords[0] + modelChangeX,
      origCoords[1] + modelChangeY
    ]
    
    var tempSoFar = soFar.concat([j]);
    graphic.geometry.addPath([origCoords, newCoords]);  
    if (totTime - timePassed > 0) {
      rec_calc(graphic, newCoords, totTime, timePassed + 2, tempSoFar);
    }
    else {
      const pointSymbol = {
        type: "simple-marker",
        color: [60, 20, 252],
        outline: {
          color: [255, 255, 255],
          width: 1
        }
      };
      var dirs = []
      for (var i = 0; i < tempSoFar.length; i++) {
        dirs.push(directions[tempSoFar[i]]);
      }
      const pointAtt = {
        Time: timePassed,
        Coordinates: newCoords,
        Paths: dirs,
      };
      const pointGraphic = new Graphic({
        geometry: new Point({
          x: newCoords[0],
          y: newCoords[1]
        }),
        symbol: pointSymbol,
        attributes: pointAtt,
        popupTemplate: {
          title: "Endpoint",
          content: [
            {
              type: "fields",
              fieldInfos: [
                {
                  fieldName: "Time"
                },
                {
                  fieldName: "Coordinates"
                },
                {
                  fieldName: "Paths"
                }
              ]
            }
          ]
        }
      });
      //view.graphics.add(pointGraphic);
    }
  }
}

$(document).ready(function () {
  $('#dataType a').on('click', function () {
    typeValue = ($(this).text());
  })
})
$("#addData").on("click", upload_data);
$("#UTC").on("click", change_utc);
map.on("click", function(event) {
  map.forEachFeatureAtPixel(event.pixel, function(feature) {
    var data = feature.get("display_data");
    if (data) {
      infoContent.innerText = data;
      overlay.setPosition(event.coordinate);
    }
  });
});
// order:
// click run model
// make url
// get current data
// send current data to backend
// run model w/filter
// return filter results to frontend
// display filter results
$("#run").on("click", function() {
  var start  = document.getElementById("startDateTime");
  var duration = document.getElementById("duration");
  var url = make_url(start.value, duration.value);
})
var view = map.getView();
$("#currents").on("click", function() {
  if (document.getElementById("currents").checked) {
    view.on("change:resolution", debounced_render_arrows);
  }
  else {
    view.un("change:resolution", debounced_render_arrows);
  }
});
infoCloser.addEventListener("click", function() {
  overlay.setPosition(undefined);
  infoCloser.blur();
  return false;
});