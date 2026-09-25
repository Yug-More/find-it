# FindIt

FindIt is an AI-powered lost-and-found platform that connects users with their missing items through intelligent image, description, location, and date-based matching.

## Project status

Currently under development for CS 160: Software Engineering at San José State University.

## Team 10 members

- Yug Amol More ([`Yug-More`](https://github.com/Yug-More))
- Marl Jonson ([`marlware`](https://github.com/marlware))
- Brody Smith ([`Brodys1`](https://github.com/Brodys1))

## Software architecture

- React Native (mobile interface: camera, GPS)
- FastAPI (single backend: users, claims, security, and AI embeddings)
- Supabase (storage, auth)
- Gemini API (vector embeddings)

### Diagram
```mermaid
graph TD
    %% Define Styles
    classDef client fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff;
    classDef aiBackend fill:#9b59b6,stroke:#8e44ad,stroke-width:2px,color:#fff;
    classDef database fill:#e67e22,stroke:#d35400,stroke-width:2px,color:#fff;
    classDef external fill:#95a5a6,stroke:#7f8c8d,stroke-width:2px,color:#fff;

    %% Nodes
    User((User))
    MobileApp[React Native Mobile App<br/>'mobile-app']:::client
    AIService[FastAPI Service<br/>'ai-service']:::aiBackend
    SupabaseDB[(Supabase PostgreSQL<br/>+ pgvector)]:::database
    Gemini[Gemini Embedding API]:::external

    %% Data Flows
    User -->|Uploads item / searches| MobileApp
    MobileApp -->|HTTPS REST Request| AIService

    AIService -->|1. Generate Vectors| Gemini
    Gemini -->|2. Return Embedding| AIService

    AIService -->|3. Save Meta & Vectors / Read Matches| SupabaseDB
```

# How to install

TODO:

- write prerequisites
- write instructions
- add design decisions to README
