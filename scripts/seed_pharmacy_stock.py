"""
Seed DEMO pharmacy stock for the hackathon.

Run from the project root (the folder with requirements.txt):

    python scripts/seed_pharmacy_stock.py                 # all clinics
    python scripts/seed_pharmacy_stock.py <clinic_id>     # one clinic

Safe to run again: existing medicines are reset to their demo quantity.
The medicines and substitutes below are DEMO DATA only, not medical advice.
"""
import sys
import uuid

# Make "app" importable when running as a script
sys.path.insert(0, ".")

from app.db.database import SessionLocal
from app.db import models

# (medicine name, quantity, substitute)
DEMO_STOCK = [
    ("Paracetamol 500mg", 120, "Dolo 650"),
    ("Dolo 650", 80, "Paracetamol 500mg"),
    ("Amoxicillin 500mg", 0, "Augmentin 625"),      # starts OUT of stock for the demo
    ("Augmentin 625", 40, "Amoxicillin 500mg"),
    ("Azithromycin 500mg", 30, "Clarithromycin 500mg"),
    ("Cetirizine 10mg", 100, "Levocetirizine 5mg"),
    ("Levocetirizine 5mg", 60, "Cetirizine 10mg"),
    ("Pantoprazole 40mg", 75, "Rabeprazole 20mg"),
    ("Omeprazole 20mg", 50, "Pantoprazole 40mg"),
    ("Ibuprofen 400mg", 90, "Diclofenac 50mg"),
    ("Diclofenac 50mg", 45, "Ibuprofen 400mg"),
    ("Cefixime 200mg", 25, "Cefpodoxime 200mg"),
    ("Metformin 500mg", 150, "Metformin SR 500mg"),
    ("ORS Sachet", 200, None),
]


def make_key(name: str) -> str:
    """Lowercase, single spaces. Used to match what the doctor types."""
    return " ".join(name.lower().split())


def seed_clinic(db, clinic_id):
    for name, qty, substitute in DEMO_STOCK:
        key = make_key(name)
        row = (
            db.query(models.PharmacyStock)
            .filter(
                models.PharmacyStock.clinic_id == clinic_id,
                models.PharmacyStock.medicine_key == key,
            )
            .first()
        )
        if row:
            row.medicine_name = name
            row.quantity = qty
            row.substitute_name = substitute
        else:
            db.add(
                models.PharmacyStock(
                    clinic_id=clinic_id,
                    medicine_name=name,
                    medicine_key=key,
                    quantity=qty,
                    substitute_name=substitute,
                )
            )


def main():
    db = SessionLocal()
    try:
        if len(sys.argv) > 1:
            clinic_ids = [uuid.UUID(sys.argv[1])]
        else:
            clinic_ids = [c.clinic_id for c in db.query(models.Clinic).all()]

        if not clinic_ids:
            print("No clinics found. Register a clinic first, then run this again.")
            return

        for cid in clinic_ids:
            seed_clinic(db, cid)
            print(f"Seeded {len(DEMO_STOCK)} medicines for clinic {cid}")

        db.commit()
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
