# Video Streaming Application - Backend Microservices

This repository contains the backend microservices for the Video Streaming Application. The application is designed using a microservices architecture, with each service handling a specific task such as user authentication, video storage, usage monitoring, and more. This repository does not include the frontend code, which is stored separately.

## Table of Contents

- [Introduction](#introduction)
- [Architecture Overview](#architecture-overview)
- [Microservices](#microservices)
- [Environment Setup](#environment-setup)
- [Docker Setup](#docker-setup)
- [Inter-Service Communication](#inter-service-communication)
- [Security and Authentication](#security-and-authentication)
- [Deployment](#deployment)
- [How to Add Images to Your Repository](#how-to-add-images-to-your-repository)

## Introduction

The goal of this project was to design and implement a scalable, cloud-based short video streaming application using a microservices architecture. The backend services are deployed on Google Cloud Platform (GCP), ensuring automatic scaling and efficient resource management. These services communicate via secure HTTP API calls and are designed to operate independently.

## Architecture Overview

The backend consists of the following microservices:
- **Video Service (video-service)**: Manages video uploads, storage, and retrieval.
- **Logging Service (logging-service)**: Collects and stores logs from all services asynchronously to avoid blocking the main functionality.
- **Storage Service (storage-service)**: Manages video file storage and tracks user storage quotas.
- **User Service (user-service)**: Handles user authentication and manages JWT tokens.
- **Usage Service (usage-service)**: Tracks user actions, including video uploads and deletions, and monitors bandwidth usage.

Each microservice is containerized using Docker and deployed on Google Cloud Run, which automatically scales based on incoming traffic.

## Microservices

The repository contains the following microservices:

- **video-service**: Manages video file handling.
- **logging-service**: Records system events.
- **storage-service**: Handles video storage and quotas.
- **user-service**: Handles user authentication and JWT token creation.
- **usage-service**: Tracks user actions related to video uploads and deletions.

### File Structure

