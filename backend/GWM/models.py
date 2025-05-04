from django.db import models

class Geoserver_data(models.Model):
    unique_name=models.CharField(max_length=100,null=True,unique=True)
    geo_publish=models.BooleanField(default=False)
    raster_visual_id=models.IntegerField(null=False)

    def __str__(self):
        return f"{self.unique_name} - {self.raster_visual_id}"