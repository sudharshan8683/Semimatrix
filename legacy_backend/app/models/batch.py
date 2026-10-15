from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, unique=True, index=True, nullable=False)
    lot_size = Column(Integer, nullable=False)
    product_family = Column(String, nullable=False)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, nullable=False) # e.g. IN_PROGRESS, COMPLETED, CANCELLED
