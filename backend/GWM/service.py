import requests
from requests.auth import HTTPBasicAuth
import os
from django.conf import settings
import rasterio
import numpy as np
import colorsys
from xml.dom import minidom
from xml.etree import ElementTree as ET
from datetime import datetime

geoserver_url = settings.GEOSERVER_URL
username = settings.GEOSERVER_USERNAME
password = settings.GEOSERVER_PASSWORD  
geoserver_extenal_url=settings.GEOSERVER_EX_URL
wcs_url=f"{geoserver_extenal_url}+/wcs"
input_path=f"{settings.BASE_DIR}"+"/temp/input"
output_path=f"{settings.BASE_DIR}"+"/temp/output"

def generate_dynamic_sld(raster_path, num_classes, output_sld_path=None, color_ramp='blue_to_red'):
    with rasterio.open(raster_path) as src:
       
        data = src.read(1, masked=True)
        
        # Get min and max values, ignoring NaN and no-data values
        valid_data = data[~data.mask]
        if len(valid_data) == 0:
            raise ValueError("Raster contains no valid data")
        
        min_val = float(np.min(valid_data))
        max_val = float(np.max(valid_data))
    
    print(f"Raster min value: {min_val}, max value: {max_val}")
    
    # Generate intervals based on min/max values
    if min_val == max_val:
        # Handle case where min equals max (constant raster)
        intervals = [min_val] * num_classes
    else:
        # Create evenly spaced intervals
        intervals = np.linspace(min_val, max_val, num_classes)
    
    # Generate colors based on the specified color ramp
    colors = generate_colors(num_classes, color_ramp)
    
    # Generate SLD XML content
    sld_content = generate_sld_xml(intervals, colors)
    
    # Save the SLD file
    if output_sld_path is None:
        base, _ = os.path.splitext(raster_path)
        output_sld_path = f"{base}.sld"
    
    with open(output_sld_path, 'w', encoding='utf-8') as f:
        f.write(sld_content)
    
    print(f"SLD file created: {output_sld_path}")
    return output_sld_path

def generate_colors(num_classes, color_ramp='blue_to_red'):
    """Generate a list of color hex codes for the specified number of classes"""
    colors = []
    
    if color_ramp == 'blue_to_red':
        # Blue to Red gradient
        for i in range(num_classes):
            # Calculate interpolation factor (0 to 1)
            t = i / max(1, num_classes - 1)
            
            if t < 0.5:
                # Blue to Green transition (first half)
                r = int(0 + t * 2 * 255)  # 0 to 255
                g = int(0 + t * 2 * 255)  # 0 to 255
                b = 255                   # Stay at 255
            else:
                # Green to Red transition (second half)
                r = 255                               # Stay at 255
                g = int(255 - (t - 0.5) * 2 * 255)    # 255 to 0
                b = int(255 - (t - 0.5) * 2 * 255)    # 255 to 0
                
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            colors.append(hex_color.upper())
    
    elif color_ramp == 'viridis':
        # Approximation of viridis colormap
        viridis_anchors = [
            (68, 1, 84),    # Dark purple
            (59, 82, 139),   # Purple
            (33, 144, 140),  # Teal
            (93, 201, 99),   # Green
            (253, 231, 37)   # Yellow
        ]
        
        for i in range(num_classes):
            t = i / max(1, num_classes - 1)
            idx = min(int(t * (len(viridis_anchors) - 1)), len(viridis_anchors) - 2)
            interp = t * (len(viridis_anchors) - 1) - idx
            
            r = int(viridis_anchors[idx][0] * (1 - interp) + viridis_anchors[idx + 1][0] * interp)
            g = int(viridis_anchors[idx][1] * (1 - interp) + viridis_anchors[idx + 1][1] * interp)
            b = int(viridis_anchors[idx][2] * (1 - interp) + viridis_anchors[idx + 1][2] * interp)
            
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            colors.append(hex_color.upper())
    
    elif color_ramp == 'terrain':
        # Approximation of terrain colormap
        terrain_anchors = [
            (0, 0, 92),      # Dark blue
            (0, 128, 255),   # Light blue
            (0, 255, 128),   # Light green
            (255, 255, 0),   # Yellow
            (128, 64, 0),    # Brown
            (255, 255, 255)  # White
        ]
        
        for i in range(num_classes):
            t = i / max(1, num_classes - 1)
            idx = min(int(t * (len(terrain_anchors) - 1)), len(terrain_anchors) - 2)
            interp = t * (len(terrain_anchors) - 1) - idx
            
            r = int(terrain_anchors[idx][0] * (1 - interp) + terrain_anchors[idx + 1][0] * interp)
            g = int(terrain_anchors[idx][1] * (1 - interp) + terrain_anchors[idx + 1][1] * interp)
            b = int(terrain_anchors[idx][2] * (1 - interp) + terrain_anchors[idx + 1][2] * interp)
            
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            colors.append(hex_color.upper())
            
    elif color_ramp == 'spectral':
        # Approximation of spectral colormap (red to blue)
        spectral_anchors = [
            (213, 62, 79),    # Red
            (253, 174, 97),   # Orange
            (254, 224, 139),  # Yellow
            (230, 245, 152),  # Light yellow-green
            (171, 221, 164),  # Light green
            (102, 194, 165),  # Teal
            (50, 136, 189)    # Blue
        ]
        
        for i in range(num_classes):
            t = i / max(1, num_classes - 1)
            idx = min(int(t * (len(spectral_anchors) - 1)), len(spectral_anchors) - 2)
            interp = t * (len(spectral_anchors) - 1) - idx
            
            r = int(spectral_anchors[idx][0] * (1 - interp) + spectral_anchors[idx + 1][0] * interp)
            g = int(spectral_anchors[idx][1] * (1 - interp) + spectral_anchors[idx + 1][1] * interp)
            b = int(spectral_anchors[idx][2] * (1 - interp) + spectral_anchors[idx + 1][2] * interp)
            
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            colors.append(hex_color.upper())
    
    else:
        # Default to blue to red if unknown color ramp
        return generate_colors(num_classes, 'blue_to_red')
        
    return colors

def generate_sld_xml(intervals, colors):
    """Generate the SLD XML content with the specified intervals and colors"""
    # Create the root element
    root = ET.Element("StyledLayerDescriptor")
    root.set("xmlns", "http://www.opengis.net/sld")
    root.set("xmlns:ogc", "http://www.opengis.net/ogc")
    root.set("xmlns:xlink", "http://www.w3.org/1999/xlink")
    root.set("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance")
    root.set("xsi:schemaLocation", "http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd")
    root.set("version", "1.0.0")
    
    # Create user layer
    user_layer = ET.SubElement(root, "UserLayer")
    name = ET.SubElement(user_layer, "Name")
    name.text = "raster_layer"
    
    # Create user style
    user_style = ET.SubElement(user_layer, "UserStyle")
    style_name = ET.SubElement(user_style, "Name")
    style_name.text = "raster"
    
    title = ET.SubElement(user_style, "Title")
    title.text = f"{len(colors)}-Class Raster Style"
    
    abstract = ET.SubElement(user_style, "Abstract")
    abstract.text = f"A style for rasters with {len(colors)} distinct classes"
    
    # Create feature type style
    feature_type_style = ET.SubElement(user_style, "FeatureTypeStyle")
    feature_type_name = ET.SubElement(feature_type_style, "FeatureTypeName")
    feature_type_name.text = "Feature"
    
    rule = ET.SubElement(feature_type_style, "Rule")
    
    # Create raster symbolizer
    raster_symbolizer = ET.SubElement(rule, "RasterSymbolizer")
    
    opacity = ET.SubElement(raster_symbolizer, "Opacity")
    opacity.text = "1.0"
    
    # Create color map
    color_map = ET.SubElement(raster_symbolizer, "ColorMap")
    color_map.set("type", "intervals")
    
    # Add color map entries
    for i, (interval, color) in enumerate(zip(intervals, colors)):
        color_map_entry = ET.SubElement(color_map, "ColorMapEntry")
        color_map_entry.set("color", color)
        color_map_entry.set("quantity", str(interval))
        color_map_entry.set("label", f"Class {i+1}")
    
    # Convert to string with pretty printing
    rough_string = ET.tostring(root, encoding='utf-8')
    reparsed = minidom.parseString(rough_string)
    pretty_xml = reparsed.toprettyxml(indent="\t")
    
    # Fix XML declaration to match requested format
    pretty_xml = '<?xml version="1.0" encoding="utf-8"?>\n' + '\n'.join(pretty_xml.split('\n')[1:])
    
    return pretty_xml

def apply_sld_to_layer(workspace_name, layer_name, sld_content, sld_name=None):
    
    if sld_name is None:
        sld_name = layer_name+datetime.now().strftime("%Y%m%d%H%M%S")
    
        # Create a simple SLD for raster with the jet color ramp manually
        new_sld_content=""
        with open(sld_content, "r") as f:
            new_sld_content = f.read()
    
    styles_url = f"{geoserver_url}/rest/workspaces/{workspace_name}/styles"
    
   
    style_data = {
        "style": {
            "name": sld_name,
            "filename": f"{sld_name}.sld"
        }
    }
    
    # Check if style already exists
    style_url = f"{styles_url}/{sld_name}"
    check_response = requests.get(
        style_url,
        auth=HTTPBasicAuth(username, password)
    )
    
    if check_response.status_code != 200:
        # Style doesn't exist, create it
        print(f"Creating new style metadata: {sld_name}")
        create_response = requests.post(
            styles_url,
            json=style_data,
            auth=HTTPBasicAuth(username, password),
            headers={"Content-Type": "application/json"}
        )
        
        if create_response.status_code not in [200, 201]:
            print(f"Failed to create style metadata: {create_response.status_code}, {create_response.text}")
            return False
    
    # Now upload the SLD content 
    print(f"Uploading SLD content for style: {sld_name}")
    upload_response = requests.put(
        style_url,
        data=new_sld_content,
        auth=HTTPBasicAuth(username, password),
        headers={"Content-Type": "application/vnd.ogc.sld+xml"}
    )
    
    if upload_response.status_code not in [200, 201]:
        print(f"Failed to upload SLD content: {upload_response.status_code}, {upload_response.text}")
        return False
    
    print(f"Successfully uploaded SLD content")
    
    # Now apply the style to the layer
    layer_url = f"{geoserver_url}/rest/workspaces/{workspace_name}/layers/{layer_name}"
    payload = {
    "layer": {
        "defaultStyle": {
            "name": sld_name
        }
    }
    }

    apply_response = requests.put(
        layer_url,
        json=payload,  # This will serialize the payload as JSON
        auth=HTTPBasicAuth(username, password),
        headers={"Content-Type": "application/json"}
    )
        
    if apply_response.status_code not in [200, 201]:
        print(f"Failed to apply style to layer: {apply_response.status_code}, {apply_response.text}")
        return False
    print(f"Successfully applied style to layer")
    return True

def create_workspace(workspace_name):
    # First check if workspace already exists
    check_url = f"{geoserver_url}/rest/workspaces/{workspace_name}"
    check_response = requests.get(
        check_url,
        auth=HTTPBasicAuth(username, password)
    )
    print("check_response",check_response)
    if check_response.status_code == 200:
        print(f"Workspace '{workspace_name}' already exists")
        return True
    
  
    workspace_url = f"{geoserver_url}/rest/workspaces"
    headers = {"Content-type": "application/json"}
    data = {"workspace": {"name": workspace_name}}
    
    response = requests.post(
        workspace_url,
        auth=HTTPBasicAuth(username, password),
        json=data,
        headers=headers
    )
    
    if response.status_code == 201:
        print(f"Workspace '{workspace_name}' created successfully")
        return True
        
    else:
        print(f"Failed to create workspace: {response.status_code}, {response.text}")
        return False

def publish_geotiff(workspace_name, store_name, geotiff_path):

    upload_url = f"{geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}/file.geotiff"
    
    with open(geotiff_path, 'rb') as file:
        upload_headers = {'Content-type': 'image/tiff'}
        response = requests.put(
            upload_url,
            auth=HTTPBasicAuth(username, password),
            data=file,
            headers=upload_headers
        )
    
    print(f"Upload response: {response.status_code}")
    
    if response.status_code in [200, 201]:
        # Get information about the coveragestore to find the associated layer
        coverage_info_url = f"{geoserver_url}/rest/workspaces/{workspace_name}/coveragestores/{store_name}/coverages.json"
        
        info_response = requests.get(
            coverage_info_url,
            auth=HTTPBasicAuth(username, password)
        )
        
        if info_response.status_code == 200:
            coverages_data = info_response.json()
            
            # Extract coverage/layer names
            if 'coverages' in coverages_data and 'coverage' in coverages_data['coverages']:
                # Multiple coverages case
                layer_names = [coverage['name'] for coverage in coverages_data['coverages']['coverage']]
                print(f"Auto-created layer names: {layer_names}")
                
                # Usually there's just one layer per GeoTIFF
                layer_name = layer_names[0] if layer_names else store_name
                
                return {
                    "success": True,
                    "store_name": store_name,
                    "layer_name": layer_name,
                    "all_layers": layer_names
                }
            else:
                # If we can't get layer info, default to store name (common case)
                print("No coverage information found, using store name as layer name")
                return {
                    "success": True,
                    "store_name": store_name,
                    "layer_name": store_name  # Usually layer name = store name for auto-created layers
                }
    
    return {
        "success": False,
        "store_name": store_name,
        "upload_status": response.status_code
    }

def raster_download(workspace_name,store_name,layer_name,legends):
    geoserver_wcs_url = (
                "http://geoserver:8080/geoserver/wcs"
                f"?service=WCS"
                f"&version=2.0.1"
                f"&request=GetCoverage"
                f"&coverageId={layer_name}"
                f"&format=image/geotiff"
            )
    r = requests.get(geoserver_wcs_url
                , auth=HTTPBasicAuth(username, password),
                cookies={})
    print(r.status_code)
    if r.status_code == 200:
        filename = layer_name.split(":")[-1] + ".tif"
        os.makedirs(input_path, exist_ok=True)
        file_path = os.path.join(input_path, filename)
        with open(file_path, "wb") as f:
            f.write(r.content)
    
    sld=generate_dynamic_sld(raster_path=file_path, 
                                   num_classes=legends, 
                                   color_ramp='blue_to_red')
    success = apply_sld_to_layer(workspace_name, layer_name, sld)
    if success:
        print(f"Successfully applied SLD to layer {layer_name}")
        return True
    else:
        print(f"Failed to apply SLD to layer {layer_name}")
        return False
    
