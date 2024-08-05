# Autonomous Systems Bootcamp 2024
## Glider Trajectory Estimation Model

This repository contains a FastAPI-based local web server that uses the [Rutgers Doppio ROMS model](https://gmd.copernicus.org/articles/13/3709/2020/) ocean current data and a 
kinematic model of a Teledyne Slocum glider to predict the likely location of the glider during the deployment, based on possible user-set waypoints.

### Setting up the environment
This project has been tested with Python version 3.12.3 and the following dependency versions:
- [FastAPI](https://fastapi.tiangolo.com/) = 0.111.0
- [pyKML](https://pythonhosted.org/pykml/) = 0.2.0
- [dapclient](https://pypi.org/project/dapclient/) = 1.0.5
- [dateutil](https://dateutil.readthedocs.io/en/stable/) = 2.9.0.post0

To set up the project, make a virtual environment with the above version of Python. To install the dependencies, activate your virtual environment, and run:
```
pip install fastapi==0.111.0
pip install pykml==0.2.0
pip install dapclient==1.0.5
pip install python-dateutil==2.9.0.post0
```
Clone or download this repository, navigate to the local repo directory and run the main.py file using:
```
cd /YOUR/PATH/fastapi-glider
python main.py
```
When the server starts, open a browser and go to the listed IP address.

![IP address](https://github.com/user-attachments/assets/493f110b-a672-46d1-a5f3-35b05a7d3f3b)

>[!NOTE]
>Your browser may default to trying to go to the IP address using https. If the server can't be found, click on the url again, and change the prefix to 'http'.


### Running the model

### Editing the source code
For contributing to this project, fork the repository and create a pull request with any changes.

### TODOS:

Python:
- model and response function
- function to check if model weight files folder exists, if not make it
- filter and response function
- adapt for all known .csv variable naming formats (Rutgers, University of Delaware, etc.)
- save model weights to external file for future use
- add try/except blocks for error checking for bad time range in case of different time coverage files, possibly try going back another day
- separate out csv reader (to be replaced with pandas) and current checking into external functions
- add comments/documentation
- separate out any parts that could require future modification

Javascript:
- allow selection of any model weight file before filter run
- save out layer to .kml file
- fix current display switch not working beyond first trigger
- add loading cursor/grey out clickable components while waiting for response
- change datalist element to be just a timerange element selection readout
- add success/failure messages
- add map legends for path colors and possibly current strengths
- allow reordering layers
- add comments/documentation
- add favicon (optional, but cooler)

Other:
- make dataflow diagram
- figure out filter running GUI structure
  - fetch model weight file list (maybe preload into interface, refreshing when new file is saved?)
  - allow selection of any model weight file before filter run
  - add model weight files folder to .gitignore so users don't automatically download others' models
- look into remote hosting or deploying to single script activation
  - activate python environment
  - run main.py
  - open browser to IP address
