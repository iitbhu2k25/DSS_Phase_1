import sys
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
from app.api.service.script_svc.geoserver_svc import create_workspace,create_vector_stores,upload_shapefile
state_zip = os.path.join(BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'state', 'STP_State.zip')
district_zip = os.path.join(BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'district', 'STP_district.zip')
subdistrict_zip = os.path.join(BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'subdistrict', 'STP_subdistrict.zip')
# villages_zip = os.path.join(BASE_DIR, 'media', 'Rajat_data', 'shape_stp', 'villages', 'STP_Basin_Village.zip')

try:
    create_workspace("vector_work")
    create_vector_stores("vector_work","stp_vector_store")
    upload_shapefile("vector_work","stp_vector_store",state_zip,"STP_state_layers")
    upload_shapefile("vector_work","stp_vector_store",district_zip,"STP_district_layers")
    upload_shapefile("vector_work","stp_vector_store",subdistrict_zip,"STP_subdistrict_layers")
    # upload_shapefile("vector_work","stp_vector_store",villages_zip,"STP_villages_layers")
    
    # now upload the shape file in geoserver

except Exception as e:
    print(e)
