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
from datetime import datetime, timedelta
import csv
import pydap.client
from pydap.client import open_url
import dateutil


app = FastAPI(title="main-app")
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="./templates/static"), name="static")

origins = [
    "*"
]

'''app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
)'''

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
	elif (filetype == "csv"):
		try:
			points = []
			contents = await file.read()
			decoded_content = contents.decode('utf-8')
			csv_data = StringIO(decoded_content)
			csvreader = csv.reader(csv_data)
			timeIndex = None
			longIndex = None
			latIndex = None
			fields = next(csvreader)
			for i in range(len(fields)):
				if (re.search(r'time', fields[i], re.IGNORECASE) and timeIndex == None):
					timeIndex = i
				elif (re.search(r'lon', fields[i], re.IGNORECASE) and longIndex == None):
					longIndex = i
				elif (re.search(r'lat', fields[i], re.IGNORECASE) and latIndex == None):
					latIndex = i
			for row in csvreader:
				try:
					long = float(row[longIndex])
				except Exception as e:
					long = None
				try:
					lat = float(row[latIndex])
				except Exception as e:
					lat = None
				if (long != None and lat != None):
					points.append([long, lat, row[timeIndex]])
			pointsJSON = json.dumps({"coordinates": points})
			return Response(content=pointsJSON, status_code=200)
		except Exception as e:
			print(e)
			print("file upload failed")

@app.get('/opendap/{datetime}/{duration}')
async def get_data(datetime, duration):
	pre_url = 'https://tds.marine.rutgers.edu/thredds/dodsC/roms/doppio/2017_da/his/runs/History_RUN_'
	fulldatetime = dateutil.parser.isoparse(datetime)
	origdatetime = "2017-11-01T00:00:00Z"
	fullorigdatetime = dateutil.parser.isoparse(origdatetime)
	timeDiff = fulldatetime - fullorigdatetime
	hourDiff = timeDiff.total_seconds() / 3600
	trying = False
	tryNum = 0
	while ((not trying) and (tryNum < 5)):
		try:
			dataset = open_url(pre_url + str(fulldatetime.date() - timedelta(days=tryNum)) + "T00:00:00Z")
		except Exception as e:
			print(e)
			print("data unavailable for selected date/time")
			tryNum += 1
		else:
			trying = True
	if (dataset):
		if (dataset['time'][:][-1].data < int(hourDiff) + int(duration)):
			print("data unavailable for selected date/time")
			return Response(status_code=200)
		else:
			timeIndex = 0
			length = dataset['time'].shape[0]
			timeCheck = int(hourDiff) + int(duration)
			while ((int(dataset['time'][:][timeIndex].data) != timeCheck)) and (timeIndex < length):
				timeIndex += 1
			times = dataset['time'][timeIndex:int(timeIndex + int(duration))].data.tolist()
			longs = dataset['lon_rho'][timeIndex:int(timeIndex + int(duration))].data.tolist()
			lats = dataset['lat_rho'][timeIndex:int(timeIndex + int(duration))].data.tolist()
			ubarEast = dataset['ubar_eastward'][timeIndex:int(timeIndex + int(duration))].data.tolist()
			vbarNorth = dataset['vbar_northward'][timeIndex:int(timeIndex + int(duration))].data.tolist()
			pointsJSON = json.dumps({"time": times, "longs": longs, "lats": lats, "eastward": ubarEast, "northward": vbarNorth})
			return Response(content=pointsJSON, status_code=200)
	else:
		return Response(status_code=200)

'''@app.get("/static/netcdfjs/src/{filename}")
async def get_parser(filename):
	filename = './templates/static/node_modules/netcdfjs/src/' + filename
	
	if not os.path.isfile(filename):
		return Response(status_code=403)
	
	return FileResponse(filename)'''

if (__name__=="__main__"):
	run("main:app", port=8080, reload=True)