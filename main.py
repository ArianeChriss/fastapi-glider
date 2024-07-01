from fastapi import FastAPI, Request, WebSocket, Body, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, StreamingResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run
from fastapi.templating import Jinja2Templates
import uvicorn
import os
from pykml import parser
import aiofiles
import base64
import sys
from io import StringIO
import json
from pprint import pprint
import re
from datetime import datetime

app = FastAPI(title="main-app")
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="./templates/static"), name="static")

origins = [
    "*"
]

app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)

@app.get("/")
def read_root(request: Request):
	return templates.TemplateResponse("index.html", {"request": request})

@app.get("/index.html")
def read_root(request: Request):
	return templates.TemplateResponse("index.html", {"request": request})

@app.get("/static/{filename}")
async def get_resource(filename):
	filename = './templates/static/' + filename

	if not os.path.isfile(filename):
		return Response(status_code=404)

	return FileResponse(filename)

@app.post("/upload/{filetype}")
async def parse_file(filetype, file: UploadFile = File(...)):
	if (filetype == "kml"):
		try:
			points = []
			contents: bytes = await file.read()
			doc = parser.fromstring(contents)
			for placemark in doc.Document.Placemark:
				if hasattr(placemark, "description"):
					description_text = placemark.description.text.strip()
					time_match = re.search(r"time = (.*?)Z", description_text, re.IGNORECASE)
					long_match = re.search(r'longitude = (.*?) degrees_east', description_text, re.IGNORECASE)
					lat_match = re.search(r'latitude = (.*?) degrees_north', description_text, re.IGNORECASE)
					if time_match and lat_match and long_match:
						time_info = time_match.group(1)
						long_info = long_match.group(1)
						lat_info = lat_match.group(1)
						points.append([long_info, lat_info, time_info])
			sorted_points = sorted(points, key=lambda t: datetime.strptime(t[2], '%Y-%m-%dT%H:%M:%S'))
			pointsJSON = json.dumps({"coordinates": sorted_points})
			return Response(content=pointsJSON, status_code=200)
		except Exception as e:
			print(e)
			print("file upload failed")

'''@app.get("/static/netcdfjs/src/{filename}")
async def get_parser(filename):
	filename = './templates/static/node_modules/netcdfjs/src/' + filename
	
	if not os.path.isfile(filename):
		return Response(status_code=403)
	
	return FileResponse(filename)'''

if (__name__=="__main__"):
	run(app, port=8080)