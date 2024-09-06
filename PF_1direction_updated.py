import matplotlib.pyplot as plt
import random
import numpy as np
import math
from read_current import get_closest_current
#from dapclient.client import open_url
import dateutil
from datetime import datetime, timedelta, timezone
from dateutil.tz import gettz
import json
from filterpy.monte_carlo import systematic_resample
from numpy.linalg import norm
from numpy.random import randn
import scipy.stats
from haversine import haversine, inverse_haversine, Direction, Unit

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
	coords_list = np.array(coords_list).T
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

def inverse_haversine_new(initial_coords, distance, heading):
	lat1_rad = initial_coords[1] * math.pi/180
	long1_rad = initial_coords[0] * math.pi/180
	heading_rad = heading# * math.pi/180	think this was already in radians, check
	r_earth = 6378137
	#print("lat1_rad " + str(lat1_rad))
	#print("long1_rad " + str(long1_rad))
	#print("heading_rad " + str(heading_rad))
	lat2_rad = math.asin((math.sin(lat1_rad) * math.cos(distance / r_earth)) + (math.cos(lat1_rad) * \
									math.sin(distance / r_earth) * math.cos(heading_rad)))
	long2_rad = long1_rad + math.atan2(math.sin(heading_rad) * math.sin(distance / r_earth) * \
									math.cos(lat1_rad), math.cos(distance / r_earth) - math.sin(lat1_rad) * math.sin(lat2_rad))
	#print("lat2_rad " + str(lat2_rad))
	#print("long2_rad " + str(long2_rad))
	return [long2_rad * 180 / math.pi, lat2_rad * 180 / math.pi]

def update(particles, weights, z, R, landmarks):
	for i, landmark in enumerate(landmarks):
		distance = np.linalg.norm(particles - landmark, axis=1)
		weights *= scipy.stats.norm(distance, R).pdf(z[i])
	weights += 1.e-300      # avoid round-off to zero
	weights /= sum(weights) # normalize
	return particles, weights

def estimate(particles, weights):
	"""returns mean and variance of the weighted particles"""
	pos = particles[:, 0:2]
	mean = np.average(pos, weights=weights, axis=0)
	var  = np.average((pos - mean)**2, weights=weights, axis=0)
	return mean, var

def neff(weights):
	return 1. / np.sum(np.square(weights))

def resample_from_index(particles, weights, indexes):
	particles[:] = particles[indexes]
	weights.resize(len(particles))
	weights.fill (1.0 / len(weights))
	return particles, weights

def predict(glider_times, initial_positions, heading_angle, glider_wpt_long, glider_wpt_lat, currentdata, t, v_kinematic, n_samples, n_g_std, n_c_std, n_t_std, duration):
	# Calculate glider's velocity components
	#v_g_north = np.sin(heading_angle)*v_kinematic
	#v_g_east = np.cos(heading_angle)*v_kinematic

	#print("initial position " + str(initial_positions[0]))
	print("heading angle radians " + str(heading_angle))
	print("heading angle degrees " + str(math.degrees(heading_angle)))

	v_c_east, v_c_north = get_closest_current(initial_positions[:,0],initial_positions[:,1], np.array(currentdata["longs"]), np.array(currentdata["lats"]), glider_times, np.array(currentdata["uEast"]), np.array(currentdata["vNorth"]), currentdata["times"]) #0,0
	#v_c_east *= 0.5				# TAKE THESE OUT LATER
	#v_c_north *= 0.5
	k = 0.33 - np.sqrt((v_c_east ** 2) + (v_c_north ** 2))	# what this represents is somewhere in my notes but it's a known quantity I just didn't want to make another super long line
	if (0 <= heading_angle < 90):
		v_g_north = np.sqrt(k / ((np.tan(heading_angle) ** 2) + 1))
		v_g_east = v_g_north * np.tan(heading_angle)
	elif (90 <= heading_angle < 180):
		v_g_north = -1 * np.sqrt(k / ((np.tan(heading_angle - math.radians(90)) ** 2) + 1))
		v_g_east = v_g_north * np.tan(heading_angle - math.radians(90))
	elif (180 <= heading_angle < 270):
		v_g_north = -1 * np.sqrt(k / ((np.tan(heading_angle - math.radians(180)) ** 2) + 1))
		v_g_east = -1 * v_g_north * np.tan(heading_angle - math.radians(180))
	else:
		v_g_north = np.sqrt(k / ((np.tan(heading_angle - math.radians(270)) ** 2) + 1))
		v_g_east = -1 * v_g_north * np.tan(heading_angle - math.radians(270))
	#v_g_east = (np.sqrt(((glider_wpt_long - initial_positions[:, 0]) ** 2) + (glider_wpt_lat - initial_positions[:, 1]) ** 2) *  np.cos(heading_angle)) * np.sqrt((v_kinematic ** 2) - ((v_c_east ** 2) + (v_c_north ** 2)))
	#v_g_north = (np.sqrt(((glider_wpt_long - initial_positions[:, 0]) ** 2) + (glider_wpt_lat - initial_positions[:, 1]) ** 2) * np.sin(heading_angle)) * np.sqrt((v_kinematic ** 2) - ((v_c_east ** 2) + (v_c_north ** 2)))

	print("v_g_east " + str(v_g_east[0]))
	print("v_g_north " + str(v_g_north[0]))
	print("v_c_east " + str(v_c_east[0]))
	print("v_c_north " + str(v_c_north[0]))

	n_g_mean, n_c_mean = 0, 0

	# Time of dive
	n_t_mean = 0
	# Add noise
	n_c_east = np.random.normal(n_c_mean, n_c_std, n_samples)
	n_c_north = np.random.normal(n_c_mean, n_c_std, n_samples)
	n_g_east = np.random.normal(n_g_mean, n_g_std, n_samples)
	n_g_north = np.random.normal(n_g_mean, n_g_std, n_samples)

	n_time = np.random.normal(n_t_mean, n_t_std, n_samples)

	# Calculate resultant velocity v = v_g + v_c for both components
	v_east = v_g_east + v_c_east + n_c_east + n_g_east
	v_north = v_g_north + v_c_north + n_c_north + n_g_north
	#v_east = np.sin(heading_angle) * v_kinematic
	#v_north = np.cos(heading_angle) * v_kinematic
	print("v_east " + str(v_east[0]))
	print("v_north " + str(v_north[0]))

	dive_duration = (n_time + duration) * 3600 # in seconds
	
	r_earth = 6378137
	#d_north  =  (v_north * dive_duration / r_earth) * (180 / np.pi)
	#d_east =  (v_east * dive_duration / r_earth) * (180 / np.pi) / np.cos(initial_positions[:,1] * np.pi/180)

	#d_north = (v_north * dive_duration) / 111320
	#d_east = (v_east * dive_duration) / (111320 * np.cos(initial_positions[:, 1]))
	d_north = (v_north * dive_duration)
	d_east = (v_east * dive_duration)

	print("d_east meters " + str(v_east[0] * dive_duration[0]) + ", d_north meters " + str(v_north[0] * dive_duration[0]))
	#print("d_east " + str(d_east[0]) + ", d_north " + str(d_north[0]))

	# Calculate estimated positions of the glider
	#estimated_long = initial_positions[:,0] + d_east #Finds new position, converts into lattitude and longitude again, than adds to new_position list. 
	#estimated_lat = initial_positions[:,1] + d_north
	
	# HEADING ANGLE NEEDS TO BE RECALCULATED AHHHHHHHHHHHHHHHH

	#long1 = np.radians(initial_positions[:, 0])
	#lat1 = np.radians(initial_positions[:, 1])
	#central_angle = (np.sqrt((d_north ** 2) + (d_east **2)) / r_earth) * (180 / math.pi)
	#delta_lat = central_angle + math.sin(heading_angle)
	#delta_long = central_angle * math.cos(heading_angle) / np.cos(initial_positions[:, 1])
	#total_distance = np.sqrt((d_north ** 2) + (d_east ** 2))
	#delta_lat = (d_north / r_earth) * 180 / math.pi
	#delta_long = (d_east / r_earth) * (180 / math.pi) / np.cos(lat1)
	#estimated_long = np.degrees(long1 + delta_long)
	#estimated_lat = np.degrees(lat1 + delta_lat)
	estimated_long = []
	estimated_lat = []
	new_heading = (np.arctan2(d_east, d_north) + (2 * math.pi)) % (2 * math.pi)	# swapped these
	print("new heading angle radians " + str(new_heading[0]))
	print("new heading angle degrees " + str(math.degrees(new_heading[0])))
	for i in range(len(d_north)):
		new_pos = inverse_haversine_new([initial_positions[i][0], initial_positions[i][1]], float(math.sqrt((d_north[i] ** 2) + (d_east[i] ** 2))), new_heading[i])
		estimated_lat.append(new_pos[1])
		estimated_long.append(new_pos[0])
	estimated_positions = np.array([np.array(estimated_long), np.array(estimated_lat)]).T

	print("haversine check " + str(haversine(initial_positions[0], estimated_positions[0])))
	print("estimated position " + str(estimated_positions[0]))

	return estimated_positions

def initialize_particles(initial_position, n_samples):
	'''
	Initializes all the particles at the same location, size (1,n_samples,2)
	2 coordinates for longitude, latitude
	'''
	initial_positions = np.zeros((n_samples, 2))
	initial_positions[:, 0] = initial_position[0]
	initial_positions[:, 1] = initial_position[1]

	return initial_positions

def increment_pos(initial_position, commanded_position, v_kinematic, duration = 2):
	#diff_in_lon = float(commanded_position[0]) - float(initial_position[0])
	#diff_in_lat = float(commanded_position[1]) - float(initial_position[1])
	diff_in_lon = (float(commanded_position[0]) - float(initial_position[0])) * math.pi / 180
	diff_in_lat = (float(commanded_position[1]) - float(initial_position[1])) * math.pi / 180
	
	y = math.sin(diff_in_lon) * math.cos(float(commanded_position[1]) * math.pi / 180)
	x = (math.cos(float(initial_position[1]) * math.pi / 180) * math.sin(float(commanded_position[1]) * math.pi / 180)) - \
		(math.sin(float(initial_position[1]) * math.pi /180) * math.cos(float(commanded_position[1] * math.pi / 180)) * \
		math.cos(diff_in_lon))
	theta = math.atan2(y, x)
	#print("x " + str(x) + ", y " + str(y) + ", theta " + str(theta))
	heading_angle = math.radians((math.degrees(theta) + 360) % 360)
	#heading_angle = np.arctan2(diff_in_lat,diff_in_lon)

	#v_north = math.sqrt(((commanded_position[1] - initial_position[1]) ** 2) + ((commanded_position[0] - initial_position[0]) ** 2)) *  np.sin(heading_angle) * v_kinematic
	#v_east = math.sqrt(((commanded_position[1] - initial_position[1]) ** 2) + ((commanded_position[0] - initial_position[0]) ** 2)) *  np.cos(heading_angle) * v_kinematic
	
	#r_earth = 6378137
	#d_north  =  (v_north * duration) / 111320
	#d_east =  (v_east * duration) / (111320 * np.cos(initial_position[1]))
	#d_north = v_north * duration
	#d_east = v_east * duration
	
	#new_position = [initial_position[0] + d_north, initial_position[1] + d_east]
	new_position = inverse_haversine_new(initial_position, v_kinematic * duration * 3600, heading_angle)
	print("glider pos " + str(new_position))
	return np.array(new_position)

def run_filter_one(calibration, duration, filterdata, glider_times, glider_longs, glider_lats, glider_wpt_longs, glider_wpt_lats, v_kinematic=0.29, n_samples=200, n_g_std=0.005, n_c_std=0.005, n_t_std=0.005, increment = 2):
	returndata = {"actual": filterdata, "predictions": {}}
	measured_positions = np.column_stack((np.array(glider_longs), np.array(glider_lats)))
	initial_positions = measured_positions
	resampled_positions = np.zeros((1,n_samples,2))

	commanded_positions = np.column_stack((np.array(glider_wpt_longs), np.array(glider_wpt_lats)))
	weights = np.ones(n_samples) / n_samples

	estimated_positions = measured_positions

	times = np.arange(0, calibration, 2)
	#print("initial " + str(estimated_positions[0]))
	for t in range(1, calibration):
		glider_pos = increment_pos(measured_positions[t - 1], commanded_positions[t - 1], v_kinematic, increment) # where it SHOULD be going by dead reckoning
		initial_positions = initialize_particles(measured_positions[t - 1], n_samples = n_samples)
		diff_in_lon = (float(glider_wpt_longs[t - 1]) - float(measured_positions[t - 1][0])) * math.pi / 180
		diff_in_lat = (float(glider_wpt_lats[t - 1]) - float(measured_positions[t - 1][1])) * math.pi / 180
		
		y = math.sin(diff_in_lon) * math.cos(float(glider_wpt_lats[t - 1]) * math.pi / 180)
		x = (math.cos(float(measured_positions[t - 1][1]) * math.pi / 180) * math.sin(float(glider_wpt_lats[t - 1]) * math.pi / 180)) - \
			(math.sin(float(measured_positions[t - 1][1]) * math.pi /180) * math.cos(float(glider_wpt_lats[t - 1] * math.pi / 180)) * \
			math.cos(diff_in_lon))
		theta = math.atan2(y, x)
		#print("x " + str(x) + ", y " + str(y) + ", theta " + str(theta))
		heading_angle = math.radians((math.degrees(theta) + 360) % 360)
	   	#math.sin(diff_in_lat / 2)) + (math.cos(float(measured_positions[t - 1][1] * (math.pi / 180))) * math.cos(float(glider_wpt_lats[t - 1]) * math.pi / 180) * math.sin(diff_in_lon / 2) * math.sin(diff_in_lon / 2))
		#heading_angle = math.degrees(2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))
		print("initial position " + str(measured_positions[t - 1]))
		print("waypoint " + str([glider_wpt_longs[t - 1], glider_wpt_lats[t - 1]]))

		landmarks = [measured_positions[t]]
		NL = 1
		zs = (norm(landmarks - glider_pos, axis=1) + (randn(NL) * (n_g_std + n_c_std + n_t_std)))

		estimated_positions = predict(glider_times, initial_positions, heading_angle, glider_wpt_longs[t - 1], glider_wpt_lats[t - 1], filterdata["currents"], t - 1, v_kinematic, n_samples, n_g_std, n_c_std, n_t_std, duration)
		#print("estimated " + str(estimated_positions[0]))
		estimated_positions, weights = update(estimated_positions, weights, z=zs, R=n_g_std + n_c_std + n_t_std, landmarks=landmarks)

		if neff(weights) < n_samples/2:
			indexes = systematic_resample(weights)
			estimated_positions, weights = resample_from_index(estimated_positions, weights, indexes)
			assert np.allclose(weights, 1/n_samples)

		flattened_resampled_positions = estimated_positions
		returndata["predictions"][str(glider_times[t])] = {}
		for i in range(len(flattened_resampled_positions)):
			returndata["predictions"][str(glider_times[t])][i] = {}
			returndata["predictions"][str(glider_times[t])][i]["long"] = flattened_resampled_positions[i][0]
			returndata["predictions"][str(glider_times[t])][i]["lat"] = flattened_resampled_positions[i][1]
			returndata["predictions"][str(glider_times[t])][i]["wptLong"] = glider_wpt_longs[t]
			returndata["predictions"][str(glider_times[t])][i]["wptLat"] = glider_wpt_lats[t]
		
		print(t)


	return json.dumps({"time": times.tolist(), "longs": [], "lats": [], "measured": measured_positions.tolist(), "returndata": returndata, "currentdata": filterdata["currents"]})