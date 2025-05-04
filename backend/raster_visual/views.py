from .models import RasterVisual
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import FileResponse, Http404
from django.conf import settings
import os
from GWM.service import create_workspace,publish_geotiff,raster_download
import time
import json

class rasters_get(APIView):
    def get(self,request,format=None):
        raster_objects = RasterVisual.objects.values_list('organisation', flat=True).distinct()
        resp=[{"id":val+1,"name":x} for val,x in enumerate(raster_objects)]
        print('resp',resp)
        return Response(resp,status=status.HTTP_200_OK)

    def post(self,request,format=None):
        org=request.data['organisation']
        resp = RasterVisual.objects.values_list('id','name').filter(organisation=org)
        resp=map(lambda x:{"id":x[0],"name":x[1]},resp)
        return Response(resp,status=status.HTTP_200_OK)
    
class rasters_file(APIView):
    def get(self, request, id, format=None):
        try:
            result = RasterVisual.objects.values('file_location').filter(id=id).first()
            if not result:
                raise Http404("Raster file not found")
            
            file_path = result['file_location']
            file_path = os.path.join(settings.BASE_DIR, 'media', file_path)
            
            print(f"Attempting to serve file from: {file_path}")
            print(f"File exists: {os.path.exists(file_path)}")
            
            if not os.path.exists(file_path):
                return Response({"error": f"File does not exist at path: {file_path}"}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            workspace_name='GWM'
            resp=create_workspace(workspace_name)
            print("resp",resp)
            store_name = f"raster_{int(time.time())}"
            if resp:
                print("workspace created")    
                new_resp=publish_geotiff(workspace_name,store_name,file_path)
                if new_resp:
                    print("geotiff published")
                    print(new_resp)
                    return Response(json.loads(json.dumps(new_resp)), status=status.HTTP_200_OK)


        except Exception as e:
            print(f"Error serving raster file: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class rasters_legends(APIView):
    def post(self,request):
        workspace=request.data.get('workspace')
        storename=request.data.get('storename')
        layername=request.data.get('layername')
        legends=request.data.get('legendCount')
        if raster_download(workspace_name=workspace,store_name=storename,layer_name=layername,legends=legends):
            return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)
    