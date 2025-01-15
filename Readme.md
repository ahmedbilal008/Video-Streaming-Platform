# Video Streaming Application - Backend Microservices

This repository contains the backend microservices for the **Video Streaming Application**. The application is designed using a microservices architecture, where each service handles a specific task such as user authentication, video storage, usage monitoring, and more. The frontend code is stored separately in its own repository, which can be accessed [here](https://github.com/ahmedbilal008/Video-Streaming-Platfrom-Frontend-).

## Table of Contents

- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)
- [Microservices](#microservices)
- [Environment Setup](#environment-setup)
- [Docker Setup (Optional)](#docker-setup-optional)
- [Inter-Service Communication](#inter-service-communication)
- [Security and Authentication](#security-and-authentication)
- [Database Setup](#database-setup)
- [Deployment](#deployment)

## Introduction

The goal of this project was to design and implement a scalable, cloud-based short video streaming application using a microservices architecture. The backend services are deployed on **Google Cloud Platform (GCP)**, ensuring automatic scaling and efficient resource management. These services communicate via secure HTTP API calls and are designed to operate independently, providing flexibility and scalability.

## Architecture Overview

The backend consists of the following microservices:

- **Video Service (video-service)**: Manages video uploads, storage, and retrieval.
- **Logging Service (logging-service)**: Collects and stores logs from all services asynchronously to avoid blocking the main functionality.
- **Storage Service (storage-service)**: Manages video file storage and tracks user storage quotas.
- **User Service (user-service)**: Handles user authentication and manages JWT tokens.
- **Usage Service (usage-service)**: Tracks user actions, including video uploads and deletions, and monitors bandwidth usage.

Each microservice is containerized using **Docker** and deployed on **Google Cloud Run**, which automatically scales based on incoming traffic. This architecture allows the application to handle fluctuating user demands without manual intervention.

## Microservices

The repository contains the following microservices:

- **video-service**: Handles video file uploads, retrieval, and management.
- **logging-service**: Records logs for all system events and user actions.
- **storage-service**: Manages cloud storage for video files and user quotas.
- **user-service**: Manages user registration, login, and JWT token generation.
- **usage-service**: Tracks user activities related to video uploads and deletions, including bandwidth monitoring.

## Environment Setup

Each microservice requires a `.env` file for configuration. The `.env` file should include the following environment variables:

- **JWT_SECRET**: Secret key for generating JWT tokens.
- **SUPABASE_URL**: URL for the Supabase database instance.
- **SUPABASE_KEY**: API key for accessing Supabase.
- **PORT**: Port number on which the service should run.

Example `.env` file:

```bash
JWT_SECRET=mysecretkey
SUPABASE_URL=https://your-supabase-url
SUPABASE_KEY=your-supabase-key
PORT=3000
```

Ensure that a `.env` file is created in each service folder (e.g., `video-service/.env`, `user-service/.env`, etc.).

## Docker Setup (Optional)

Each microservice contains a `Dockerfile` for containerization. Running the microservices locally is optional. If you prefer to run the services locally with Docker, follow these steps:

1. Navigate to the service directory (e.g., `cd video-service`).
2. Build the Docker image:
   ```bash
   docker build -t video-service .
   ```
3. Run the container:
   ```bash
   docker run -p 3000:3000 video-service
   ```

> Note: Docker setup is optional. You can also run the services locally without Docker during development.

## Inter-Service Communication

Each microservice communicates with others via secure HTTP APIs. For example:

- **User Service** issues JWT tokens to authenticate users.
- **Video Service** handles video uploads, retrieval, and storage.
- **Storage Service** manages user video storage quotas and limits.
- **Usage Service** tracks user actions related to video uploads, deletions, and bandwidth usage.

These services are loosely coupled to ensure that failures in one service do not affect others.

## Security and Authentication

The application uses **JWT tokens** for secure communication between the frontend and backend. Upon user login, the **user-service** generates a JWT token that is validated by all other microservices to ensure that only authorized users can access protected resources.

## Database Setup

The application uses **Supabase** as the database for managing users, videos, and logs. The database schema consists of the following tables:

### Users Table

| Name       | Data Type               | Format             |
|------------|-------------------------|--------------------|
| id         | uuid                    | uuid               |
| email      | text                    | text               |
| password   | text                    | text               |
| username   | text                    | text               |
| created_at | timestamp with time zone | timestamptz        |
| role       | text                    | text               |
| uploading  | timestamp with time zone | timestamptz        |

### Videos Table

| Name        | Data Type               | Format             |
|-------------|-------------------------|--------------------|
| id          | uuid                    | uuid               |
| user_id     | uuid                    | uuid               |
| filename    | text                    | text               |
| filepath    | text                    | text               |
| title       | text                    | text               |
| uploaded_at | timestamp with time zone | timestamptz        |
| deleted_at  | timestamp without time zone | timestamp        |
| size_mb     | double precision        | float8             |

### Logs Table

| Name        | Data Type               | Format             |
|-------------|-------------------------|--------------------|
| id          | uuid                    | uuid               |
| user_id     | uuid                    | uuid               |
| action_type | character varying       | varchar            |
| description | text                    | text               |
| service_name| character varying       | varchar            |
| created_at  | timestamp without time zone | timestamp        |

## Deployment

All microservices are deployed on **Google Cloud Run** for automatic scaling. This ensures that the application can handle fluctuating traffic efficiently, scaling up when traffic increases and scaling down when traffic decreases. Additionally, **load balancing** ensures that incoming requests are distributed across multiple instances to prevent any single instance from being overwhelmed.

---

This concludes the setup for your backend microservices repository. For the frontend code, visit the [frontend repository](https://github.com/ahmedbilal008/Video-Streaming-Platfrom-Frontend-).
