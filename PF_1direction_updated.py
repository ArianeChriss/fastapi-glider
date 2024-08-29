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

def predict(glider_times, initial_positions, heading_angle, currentdata, t, v_kinematic=0.33, n_samples=200, n_g_std=0.05, n_c_std=0.05, n_t_std=0.5):
	# Calculate glider's velocity components
	v_g_north = np.sin(heading_angle)*v_kinematic
	v_g_east = np.cos(heading_angle)*v_kinematic

	v_c_east, v_c_north = get_closest_current(initial_positions[:,0],initial_positions[:,1], np.array(currentdata["longs"]), np.array(currentdata["lats"]), glider_times, np.array(currentdata["uEast"]), np.array(currentdata["vNorth"]), currentdata["times"]) #0,0
	n_g_mean, n_c_mean = 0, 0

	# Time of dive
	t_mean = 0
	# Add noise
	n_c_east = np.random.normal(n_c_mean, n_c_std, n_samples)
	n_c_north = np.random.normal(n_c_mean, n_c_std, n_samples)
	n_g_east = np.random.normal(n_g_mean, n_g_std, n_samples)
	n_g_north = np.random.normal(n_g_mean, n_g_std, n_samples)

	n_time = np.random.normal(t_mean, n_t_std, n_samples)

	# Calculate resultant velocity v = v_g + v_c for both components
	v_east = v_g_east + v_c_east + n_c_east + n_g_east
	v_north = v_g_north + v_c_north + n_c_north + n_g_north

	#print("v_east " + str(v_east))
	#print("v_north " + str(v_north))

	dive_duration = (n_time + t_mean) * 3600 # in seconds
	
	r_earth = 6378137
	#d_north  =  (v_north * dive_duration / r_earth) * (180 / np.pi)
	#d_east =  (v_east * dive_duration / r_earth) * (180 / np.pi) / np.cos(initial_positions[:,1] * np.pi/180)

	d_north = (v_north * dive_duration) / 111320
	d_east = (v_east * dive_duration) / (111320 * np.cos(initial_positions[:, 1]))

	#print("d_east: " + str(d_east) + ", d_north: " + str(d_north))

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
	initial_positions = np.zeros((n_samples, 2))
	initial_positions[:, 0] = initial_position[0]
	initial_positions[:, 1] = initial_position[1]

	return initial_positions

def increment_pos(initial_position, commanded_position, v_kinematic, duration = 2):
	diff_in_lon = float(commanded_position[0]) - float(initial_position[0])
	diff_in_lat = float(commanded_position[1]) - float(initial_position[1])
	heading_angle = np.arctan2(diff_in_lat,diff_in_lon)
	v_north = np.sin(heading_angle)*v_kinematic
	v_east = np.cos(heading_angle)*v_kinematic
	r_earth = 6378137
	d_north  =  (v_north * duration / r_earth) * (180 / np.pi)
	d_east =  (v_east * duration / r_earth) * (180 / np.pi) / np.cos(initial_position[1] * np.pi/180)
	new_position = [initial_position[0] + d_north, initial_position[1] + d_east]
	return np.array(new_position)


def run_filter_one(calibration, duration, filterdata, desLong, desLat, glider_times, glider_longs, glider_lats, glider_wpt_longs, glider_wpt_lats, v_kinematic=0.33, n_samples=200, n_g_std=0.05, n_c_std=0.05, n_t_std=0.05):
	returndata = {"actual": filterdata, "predictions": {}}
	measured_positions = np.column_stack((np.array(glider_longs), np.array(glider_lats)))
	initial_positions = measured_positions
	resampled_positions = np.zeros((1,200,2))

	commanded_positions = np.column_stack((np.array(glider_wpt_longs), np.array(glider_wpt_lats)))
	weights = np.ones(n_samples) / n_samples

	estimated_positions = measured_positions

	times = np.arange(0, calibration, 2)
	print("initial " + str(estimated_positions[0]))
	for t in range(1, calibration):
		glider_pos = increment_pos(measured_positions[t - 1], commanded_positions[t - 1], v_kinematic, duration = 2) # where it SHOULD be going by dead reckoning
		initial_positions = initialize_particles(measured_positions[t - 1], n_samples = n_samples)
		diff_in_lon = float(glider_wpt_longs[t - 1]) - float(measured_positions[t - 1][0])
		diff_in_lat = float(glider_wpt_lats[t - 1]) - float(measured_positions[t - 1][1])
		heading_angle = np.arctan2(diff_in_lat,diff_in_lon)

		landmarks = [measured_positions[t]]
		NL = 1
		zs = (norm(landmarks - glider_pos, axis=1) + (randn(NL) * (n_g_std + n_c_std + n_t_std)))

		estimated_positions = predict(glider_times, initial_positions, heading_angle, filterdata["currents"], t - 1, v_kinematic = 0.33)
		print("estimated " + str(estimated_positions[0]))
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