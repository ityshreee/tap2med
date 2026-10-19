import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CrossClinicConsentResponse(BaseModel):
    consent_id: uuid.UUID
    clinic_id: uuid.UUID
    event_id: uuid.UUID
    network_token: str
    consent_given: bool
    granted_at: datetime

    class Config:
        from_attributes = True

class ConsentUpdatePayload(BaseModel):
    consent_given: bool

class PatientConsentStatusResponse(BaseModel):
    network_token: str
    consent_given: bool
    abha_linked: bool = True
    abha_id: Optional[str] = None
    uhi_status: str = "Active"
    active_consents_count: int = 0
    last_updated: Optional[datetime] = None

class HealthScoreFactor(BaseModel):
    name: str
    status: str
    impact: str
    type: str  # "positive", "neutral", "negative"

class HealthCreditScoreResponse(BaseModel):
    network_token: str
    score: int
    category: str  # "Excellent", "Good", "Fair", "Needs Attention"
    discount_percentage: float
    credit_tier: str
    max_coverage_inr: int
    factors: list[HealthScoreFactor]
    evaluated_at: datetime
