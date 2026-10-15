"""
This is the single entry point for all sensor data ingestion.
Currently called by the internal simulator, but designed so an MQTT, OPC-UA, 
or MES adapter can replace the simulator by sending payloads here.
"""
from sqlalchemy.orm import Session
from app.models import SensorReading

def ingest_reading(db: Session, payload: dict):
    reading = SensorReading(**payload)
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading
