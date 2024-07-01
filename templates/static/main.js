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
import {Circle, Fill, Stroke, Style} from 'https://cdn.skypack.dev/ol/style.js';

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
var typeValue = null;
var source = new VectorSource();
//var mapLayers = [];

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    })
  ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});
function upload_data() {
  if (typeValue == ".nc v3") {
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
  }
  else if (typeValue == ".kml") {
    var uploaded = document.createElement("input");
    uploaded.type = "file";
    uploaded.accept = ".kml";
    uploaded.onchange = e => {
      var uploadKML = e.target.files[0];
      if (uploadKML) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            var coords = []
            var points = JSON.parse(this.responseText);
            var pointsFeatures = []
            console.log(points);
            for (var point of points.coordinates) {
              coords.push([parseFloat(point[0]), parseFloat(point[1])])
              pointsFeatures.push(new Feature({
                geometry: new Point({
                  name: points[2],
                  coordinates: [parseFloat(point[0], parseFloat(point[1]))]
                })
              }))
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
            source.addFeature(addFeature);
            source.addFeatures(pointsFeatures);
            map.addLayer(new VectorLayer({
              source: source
            }))
          }
        }
        xhttp.open("POST", "upload/kml", true);
        const fileData = new FormData();
        fileData.append("file", uploadKML);
        xhttp.send(fileData);
      }
    }
    uploaded.click();
  }
  else if (typeValue == ".csv") {
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
          }))*/
        }
      };
      reader.readAsDataURL(uploadCSV);
    }
    uploaded.click();
  }
}

/*
function upload_kml() {
  var uploaded = document.createElement("input");
  uploaded.type = "file";
  uploaded.accept = ".kml";
  uploaded.onchange = e => {
    var uploadKML = e.target.files[0];
    if (uploadKML) {
      var reader = new FileReader();
      reader.onload = function() {
        map.addLayer(new VectorLayer({
          source: new VectorSource({
            url: reader.result,
            format: new KML()
          })
        }))
      };
      reader.readAsDataURL(uploadKML);
    }
  }
  uploaded.click();
}


function upload_ncv3() {
  var uploaded = document.createElement("input");
  uploaded.type = "file";
  uploaded.accept = ".nc";
  uploaded.onchange = e => {
    var uploadNC = e.target.files[0];
    if (uploadNC) {
      var reader = new FileReader();
      reader.onload = function() {
        var ncReader = new NetCDFReader(reader.result);
        console.log(ncReader.getDataVariable("lat"));
        // figure out the actual displays later I guess
      }
      reader.readAsArrayBuffer(uploadNC);
    }
  }
  uploaded.click();
}

function upload_ncv4() {
  var uploaded = document.createElement("input");
  uploaded.type = "file";
  uploaded.accept = ".nc";
  uploaded.onchange = e => {
    var uploadNC = e.target.files[0];
    if (uploadNC) {
      var reader = new FileReader();
      reader.onload = function() {
        var file = new hdf5.File(reader.result, uploaded.name);
        var lats = file.get("latitude").value;
        var longs = file.get("longitude").value;
        var coords = []
        for (var i = 0; i < lats.length; i++) {
          coords.push([lats[i], longs[i]]);
        }
        map.addLayer(new VectorLayer({
          source: new VectorSource(),
          geometry: new MultiPoint({
            coordinates: coords
          })
        }))
      }
    };
    reader.readAsArrayBuffer(uploadNC);
  }
  uploaded.click();
}*/

/*

var lines = [];

const expr = document.getElementById('expr')
const pretty = document.getElementById('pretty')
const result = document.getElementById('result')
const add_button = document.getElementById('line')
let parenthesis = 'keep'
let implicit = 'hide'

const mj = function (tex) {
    return MathJax.tex2svg(tex, {em: 16, ex: 6, display: false});
}

function change_pretty() {
    let node = null
  
    try {
      // parse the expression
      node = math.parse(expr.value)
  
      // evaluate the result of the expression
      //result.innerHTML = math.format(node.compile().evaluate())
    }
    catch (err) {
      //result.innerHTML = '<span style="color: red;">' + err.toString() + '</span>'
      console.log(err);
    }
  
    try {
      // export the expression to LaTeX
      const latex = node ? node.toTex({parenthesis: parenthesis, implicit: implicit}) : '';
      console.log('LaTeX expression:', latex);
  
      // display and re-render the expression
      MathJax.typesetClear();
      pretty.innerHTML = '';
      pretty.appendChild(mj(latex));
    }
    catch (err) {
      console.log(err);
    }
}
*/

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

function add_line(coordinates, name, date, model, color, increments) {
    const lineSymbol = {
      type: "simple-line",
      color: color,
      width: 1
    };
    const lineAtt = {
      Name: name,
      Date: date,
      Model: model,
    };
    const polylineGraphic = new Graphic({
      geometry: new Polyline({
        paths: [
          [-74, 37],
          [-75, 35],
          [-76, 32]
        ]
      }),
      symbol: lineSymbol,
      attributes: lineAtt,
      popupTemplate: {
        title: "Path",
        content: [
          {
            type: "fields",
            fieldInfos: [
              {
                fieldName: "Name"
              },
              {
                fieldName: "Date"
              },
              {
                fieldName: "Model"
              }
            ]
          }
        ]
      }
    });
    //var soFar = []
    //rec_calc(polylineGraphic, coordinates, 10, 0, []);
    //geometryEngine.union(polylineGraphic.geometry);
    view.graphics.add(polylineGraphic);
}

$(document).ready(function () {
  $('#dataType a').on('click', function () {
    typeValue = ($(this).text());
  })
})
addData.addEventListener("click", upload_data.bind(this));
//add_button.addEventListener("click", add_line.bind(this, [-74, 37], "glider 1", "5/16/2024", "none", [20, 3, 252], 0));