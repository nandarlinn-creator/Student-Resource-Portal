# 🎓 Student Resource Portal

Node.js / Express application for university resource sharing, deployed on AWS EC2 with RDS MySQL.

---

## Directory Structure

```
student-portal/
├── config/
│   └── database.js          # Sequelize + RDS connection (reads from env vars)
├── controllers/
│   ├── authController.js    # Login, register, logout logic
│   └── projectController.js # Project CRUD logic
├── middleware/
│   ├── authMiddleware.js    # Session guards + RBAC
│   └── uploadMiddleware.js  # Multer file validation
├── models/
│   ├── User.js              # User schema + password hashing
│   └── Project.js           # Project schema + associations
├── routes/
│   ├── authRoutes.js        # /auth/* with validation
│   └── projectRoutes.js     # /projects/* (protected)
├── public/
│   ├── css/                 # Stylesheets
│   ├── js/                  # Client-side scripts
│   ├── uploads/             # Uploaded project files (local dev)
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   └── upload.html          # Project upload page
├── .env.example             # Template — copy to .env and fill in secrets
├── package.json
└── server.js                # Entry point
```

---

## Local Setup

```bash
# 1. Clone and install
git clone <repo-url> && cd student-portal
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — fill in your RDS credentials and SESSION_SECRET

# 3. Run (development)
npm run dev
```

---

## AWS EC2 Deployment

### Prerequisites
- EC2 instance (Amazon Linux 2 or Ubuntu 22.04 LTS)
- RDS MySQL instance in the same VPC
- Security Groups: EC2 → RDS on port 3306; Internet → EC2 on port 80/443

### Steps

```bash
# On EC2 — install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs   # Amazon Linux
# OR: sudo apt-get install -y nodejs   # Ubuntu

# Clone app
git clone <repo-url> /home/ec2-user/student-portal
cd /home/ec2-user/student-portal
npm install --production

# Set env vars (use AWS Secrets Manager or Parameter Store in production)
cp .env.example .env
nano .env   # Fill in real RDS endpoint and credentials

# Run with PM2 (process manager)
sudo npm install -g pm2
pm2 start server.js --name student-portal
pm2 startup && pm2 save
```

### RDS Security Group Rule
Allow EC2's security group to reach RDS on **port 3306**.
Never expose RDS publicly.

### HTTPS (strongly recommended)
Use **Nginx as a reverse proxy** in front of Node + **Certbot** for free TLS:
```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## API Endpoints

| Method | Path               | Auth | Description              |
|--------|--------------------|------|--------------------------|
| GET    | /auth/login        | No   | Login page               |
| POST   | /auth/login        | No   | Authenticate user        |
| GET    | /auth/register     | No   | Registration page        |
| POST   | /auth/register     | No   | Create account           |
| POST   | /auth/logout       | Yes  | End session              |
| GET    | /projects          | Yes  | List approved projects   |
| GET    | /projects/upload   | Yes  | Upload form              |
| POST   | /projects/upload   | Yes  | Submit project + file    |
| GET    | /projects/:id      | Yes  | View single project      |

---

## Security Checklist

- [x] Passwords hashed with bcrypt (cost 12)
- [x] Session stored server-side (not in cookie)
- [x] Session regenerated on login (prevents fixation)
- [x] DB credentials in environment variables only
- [x] SSL enforced on RDS connection
- [x] File type and size validation on upload
- [x] Input validation via express-validator
- [ ] Add CSRF protection (`csurf` or `csrf-csrf`)
- [ ] Rate-limit `/auth/login` (`express-rate-limit`)
- [ ] Move uploads to S3 for production
- [ ] Use AWS Secrets Manager instead of .env on EC2
