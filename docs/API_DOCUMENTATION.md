# API Documentation

## Overview
This document provides comprehensive documentation for the AI Sports Betting Platform API.

## Base URL
```
https://api.your-domain.com/v1
```

## Authentication
All API requests require authentication using a Bearer token in the Authorization header:
```
Authorization: Bearer <your-token>
```

## Rate Limiting
- 100 requests per minute per IP
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoints

### Predictions

#### Get Predictions
```http
GET /predictions
```

Query Parameters:
- `sport` (optional): Filter by sport (NBA, WNBA, MLB, NHL, SOCCER)
- `playerId` (optional): Filter by player ID
- `minConfidence` (optional): Minimum confidence score (0-1)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

Response:
```json
{
  "data": {
    "predictions": [
      {
        "id": "string",
        "playerId": "string",
        "sport": "string",
        "predictedValue": "number",
        "confidence": "number",
        "factors": [
          {
            "name": "string",
            "weight": "number",
            "value": "number"
          }
        ],
        "timestamp": "string"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  },
  "status": "success",
  "message": "string",
  "timestamp": "string"
}
```

### Lineups

#### Create Lineup
```http
POST /lineups
```

Request Body:
```json
{
  "legs": [
    {
      "playerId": "string",
      "lineId": "string",
      "type": "OVER|UNDER",
      "value": "number",
      "odds": "number"
    }
  ]
}
```

Response:
```json
{
  "data": {
    "id": "string",
    "legs": [
      {
        "playerId": "string",
        "lineId": "string",
        "type": "string",
        "value": "number",
        "odds": "number"
      }
    ],
    "totalOdds": "number",
    "potentialPayout": "number",
    "confidence": "number",
    "createdAt": "string"
  },
  "status": "success",
  "message": "string",
  "timestamp": "string"
}
```

### Players

#### Get Player Stats
```http
GET /players/{playerId}/stats
```

Response:
```json
{
  "data": {
    "id": "string",
    "name": "string",
    "team": "string",
    "sport": "string",
    "stats": {
      "gamesPlayed": "number",
      "averagePoints": "number",
      "averageRebounds": "number",
      "averageAssists": "number",
      "averageGoals": "number",
      "averageSaves": "number"
    },
    "status": {
      "isActive": "boolean",
      "injuryStatus": "string",
      "lastUpdated": "string"
    }
  },
  "status": "success",
  "message": "string",
  "timestamp": "string"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "status": "error",
  "error": {
    "code": "string",
    "message": "string",
    "details": "object",
    "timestamp": "string"
  }
}
```

Common Error Codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## WebSocket API

### Connection
```
wss://api.your-domain.com/v1/ws
```

### Events

#### Live Odds Updates
```json
{
  "type": "odds_update",
  "data": {
    "lineId": "string",
    "odds": "number",
    "timestamp": "string"
  }
}
```

#### Player Status Updates
```json
{
  "type": "player_status",
  "data": {
    "playerId": "string",
    "status": {
      "isActive": "boolean",
      "injuryStatus": "string",
      "lastUpdated": "string"
    }
  }
}
```

## Best Practices

1. Always handle rate limiting
2. Implement exponential backoff for retries
3. Cache responses when appropriate
4. Use WebSocket for real-time updates
5. Validate all input data
6. Handle errors gracefully
7. Monitor API usage and performance 