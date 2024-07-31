# Autonomous Systems Bootcamp 2024
## Glider Trajectory Estimation Model

This repository contains a FastAPI-based local web server that uses the [Rutgers Doppio ROMS model](https://gmd.copernicus.org/articles/13/3709/2020/) ocean current data and a 
kinematic model of a Teledyne Slocum glider to predict the likely location of the glider during the deployment, based on possible user-set waypoints.

### Setting up the environment
This project has been tested with Python version VERSION and the following dependency versions:
- [FastAPI](https://fastapi.tiangolo.com/) = VERSION
- [pyKML](https://pythonhosted.org/pykml/) = VERSION
- [dapclient](https://pypi.org/project/dapclient/) = VERSION
- [dateutil](https://dateutil.readthedocs.io/en/stable/) = VERSION

To set up the project, make a virtual environment with the above version of Python. To install the dependencies, activate your virtual environment, and run:
```
pip install fastapi==VERSION
pip install pyKML==VERSION
pip install dapclient==VERSION
pip install dateutil==VERSION
```
Clone or download this repository, navigate to the local repo directory and run the main.py file using:
```
cd /YOUR/PATH/fastapi-glider
python main.py
```
When the server starts, open a browser and go to the listed IP address.

SCREENSHOT

>[!NOTE]
>Your browser may default to trying to go to the IP address using https. If the server can't be found, click on the url again, and change the prefix to 'http'.


### Running the model

### Editing the source code
