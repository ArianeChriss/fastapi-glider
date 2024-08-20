//export * from './lodash.js';
import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
//import { WebGLPointsLayer, WebGLPoints } from 'https://cdn.skypack.dev/ol/layer';
import WebGLPointsLayer from 'https://cdn.skypack.dev/ol/layer/WebGLPoints.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
//import KML from 'https://cdn.skypack.dev/ol/format/KML.js';
import VectorSource from 'https://cdn.skypack.dev/ol/source/Vector.js';
import VectorLayer from 'https://cdn.skypack.dev/ol/layer/Vector.js';
import Feature from 'https://cdn.skypack.dev/ol/Feature.js';
import Point from 'https://cdn.skypack.dev/ol/geom/Point.js';
import Polyline from 'https://cdn.skypack.dev/ol/format/Polyline.js';
import LineString from 'https://cdn.skypack.dev/ol/geom/LineString.js';
import { fromLonLat } from 'https://cdn.skypack.dev/ol/proj';
import GeoJSON from 'https://cdn.skypack.dev/ol/format/GeoJSON';
import {useGeographic} from 'https://cdn.skypack.dev/ol/proj.js';
import {Circle, Fill, Stroke, Style, Text, Icon} from 'https://cdn.skypack.dev/ol/style.js';
//import currentArrow from './current.png';
import Cluster from 'https://cdn.skypack.dev/ol/source/Cluster.js';
import Overlay from 'https://cdn.skypack.dev/ol/Overlay.js';
import Event from 'https://cdn.skypack.dev/ol/events/Event.js';
import _ from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm';
import numjs from 'https://cdn.jsdelivr.net/npm/numjs@0.16.1/+esm';
//import debounce from lodash;
/*var projectName = require("@scope/lodash")*/
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
var filterRun = false;
const infoContainer = document.getElementById('popup');
const infoContent = document.getElementById('popup-content');
const infoCloser = document.getElementById('popup-closer');
const layersList = document.getElementById('layersList');
var typeValue = null;
var selecting = false;
var currentData = null;
var filterData = null;
var currentSource = null;
var filterSource = null;
var source = new VectorSource();
var wptLong = null;
var wptLat = null;
var iconStyle = {
  'icon-src': './static/current.png',
  'icon-width': 7,
  'icon-height': 18,
  'icon-color': [
    'interpolate',
    ['linear'],
    ['get', 'strength'],
    0,
    '#44ce1b',
    0.25,
    '#bbdb44',
    0.5,
    '#f7e379',
    0.75,
    '#f2a134',
    1,
    '#e51f1f',
    1.25,
    '#e51fe2',
    1.5,
    "#aa1fe5"],
  'icon-rotate-with-view': true,
  'icon-rotation': [
    'interpolate',
    ['linear'],
    ['get', 'rotation'],
    0,
    0,
    360,
    6.28319]
}
var filterStyle = {
  'circle-radius': 4,
    'circle-fill-color': ['color', ['get', 'red'], ['get', 'green'], ['get', 'blue']],
    'circle-rotate-with-view': false,
    'circle-displacement': [0, 0],
}

const overlay = new Overlay({
  element: infoContainer,
  autoPan: {
    animation: {
      duration: 250,
    },
  },
});

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
    else if (mouse.y > center.y) { // X-, Y-
      var divide = (mouse.x - center.x) / ray;
      angle = (Math.abs(Math.acos(divide)) * (180 / Math.PI)) - 270;
    }
    else { // X-, Y+
      var divide = (mouse.x - center.x) / ray;
      angle = -1 * ((Math.abs(Math.acos(divide)) * (180 / Math.PI)) - 90);
    }
  }
  else {
    if (mouse.y == center.y) {
      angle = 90;
    }
    else if (mouse.y > center.y) { // X+, Y-
      var divide = (mouse.x - center.x) / ray;
      angle = 90 - (-1 * Math.abs(Math.acos(divide)) * (180 / Math.PI));
    }
    else { // X+, Y+
      var divide = (mouse.x - center.x) / ray;
      angle = 90 - (Math.abs(Math.acos(divide)) * (180 / Math.PI));
    }
  }
  return angle;
}
// Function to update needle rotation
function updateRotation(event) {
  const newAngle = getAngle(event);
  needle.style.transform = `translate(-50%,
  -50%) rotate(${newAngle
  }deg)`;
}
// Event listeners for mouse down, move, and up
/*needle.addEventListener('mousedown', function(event) {
  isDragging = true;
});

document.addEventListener('mousemove', function(event) {
  if (isDragging) {
    updateRotation(event);
  }
});

document.addEventListener('mouseup', function() {
  isDragging = false;
});*/

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  overlays: [overlay
  ],
  view: new View({
    center: [
      0,
      0
    ],
    zoom: 2
  })
});

function fetch_data(url) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      currentData = xhttp.responseText;
    }
  }
  xhttp.open("GET", "/newfile/" + url, true);
  xhttp.send();
}

function run_filter(dirNum) {
  filterRun = true;
  const name = document.getElementById("runName").value;
  if ((name == undefined) || (name == "")) {
    display_error("Please enter a valid run name")
    console.log("Please enter a valid run name")
  }
  const dataID = document.getElementById("dataURL").value;
  if (dataID == undefined) {
    display_error("Please enter a dataset ID");
    console.log("Please enter a dataset ID");
  }
  const calibration = parseInt(document.getElementById("calibration").value);
  if (calibration == NaN) {
    display_error("Please enter an integer point calibration number");
    console.log("Please enter an integer point calibration number");
    return;
  }
  const datetime = document.getElementById("startDateTime").getAttribute("data-utcdatetime");
  if (datetime == "") {
    display_error("Please select a start time");
    console.log("Please select a start time");
    return;
  }
  const duration = parseInt(document.getElementById("duration").value);
  if (duration == NaN) {
    display_error("Please enter an integer duration");
    console.log("Please enter an integer duration");
    return;
  }
  const color = document.getElementById("color").value;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      filterData = xhttp.responseText;
      var timeslider = document.getElementById('timeRange');
      timeslider.setAttribute("max", duration);
      debounced_render_particles(name, color);
      filterRun = true;
    }
  }
  if (dirNum == 1) {
    xhttp.open("GET","/filter/onedir/"+calibration+"/"+datetime+"/"+duration+"/"+dataID+"/"+String(-74)+"/"+String(40), true);
  }
  else {
    xhttp.open("GET","/filter/eightdir/"+calibration+"/"+datetime+"/"+duration+"/"+dataID, true);
  }
  xhttp.send();
  /*
  var options = document.getElementById("tickmarks");
  for (var i = 0; i < duration; i++) {
    var newTime = document.createElement("option");
    newTime.value = i;
    newTime.label = i;
    options.appendChild(newTime);
  }*/
}

function get_currents() { // gets time and duration and sends to backend, then renders data to map
  var layers = map.getLayers(); // if filter has been run and layer is just invisible, toggles visibility
  var numLayers = layers.getLength();
  for (var i = 1; i < numLayers; i++) {
    if ((layers.item(i).get('title') == "currents") && (filterRun == false)) {
      map.removeLayer(layers.item(i));
      break;
    }
  }
  var datetime = document.getElementById("startDateTime").getAttribute("data-utcdatetime");
  if (datetime == "") {
    display_error("Please select a start time");
    console.log("Please select a start time");
    return;
  }
  var duration = parseInt(document.getElementById("duration").value);
  if (duration == NaN) {
    display_error("Please enter an integer duration");
    console.log("Please enter an integer duration");
    return;
  }
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      currentData = xhttp.responseText;
      //var timeslider = document.getElementById('timeRange');    This might have to go back in here but has been put into run_filter
      //timeslider.setAttribute("max", duration);
      // DISPLAY RENDERING GOES HERE
      
    }
  }
  xhttp.open("GET", "/opendap/"+datetime+"/"+duration, true);
  xhttp.send();
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
}

function render_particles(name, color) {
  var layers = map.getLayers(); // if filter has been run and layer is just invisible, toggles visibility
  var numLayers = layers.getLength();
  var timeslider = document.getElementById('timeRange');
  var time = parseInt(timeslider.value);
  for (var i = 1; i < numLayers; i++) {
    if (((layers.item(i).get('title') == name) && (filterRun == true))) {
      if (layers.item(i).getVisible == false) {
        if (parseInt(layers.item(i).get('timeData')) == time) {
          layers.item(i).setVisible(true);
          update_layers();
          return;
        }
        else {
          map.removeLayer(layers.item(i));
          update_layers();
          break;
        }
      }
      else if (parseInt(layers.item(i).get('timeData')) == time) {
        layers.item(i).setVisible(false);
        update_layers();
        return;
      }
      else if (parseInt(layers.item(i).get('timeData')) != time) {
        map.removeLayer(layers.item(i));
        update_layers();
        break;
      }
    }
    else if ((layers.item(i).get('title') == name) && (filterRun == false)) {
      map.removeLayer(layers.item(i));
      update_layers();
      return;
    }
  }
  var time = parseInt(timeslider.value);
  var data = JSON.parse(filterData.replace(/\bNaN\b/g, "null"));
  console.log(data.returndata);
  currentData = data.currentdata;
  console.log(currentData);
  var filterSource = [];
  for (var i = 0; i < Object.keys(data.returndata.predictions).length; i++) {
    var firstkey = Object.keys(data.returndata.predictions)[i].toString();
    for (var j = 0; j < Object.keys(data.returndata.predictions[firstkey]).length; j++) {
      var secondkey = Object.keys(data.returndata.predictions[firstkey])[j];
      var timestamp = new Date(firstkey*1000);
      var feature = new Feature({
        geometry: new Point([data.returndata.predictions[firstkey][secondkey].long, data.returndata.predictions[firstkey][secondkey].lat]),
        red: parseInt(color.slice(1,3), 16),
        green: parseInt(color.slice(3,5), 16),
        blue: parseInt(color.slice(5,7), 16),
        long_lat: data.returndata.predictions[firstkey][secondkey].long.toString() + ", " + data.returndata.predictions[firstkey][secondkey].lat.toString(),
        time: timestamp.toUTCString()
      })
      if (data.returndata.predictions[firstkey][secondkey].wptLong != undefined) {
        if (data.returndata.predictions[firstkey][secondkey].wptLat != undefined) {
          feature.set("commanded_waypoint", data.returndata.predictions[firstkey][secondkey].wptLong.toString() + ", " + data.returndata.predictions[firstkey][secondkey].wptLat.toString());
        }
      }
      filterSource.push(feature);
    }
  }
  var linePoints = []
  for (var i = 0; i < Object.keys(data.returndata.actual.points).length; i++) {
    firstkey = Object.keys(data.returndata.actual.points)[i].toString();
    timestamp = new Date(data.returndata.actual.points[firstkey].time * 1000);
    linePoints.push([data.returndata.actual.points[firstkey].long, data.returndata.actual.points[firstkey].lat])
    var feature = new Feature({
      geometry: new Point([data.returndata.actual.points[firstkey].long, data.returndata.actual.points[firstkey].lat]),
      red: 0,
      green: 0,
      blue: 0,
      long_lat: data.returndata.actual.points[firstkey].long.toString() + ", " + data.returndata.actual.points[firstkey].lat.toString(),
      time: timestamp.toUTCString()
    })
    if (data.returndata.actual.points[firstkey].wptLong != undefined) {
      if (data.returndata.actual.points[firstkey].wptLat != undefined) {
        feature.set("commanded_waypoint", data.returndata.actual.points[firstkey].wptLong.toString() + ", " + data.returndata.actual.points[firstkey].wptLat.toString());
      }
    }
    filterSource.push(feature);
  }
  feature = new Feature({
    geometry: new LineString(linePoints)
  })
  /*for (var i = 0; i < data.time.length; i++) {
    for (var j = 0; j < data.longs[i].length; j++) {
      var tempLong = data.longs[i][j];
      var tempLat = data.lats[i][j];
      var feature = new Feature({
        geometry: new Point([tempLong, tempLat]),
        red: parseInt(color.slice(1,3), 16),
        green: parseInt(color.slice(3,5), 16),
        blue: parseInt(color.slice(5,7), 16),
      })
      filterSource.push(feature);
    }
  }*/
  /*for (var i = 0; i < data.measured.length; i++) {
    var tempLong = data.measured[i][0];
    var tempLat = data.measured[i][1];
    var feature = new Feature({
      geometry: new Point([tempLong, tempLat]),
      red: 0,
      green: 0,
      blue: 0
    })
    filterSource.push(feature);
  }*/
  //console.log("hello");
  var geoJsonFormat = new GeoJSON();
  var geoJsonObject = geoJsonFormat.writeFeaturesObject(filterSource);
  var features = geoJsonFormat.readFeatures(geoJsonObject);
  var source = new VectorSource();
  source.addFeatures(features);
  var pointsLayer = new WebGLPointsLayer({
    source: source,
    style: filterStyle,
    title: name,
    timeData: time
  })
  var lineSource = new VectorSource({
    features: [feature]
  });
  const vectorLayer = new VectorLayer({
    source: lineSource,
    style: new Style({
      stroke: new Stroke({
        color: '#636363',
        width: 4
      })
    })
  });
  map.addLayer(vectorLayer);
  map.addLayer(pointsLayer);
  update_layers();
  return;
}

function render_arrows() { // show retrieved current data as vector field
  var layers = map.getLayers(); // if filter has been run and layer is just invisible, toggles visibility
  var numLayers = layers.getLength();
  var timeslider = document.getElementById('timeRange');
  var time = parseInt(timeslider.value);
  for (var i = 1; i < numLayers; i++) {
    if (((layers.item(i).get('title') == "currents") && (filterRun == true))) {
      if (layers.item(i).getVisible == false) {
        if (parseInt(layers.item(i).get('timeData')) == time) {
          layers.item(i).setVisible(true);
          update_layers();
          return;
        }
        else {
          map.removeLayer(layers.item(i));
          update_layers();
          break;
        }
      }
      else if (parseInt(layers.item(i).get('timeData')) == time) {
        layers.item(i).setVisible(false);
        update_layers();
        return;
      }
      else if (parseInt(layers.item(i).get('timeData')) != time) {
        map.removeLayer(layers.item(i));
        update_layers();
        break;
      }
    }
    else if ((layers.item(i).get('title') == "currents") && (filterRun == false)) {
      map.removeLayer(layers.item(i));
      update_layers();
      return;
    }
  }
  var data = currentData; //JSON.parse(currentData.replace(/\bNaN\b/g, "null"));
  var currentSource1 = [];     // if changing this to use the global variable doesn't work, change back to local currentsource
  //console.log(data.uEast);
  //console.log(data.uEast[0]);
  //console.log(data.uEast[0][0]);
  //console.log(data.uEast[0][0][0]);
  for (var i = 0; i < data.longs.length; i++) {
    for (var j = 0; j < data.longs[i].length; j++) {
      var tempLong = parseFloat(data.longs[i][j]);
      var tempLat = parseFloat(data.lats[i][j]);
      var tempRotation = 0;
      if ((!(Number.isNaN(tempLong))) && (!(Number.isNaN(tempLat)))) {
        var east = parseFloat(data.uEast[time][i][j]);                 // APPARENTLY THIS HAS A PROBLEM, ERROR THROWN WHEN 3O ENTERED AS DURATION
        var north = parseFloat(data.vNorth[time][i][j]);               // COULD BE BEYOND SCOPE OF SINGLE FILE TIME RANGE
        //console.log("east: " + toString(east));
        //console.log(east);
        //console.log(Number.isNaN(east));
        //console.log(!(Number.isNaN(east)) && !(Number.isNaN(north)));
        if ((!(Number.isNaN(east))) && (!(Number.isNaN(north)))) {
          var magnitude = Math.sqrt((east**2)+(north**2));
          if (magnitude != 0) {
            if (east == 0) {
              if (north > 0) {
                tempRotation = 90;
              }
              else {
                tempRotation = 270;
              }
            }
            if (east > 0) {
              if (north > 0) {
                tempRotation = 180 * Math.atan(north/east) / Math.PI;
              }
              else if (north == 0)  {
                tempRotation = 0;
              }
              else {
                tempRotation = 360 - (180 * Math.atan(-1 * north / east) / Math.PI);
              }
            }
            else {
              if (north > 0) {
                tempRotation = 180 - (180 * Math.atan(-1 * north / east) / Math.PI);
              }
              else if (north == 0) {
                tempRotation = 180;
              }
              else {
                tempRotation = 180 + (180 * Math.atan(north / east) / Math.PI);
              }
            }
            if (!(Number.isNaN(parseFloat(tempRotation)))) {
              var feature = new Feature({
                geometry: new Point([tempLong, tempLat]),
                rotation: tempRotation,
                strength: magnitude
              })
              currentSource1.push(feature);
            }
          }
        }
      }
    }
  }
  var geoJsonFormat = new GeoJSON();
  var geoJsonObject = geoJsonFormat.writeFeaturesObject(currentSource1);
  var features = geoJsonFormat.readFeatures(geoJsonObject);
  var source1 = new VectorSource();
  source1.addFeatures(features);
  var pointsLayer = new WebGLPointsLayer({
    source: source1,
    style: iconStyle,
    title: "currents",
    timeData: time
  })
  map.addLayer(pointsLayer);
  update_layers();
  return;
}
let debounced_render_arrows = _.debounce(render_arrows, 300); // gives a bit of a respite to the map renderer via delay after update, time can probably be increased
let debounced_render_particles = _.debounce(render_particles, 300);

function update_layers() { // updates the dropdown list of layers with the layers rendered in the map
  var layers = map.getLayers(); // needs to be called whenever a new layer is added to the map
  var numLayers = layers.getLength();
  var displayed = [...layersList.getElementsByTagName("li")
  ];
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

function change_utc() { // switches formatting and time of datetime element to UTC or local
  const now = new Date();
  const start = document.getElementById("startDateTime");
  const utc = document.getElementById("UTC");
  if (utc.checked == true) {
    const utcString = now.toISOString().slice(0,
    16);
    start.value = utcString;
    start.setAttribute("data-utcdatetime", now.toISOString());
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
    start.setAttribute("data-utcdatetime",  now.toISOString());
  }
  filterRun = false;
}

function user_datechange() { // switched the later-accessed data-utcdatetime data storage in the datetime-local html element
  var start = document.getElementById("startDateTime");
  var utcSwitch = document.getElementById("UTC");
  start.setAttribute("data-utcdatetime", new Date(start.value).toISOString());
  filterRun = false;
}

function start_selection() {
  selecting = true;
}

function display_error(message) {
  return;
}

$(document).ready(function () {
  $('#dataType a').on('click', function () {
    typeValue = ($(this).text());
  })
})
$("#addData").on("click", function() {
  var url = document.getElementById("dataURL").value;
  console.log(url);
  fetch_data(url);
});
$("#UTC").on("click", change_utc);
map.on("click", function(event) {
  if (selecting == true) {
    const coordinates = event.coordinate;
    wptLong = coordinates[0];
    wptLat = coordinates[1];
    selecting = false;
  }
  else {
    map.forEachFeatureAtPixel(event.pixel, function(feature) {
      var waypt = feature.get("commanded_waypoint");
      var long_lat = feature.get("long_lat");
      var time = feature.get("time");
      if (time) {
        if (waypt) {
          infoContent.innerText = time + "\nLocation: " + long_lat + "\nCommanded Waypoint: " + waypt;
        }
        else {
          infoContent.innerText = time + "\nLocation: " + long_lat;
        }
        overlay.setPosition(event.coordinate);
      }
    });
  }
});
$("#chooseWpt").on("click", start_selection);
$("#startDateTime").on("change", user_datechange);
// order:
// click run model
// send date in UTC and duration to backend
// run model w/filter
// return filter results to frontend
// display filter results
$("#runOne").on("click", function() {
  //var startElement = document.getElementById("startDateTime");
  //var startTime = startElement.getAttribute("data-utcdatetime");
  //var duration = parseInt(document.getElementById("duration").value);
  //const name = document.getElementById("runName").value;
  //const color = document.getElementById("color").value;
  //const dataID = document.getElementById("dataURL").value;
  run_filter(1);
  //get_currents();
  return;
})

var view = map.getView();
$("#currents").on("click", function() {
  if (document.getElementById("currents").checked) {
    if (filterRun == true) {
      if (currentData != null) {}
      console.log("current data exists");
      debounced_render_arrows();
      //view.on("change:resolution", debounced_render_arrows);
    }
  }
  else {
    debounced_render_arrows();
  }
  /*else {
    view.un("change:resolution", debounced_render_arrows);
    render_arrows(false);
  }*/
});
$("#timeRange").on("change", function() {                         // figure out why this isn't working 7-29-24
  if (document.getElementById("currents").checked) {
    const name = document.getElementById("runName").value;
    const color = document.getElementById("color").value;
    debounced_render_arrows();
    console.log("changing time slider");
    debounced_render_particles(name, color);
  }
})
infoCloser.addEventListener("click", function() {
  overlay.setPosition(undefined);
  infoCloser.blur();
  return false;
});