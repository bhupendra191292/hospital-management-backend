# 🏥 Hospital Management System - Backend

A robust Node.js backend API for the Hospital Management System built with Express, MongoDB, and modern backend technologies.

## 🚀 Features

- **RESTful API**: Complete REST API for all hospital operations
- **Multi-tenant Architecture**: Support for multiple hospitals
- **Role-based Authentication**: JWT-based secure authentication
- **Patient Management**: Complete patient lifecycle management
- **Doctor Management**: Doctor profiles, schedules, and approvals
- **Appointment System**: Booking and scheduling system
- **Medical Records**: Secure medical record management
- **Billing System**: Payment and invoicing management
- **Analytics & Reporting**: Comprehensive data analytics
- **File Upload**: Secure file upload for documents
- **Audit Logging**: Complete audit trail
- **Rate Limiting**: API protection and throttling

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Express Rate Limit** - API rate limiting

## 📦 Installation

```bash
# Clone the repository
git clone <your-backend-repo-url>
cd hospital-management-backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Start development server
npm start
```

## 🌐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/hospital-management
MONGODB_TEST_URI=mongodb://localhost:27017/hospital-management-test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Available Scripts

```bash
# Development
npm start           # Start production server
npm run dev         # Start development server with nodemon
npm run build       # Build the application

# Database
npm run seed        # Seed database with sample data
npm run seed:demo   # Seed with demo data
npm run clear       # Clear database

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📁 Project Structure

```
backend/
├── controllers/         # Route controllers
│   ├── adminController.js
│   ├── doctorController.js
│   ├── patientController.js
│   └── ...
├── middlewares/         # Custom middleware
│   ├── authMiddleware.js
│   ├── validationMiddleware.js
│   └── ...
├── models/              # Database models
│   ├── Patient.js
│   ├── Doctor.js
│   ├── Appointment.js
│   └── ...
├── routes/              # API routes
│   ├── patientRoutes.js
│   ├── doctorRoutes.js
│   └── ...
├── services/            # Business logic
│   ├── auditService.js
│   └── ...
├── NewFlow/             # New flow modules
│   ├── controllers/     # New flow controllers
│   ├── models/          # New flow models
│   ├── routes/          # New flow routes
│   └── middleware/      # New flow middleware
├── uploads/             # File uploads
├── server.js            # Main server file
└── package.json         # Dependencies
```

## 🔐 Authentication & Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Role-based Access**: Granular permission system
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Comprehensive input validation
- **File Upload Security**: Secure file handling

## 📊 API Endpoints

### Authentication
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/logout         # User logout
GET  /api/auth/verify         # Verify token
```

### Patients
```
GET    /api/patients          # Get all patients
POST   /api/patients          # Create patient
GET    /api/patients/:id      # Get patient by ID
PUT    /api/patients/:id      # Update patient
DELETE /api/patients/:id      # Delete patient
```

### Doctors
```
GET    /api/doctors           # Get all doctors
POST   /api/doctors           # Create doctor
GET    /api/doctors/:id       # Get doctor by ID
PUT    /api/doctors/:id       # Update doctor
DELETE /api/doctors/:id       # Delete doctor
```

### Appointments
```
GET    /api/appointments      # Get all appointments
POST   /api/appointments      # Create appointment
GET    /api/appointments/:id  # Get appointment by ID
PUT    /api/appointments/:id  # Update appointment
DELETE /api/appointments/:id  # Delete appointment
```

### NewFlow API
```
POST /api/newflow/auth/login  # NewFlow login
GET  /api/newflow/dashboard   # Dashboard data
GET  /api/newflow/patients    # NewFlow patients
GET  /api/newflow/doctors     # NewFlow doctors
```

## 🗄️ Database Models

### Patient
```javascript
{
  patientId: String,
  name: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  address: String,
  emergencyContact: String,
  medicalHistory: [String],
  allergies: [String],
  tenant: ObjectId
}
```

### Doctor
```javascript
{
  name: String,
  specialization: String,
  phone: String,
  email: String,
  experience: Number,
  qualifications: [String],
  availableDays: [String],
  tenant: ObjectId
}
```

### Appointment
```javascript
{
  patientId: ObjectId,
  doctorId: ObjectId,
  date: Date,
  time: String,
  status: String,
  notes: String,
  tenant: ObjectId
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "Patient"
```

## 🚀 Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create hospital-backend

# Deploy
git push heroku main
```

### Docker
```bash
# Build Docker image
docker build -t hospital-backend .

# Run container
docker run -p 3000:3000 hospital-backend
```

## 📊 Database Seeding

```bash
# Seed with sample data
npm run seed

# Seed with demo data
npm run seed:demo

# Clear database
npm run clear
```

## 🔧 Development

### Adding New Models
1. Create model in `models/` directory
2. Add validation schema
3. Create controller in `controllers/`
4. Add routes in `routes/`
5. Update API documentation

### Adding New Middleware
1. Create middleware in `middlewares/` directory
2. Export middleware function
3. Import and use in routes
4. Add tests for middleware

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@hospitalmanagement.com or create an issue in the repository.

## 🔗 Related

- [Frontend Repository](https://github.com/yourusername/hospital-management-frontend)
- [API Documentation](https://api-docs.hospitalmanagement.com)
- [Live Demo](https://demo.hospitalmanagement.com)

---

**Built with ❤️ for better healthcare management**

