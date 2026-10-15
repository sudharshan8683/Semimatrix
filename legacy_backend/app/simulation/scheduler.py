from apscheduler.schedulers.background import BackgroundScheduler
from app.simulation.engine import engine_instance

scheduler = BackgroundScheduler()

def simulation_job():
    engine_instance.tick()

scheduler.add_job(simulation_job, 'interval', seconds=2)
# scheduler.start() # Normally started on app startup event
