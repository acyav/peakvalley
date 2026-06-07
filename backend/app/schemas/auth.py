from __future__ import annotations
"""认证相关 Pydantic Schema"""
from pydantic import BaseModel, EmailStr
from enum import Enum


class UserRole(str, Enum):
    student = "student"
    enterprise = "enterprise"
    admin = "admin"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.student


class RegisterResponse(BaseModel):
    user_id: str
    email: str
    message: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
