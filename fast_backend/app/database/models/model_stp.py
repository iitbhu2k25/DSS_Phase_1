import sqlalchemy as sa
from app.database.models.base import Base
from sqlalchemy.orm import Mapped,mapped_column, relationship
from sqlalchemy import Integer, String, Float,ForeignKey
from typing import List

class State(Base):
    __tablename__ = "stp_state"

    state_code: Mapped[int] = mapped_column(Integer, primary_key=True,unique=True, nullable=False)
    state_name: Mapped[str] = mapped_column(String, nullable=False)
    districts: Mapped[List["District"]] = relationship(back_populates="state")

class District(Base):
    __tablename__ = "stp_district"

    district_code: Mapped[int] = mapped_column(Integer, primary_key=True,unique=True,  nullable=False)
    district_name: Mapped[str] = mapped_column(String, nullable=False)
    state_code: Mapped[int] = mapped_column(ForeignKey("stp_state.state_code"), nullable=False)
    state: Mapped["State"] = relationship(back_populates="districts")
    subdistricts: Mapped[List["SubDistrict"]] = relationship(back_populates="district")

class SubDistrict(Base):
    __tablename__ = "stp_subdistrict"

    subdistrict_code: Mapped[int] = mapped_column(Integer, primary_key=True,unique=True,  nullable=False)
    subdistrict_name: Mapped[str] = mapped_column(String, nullable=False)

    district_code: Mapped[int] = mapped_column(ForeignKey("stp_district.district_code"), nullable=False)
    district: Mapped["District"] = relationship(back_populates="subdistricts")
    

class STP_raster(Base):
    __tablename__='stp_raster'
    file_name:Mapped[str]=mapped_column(String,nullable=False)
    layer_name:Mapped[str]=mapped_column(String,nullable=False)
    weight:Mapped[float]=mapped_column(Float,nullable=False)
    file_path:Mapped[str]=mapped_column(String,nullable=False)


