from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    
    temperature = Column(Float, nullable=False)
    pressure = Column(Float, nullable=False)
    vibration = Column(Float, nullable=False)
    power_draw = Column(Float, nullable=False)
    gas_flow = Column(Float, nullable=False)
    chamber_humidity = Column(Float, nullable=False)
    particle_count = Column(Integer, nullable=False)
    cycle_time = Column(Float, nullable=False)
    error_count = Column(Integer, nullable=False)

    equipment = relationship("Equipment")
