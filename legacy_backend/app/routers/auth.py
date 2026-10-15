from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import User
from app.schemas import Token, UserResponse, UserCreate
from app.auth.security import verify_password, create_access_token, get_password_hash
from app.auth.dependencies import get_current_active_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
async def login_for_access_token(request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT bearer token.
    Accepts both JSON ({username, password}) and URL-encoded form data.
    """
    username = None
    password = None

    content_type = request.headers.get("content-type", "")
    
    # 1. Attempt JSON parsing
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                username = body.get("username")
                password = body.get("password")
        except Exception:
            pass

    # 2. Attempt Form parsing
    if not username:
        try:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
        except Exception:
            pass

    # 3. Fallback: try raw query or body if JSON parsing failed
    if not username:
        try:
            raw_body = await request.body()
            import json
            data = json.loads(raw_body.decode('utf-8'))
            username = data.get("username")
            password = data.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    try:
        user = db.query(User).filter(User.username == username.strip()).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user_by_username = db.query(User).filter(User.username == user_in.username).first()
    if user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    user_by_email = db.query(User).filter(User.email == user_in.email).first()
    if user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role
    )
    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    return new_user

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
