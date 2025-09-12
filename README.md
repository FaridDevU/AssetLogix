# AssetLogix - Asset Management System

Sistema integral de gestión de activos, equipos, mantenimiento y documentos empresariales.

## Features

- **Equipment Management**: Complete inventory control and equipment status tracking
- **Preventive Maintenance**: Maintenance scheduling and monitoring
- **Document Management**: Document organization and version control
- **Project Management**: Project administration and resource allocation
- **Analytics Dashboard**: Real-time metrics and reporting
- **User Control**: Role-based access and permissions system
- **RESTful API**: External systems integration

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS + Shadcn/UI
- Framer Motion animations
- TanStack Query for state management
- Wouter routing

### Backend
- Node.js + Express
- TypeScript
- Passport.js authentication
- Multer file uploads
- Drizzle ORM

## Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd AssetLogix-main
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Start development server**
```bash
npm run dev
```

5. **Access application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3005

## Login Credentials

```
User: admin
Password: 123
```

## Project Structure

```
AssetLogix-main/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Application pages
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utils and config
├── server/                 # Express Backend
│   ├── routes/             # API routes
│   └── services/           # Business logic
├── shared/                 # Shared schemas
└── public/                 # Static files
```

## Available Scripts

- `npm run dev` - Start development (frontend + backend)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - TypeScript type checking

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Equipment
- `GET /api/equipment` - List equipment
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/:id/download` - Download document

### Maintenance
- `GET /api/maintenance-schedules` - Maintenance schedules
- `POST /api/maintenance-interventions` - Register intervention
- `GET /api/maintenance-interventions/recent` - Recent interventions

## License

MIT License
