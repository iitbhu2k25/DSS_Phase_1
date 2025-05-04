from sqlalchemy.orm import Session
from app.database.crud.stp_crud import Stp_State_crud,Stp_District_crud,Stp_SubDistrict_crud,STP_raster_crud
from app.conf.settings import Settings
import os


class Stp_service:
    def get_state(db:Session,all_data: bool = False):
        states=Stp_State_crud(db).get_states(all_data)
        states=[{'id': state.state_code,'name':state.state_name} for state in states]
        return states

    def get_district(db:Session,payload:dict):
        districts=Stp_District_crud(db).get_district(payload.state,payload.all_data)
        districts=[{'id': district.district_code,'name':district.district_name} for district in districts]
        return districts

    def get_sub_district(db:Session,payload:dict):
        SubDistricts=Stp_SubDistrict_crud(db).get_subdistrict(payload.districts,payload.all_data)
        SubDistricts=[{'id': SubDistrict.subdistrict_code,'name':SubDistrict.subdistrict_name} for SubDistrict in SubDistricts]
        return SubDistricts

    # def get_villages(db:Session,payload:dict):
    #     Villages=Stp_Village_crud(db).get_by_list(payload.sub_districts,payload.all_data)
    #     villages=[{'id': village.village_name,'name':village.village_name,"population":village.population,"sewageLoad":village.sewage} for village in Villages]
    #     return villages
    
    def get_raster(db:Session,payload:dict):
        raster_path=[]
        raster_weights=[]
        for i in payload.data:
            temp_path=STP_raster_crud(db).get_raster_path(i.RasterName)
            temp_path=os.path.join(Settings().BASE_DIR+""+temp_path)
            temp_path = os.path.abspath(temp_path)
            print("path is exist",os.path.exists(temp_path))
            raster_path.append(temp_path)
            raster_weights.append(float(i.weight))
        return raster_path,raster_weights

        
