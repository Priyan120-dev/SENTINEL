import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, SmallInteger, Enum
from sqlalchemy.orm import relationship
from .db import Base

class OfficerStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    OFF_DUTY = "OFF-DUTY"


class District(Base):
    __tablename__ = "districts"

    district_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    population = Column(Integer)
    geom = Column(String)

    stations = relationship("Station", back_populates="district")
    crime_events = relationship("CrimeEvent", back_populates="district")
    suspects = relationship("Suspect", back_populates="district")
    officers = relationship("Officer", back_populates="district")
class Station(Base):
    __tablename__ = "stations"

    station_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.district_id"))
    lat = Column(Float)
    lon = Column(Float)

    district = relationship("District", back_populates="stations")
    crime_events = relationship("CrimeEvent", back_populates="station")

class CrimeEvent(Base):
    __tablename__ = "crime_events"

    event_id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.station_id"))
    district_id = Column(Integer, ForeignKey("districts.district_id"))
    crime_type = Column(String, nullable=False)
    occurred_at = Column(DateTime, nullable=False)
    lat = Column(Float)
    lon = Column(Float)
    status = Column(String)
    severity = Column(SmallInteger)

    station = relationship("Station", back_populates="crime_events")
    district = relationship("District", back_populates="crime_events")
    suspect_links = relationship("SuspectLink", back_populates="shared_event")

class Suspect(Base):
    __tablename__ = "suspects"

    suspect_id = Column(Integer, primary_key=True, index=True)
    alias = Column(String)
    district_id = Column(Integer, ForeignKey("districts.district_id"))

    district = relationship("District", back_populates="suspects")

class SuspectLink(Base):
    __tablename__ = "suspect_links"

    link_id = Column(Integer, primary_key=True, index=True)
    suspect_a = Column(Integer, ForeignKey("suspects.suspect_id"))
    suspect_b = Column(Integer, ForeignKey("suspects.suspect_id"))
    shared_event_id = Column(Integer, ForeignKey("crime_events.event_id"))
    link_type = Column(String)

    shared_event = relationship("CrimeEvent", back_populates="suspect_links")
    suspect_a_rel = relationship("Suspect", foreign_keys=[suspect_a])
    suspect_b_rel = relationship("Suspect", foreign_keys=[suspect_b])

class Officer(Base):
    __tablename__ = "officers"

    officer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    badge_number = Column(String)
    status = Column(Enum(OfficerStatus))
    lat = Column(Float)
    lon = Column(Float)
    district_id = Column(Integer, ForeignKey("districts.district_id"))

    district = relationship("District", back_populates="officers")
