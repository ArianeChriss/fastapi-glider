import numpy as np
import matplotlib.pyplot as plt
from shapely.geometry import Point, MultiPoint
from shapely.ops import nearest_points


def get_closest_current(glider_long, glider_lat, longs, lats, glider_times, uEast, vNorth, current_times, t=1):

	# directions, n_samples = np.shape(glider_long)[0], np.shape(glider_long)[1]

	#folder = 'C:/Users/arian/Documents/GitHub/fastapi-glider/'
	#ubarEast = np.load(folder+'ubarEast.npy')

	#vbarNorth = np.load(folder+'vbarNorth.npy')

	#lats = np.load(folder+'lats.npy')

	#longs = np.load(folder+'longs.npy')

	#times = np.load(folder+'times.npy')
	#times = current_times - current_times[0] # epoch time for start of doppio model, where current hours are measured from

	firstCurrentTime = (current_times[0] * 60 * 60) + 1509494400
	currentTimeIndex = 0
	for i in range(1, len(current_times)):
		checkGliderTime = glider_times[t]
		secondCurrentTime = (current_times[i] * 60 * 60) + 1509494400
		if (firstCurrentTime > checkGliderTime):
			currentTimeIndex = i
			break
		if ((firstCurrentTime - checkGliderTime) < ((secondCurrentTime) - checkGliderTime)):
			firstCurrentTime = secondCurrentTime

	uEast = uEast[currentTimeIndex,:,:]
	vNorth = vNorth[currentTimeIndex,:,:]

	lats_all = lats.flatten()
	longs_all = longs.flatten()
	print(lats.shape)
	print(lats_all.shape)

	uEast_all = uEast.flatten()
	vNorth_all = vNorth.flatten()

	# glider_long = glider_long.flatten()
	# glider_lat = glider_lat.flatten()

	v_c_east, v_c_north = np.zeros(len(glider_long)), np.zeros(len(glider_lat))

	points = [Point(lon, lat) for lon, lat in zip(longs_all, lats_all)]

	grid_points = MultiPoint(points)

	for i, orig in enumerate(zip(glider_long, glider_lat)):

		nearest_geoms = nearest_points(Point(orig), grid_points)

		closest_point = np.array([nearest_geoms[1].x, nearest_geoms[1].y])

		indices = np.where(longs_all == closest_point[0])[0]

		v_c_north[i] = vNorth_all[indices][0]
		v_c_east[i] = uEast_all[indices][0]

	return v_c_east, v_c_north

#v_c_east,v_c_north = get_closest_current(np.array([-74.23063, -74.22113, -74.205475, -74.186723, -74.16965, -74.154815]), np.array([38.415283, 38.41733, 38.416848, 38.411815, 38.407292, 38.407554]), t=2)

#print(v_c_east,v_c_north)