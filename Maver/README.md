# MAVER - Movie Management System 🎬

A full-stack web application for movie enthusiasts to discover, manage, and share their favorite films. MAVER provides a comprehensive platform for movie browsing, watchlist management, community interactions, and actor profiles.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![React](https://img.shields.io/badge/React-19.1.1-61dafb.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)

##  Features

###  User Features
- **User Authentication**: Secure registration, login, and password reset
- **Movie Browsing**: Search and discover movies with advanced filtering
- **Watchlists**: Create multiple watchlists, rank movies, and organize your collection
- **Favorite Actors**: Save and manage your favorite actors
- **Community Posts**: Share thoughts, react to posts, and engage with the community
- **Movie Details**: Comprehensive movie information including cast, ratings, and comments
- **Actor Profiles**: View actor biographies, filmography, and statistics
- **Profile Management**: Customize your profile with pictures and settings
- **Friend System**: Connect with friends and view their watchlists

###  Admin Features
- **User Management**: View, edit, and delete user accounts
- **Content Moderation**: Manage community posts and comments
- **Message Center**: Receive and respond to user contact messages
- **Dashboard Analytics**: Overview of system statistics

###  Actor Features
- **Actor Dashboard**: Dedicated space for actors to manage their profiles
- **Profile Management**:Explore biography, filmography, and profile information
- **Fan Connections**: Connect with fans

##  Tech Stack

### Frontend
- **React 19.1.1** - UI library
- **React Router DOM 7.9.5** - Client-side routing
- **Vite 7.1.7** - Build tool and dev server
- **Axios 1.13.1** - HTTP client
- **CSS3** - Styling with modern features (Grid, Flexbox, Animations)

### Backend
- **Java 17** - Programming language
- **Spring Boot 3.2.0** - Application framework
- **Spring Data JPA** - Database ORM
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **Spring Security** - Password encryption

### External APIs
- **The Movie Database (TMDB)** - Movie and actor data

##  Prerequisites

Before you begin, ensure you have the following installed:

- **JDK 17+** - [Download here](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
- **Apache Maven 3.6+** - [Download here](https://maven.apache.org/download.cgi)
- **Node.js 16+** and **npm** - [Download here](https://nodejs.org/)
- **XAMPP** (for MySQL) - [Download here](https://www.apachefriends.org/)

##  Quick Start

For detailed setup instructions, see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).

### 1. Start MySQL Server
- Open XAMPP Control Panel
- Start the MySQL service

### 2. Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Application
- Open your browser and navigate to the frontend URL (usually `http://localhost:5173`)
- Default admin credentials:
  - **Email**: admin@mail.tn
  - **Password**: admin



## 🔧 Configuration

### Backend Configuration
Edit `backend/src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/gestion_film
spring.datasource.username=root
spring.datasource.password=your_password

# Server Port
server.port=8080
```

### Frontend Configuration
Create `frontend/.env` (optional):

```env
VITE_API_BASE=http://localhost:8080
VITE_TMDB_API_KEY=your_tmdb_key
```

## 🎯 Key Features Overview

### Movie Management
- Browse movies from TMDB database
- Search and filter by genre, year, and keywords
- View detailed movie information
- Add movies to watchlists
- Rate and comment on movies

### Watchlist System
- Create multiple personalized watchlists
- Rank movies within watchlists
- Organize your movie collection
- Share watchlists with friends

### Community Features
- Create and share posts
- React to community posts
- View user profiles and avatars
- Engage with the movie community

### Actor Management
- Browse actor profiles
- View filmography and statistics
- Add actors to favorites
- Rate and comment on actors

### Admin Dashboard
- Manage users and their roles
- Moderate community content
- Handle contact messages
- View system analytics

##  Security

- JWT-based authentication
- Password encryption with BCrypt
- Role-based access control (Fan, Actor, Admin)
- Protected API endpoints
- CORS configuration
- Input validation and sanitization

##  API Documentation

The backend provides RESTful API endpoints for:

- **Authentication**: `/api/auth/*` - Login, signup, password reset
- **Movies**: `/api/films/*` - Movie operations
- **Actors**: `/api/acteurs/*` - Actor operations
- **Watchlists**: `/api/watchlists/*` - Watchlist management
- **Community**: `/api/community/*` - Posts and reactions
- **Users**: `/api/users/*` - User management
- **Admin**: `/api/admin/*` - Admin operations
- **Contact**: `/api/contact` - Contact form submissions

For detailed API documentation, refer to the backend controller classes.

##  Troubleshooting

### Common Issues

**Backend won't start:**
- Ensure MySQL is running in XAMPP
- Check that port 8080 is available
- Verify Java 17+ is installed
- Check database credentials in `application.properties`

**Frontend won't start:**
- Ensure Node.js 16+ is installed
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Check that port 5173 is available

**Database connection errors:**
- Verify MySQL service is running
- Check database credentials
- Ensure database name matches in `application.properties`

For more troubleshooting tips, see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md).

##  Documentation

- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Detailed setup and installation guide
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Comprehensive project documentation with file descriptions

##  Design Features

- Modern, responsive UI design
- Smooth animations and transitions
- Dark theme with blue accent colors
- Mobile-first responsive layout
- Intuitive user interface
- Accessible design patterns

##  Database

The application uses MySQL with automatic table creation via JPA/Hibernate. The database is created automatically on first run.

Key tables:
- `utilisateurs` - User accounts
- `films` - Movie data
- `acteurs` - Actor profiles
- `watchlists` - User watchlists
- `posts` - Community posts
- `commentaires` - Comments and ratings
- `contact_messages` - Contact form submissions

##  Build & Deployment

### Build Frontend for Production
```bash
cd frontend
npm run build
```

### Build Backend JAR
```bash
cd backend
mvn clean package
```



