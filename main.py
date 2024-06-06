from fastapi import FastAPI, Request, WebSocket, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, StreamingResponse, FileResponse, JSONResponse
from uvicorn import run
from fastapi.templating import Jinja2Templates
import uvicorn
import os

app = FastAPI(title="main-app")
templates = Jinja2Templates(directory="templates")

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

if (__name__=="__main__"):
	run(app, port=8080)