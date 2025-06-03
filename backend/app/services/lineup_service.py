from sqlalchemy.orm import Session
from app.models.lineup import Lineup
from app.models.player import Player
from typing import List, Optional, Dict, Any
from datetime import datetime, UTC
import uuid

class LineupService:
    @staticmethod
    def get_lineups(db: Session, skip: int = 0, limit: int = 100) -> List[Lineup]:
        return db.query(Lineup).offset(skip).limit(limit).all()

    @staticmethod
    def get_lineup_by_id(db: Session, lineup_id: str) -> Optional[Lineup]:
        return db.query(Lineup).filter(Lineup.id == lineup_id).first()

    @staticmethod
    def create_lineup(db: Session, lineup_data: Dict[str, Any]) -> Lineup:
        # Calculate total salary
        total_salary = sum(player.salary for player in lineup_data['players'])
        
        # Create new lineup
        db_lineup = Lineup(
            id=str(uuid.uuid4()),
            sport=lineup_data['sport'],
            contest_id=lineup_data.get('contestId'),
            total_salary=total_salary,
            players=lineup_data['players']
        )
        
        db.add(db_lineup)
        db.commit()
        db.refresh(db_lineup)
        return db_lineup

    @staticmethod
    def update_lineup(db: Session, lineup_id: str, lineup_data: Dict[str, Any]) -> Optional[Lineup]:
        db_lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
        if db_lineup:
            # Update basic fields
            if 'sport' in lineup_data:
                db_lineup.sport = lineup_data['sport']
            if 'contestId' in lineup_data:
                db_lineup.contest_id = lineup_data['contestId']
            
            # Update players if provided
            if 'players' in lineup_data:
                db_lineup.players = lineup_data['players']
                # Recalculate total salary
                db_lineup.total_salary = sum(player.salary for player in lineup_data['players'])
            
            db_lineup.updated_at = datetime.now(UTC)
            db.commit()
            db.refresh(db_lineup)
        return db_lineup

    @staticmethod
    def delete_lineup(db: Session, lineup_id: str) -> bool:
        db_lineup = db.query(Lineup).filter(Lineup.id == lineup_id).first()
        if db_lineup:
            db.delete(db_lineup)
            db.commit()
            return True
        return False

    @staticmethod
    def get_lineups_by_sport(db: Session, sport: str) -> List[Lineup]:
        return db.query(Lineup).filter(Lineup.sport == sport).all()

    @staticmethod
    def get_lineups_by_contest(db: Session, contest_id: str) -> List[Lineup]:
        return db.query(Lineup).filter(Lineup.contest_id == contest_id).all()

    @staticmethod
    def validate_lineup(players: List[Player], sport: str) -> Dict[str, Any]:
        errors = []
        total_salary = sum(player.salary for player in players)

        # Check salary cap
        if total_salary > 50000:
            errors.append("Lineup exceeds salary cap of $50,000")

        # Check position requirements based on sport
        position_counts = {}
        for player in players:
            position_counts[player.position] = position_counts.get(player.position, 0) + 1

        # Example position requirements for NFL
        if sport.lower() == 'nfl':
            requirements = {
                'QB': 1,
                'RB': 2,
                'WR': 3,
                'TE': 1,
                'FLEX': 1,
                'DST': 1
            }
            for position, required in requirements.items():
                actual = position_counts.get(position, 0)
                if actual < required:
                    errors.append(f"Need {required} {position}, have {actual}")

        return {
            "isValid": len(errors) == 0,
            "errors": errors,
            "totalSalary": total_salary
        } 