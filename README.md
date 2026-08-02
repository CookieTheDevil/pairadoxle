# Pairadoxle

Sandra's take on LinkedIn's "Tango" Daily Game.

I am a giant fan of daily games, and I love to share my results with my friends. Therefore, the goal was to create a daily-game with a leaderboard for my friends and I to compete for a few minutes every day. The idea is far from original, but this also serves as a learning-exercise for creating future daily-games alike.

I wanted to make the game self-sustaining to eliminate the need for manual puzzle creation for each day. This also gave the benifit of leaving me clueless to the solution, so I could participate alongside all of my friends. 

## How it's all connected

Uh uhm uhhhh

In the end, it'll hopefully look something like this: 

```
sandrakubosch.no/game/
        │
        ▼
GitHub Pages
HTML + CSS + JavaScript
        │
        │ fetch()
        ▼
Cloudflare Worker API
        │
        ├── Generates/verifies daily puzzles
        ├── Validates submitted scores
        └── Manages leaderboard requests
        │
        ▼
Cloudflare D1
SQLite-compatible database
/
Supabase
Daily Leaderboard database
Daily Puzzle 
```

## 