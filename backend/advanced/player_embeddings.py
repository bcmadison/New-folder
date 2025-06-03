import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import os
import json

class PlayerEmbeddingModel(nn.Module):
    def __init__(self, input_dim: int, embedding_dim: int = 32):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, embedding_dim)
        )
        
    def forward(self, x):
        return self.encoder(x)

class PlayerDataset(Dataset):
    def __init__(self, features: np.ndarray):
        self.features = torch.FloatTensor(features)
        
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        return self.features[idx]

class PlayerEmbeddings:
    def __init__(self, embedding_dim: int = 32):
        self.embedding_dim = embedding_dim
        self.scaler = StandardScaler()
        self.model = None
        self.feature_names = None
        
    def prepare_features(self, player_data: pd.DataFrame) -> np.ndarray:
        """Prepare and normalize player features"""
        # Select numerical features
        numerical_cols = player_data.select_dtypes(include=[np.number]).columns
        self.feature_names = numerical_cols.tolist()
        
        # Handle missing values
        features = player_data[numerical_cols].fillna(0)
        
        # Scale features
        scaled_features = self.scaler.fit_transform(features)
        return scaled_features
    
    def train_model(self, player_data: pd.DataFrame, epochs: int = 100, batch_size: int = 32):
        """Train the embedding model"""
        # Prepare features
        features = self.prepare_features(player_data)
        
        # Create dataset and dataloader
        dataset = PlayerDataset(features)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # Initialize model
        self.model = PlayerEmbeddingModel(features.shape[1], self.embedding_dim)
        optimizer = torch.optim.Adam(self.model.parameters())
        criterion = nn.MSELoss()
        
        # Training loop
        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch in dataloader:
                optimizer.zero_grad()
                output = self.model(batch)
                loss = criterion(output, batch)  # Autoencoder reconstruction loss
                loss.backward()
                optimizer.step()
                total_loss += loss.item()
            
            if (epoch + 1) % 10 == 0:
                print(f"Epoch [{epoch+1}/{epochs}], Loss: {total_loss/len(dataloader):.4f}")
    
    def get_embeddings(self, player_data: pd.DataFrame) -> Dict[str, np.ndarray]:
        """Generate embeddings for players"""
        if self.model is None:
            raise ValueError("Model must be trained before generating embeddings")
        
        # Prepare features
        features = self.prepare_features(player_data)
        
        # Generate embeddings
        self.model.eval()
        with torch.no_grad():
            embeddings = self.model(torch.FloatTensor(features)).numpy()
        
        # Create player to embedding mapping
        player_embeddings = {}
        for idx, player_id in enumerate(player_data.index):
            player_embeddings[player_id] = embeddings[idx]
        
        return player_embeddings
    
    def get_similar_players(self, player_id: str, player_embeddings: Dict[str, np.ndarray], 
                          top_k: int = 5) -> List[Tuple[str, float]]:
        """Find similar players based on embedding similarity"""
        if player_id not in player_embeddings:
            raise ValueError(f"Player {player_id} not found in embeddings")
        
        # Get target player embedding
        target_embedding = player_embeddings[player_id]
        
        # Calculate similarities
        similarities = []
        for pid, embedding in player_embeddings.items():
            if pid != player_id:
                similarity = np.dot(target_embedding, embedding) / (
                    np.linalg.norm(target_embedding) * np.linalg.norm(embedding)
                )
                similarities.append((pid, similarity))
        
        # Sort by similarity and return top k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
    
    def save_model(self, path: str):
        """Save model and scaler"""
        if self.model is None:
            raise ValueError("No model to save")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        # Save model state
        torch.save({
            'model_state': self.model.state_dict(),
            'feature_names': self.feature_names,
            'embedding_dim': self.embedding_dim
        }, f"{path}/model.pt")
        
        # Save scaler
        import joblib
        joblib.dump(self.scaler, f"{path}/scaler.joblib")
    
    def load_model(self, path: str):
        """Load model and scaler"""
        # Load model state
        checkpoint = torch.load(f"{path}/model.pt")
        self.feature_names = checkpoint['feature_names']
        self.embedding_dim = checkpoint['embedding_dim']
        
        # Initialize and load model
        self.model = PlayerEmbeddingModel(len(self.feature_names), self.embedding_dim)
        self.model.load_state_dict(checkpoint['model_state'])
        
        # Load scaler
        import joblib
        self.scaler = joblib.load(f"{path}/scaler.joblib")

def generate_player_embeddings(player_data: pd.DataFrame, 
                             model_path: str = "models/player_embeddings",
                             embedding_dim: int = 32) -> Dict[str, np.ndarray]:
    """Generate embeddings for all players"""
    # Initialize and train model
    embeddings = PlayerEmbeddings(embedding_dim=embedding_dim)
    embeddings.train_model(player_data)
    
    # Generate embeddings
    player_embeddings = embeddings.get_embeddings(player_data)
    
    # Save model
    embeddings.save_model(model_path)
    
    return player_embeddings 