# SwingMate

Your Personal Swing Trade Assistant - Track, analyze, and optimize your trading performance with a comprehensive portfolio management system.

## 🚀 Features

### 📊 Portfolio Management
- **Open Holdings Tracking**: Monitor your current positions with real-time price updates
- **Trade History**: Complete record of closed trades with entry/exit details
- **P&L Analysis**: Real-time profit/loss calculations for open and closed positions
- **Performance Metrics**: Win rate, average hold time, and portfolio statistics

### 📈 Real-time Data
- **Live Stock Quotes**: Powered by Finnhub API with intelligent caching
- **Price Updates**: Automatic refresh of current market prices
- **Market Data**: Open, high, low, previous close, and volume information

### 💼 Trade Management
- **Add Holdings**: Simple form to record new positions with entry price and date
- **Edit Trades**: Update sell price and sell date for position management
- **Delete Trades**: Remove incorrect entries or closed positions
- **Quantity Tracking**: Support for multiple shares per position

### 📱 Modern UI
- **Chakra UI**: Beautiful, responsive design with dark theme
- **Interactive Dashboard**: Real-time portfolio overview with key metrics
- **Sortable Tables**: Organize holdings by date, ticker, or performance
- **Search & Filter**: Quickly find specific positions or filter by status

### 🔧 Technical Features
- **Authentication**: Secure user management with NextAuth.js
- **Database**: PostgreSQL with Prisma ORM for reliable data storage
- **API Caching**: Optimized API calls to reduce rate limits
- **TypeScript**: Full type safety throughout the application

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Framework**: Chakra UI 2.8.2 with Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with email provider
- **Stock Data**: Finnhub API with intelligent caching
- **Styling**: Chakra UI components with custom dark theme
- **Deployment**: Docker-ready with docker-compose

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL (local or cloud)
- Finnhub API key (free tier available)
- Docker (optional, for containerized setup)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SwingMate
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/swingmate"

# Stock Data API
FINNHUB_API_KEY="your-finnhub-api-key"
```

### 4. Database Setup
```bash
# Create database (if using local PostgreSQL)
npm run db:create

# Run Prisma migrations
npm run db:migrate

# Generate Prisma client
npx prisma generate
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Setup (Alternative)

If you prefer using Docker:

```bash
# Build and start all services
docker-compose up --build

# Run migrations in a new terminal
docker-compose exec web npx prisma migrate dev --name init
```

## 📊 API Endpoints

- `GET /api/holdings` - Fetch all user holdings
- `POST /api/holdings` - Add new holding
- `PUT /api/holdings/[id]` - Update holding
- `DELETE /api/holdings/[id]` - Delete holding
- `GET /api/alpha?ticker=SYMBOL` - Get stock quote (cached)

## 🎯 Key Features in Detail

### Dashboard Overview
- **Portfolio Summary**: Total value, open positions, closed trades
- **Performance Metrics**: Win rate, average P&L, best/worst performers
- **Recent Activity**: Latest trades and position updates
- **Quick Actions**: Add new holdings, edit existing positions

### Holdings Management
- **Open Positions**: Real-time P&L calculation with current market prices
- **Closed Trades**: Historical performance with entry/exit analysis
- **Edit Functionality**: Update sell prices and dates for position management
- **Sort & Filter**: Organize by date, performance, or ticker symbol

### Data Integration
- **Finnhub API**: Reliable stock data with 5-minute caching
- **Real-time Updates**: Automatic price refresh for open positions
- **Error Handling**: Graceful fallbacks when API is unavailable

## 🔧 Development

### Project Structure
```
src/
├── app/                 # Next.js 13+ app directory
│   ├── components/      # Reusable UI components
│   ├── layout.tsx      # Root layout with Chakra UI provider
│   └── page.tsx        # Main dashboard page
├── pages/
│   └── api/            # API routes
│       ├── alpha.ts    # Stock data endpoint
│       ├── holdings/   # Holdings management
│       └── auth/       # Authentication
└── lib/                # Utility functions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:create` - Create database
- `npm run db:migrate` - Run database migrations

## 🚨 Troubleshooting

### Common Issues

**Database Connection**
- Ensure PostgreSQL is running and accessible
- Check DATABASE_URL format in .env.local
- Run `npx prisma db push` to sync schema

**API Rate Limits**
- Finnhub free tier: 60 calls/minute
- Application includes 5-minute caching to minimize API calls
- Consider upgrading to paid tier for higher limits

**Styling Issues**
- Chakra UI is properly configured in layout.tsx
- No additional CSS setup required
- Check browser console for any JavaScript errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Finnhub** for providing reliable stock market data
- **Chakra UI** for the beautiful component library
- **Next.js** team for the amazing React framework
- **Prisma** for the excellent database toolkit

---

**Happy Trading! 📈**

*SwingMate helps you make informed trading decisions with comprehensive portfolio tracking and analysis tools.*
