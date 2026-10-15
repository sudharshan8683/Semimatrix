import base64
import json
import hmac
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from app.config import settings

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(data + padding)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    # 1. Plain text comparison fallback
    if plain_password == hashed_password:
        return True
    # 2. Try bcrypt if available
    try:
        import bcrypt
        hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
        plain_bytes = plain_password.encode('utf-8') if isinstance(plain_password, str) else plain_password
        if bcrypt.checkpw(plain_bytes, hashed_bytes):
            return True
    except Exception as e:
        print(f"[AUTH] bcrypt verify fallback: {e}")
    # 3. Try sha256
    sha256_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    if sha256_hash == hashed_password:
        return True
    return False

def get_password_hash(password: str) -> str:
    try:
        import bcrypt
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    except Exception:
        # Fallback to sha256
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates HS256 JWT bearer token. Tries python-jose first;
    falls back seamlessly to standard library hmac/hashlib/base64.
    """
    try:
        from jose import jwt
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    except Exception as e:
        print(f"[AUTH] jose encode fallback to standard library: {e}")
        # Standard library HS256 JWT
        header = {"alg": "HS256", "typ": "JWT"}
        payload = data.copy()
        if expires_delta:
            exp_ts = int(time.time() + expires_delta.total_seconds())
        else:
            exp_ts = int(time.time() + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
        payload["exp"] = exp_ts
        
        header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
        payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        
        header_b64 = _base64url_encode(header_bytes)
        payload_b64 = _base64url_encode(payload_bytes)
        
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        signature_b64 = _base64url_encode(signature)
        
        return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes HS256 JWT bearer token. Tries python-jose first;
    falls back seamlessly to standard library hmac/hashlib/base64.
    """
    try:
        from jose import jwt
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        # Standard library HS256 JWT decoding
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid JWT format")
        header_b64, payload_b64, signature_b64 = parts
        
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(settings.SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = _base64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid signature")
            
        payload_json = _base64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        
        if "exp" in payload and payload["exp"] < time.time():
            raise ValueError("Token expired")
            
        return payload
