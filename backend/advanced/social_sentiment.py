import tweepy
import praw
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from transformers import pipeline
import os
from datetime import datetime, timedelta

class SocialSentimentAnalyzer:
    def __init__(self):
        # Initialize Twitter API
        auth = tweepy.OAuthHandler(
            os.getenv('TWITTER_API_KEY'),
            os.getenv('TWITTER_API_SECRET')
        )
        auth.set_access_token(
            os.getenv('TWITTER_ACCESS_TOKEN'),
            os.getenv('TWITTER_ACCESS_SECRET')
        )
        self.twitter_api = tweepy.API(auth)
        
        # Initialize Reddit API
        self.reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent=os.getenv('REDDIT_USER_AGENT')
        )
        
        # Initialize sentiment analyzers
        self.vader = SentimentIntensityAnalyzer()
        self.transformer = pipeline('sentiment-analysis')
        
    def get_twitter_sentiment(self, query: str, count: int = 100) -> List[Dict]:
        """Get sentiment from Twitter"""
        tweets = []
        try:
            # Search tweets
            for tweet in tweepy.Cursor(
                self.twitter_api.search_tweets,
                q=query,
                lang="en",
                tweet_mode="extended"
            ).items(count):
                # Get sentiment scores
                vader_score = self.vader.polarity_scores(tweet.full_text)
                transformer_score = self.transformer(tweet.full_text)[0]
                
                tweets.append({
                    'text': tweet.full_text,
                    'created_at': tweet.created_at,
                    'vader_score': vader_score['compound'],
                    'transformer_score': transformer_score['score'] if transformer_score['label'] == 'POSITIVE' else -transformer_score['score']
                })
        except Exception as e:
            print(f"Twitter API error: {e}")
        
        return tweets
    
    def get_reddit_sentiment(self, subreddit: str, query: str, limit: int = 100) -> List[Dict]:
        """Get sentiment from Reddit"""
        posts = []
        try:
            # Search subreddit
            for submission in self.reddit.subreddit(subreddit).search(query, limit=limit):
                # Get sentiment scores
                vader_score = self.vader.polarity_scores(submission.title + " " + submission.selftext)
                transformer_score = self.transformer(submission.title + " " + submission.selftext)[0]
                
                posts.append({
                    'title': submission.title,
                    'text': submission.selftext,
                    'created_at': datetime.fromtimestamp(submission.created_utc),
                    'score': submission.score,
                    'vader_score': vader_score['compound'],
                    'transformer_score': transformer_score['score'] if transformer_score['label'] == 'POSITIVE' else -transformer_score['score']
                })
        except Exception as e:
            print(f"Reddit API error: {e}")
        
        return posts
    
    def aggregate_sentiment(self, team: str) -> Dict[str, float]:
        """Aggregate sentiment from both platforms"""
        # Get data from both platforms
        twitter_data = self.get_twitter_sentiment(team)
        reddit_data = self.get_reddit_sentiment('sportsbetting', team)
        
        # Combine all data
        all_data = twitter_data + reddit_data
        
        if not all_data:
            return {
                'overall_score': 0.5,
                'confidence': 0.0,
                'volume': 0
            }
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        # Calculate weighted scores
        df['weighted_score'] = (
            df['vader_score'] * 0.4 +  # VADER weight
            df['transformer_score'] * 0.6  # Transformer weight
        )
        
        # Calculate time decay
        now = datetime.now()
        df['time_diff'] = (now - df['created_at']).dt.total_seconds() / 3600  # hours
        df['time_weight'] = np.exp(-df['time_diff'] / 24)  # 24-hour decay
        
        # Calculate final scores
        overall_score = np.average(df['weighted_score'], weights=df['time_weight'])
        confidence = np.std(df['weighted_score'])  # Lower std = higher confidence
        volume = len(df)
        
        return {
            'overall_score': (overall_score + 1) / 2,  # Normalize to [0, 1]
            'confidence': 1 - min(confidence, 1),  # Normalize to [0, 1]
            'volume': volume
        }

def get_sentiment_scores(teams: List[str]) -> Dict[str, float]:
    """Get sentiment scores for multiple teams"""
    analyzer = SocialSentimentAnalyzer()
    scores = {}
    
    for team in teams:
        sentiment = analyzer.aggregate_sentiment(team)
        scores[team] = sentiment['overall_score']
    
    return scores 