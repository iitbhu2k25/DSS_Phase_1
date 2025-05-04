from pydantic import BaseModel
from typing import Annotated,List


class Stp_response(BaseModel):
    id:int
    name:str
    
    class Config:
        from_attributes = True

# class village_response(BaseModel):
#     id:str|int
#     name:str
#     population:int
#     sewageLoad:float
    
#     class Config:
#         from_attributes = True

class District_request(BaseModel):
    state:int
    all_data: bool = True
    
    class Config:
        from_attributes = True
    
class Sub_district_request(BaseModel):
    districts:Annotated[List[int],None]
    all_data: bool = True
    
    class Config:
        from_attributes = True

# class Village_request(BaseModel):
#     sub_districts:Annotated[List[str],None]
#     all_data: bool = True
    
#     class Config:
#         from_attributes = True


class STPRasterInput(BaseModel):
    RasterName: str
    weight: str


class STPCategory(BaseModel):
    data: List[STPRasterInput] = None
    all_data: bool = True
    class Config:
        from_attributes = True

    
class STPClassification(BaseModel):
    workspace:str
    store:str
    layer_name:str
    
    class Config:
        from_attributes = True