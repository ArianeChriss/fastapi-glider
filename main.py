from fastapi import FastAPI, Request, WebSocket, Body, File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, StreamingResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run
from fastapi.templating import Jinja2Templates
import uvicorn
import os
from pykml import parser
#import aiofiles
import base64
import sys
from io import StringIO
import json
from pprint import pprint
import re
from datetime import datetime, timedelta
import csv
#import pydap.client
#from pydap.client import open_url
from dapclient.client import open_url
import dateutil
import math
import numpy as np
#from filter import run_filter

from PF_1direction import run_filter_one
#from PF_8directions_backend import run_filter_eight


app = FastAPI(title="main-app")
templates = Jinja2Templates(directory="templates/asb24")
app.mount("/static", StaticFiles(directory="./templates/asb24"), name="static")

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

@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    return FileResponse('./glider_compass.ico')

@app.get("/static/{filename}")
async def get_resource(filename):
	filename = './templates/asb24/' + filename

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

@app.get('/filter/onedir/{dateTime}/{duration}/{dataID}/{desLong}/{desLat}')
async def filtering_one(dateTime, duration, dataID, desLong, desLat):
	dataset = open_url("https://slocum-data.marine.rutgers.edu/erddap/tabledap/"+str(dataID))
	timedata = list(dataset['s']['time'].data)
	latdata = list(dataset['s']['m_gps_lat'].data)
	longdata = list(dataset['s']['m_gps_lon'].data)
	timedata, latdata, longdata = zip(*sorted(zip(timedata, latdata, longdata)))
	newtime = []
	newlat = []
	newlong = []
	for j in range(len(timedata)):
		if (-5400 <= latdata[j] <= 5400):
			newtime.append(timedata[j])
			newlat.append(latdata[j])
			newlong.append(longdata[j])
	newnewtime = [newtime[0]]
	newnewlat = [newlat[0]]
	newnewlong = [newlong[0]]
	dtime = 0
	for k in range(1, len(newtime)):
		dtime = newtime[k] - newtime[k - 1]
		if (6600 <= dtime <= 7800):
			newnewtime.append(newtime[k])
			newnewlat.append(newlat[k])
			newnewlong.append(newlong[k])
	'''
	send previous glider mission data to the run_filter function
	'''
	particlesJSON = run_filter_one(duration, float(desLong), float(desLat), newnewtime, [newnewlong, newnewlat])#(datetime, duration, dataID, desLong, desLat)
	return Response(content=particlesJSON, status_code=200)

@app.get('/filter/eightdir/{dateTime}/{duration}/{dataID}/{desLong}/{desLat}')
async def filtering_eight(dateTime, duration, dataID, desLong, desLat):
	dataset = open_url("https://slocum-data.marine.rutgers.edu/erddap/tabledap/"+str(dataID))
	timedata = list(dataset['s']['time'].data)
	latdata = list(dataset['s']['m_gps_lat'].data)
	longdata = list(dataset['s']['m_gps_lon'].data)
	timedata, latdata, longdata = zip(*sorted(zip(timedata, latdata, longdata)))
	newtime = []
	newlat = []
	newlong = []
	print(latdata[0:5])
	for j in range(len(timedata)):
		if (-5400 <= latdata[j] <= 5400):
			newtime.append(timedata[j])
			newlat.append(latdata[j])
			newlong.append(longdata[j])
	newnewtime = [newtime[0]]
	newnewlat = [newlat[0]]
	newnewlong = [newlong[0]]
	dtime = 0
	for k in range(1, len(newtime)):
		dtime = newtime[k] - newtime[k - 1]
		if (6600 <= dtime <= 7800):
			newnewtime.append(newtime[k])
			newnewlat.append(newlat[k])
			newnewlong.append(newlong[k])
	#particlesJSON = run_filter_eight(duration, newnewlong[-1], newnewlat[-1])
	#return Response(particlesJSON, status_code=200)

@app.get('/newfile/{url}')
async def fetch_file(url):
	try:
		dataset = open_url("https://slocum-data.marine.rutgers.edu/erddap/tabledap/"+str(url))
	except Exception as e:
		print(e)
		print("error opening file")
	if (dataset):
		seq = dataset[('s')]
		lats = seq[('time')]
		print(lats)
		#print(seq)
		#print(seq.time.iterdata())
		all = seq[('time', 'latitude', 'longitude', 'c_wpt_lat', 'c_wpt_lon')]['time'][:].iterdata()
		#print(all)
		#lats = dataset['s']
		#print(lats)

@app.get('/opendap/{datetime}/{duration}')
async def get_data(datetime, duration):
	preURL = 'https://tds.marine.rutgers.edu/thredds/dodsC/roms/doppio/2017_da/his/runs/History_RUN_'
	fulldatetime = dateutil.parser.isoparse(datetime)
	hourOffset = int(datetime[11:13])
	minuteOffset = int(datetime[14:16])
	if (minuteOffset > 0):
		duration = int(duration) + 1
	origdatetime = "2017-11-01T00:00:00Z"
	fullorigdatetime = dateutil.parser.isoparse(origdatetime)
	timeDiff = fulldatetime - fullorigdatetime
	hourDiff = timeDiff.total_seconds() / 3600
	trying = False
	tryNum = 0
	dataset = None
	while ((not trying) and (tryNum < 5)):
		try:
			newURL = preURL + str(fulldatetime.date() - timedelta(days=tryNum)) + "T00:00:00Z"# + "?"
			print(newURL)
			dataset = open_url(newURL)
		except Exception as e:
			print(e)
			print("data unavailable for selected date/time")
			tryNum += 1
		else:
			trying = True
	if (dataset):
		times = dataset['time'][hourOffset + (tryNum * 24):hourOffset + int(duration) + (tryNum * 24)].data.tolist()
		longs = dataset['lon_rho'][:][:].data.tolist()
		lats = dataset['lat_rho'][:][:].data.tolist()
		uEast = dataset['u_eastward'][hourOffset + (tryNum * 24):hourOffset + int(duration) + (tryNum * 24)][0][:][:].data.tolist()
		vNorth = dataset['v_northward'][hourOffset + (tryNum * 24):hourOffset + int(duration) + (tryNum * 24)][0][:][:].data.tolist()
		uEast = np.array(uEast)[0].tolist()
		vNorth = np.array(vNorth)[0].tolist()
		#print(np.shape(np.array(uEast[0])))
		pointsJSON = json.dumps({"time": times, "longs": longs, "lats": lats, "eastward": uEast, "northward": vNorth})
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
