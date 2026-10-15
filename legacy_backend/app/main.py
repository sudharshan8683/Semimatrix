from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth
from app.routers import equipment, telemetry, wafers, production, yield_analytics, maintenance, predictions, anomalies, alerts, simulation, dashboard, reports, websocket, optimization
from app.simulation.scheduler import scheduler

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FABSENSE API", version="1.0.0")

@app.on_event("startup")
def startup_event():
    from scripts.init_db import main as seed_db
    from app.database import SessionLocal
    from app.models import User
    from app.auth.security import get_password_hash
    try:
        seed_db()
        db = SessionLocal()
        
        users_to_ensure = [
            {"username": "admin", "email": "admin@fabsense.local", "pw": "admin123", "role": "ADMIN"},
            {"username": "prod_mgr", "email": "prod@fabsense.local", "pw": "prod123", "role": "PRODUCTION_MANAGER"},
            {"username": "maint_eng", "email": "maint@fabsense.local", "pw": "maint123", "role": "MAINTENANCE_ENGINEER"},
            {"username": "qual_eng", "email": "qual@fabsense.local", "pw": "qual123", "role": "QUALITY_ENGINEER"},
            {"username": "viewer", "email": "viewer@fabsense.local", "pw": "viewer123", "role": "VIEWER"},
        ]
        
        for u in users_to_ensure:
            db_user = db.query(User).filter(User.username == u["username"]).first()
            if not db_user:
                db.add(User(username=u["username"], email=u["email"], hashed_password=get_password_hash(u["pw"]), role=u["role"]))
            else:
                db_user.hashed_password = get_password_hash(u["pw"])
                
        db.commit()
        db.close()
    except Exception as e:
        print(f"Error seeding DB: {e}")
        
    try:
        from app.ml.secom_service import init_secom_pipeline
        init_secom_pipeline()
    except Exception as e:
        print(f"Error initializing SECOM ML pipeline: {e}")
        
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(websocket.router)
app.include_router(auth.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")
app.include_router(wafers.router, prefix="/api")
app.include_router(production.router, prefix="/api")
app.include_router(yield_analytics.router, prefix="/api")
app.include_router(maintenance.router, prefix="/api")
app.include_router(predictions.router, prefix="/api")
app.include_router(anomalies.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(optimization.router, prefix="/api")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "FABSENSE Backend API",
        "docs": "/docs",
        "frontend": "http://localhost:5173"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}


