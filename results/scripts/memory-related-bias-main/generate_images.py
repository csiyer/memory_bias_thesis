"""module to generate base data"""
import bpy, os, math, time, mathutils, sys
import numpy as np
import pdb 

def generate_lights(bpy, params):

    object_name = params['object_name']

    # select all the old lights
    for o in bpy.data.objects:
        if o.type == 'LIGHT':
            o.select_set(True)
        else:
            o.select_set(False)

# delete all the old lights
    bpy.ops.object.delete()

    # generate random xyz locations within range
    x_dim = 3 #bpy.data.objects[object_name].dimensions.x * params['light_scale']
    y_dim = 2 # bpy.data.objects[object_name].dimensions.y * params['light_scale']
    z_dim = 2 # bpy.data.objects[object_name].dimensions.z * params['light_scale']

    # add each light
    for l in range(params['n_lights']):

        # create light datablock, set attributes
        light_data = bpy.data.lights.new(name="l_%d"%l, type='POINT')
        # set how bright this light is
        light_data.energy = params['light_energy']
        # create new object with our light datablock
        light_object = bpy.data.objects.new(name="l_%d"%l, object_data=light_data)
        # link light object
        bpy.context.collection.objects.link(light_object)
        # make it active
        bpy.context.view_layer.objects.active = light_object
        # generate random positions
        x_point = np.random.uniform(-5, 5)
        y_point = np.random.uniform(-2, -4)
        z_point = np.random.uniform(-5, 5)
        #change location
        light_object.location = (x_point,  y_point, z_point)
        # update scene, if needed
        dg = bpy.context.evaluated_depsgraph_get()
        dg.update()


def rotate_and_center_camera(bpy, position, params):
    """
    Focus the camera to a focus point and place the camera at a specific distance from that
    focus point. The camera stays in a direct line with the focus point.
    """
    camera = bpy.data.objects['Camera']
    # reposition camera
    camera.location = position
    # identify object center of mass
    object_center_of_mass = bpy.data.objects[params['object_name']].location
    # difference between location and origin
    looking_direction = camera.location - object_center_of_mass
    # unsure about details
    rot_quat = looking_direction.to_track_quat('Z', 'Y')
    # unsure about details
    camera.rotation_euler = rot_quat.to_euler()
    # define random-ish distance to object
    random_distance = 0
    if random_distance == 1: 
        distance = params['distance'] + [i for i in np.arange(0, 3.1, 1)][np.random.randint(3)]
    else: 
        distance = params['distance']

    # unsure about details
    camera.location = rot_quat @ mathutils.Vector((0, 0, distance))

def save_render(params, nice_xy, nice_height):
    
    def nice_degrees(xy, i_view= [60, 30,  0, 30, 60], i_range=[30, 60, 90, 120, 150]): 
        return i_view[np.argmin(np.abs(np.array(i_range) - np.abs(np.rad2deg(xy))))]
    
    """Save object as image or blend file"""
    # remove the .blender from the file name
    
    relative_xy = np.round(nice_xy-90)
    relative_height = np.round(nice_height) 

    if relative_xy == 0: 
        LR = '00C'
    else: 
        side = ['L', 'R'][(relative_xy >= 0)*1]
        LR = '%02d%s'%(abs(relative_xy), side)

    if  relative_height  == 0: 
        UP = 'C'
    else: 
        top = ['U', 'D'][(nice_height <=0) * 1]
        #UP = '%02d%s'%(params['elevation_angles'], top)
        UP = '%s'%(top)

    object_name = params['object_filename'][:params['object_filename'].find('.')]
    # add the base folder and view count 
    name_to_save =  object_name + '_%s_%s'%(LR, UP)  
    filename_and_path = os.path.join(params['save_directory'], name_to_save)
    # unsure about details
    bpy.context.scene.render.resolution_percentage = params['resolution']
    bpy.context.scene.render.filepath=filename_and_path
    bpy.context.scene.render.engine='BLENDER_EEVEE'
    bpy.ops.render.render(write_still=True)
    print( '\n\n', filename_and_path ) 

def load_object(bpy, params):
    
    print('LOADING OBJECT...', params['object_filename']) 
    [bpy.data.collections.remove(i) for i in bpy.data.collections]
    [bpy.data.objects.remove(i) for i in bpy.data.objects]
    # delete them all to start clean
    bpy.ops.object.delete()
    bpy.ops.object.camera_add()
    bpy.context.scene.camera = bpy.context.object
    path_to_object = os.path.join(params['object_directory'], params['object_filename'])
    print('LOADING PATH TO OBJECT:', path_to_object) 
    with bpy.data.libraries.load(path_to_object) as (data_from, data_to):
        data_to.objects = [i for i in data_from.objects if i.lower() not in ['camera', 'light', 'point']]
    #Objects have to be linked to show up in a scene, assign color
    for _, obj in enumerate(data_to.objects):
        bpy.context.collection.objects.link(obj)
        if obj.hide_viewport:
            obj.hide_viewport = False
        obj.select_set(True)
    for ob in bpy.context.scene.objects:
        bpy.context.view_layer.objects.active = ob
        # ob.location = (0, 0, 0) # being done in frame

    #align local and global coordinates
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    try:
        object_name = [i.name for i in bpy.data.objects if i.name[0:i.name.find('.')] in params['object_names']][0]
    except:
        object_name = [i.name for i in bpy.data.objects if i.name in params['object_names']][0]

    return object_name

def set_background_and_size(params):
    # set window size to square
    bpy.context.scene.render.resolution_y = params['window_size']
    bpy.context.scene.render.resolution_x = params['window_size']
    # set background color to rgb+
    bpy.data.worlds["World"].node_tree.nodes["Background"].inputs[0].default_value = params['background_color']
    bpy.context.scene.view_settings.view_transform = 'Standard'
    bpy.context.scene.render.film_transparent = True
    bpy.context.scene.render.image_settings.color_mode = 'RGBA'
    #bpy.context.scene.render.film_transparent = True

def generate_stimuli(bpy, params):
    
    set_background_and_size(params)
    params['object_name'] = load_object(bpy, params)
    
    radius = params['viewpoint_radius']
    height_offset = 3
    n_points = 8
    height_angles = np.linspace( -params['elevation_angles'], params['elevation_angles'], 3) 
    print( 'HEIGHT ANGLES', height_angles ) 
    n_points = 5 
    front_angle = 90
    side_angles = [ np.deg2rad(i) for i in np.linspace(front_angle-50 , front_angle+50, n_points)]  
    radius = params['view_radius'] 

    print( height_angles ) 
    for i_z in height_angles:
        for i_angle in side_angles:

            i_view =  (radius * np.cos(i_angle), radius * -np.sin(i_angle),  (radius) * -np.sin(i_z))
            print( '\n\n', i_view ,  i_angle) 
            # # generate random configuration of lights
            generate_lights(bpy, params)
            # rotate camera and reorient towards origin
            rotate_and_center_camera(bpy, i_view, params)
            # save this lighting x viewpoint image
            save_render(params, np.rad2deg(i_angle), np.rad2deg(i_z))

if __name__ == "__main__":
    
    ##### e.g. /Applications/Blender.app/Contents/MacOS/Blender -b -P generate_scene.py object_01.blend
    #####  /Applications/Blender.app/Contents/MacOS/Blender -b -P generate_images.py
    """$ blender -b -P generate_scene.py"""

    params = {'window_size': 256,
              'base_directory': '/Users/biota/working/faces/faces_from_drive/', 
              'save_directory': '/Users/biota/working/faces/experiment_images/',
              'background_color':(1, 1, 1, 0),
              'object_names': ['Cube', 'Sphere', 'Cylinder', 'Generated Shape', 'my_shape', 'FaceBuilderHead'],
              'light_scale': 10,
              'light_energy': 100,
              'n_lights': 10,
              'resolution': 200,
              'distance': 5,
              'sphere_points': 15 ,
              'viewpoint_radius':2, 
              'save': 1,
              'degree_interval':20,
              'view_radius':5,
              'elevation_angles': 10
             }
    
    params['object_directory'] = params['base_directory']

    blender_objects = [i for i in os.listdir(params['base_directory']) if ('blend1' not in i) * ('blend' in i)]
    test = 0 
    if test: 
        blender_objects = ['id055.blend'] 
    
    for i_object in np.sort(blender_objects): #np.random.permutation(np.sort(blender_objects)):
        params['object_filename'] = i_object
        generate_stimuli(bpy, params)
        if test: exit() 
