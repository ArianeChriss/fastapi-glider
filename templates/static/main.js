//import './index.css';
import Map from 'https://cdn.skypack.dev/ol/Map.js';
import View from 'https://cdn.skypack.dev/ol/View.js';
import TileLayer from 'https://cdn.skypack.dev/ol/layer/Tile.js';
import OSM from 'https://cdn.skypack.dev/ol/source/OSM.js';
//import Map from "@arcgis/core/Map.js";
//import MapView from "@arcgis/core/views/MapView.js";
//import Graphic from "@arcgis/core/Graphic.js";
//import Polyline from "@arcgis/core/geometry/Polyline.js";
//import Point from "@arcgis/core/geometry/Point.js";
//import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
//import { setAssetPath } from "@esri/calcite-components/dist/components";

//console.log('👋 This message is being logged by "renderer.js", included via Vite');
//setAssetPath("https://js.arcgis.com/calcite-components/2.8.2/assets");
/*
import "@esri/calcite-components/dist/components/calcite-tab";
import "@esri/calcite-components/dist/components/calcite-tab-nav";
import "@esri/calcite-components/dist/components/calcite-tab-title";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-icon";
import "@esri/calcite-components/dist/components/calcite-slider";

const map = new Map({
    basemap: "oceans"
});
  
const view = new MapView({
    container: "viewDiv",
    map: map,
    zoom: 6,
    center: [-75, 38] // longitude, latitude
});
*/
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

const add_kml = document.getElementById("addKML");

function upload_kml() {
  var uploaded = document.createElement("input");
  uploaded.type = "file";
  uploaded.accept = ".kml";
}

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

add_kml.addEventListener("click", upload_kml.bind(this));
//add_button.addEventListener("click", add_line.bind(this, [-74, 37], "glider 1", "5/16/2024", "none", [20, 3, 252], 0));