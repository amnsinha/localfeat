# Overview

LocalFeat is a location-based social media application built as a full-stack web app. Users can create posts tied to their geographic location, view posts from others nearby, interact through likes and comments, and filter content by hashtags. The app emphasizes local community engagement by showing posts within a specific radius of the user's location.

## Recent Major Features Added

### Production Bot Population System (August 2025)
- **Scalable Bot Creation**: Production-optimized script to create 5000 authentic Indian bot users
- **Geographic Distribution**: Posts distributed across 15 Delhi/NCR locations with realistic coordinates
- **Authentic Content**: Realistic community posts with proper hashtags for gym partners, study groups, local events
- **Performance Optimized**: Batch processing, error recovery, and progress monitoring for production deployment
- **Community Engagement**: Nearly 10,000 posts creating an active, vibrant local community from day one

### Automated Blog System (August 2025)
- **Public Blog Platform**: Added a comprehensive SEO-friendly blog system accessible without login at `/blog`
- **Automated Content Generation**: Integrated Perplexity AI to automatically generate daily blog posts about trending topics converted to local community context
- **Daily Publishing Schedule**: Automated system runs daily at 6 AM to create fresh content
- **Blog Database Schema**: Complete blog posts table with SEO metadata, tags, view counts, and publication controls
- **Blog Navigation**: Added blog link to main application header for easy discovery

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with CSS variables for theming support

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API endpoints under `/api` prefix
- **Data Validation**: Zod schemas shared between client and server
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development**: Hot reload with Vite integration in development mode

## Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL driver
- **Fallback**: In-memory storage implementation for development/testing

## Database Schema
- **Posts Table**: Content, author info, coordinates, location names, hashtags array, likes count, timestamps, expiration dates
- **Comments Table**: Post references, content, author info, likes count, timestamps with cascade deletion
- **Geospatial**: Latitude/longitude stored as real numbers for distance calculations
- **Auto-Cleanup**: Periodic server-side cleanup removes expired posts and associated comments

## Core Features
- **Geolocation**: Browser geolocation API with reverse geocoding for location names
- **Distance Calculation**: Haversine formula for calculating distances between coordinates
- **Hashtag System**: Array-based hashtag storage with filtering capabilities
- **Real-time Updates**: Optimistic updates with TanStack Query cache invalidation
- **Responsive Design**: Mobile-first approach with responsive components
- **Auto-Deletion**: Posts automatically expire after 30 days with real-time countdown timers
- **Content Moderation**: Bad word filtering for posts and comments using shared filter system
- **Search Functionality**: Full-text search across post content and hashtags
- **Share Feature**: Native device sharing with clipboard fallback and toast notifications
- **Direct Messaging**: Private messaging system with conversation management
- **Authentication Flow**: Seamless login/logout with user session persistence

## Authentication & Authorization
- **Replit Auth Integration**: Full OpenID Connect authentication system
- **Public Viewing**: All users can view posts, comments, and use search/filter features
- **Protected Actions**: Creating posts, commenting, and messaging require authentication
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **User Management**: Automatic user creation/update on login with profile data
- **Direct Messaging**: Private conversations between authenticated users

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations and migrations

## UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **Shadcn/ui**: Pre-built component library following design system principles

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

## Browser APIs
- **Geolocation API**: For retrieving user's current position
- **Fetch API**: For HTTP requests to backend services

## Data Management
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition