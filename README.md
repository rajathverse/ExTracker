# 💰 ExTracker - Personal Expense Tracker

A full-stack expense tracking application with AWS backend infrastructure. Track your monthly expenses, recurring bills, loan EMIs, SIP investments, and credit cards all in one place.

![ExTracker](https://img.shields.io/badge/Status-Live-success)
![AWS](https://img.shields.io/badge/AWS-Deployed-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

🌐 **Live Demo**: [https://extracker.rajathverse.com](https://extracker.rajathverse.com)

---

## ✨ Features

### 📊 Expense Management
- **Monthly Expenses** - Track one-time expenses with due dates
- **Recurring Bills** - Manage monthly bills (Rent, Electricity, Internet, etc.)
- **Loan EMIs** - Track loan payments with EMI progress
- **SIP Investments** - Monitor investment contributions
- **Credit Cards** - Manage credit card limits and outstanding amounts

### 🔐 Authentication & Security
- **AWS Cognito** - Secure user authentication with email verification
- **Session Management** - Persistent login sessions
- **Data Isolation** - Each user's data is completely isolated

### 💾 Data Persistence
- **Hybrid Storage** - localStorage + DynamoDB for instant load and cloud sync
- **Real-time Sync** - Automatic synchronization across devices
- **Month-wise Organization** - Expenses organized by month

### 🎨 User Interface
- **Responsive Design** - Optimized for mobile and desktop
- **Modern UI** - Clean, intuitive interface with smooth animations
- **Dark Mode Ready** - Beautiful gradient themes
- **Touch-Friendly** - All buttons 44-48px minimum for mobile

### 🛠️ Smart Features
- **Mark as Paid** - Track payment status with timestamps
- **Filter Options** - View All, Pending, or Paid expenses
- **Expense Grouping** - Organized by type (Loans, Recurring, One-time)
- **Custom Categories** - Add your own expense categories
- **Bank Name Tracking** - For loan EMIs and credit cards
- **Double-Click Prevention** - No duplicate entries

---

## 🏗️ Architecture

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **Vanilla JavaScript** - No framework dependencies
- **AWS SDK** - Client-side AWS integration

### Backend (AWS Serverless)
- **AWS Cognito** - User authentication & authorization
- **AWS Lambda** - Serverless compute (8 functions)
- **DynamoDB** - NoSQL database (2 tables)
- **API Gateway** - REST API endpoints
- **S3** - Static website hosting
- **CloudFront** - CDN with SSL/HTTPS
- **Route53** - DNS management

### Infrastructure as Code
- **Serverless Framework** - Infrastructure deployment
- **Node.js** - Lambda runtime

---

## 📁 Project Structure

```
ExTracker/
├── index.html              # Main HTML file
├── styles.css              # All styles and animations
├── app.js                  # Core application logic
├── auth.js                 # Authentication handling
├── api-service.js          # API communication layer
├── aws-config.js           # AWS configuration
├── serverless.yml          # Infrastructure definition
├── handlers/
│   ├── expenses.js         # Expense CRUD operations
│   └── creditcards.js      # Credit card operations
├── package.json            # Dependencies
└── README.md               # Documentation
```

---

## 🚀 Deployment

### Prerequisites
- AWS Account
- AWS CLI configured
- Node.js & npm installed
- Serverless Framework installed

### Backend Deployment

```bash
# Install dependencies
npm install

# Deploy to AWS
serverless deploy
```

This will create:
- Lambda functions (8 functions)
- DynamoDB tables (2 tables)
- API Gateway
- IAM roles and policies

### Frontend Deployment

```bash
# Upload to S3
aws s3 sync . s3://extracker-s3-web \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude ".serverless/*"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 🔧 Configuration

### AWS Configuration
Update `aws-config.js` with your AWS resources:

```javascript
const AWS_CONFIG = {
    region: 'ap-south-1',
    userPoolId: 'YOUR_USER_POOL_ID',
    clientId: 'YOUR_CLIENT_ID',
    apiEndpoint: 'YOUR_API_GATEWAY_URL'
};
```

### DynamoDB Tables
- **expenses** - Stores all expense data
  - Partition Key: `userId` (String)
  - Sort Key: `id` (String)
  
- **creditcards** - Stores credit card data
  - Partition Key: `userId` (String)
  - Sort Key: `id` (String)

---

## 📊 API Endpoints

### Expenses
- `GET /expenses/{userId}` - Get all expenses
- `POST /expenses` - Create expense
- `PUT /expenses/{userId}/{id}` - Update expense
- `DELETE /expenses/{userId}/{id}` - Delete expense

### Credit Cards
- `GET /creditcards/{userId}` - Get all cards
- `POST /creditcards` - Create card
- `PUT /creditcards/{userId}/{id}` - Update card
- `DELETE /creditcards/{userId}/{id}` - Delete card

---

## 🎯 Key Features Explained

### Hybrid Storage Strategy
- **localStorage**: Instant page load (0ms delay)
- **DynamoDB**: Cloud backup and cross-device sync
- **Sync Logic**: Read from localStorage → Display → Sync with DynamoDB in background

### Expense Grouping
Expenses are intelligently grouped by type:
- **Loan EMIs** - All loan payments together
- **SIP Investments** - All investment contributions
- **Recurring Bills** - Monthly bills (Rent, Electricity, etc.)
- **One-Time Expenses** - Ad-hoc expenses

### Double-Click Prevention
All form submissions and buttons are protected:
```javascript
button.disabled = true;
button.textContent = 'Saving...';
// ... operation ...
button.disabled = false;
```

---

## 💡 Usage

1. **Sign Up** - Create account with email
2. **Verify Email** - Check email for verification code
3. **Add Expenses** - Use various forms to add different expense types
4. **Track Payments** - Mark expenses as paid when completed
5. **View Reports** - See expenses grouped by category
6. **Manage Commitments** - Track recurring bills, loans, and investments

---

## 🔒 Security

- ✅ AWS Cognito authentication
- ✅ HTTPS/SSL via CloudFront
- ✅ IAM role-based access control
- ✅ User data isolation
- ✅ Secure API endpoints
- ✅ No credentials in frontend code

---

## 💰 Cost Estimation

Monthly AWS costs (estimated):
- **Route53**: $0.50/month (hosted zone)
- **CloudFront**: Free tier (1TB/month)
- **S3**: Free tier (5GB storage)
- **Lambda**: Free tier (1M requests)
- **DynamoDB**: Free tier (25GB storage)
- **Cognito**: Free tier (50,000 MAUs)

**Total**: ~$0.50/month (within free tier limits)

---

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- AWS SDK for JavaScript

### Backend
- AWS Lambda (Node.js 18.x)
- AWS DynamoDB
- AWS Cognito
- AWS API Gateway
- Serverless Framework

### DevOps
- AWS S3 (Static hosting)
- AWS CloudFront (CDN)
- AWS Route53 (DNS)
- AWS Certificate Manager (SSL)
- AWS CLI

---

## 📱 Mobile Optimization

- ✅ Responsive design (320px - 1920px)
- ✅ Touch-friendly buttons (44-48px minimum)
- ✅ Fluid typography (clamp)
- ✅ Horizontal scrolling for tables
- ✅ Full-screen modals
- ✅ Smooth animations
- ✅ Sticky header navigation

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Rajath**
- GitHub: [@rajathverse](https://github.com/rajathverse)
- Website: [extracker.rajathverse.com](https://extracker.rajathverse.com)

---

## 🙏 Acknowledgments

- AWS for providing excellent cloud services
- Serverless Framework for easy deployment
- All open-source contributors

---

## 📞 Support

For issues or questions, please open an issue on GitHub or contact through the website.

---

**Made with ❤️ by Rajath**
