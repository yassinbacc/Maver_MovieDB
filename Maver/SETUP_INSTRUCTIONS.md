# MAVER Project - Setup Instructions

This guide will help you set up and run the MAVER movie management system on your local machine.

## Prerequisites

Before starting, ensure you have the following installed:

1. **Java Development Kit (JDK) 17** or higher
   - Download from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
   - Verify installation: `java -version`

2. **Apache Maven 3.6+**
   - Download from: https://maven.apache.org/download.cgi
   - Verify installation: `mvn -version`

3. **Node.js 16+ and npm**
   - Download from: https://nodejs.org/
   - Verify installation: `node -v` and `npm -v`

4. **XAMPP** (for MySQL server)
   - Download from: https://www.apachefriends.org/
   - Install and start the MySQL service from XAMPP Control Panel

## Step-by-Step Setup

### Step 1: Start MySQL Server (XAMPP)

1. Open **XAMPP Control Panel**
2. Click **Start** next to **MySQL** service
3. Wait until MySQL status shows as "Running" (green)

### Step 2: Configure Database

The project uses MySQL with the following default settings:
- **Host:** localhost
- **Port:** 3306
- **Database Name:** `gestion_film`
- **Username:** root
- **Password:** (empty/blank by default in XAMPP)


### Step 3: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Build the project using Maven:**
   ```bash
   mvn clean install
   ```
   
   This will download all dependencies and compile the project.

3. **Run the backend server:**
   ```bash
   mvn spring-boot:run
   ```
   
   Or if you prefer using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   (On Windows: `mvnw.cmd spring-boot:run`)

4. **Verify the backend is running:**
   - You should see messages indicating the Spring Boot application started
   - The backend will run on: **http://localhost:8080**
   - Wait for the message: "Started GestionFilmApplication"

### Step 4: Frontend Setup

1. **Open a new terminal/command prompt** (keep the backend running)

2. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   
   This will download all required packages (may take a few minutes).

4. **Run the frontend development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - The frontend will typically run on: **http://localhost:5173**
   - The terminal will show the exact URL
   - Open this URL in your web browser

### Step 5: First Login

The system automatically creates an admin user on first startup. You can log in with:
- **Email:** admin@mail.tn
- **Password:** admin123



## Important Configuration Files

### Backend Configuration
- **Location:** `backend/src/main/resources/application.properties`
- **Key settings:**
  - Database connection (MySQL)
  - Server port (8080)
  - JPA/Hibernate settings

### Frontend Configuration
- **API Base URL:** Defaults to `http://localhost:8080`
- **Environment Variables (optional):**
  - Create a `.env` file in the `frontend/` directory if needed:
    ```
    VITE_API_BASE=http://localhost:8080
    VITE_TMDB_API_KEY=your_key_here
    ```

## Troubleshooting

### Backend won't start
- **Check MySQL is running:** Ensure MySQL service is started in XAMPP Control Panel
- **Check port 8080:** Make sure no other application is using port 8080
- **Check Java version:** Run `java -version` to ensure JDK 17+ is installed
- **Database connection error:** Verify MySQL credentials in `application.properties`

### Frontend won't start
- **Check Node.js version:** Ensure Node.js 16+ is installed
- **Clear cache and reinstall:**
  ```bash
  cd frontend
  rm -rf node_modules package-lock.json
  npm install
  ```

### Database connection issues
- **MySQL not running:** Start MySQL from XAMPP Control Panel
- **Wrong credentials:** Update `application.properties` with correct MySQL username/password
- **Database doesn't exist:** The database will be created automatically on first run

### Port already in use
- **Backend (8080):** Change `server.port` in `application.properties`
- **Frontend (5173):** Vite will automatically use the next available port

## Running the Project (Quick Reference)

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Browser:**
- Open the URL shown in the frontend terminal (usually http://localhost:5173)




