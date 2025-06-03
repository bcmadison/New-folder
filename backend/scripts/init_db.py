import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

def init_database():
    """Initialize the database and create necessary tables"""
    try:
        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Create database if it doesn't exist
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{os.getenv('DB_NAME')}'")
        exists = cur.fetchone()
        if not exists:
            cur.execute(f'CREATE DATABASE {os.getenv("DB_NAME")}')
            print(f"Database {os.getenv('DB_NAME')} created successfully")
        
        # Close connection to default database
        cur.close()
        conn.close()
        
        # Connect to the new database
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )
        cur = conn.cursor()
        
        # Create tables
        cur.execute("""
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                league VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                team_id INTEGER REFERENCES teams(id),
                position VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(name, team_id)
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                home_team_id INTEGER REFERENCES teams(id),
                away_team_id INTEGER REFERENCES teams(id),
                match_date TIMESTAMP NOT NULL,
                home_score INTEGER,
                away_score INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id SERIAL PRIMARY KEY,
                match_id INTEGER REFERENCES matches(id),
                model_name VARCHAR(50) NOT NULL,
                prediction FLOAT NOT NULL,
                confidence FLOAT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS player_stats (
                id SERIAL PRIMARY KEY,
                player_id INTEGER REFERENCES players(id),
                match_id INTEGER REFERENCES matches(id),
                goals INTEGER DEFAULT 0,
                assists INTEGER DEFAULT 0,
                minutes_played INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS social_sentiment (
                id SERIAL PRIMARY KEY,
                team_id INTEGER REFERENCES teams(id),
                sentiment_score FLOAT NOT NULL,
                confidence FLOAT NOT NULL,
                volume INTEGER NOT NULL,
                source VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cur.execute("CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_social_sentiment_team ON social_sentiment(team_id)")
        
        # Commit changes
        conn.commit()
        print("Database tables created successfully")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        sys.exit(1)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    init_database() 