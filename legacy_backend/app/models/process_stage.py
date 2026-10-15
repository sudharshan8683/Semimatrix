from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class ProcessStage(Base):
    __tablename__ = "process_stages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    sequence_index = Column(Integer, unique=True, nullable=False)
    nominal_duration_min = Column(Float, nullable=False)
    process_type = Column(String, nullable=False)
