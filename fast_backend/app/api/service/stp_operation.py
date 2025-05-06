import os
from typing import List, Tuple
import numpy as np
import geopandas as gpd
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import calculate_default_transform, reproject
from rasterio.transform import from_origin
from rasterio.mask import mask
from tqdm import tqdm
from app.api.service.geoserver import Geoserver
from xml.dom import minidom
from xml.etree import ElementTree as ET
from app.api.service.network.network_conf import GeoConfig
import uuid
from pathlib import Path
from app.api.schema.stp_schema import STPClassification
import uuid

geo=Geoserver()
class STPProcessor:
    
    def __init__(self, config: GeoConfig):
        """Initialize with configuration."""
        self.config = config
        self.aligned_arrays = []
        self.reference_profile = None
    
    def _calculate_common_extent(self, raster_paths: List[str]) -> Tuple[float, float, float, float, int, int]:
        
        all_bounds = []
        
        for path in raster_paths:
            with rasterio.open(path) as src:
                bounds = rasterio.warp.transform_bounds(
                    src.crs, self.config.target_crs, *src.bounds
                )
                all_bounds.append(bounds)
        
       
        minx = min(b[0] for b in all_bounds)
        miny = min(b[1] for b in all_bounds)
        maxx = max(b[2] for b in all_bounds)
        maxy = max(b[3] for b in all_bounds)
        
       
        width = int((maxx - minx) / self.config.target_resolution[0])
        height = int((maxy - miny) / self.config.target_resolution[1])
        
        return minx, miny, maxx, maxy, width, height
    
    def _normalize_array(self, array: np.ndarray) -> np.ndarray:
        
        # Replace negative values with 0
        array[array < 0] = 0
        
        # Get min and max values
        min_val = np.nanmin(array)
        max_val = np.nanmax(array)
        
        # Normalize
        norm_array = (array - min_val) / (max_val - min_val + 1e-6)
        return norm_array
    
    def align_rasters(self, raster_paths: List[str]) -> None:
        
  
        minx, _, maxx, maxy, width, height = self._calculate_common_extent(raster_paths)
        
       
        transform = from_origin(minx, maxy, 
                               self.config.target_resolution[0], 
                               self.config.target_resolution[1])
        
        # Process each raster
        for path in tqdm(raster_paths, desc="Aligning rasters"):
            with rasterio.open(path) as src:
              
                dst_array = np.zeros((height, width), dtype=np.float32)
                
               
                reproject(
                    source=rasterio.band(src, 1),
                    destination=dst_array,
                    src_transform=src.transform,
                    src_crs=src.crs,
                    dst_transform=transform,
                    dst_crs=self.config.target_crs,
                    resampling=Resampling.bilinear
                )
                
                # Normalize
                norm_array = self._normalize_array(dst_array)
                self.aligned_arrays.append(norm_array)
                
                # Save reference profile from first raster
                if self.reference_profile is None:
                    self.reference_profile = src.meta.copy()
                    self.reference_profile.update({
                        "crs": self.config.target_crs,
                        "transform": transform,
                        "width": width,
                        "height": height,
                        "dtype": 'float32'
                    })
        
    def create_weighted_overlay(self, weights: List[float], output_name: str = "weighted_overlay.tif") -> str:
        
        if len(weights) != len(self.aligned_arrays):
            raise ValueError(f"Number of weights ({len(weights)}) must match number of rasters ({len(self.aligned_arrays)})")
        
       
        
        # Initialize weighted sum array
        weighted_sum = np.zeros_like(self.aligned_arrays[0], dtype=np.float32)
 
        for i, array in enumerate(self.aligned_arrays):
            weighted_sum += array * weights[i]
        
        # Replace NaN values with 0
        weighted_sum = np.nan_to_num(weighted_sum)
        
        
        output_path = os.path.join(self.config.output_path, output_name)
        with rasterio.open(output_path, 'w', **self.reference_profile) as dst:
            dst.write(weighted_sum, 1)
        
        return output_path, weighted_sum
    
    def apply_constraint(self, weighted_sum: np.ndarray, constraint_path: str = None, 
                        output_name: str = "constrained_overlay.tif") -> str:
       
        constraint_path = constraint_path or self.config.constraint_raster_path
        
        
        # Initialize constraint array
        constraint_aligned = np.zeros_like(weighted_sum, dtype=np.float32)
        
        with rasterio.open(constraint_path) as src:
            reproject(
                source=rasterio.band(src, 1),
                destination=constraint_aligned,
                src_transform=src.transform,
                src_crs=src.crs,
                dst_transform=self.reference_profile['transform'],
                dst_crs=self.reference_profile['crs'],
                resampling=Resampling.nearest
            )
        

        constraint_mask = np.where(constraint_aligned >= 1, 1, 0).astype("float32")
        
        
        final_priority = weighted_sum * constraint_mask
        
        # Save constrained overlay
        output_path = os.path.join(self.config.output_path, output_name)
        with rasterio.open(output_path, 'w', **self.reference_profile) as dst:
            dst.write(final_priority, 1)
        
       
        return output_path, final_priority
    
    def clip_to_basin(self, raster_path: str, shapefile_path: str = None, 
                     output_name: str = "clipped_priority_map.tif") -> str:
        
        basin = gpd.read_file(shapefile_path)
        if basin.crs is None:
            basin.set_crs("EPSG:32644", inplace=True) 
        print('raster path',raster_path)
        try:
            basin = basin.to_crs("EPSG:32644")
        except Exception as e:
            print(e)

        with rasterio.open(raster_path) as src:
            out_image, out_transform = mask(dataset=src, shapes=basin.geometry, crop=True)
            out_meta = src.meta.copy()
        
        
        out_meta.update({
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        
        
        output_path = os.path.join(self.config.output_path, output_name)
        with rasterio.open(output_path, "w", **out_meta) as dest:
            dest.write(out_image)
        
   
        return output_path

class RasterProcess:
    def __init__(self, config: GeoConfig = GeoConfig()):
        self.output_dir=Path(config.output_path) / "SLD" 
        self.geoserver_url = config.geoserver_url
        self.username = config.username
        self.password = config.password
        self.geoserver_external_url = config.geoserver_external_url 
        self.raster_workspace="raster_work"
        self.raster_store="stp_raster_store"
        os.makedirs(self.output_dir, exist_ok=True)

    def _generate_colors(self,num_classes, color_ramp='blue_to_red'):
        colors = []
        if color_ramp == 'blue_to_red':
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

        elif color_ramp == 'greenTOred':
            for i in range(num_classes):
        # Calculate interpolation factor (0 to 1)
                t = i / max(1, num_classes - 1)

                r = int(t * 255)           # 0 to 255
                g = int(255 * (1 - t))     # 255 to 0
                b = 0                      # Always 0
                    
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
            return self._generate_colors(num_classes, 'blue_to_red')
        return colors

    def _generate_sld_xml(self,intervals, colors):
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
        level_class=["very low","low","moderate","high","very high"]
        for i, (interval, color) in enumerate(zip(intervals, colors)):
            color_map_entry = ET.SubElement(color_map, "ColorMapEntry")
            color_map_entry.set("color", color)
            color_map_entry.set("quantity", str(interval))
            color_map_entry.set("label", f"{level_class[i]}")
    
    # Convert to string with pretty printing
        rough_string = ET.tostring(root, encoding='utf-8')
        reparsed = minidom.parseString(rough_string)
        pretty_xml = reparsed.toprettyxml(indent="\t")
    
    # Fix XML declaration to match requested format
        pretty_xml = '<?xml version="1.0" encoding="utf-8"?>\n' + '\n'.join(pretty_xml.split('\n')[1:])
    
        return pretty_xml
    
    def _generate_dynamic_sld(self,raster_path:str,num_classes:int,color_ramp:str='blue_to_red'):
        with rasterio.open(raster_path) as src:
            data = src.read(1, masked=True)
            valid_data = data[~data.mask]
            if len(valid_data) == 0:
                raise ValueError("Raster contains no valid data")
            
            min_val = float(np.min(valid_data))
            max_val = float(np.max(valid_data))
    
        print(f"Raster min value: {min_val}, max value: {max_val}")
        if min_val == max_val:
            intervals = [min_val] * num_classes
        else:
            intervals = np.linspace(min_val, max_val, num_classes)

        colors = self._generate_colors(num_classes, color_ramp)
        sld_content = self._generate_sld_xml(intervals, colors)
        unique_name = f"style_{uuid.uuid4().hex}.sld"
        output_sld_path = os.path.join(self.output_dir, unique_name)        
        with open(output_sld_path, 'w', encoding='utf-8') as f:
            f.write(sld_content)
        print(f"SLD file created: {output_sld_path}")
        return output_sld_path
    
    def processRaster(self,payload:STPClassification):
        try:
            file_path=geo.raster_download(workspace_name=payload.get('workspace'), store_name=payload.get('store_name'), layer_name = payload.get('layer_name'))
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='viridis')
            sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='blue_to_red')
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='spectral')
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp='terrain') #terrain
            #sld_path=self._generate_dynamic_sld(raster_path=file_path,num_classes=5,color_ramp="greenTOred")
            sld_name = os.path.basename(sld_path).split('.')[0]
            geo.apply_sld_to_layer(workspace_name=payload.get('workspace'), layer_name = payload.get('layer_name'),sld_content=sld_path, sld_name=sld_name)
            os.remove(sld_path)
            os.remove(file_path)
            return True
        except Exception as e:
            print("exceprion",e)
            return False

class STPPriorityMapper:
    def __init__(self, config: GeoConfig = None):
        self.config = config or GeoConfig()
        self.processor = STPProcessor(self.config)
    
    def create_priority_map(self, raster_paths: List[str], weights: List[float]) -> str:
        try:

            if len(raster_paths) != len(weights):
                raise ValueError(f"Number of rasters ({len(raster_paths)}) must match number of weights ({len(weights)})")
            
            self.processor.align_rasters(raster_paths)
            weighted_path, weighted_sum = self.processor.create_weighted_overlay(
                weights, "weighted_overlay.tif"
            )
            
            constrained_path, _ = self.processor.apply_constraint(
                weighted_sum, output_name="Final_STP_Priority_Map.tif"
            )
            final_name = f"stp_priority_{uuid.uuid4().hex}_map.tif"
            final_path = self.processor.clip_to_basin(
                raster_path=constrained_path,
                shapefile_path=self.config.basin_shapefile , output_name=final_name
            )
            status,layer_name=geo.publish_raster(workspace_name=self.config.raster_workspace, store_name=self.config.raster_store, raster_path=final_path)
            if status:
                os.remove(final_path)
                os.remove(weighted_path)
                os.remove(constrained_path)
                return {
                    "status": "success",
                    "workspace": self.config.raster_workspace,
                    "store": self.config.raster_store,
                    "layer_name": layer_name,
                    "type": "raster"
                }
            return False
        except Exception as e:
            print(e)
            return False

