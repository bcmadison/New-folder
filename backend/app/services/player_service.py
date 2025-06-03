from sqlalchemy.orm import Session
from app.models.player import Player
from typing import List, Optional
from datetime import datetime, UTC

class PlayerService:
    @staticmethod
    def get_players(db: Session, skip: int = 0, limit: int = 100) -> List[Player]:
        return db.query(Player).offset(skip).limit(limit).all()

    @staticmethod
    def get_player_by_id(db: Session, player_id: str) -> Optional[Player]:
        return db.query(Player).filter(Player.id == player_id).first()

    @staticmethod
    def create_player(db: Session, player_data: dict) -> Player:
        db_player = Player(**player_data)
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
        return db_player

    @staticmethod
    def update_player(db: Session, player_id: str, player_data: dict) -> Optional[Player]:
        db_player = db.query(Player).filter(Player.id == player_id).first()
        if db_player:
            for key, value in player_data.items():
                setattr(db_player, key, value)
            db_player.updated_at = datetime.now(UTC)
            db.commit()
            db.refresh(db_player)
        return db_player

    @staticmethod
    def delete_player(db: Session, player_id: str) -> bool:
        db_player = db.query(Player).filter(Player.id == player_id).first()
        if db_player:
            db.delete(db_player)
            db.commit()
            return True
        return False

    @staticmethod
    def get_players_by_position(db: Session, position: str) -> List[Player]:
        return db.query(Player).filter(Player.position == position).all()

    @staticmethod
    def get_players_by_team(db: Session, team: str) -> List[Player]:
        return db.query(Player).filter(Player.team == team).all()

    @staticmethod
    def get_players_by_salary_range(db: Session, min_salary: float, max_salary: float) -> List[Player]:
        return db.query(Player).filter(
            Player.salary >= min_salary,
            Player.salary <= max_salary
        ).all()

    @staticmethod
    def get_players_by_confidence(db: Session, min_confidence: float) -> List[Player]:
        return db.query(Player).filter(Player.confidence >= min_confidence).all() 