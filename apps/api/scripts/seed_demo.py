from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models import Base, User, Sound
from app.auth import hash_password


def main():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    user = User(email="demo@tikun.dev", hashed_password=hash_password("Password123"), is_verified=True)
    db.add(user)
    db.commit()
    db.refresh(user)

    sounds = [
        Sound(user_id=user.id, name="Door knock", description="Front door"),
        Sound(user_id=user.id, name="Fire alarm", description="Safety alert"),
        Sound(user_id=user.id, name="Phone ringing", description="Incoming call"),
    ]
    db.add_all(sounds)
    db.commit()
    print("Seeded demo user demo@tikun.dev with Password123")


if __name__ == "__main__":
    main()
