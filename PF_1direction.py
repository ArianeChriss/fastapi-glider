import matplotlib.pyplot as plt
import random
import numpy as np
import math
from read_current import get_closest_current
from dapclient.client import open_url
import dateutil
from datetime import datetime, timedelta, timezone
from dateutil.tz import gettz
import json

def convert_dmm_to_dd(dmm_value):
       if dmm_value < 0: 
           degrees = -dmm_value // 100
           minutes = -dmm_value % 100
           return -(degrees + (minutes / 60))
       else:
           degrees = dmm_value // 100
           minutes = dmm_value % 100
           return degrees + (minutes / 60)

def dmm_to_dd(coords_list):
   dd_list = []
   print(coords_list)
   coords_list = np.array(coords_list).T
   print(coords_list)
   for coord in coords_list:
       lon_dd = convert_dmm_to_dd(coord[0])
       lat_dd = convert_dmm_to_dd(coord[1])

       dd_list.append([lon_dd, lat_dd]) 

   return dd_list

def dmm_to_dd_2(coords_list):
   dd_list = []
   for coord in coords_list:
       lon_dd = convert_dmm_to_dd(coord[0])
       lat_dd = convert_dmm_to_dd(coord[1])

       dd_list.append([lon_dd, lat_dd]) 

   return dd_list


def update_weights(particles, measurement, measurement_std=1):
	""" 
	Update particle weights based on the measurement.
	"""
	distances = np.linalg.norm(particles - measurement, axis=1)
	#print(distances)
	#print(particles)

	weights = np.exp(-0.5 * (distances / measurement_std) ** 2) + 1e-6

	return weights / np.sum(weights)  # Normalize weights


def resample(particles, measurement, measurement_std=0.001):
	""" 
	Resample particles based on weights.
	"""
	weights = update_weights(particles, measurement, measurement_std)
	#print(weights)
	indices = np.random.choice(len(particles), len(particles), p=weights)
	return particles[indices]



def estimate_positions(glider_times, initial_positions, heading_angle, currentdata, t=1, v_kinematic=0.29, n_samples=200, n_g_std = 0.0001, n_c_std =0.005):
	'''
	Input: 
		initial_positions: One or multiple initial positions for the glider, size (1,2) or (n_samples,2)
		heading_angle: Heading calculated from commanded position user input 
		t: time duration is fixed to one hour, since current data will update every one hour
		v_kinematic: glider's default velocity is 0.29 m/s
		n_samples: default number of samples for particle filter is 200
		n_g_std: Glider velocity noise is zero mean Gaussian with default standard deviation of 0.005
		n_c_std: Current velocity noise is zero mean Gaussian with default standard deviation of 0.005

	Getting familiar with other variables: 
		v_g_north: north component of glider velocity
		v_c_east: east component of current velocity
		and so on...

	Returns: estimated positions, (n_samples,2) array
	'''
	
	# Calculate glider's velocity components
	v_g_north = np.sin(heading_angle)*v_kinematic
	v_g_east = np.cos(heading_angle)*v_kinematic

	""" 	# Get list of currents
	preURL = 'https://tds.marine.rutgers.edu/thredds/dodsC/roms/doppio/2017_da/his/runs/History_RUN_'
	datetimecheck = str(datetime.fromtimestamp(glider_times[0], timezone.utc))
	fulldatetime = dateutil.parser.isoparse(datetimecheck)
	hourOffset = int(datetimecheck[11:13])
	minuteOffset = int(datetimecheck[14:16])
	if (minuteOffset > 0):
		#duration = int(duration) + 1
		duration = int(t) + 1
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
		current_times = dataset['time'][hourOffset + (tryNum * 24):hourOffset + int(duration) + (tryNum * 24)].data.tolist()
		longs = dataset['lon_rho'][:][:].data#.tolist()
		lats = dataset['lat_rho'][:][:].data#.tolist()
		uEast = dataset['u_eastward'][hourOffset + (tryNum * 24):hourOffset + int(duration) + (tryNum * 24)][:][:].data.tolist()
		vNorth = dataset['v_northward'][hourOffset + (tryNum * 24):hourOffset + int(duration) + (tryNum * 24)][:][:].data.tolist() """
		#uEast = np.array(uEast)[0]
		#vNorth = np.array(vNorth)[0]
	# Calculate current's velocity components
	
	v_c_east, v_c_north = get_closest_current(initial_positions[:,0],initial_positions[:,1], np.array(currentdata["longs"]), np.array(currentdata["lats"]), glider_times, np.array(currentdata["uEast"]), np.array(currentdata["vNorth"]), currentdata["times"]) #0,0
	#v_c_east, v_c_north = v_c_east*0.51, v_c_north*0.51
	# print("current:", v_c_east, v_c_north)
	n_g_mean, n_c_mean = 0, 0

	# Add noise
	n_c_east = np.random.normal(n_c_mean, n_c_std, n_samples)
	n_c_north = np.random.normal(n_c_mean, n_c_std, n_samples)
	n_g_east = np.random.normal(n_g_mean, n_g_std, n_samples)
	n_g_north = np.random.normal(n_g_mean, n_g_std, n_samples)

	# Calculate resultant velocity v = v_g + v_c for both components
	v_east = v_g_east + v_c_east + n_c_east + n_g_east
	v_north = v_g_north + v_c_north + n_c_north + n_g_north
	
	dive_duration = 2*3600 # in seconds

	# Calculate traveled distance
	d_east = v_east*dive_duration/111139			# where did this come from???
	d_north = v_north*dive_duration/111139

	# Calculate estimated positions of the glider
	estimated_long = initial_positions[:,0] + d_east #Finds new position, converts into lattitude and longitude again, than adds to new_position list. 
	estimated_lat = initial_positions[:,1] + d_north
	estimated_positions = np.array([estimated_long, estimated_lat]).T

	return estimated_positions


def initialize_particles(initial_position, n_samples=200):
	'''
	Initializes all the particles at the same location, size (1,n_samples,2)
	2 coordinates for longitude, latitude
	'''
	initial_positions = np.zeros((1, n_samples, 2))
	initial_positions[:, :, 0] = initial_position[0]
	initial_positions[:, :, 1] = initial_position[1]

	return initial_positions


def plot_positions(initial_positions, estimated_positions, commanded_position=None, measured_position=None, resampled_positions=None):
	
	plt.scatter(initial_positions[:,:,0], initial_positions[:,:,1], color='red', marker='.', label='Initial position')

	# plt.scatter(estimated_positions[:,:,0], estimated_positions[:,:,1], color='orange', marker='.', label='Estimated positions')
	# if commanded_position:
	#     plt.scatter(commanded_position[0], commanded_position[1], color='yellow', marker='x', label='Commanded position')
	if measured_position:
		plt.scatter(measured_position[0], measured_position[1], color='blue', marker='x', label='Measurement after 2 hours')
	# if resampled_positions:
		plt.scatter(resampled_positions[:,:,0], resampled_positions[:,:,1], color='green', marker='.', label='Resampled positions')


def initialize_particles(initial_position, n_samples=200):
	'''
	Initializes all the particles at the same location, size (1,n_samples,2)
	2 coordinates for longitude, latitude
	'''
	initial_positions = np.zeros((1, n_samples, 2))
	initial_positions[:, :, 0] = initial_position[0]
	initial_positions[:, :, 1] = initial_position[1]

	return initial_positions


def run_filter_one(calibration, duration, filterdata, desLong, desLat, glider_times, glider_longs, glider_lats, glider_wpt_longs, glider_wpt_lats, v_kinematic=0.29, n_samples=200, n_g_std=0.005, n_c_std=0.005):
	returndata = {"actual": filterdata, "predictions": {}}
	#print(glider_longs)
	#print("^ longs")
	#print(glider_lats)
	#print("^ lats")
	measured_positions = np.column_stack((np.array(glider_longs), np.array(glider_lats)))		# if this doesn't work, check the format of the array(s)
	#print(measured_positions)
	measured_positions = dmm_to_dd_2(measured_positions)
	#print('meas pos:', measured_positions)
	initial_positions = [measured_positions[0][0], measured_positions[0][1]]
	estimated_positions = np.zeros((1,200,2))
	#commanded_position = [-73.19134, 38.414]
	commanded_position = [desLong, desLat]
	estimated_positions = np.zeros((1,200,2))
	#measured_positions = [[-74.23063, 38.415283], [-74.22113, 38.41733], [-74.205475, 38.416848], [-74.186723, 38.411815], [-74.16965, 38.407292], [-74.154815, 38.407554]]
	resampled_positions = np.zeros((1,200,2))

	times = np.arange(0, calibration, 2)		# i think this way of generating the times is wrong
			
	#print(measured_positions)
	#plt.figure()
	#print(glider_times)
	for t in range(calibration):			# this is gonna have to include duration at some point
		commanded_position = [filterdata["points"][list(filterdata["points"])[-1 * int(t)]]["long"], filterdata["points"][list(filterdata["points"])[-1 * int(calibration)]]["lat"]]
		if t == 0:
			#print('init pose:',initial_position)
			initial_positions = initialize_particles(initial_positions, n_samples=n_samples)
			flattened_initial_positions = initial_positions.reshape(np.shape(initial_positions)[0]*np.shape(initial_positions)[1], 2)
			longs = [flattened_initial_positions[:,0].tolist()]
			lats = [flattened_initial_positions[:,1].tolist()]
		else:
			initial_positions = resampled_positions.copy()
			flattened_initial_positions = initial_positions.reshape(np.shape(initial_positions)[0]*np.shape(initial_positions)[1], 2)
			longs.append(flattened_initial_positions[:,0].tolist())
			lats.append(flattened_initial_positions[:,1].tolist())
		
		returndata["predictions"][str(glider_times[t])] = {}
		for i in range(len(flattened_initial_positions)):
			returndata["predictions"][str(glider_times[t])][i] = {}
			returndata["predictions"][str(glider_times[t])][i]["long"] = flattened_initial_positions[i][0]
			returndata["predictions"][str(glider_times[t])][i]["lat"] = flattened_initial_positions[i][1]
			returndata["predictions"][str(glider_times[t])][i]["wptLong"] = glider_wpt_longs[t]
			returndata["predictions"][str(glider_times[t])][i]["wptLat"] = glider_wpt_lats[t]
		#print(initial_positions[0])
		#diff_in_lon = float(commanded_position[0])-initial_positions[0,:,0] #Difference in lattitude between commanded and inital points, in meters.
		diff_in_lon = float(glider_wpt_longs[t])-initial_positions[0,:,0]
		diff_in_lat = float(glider_wpt_lats[t])-initial_positions[0,:,1] #Difference in longitude between commanded and initial points, in meters.
		heading_angle = np.arctan2(diff_in_lat,diff_in_lon)
		# print(np.mean(heading_angle))

		estimated_positions[0] = estimate_positions(glider_times, initial_positions[0], heading_angle, filterdata["currents"], t=2*t, v_kinematic=0.29)
		#print(estimated_positions[0])
		# if measured_positions:
		resampled_positions[0,:,:] = resample(estimated_positions[0], measured_positions[t])			# why is this floor function???
		print(t)
		'''if t==4:
			#print(np.shape(np.array(longs)))
			break'''


		# plot_positions(initial_positions, estimated_positions, commanded_position=commanded_position, measured_position=measured_position[t//2], resampled_positions=resampled_positions)
	return json.dumps({"time": times.tolist(), "longs": longs, "lats": lats, "measured": measured_positions, "returndata": returndata, "currentdata": filterdata["currents"]})

	plt.xlabel('Longitude')
	plt.ylabel('Latitude')
	plt.title('Estimated Glider Position')
	plt.legend()
	plt.grid()
	plt.show()
	return


#run_filter_one(12)

