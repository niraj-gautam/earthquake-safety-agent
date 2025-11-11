# Earthquake Alert & Safety Brief - AI Agent
*Intelligent earthquake monitoring powered by AI*

An AI agent that provides real-time earthquake information and safety 
guidance using Google Gemini and USGS data, built with MCP architecture.

## 🏗️ Architecture

This project consists of three main components:

1. **MCP Server** - A TypeScript/Express server that provides earthquake data from USGS via the MCP (Model Context Protocol)
2. **AI Agent** - A Python-based agent using Google ADK that acts as an MCP client and provides intelligent responses
3. **Frontend** - A React/TypeScript web interface for user interaction

## ✅ Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Python** (v3.10 or higher)
- **Google ADK** (Agent Development Kit)
- **Git**

## 🔧 Installation

### 1. MCP Server Setup

```bash
# Navigate to the MCP server directory
cd mcp-server

# Install dependencies
npm install
```

### 2. AI Agent Setup

```bash
# Navigate to the agent directory
cd agent

# Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Google ADK and dependencies
pip install google-adk
pip install python-dotenv
```

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd agent/frontend

# Install dependencies
npm install
```

## ⚙️ Environment Setup

### MCP Server Environment

Create a `.env` file in the `mcp-server/` directory (use `example.env` as reference):

```bash
cd mcp-server
cp example.env .env
```

**Edit the `.env` file with your configuration**


**Important:** Generate a secure API key for the `API_KEY` field. You can use:
```bash
openssl rand -hex 32
```

### AI Agent Environment

Create a `.env` file in the `agent/earthquake_agent/` directory (use `env.example` as reference):

```bash
cd agent/earthquake_agent
cp env.example .env
```

**Edit the `.env` file with your configuration:**

- `GOOGLE_API_KEY` - Your Google Gemini API key
- `SERVER_API_KEY` - Use the SAME API_KEY that you set in the MCP server's `.env` file
- `SERVER_API_URL` - URL of the MCP server (default: `http://localhost:3000`)

**⚠️ Critical:** The `SERVER_API_KEY` in the agent's `.env` file **MUST match** the `API_KEY` in the MCP server's `.env` file. The agent uses this key to authenticate with the MCP server.

### Frontend Environment (Optional)

Create a `.env` file in the `agent/frontend/` directory (optional):

```bash
cd agent/frontend
touch .env
```

Add the following configuration:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
```

## 🚀 Running the Project

### Option 1: Development Mode

#### Step 1: Start the MCP Server

```bash
cd mcp-server
npm run dev
```

The MCP server will start on `http://localhost:3000`

#### Step 2: Start the AI Agent

Open a new terminal:

```bash
cd agent
source venv/bin/activate  # On Windows: venv\Scripts\activate
adk api_server earthquake_agent
```

The agent API server will start on `http://localhost:8000`

#### Step 3: Start the Frontend

Open another terminal:

```bash
cd agent/frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or another available port)

### Option 2: Production Mode

#### Step 1: Build and Run MCP Server

```bash
cd mcp-server
npm run build
npm start
```

#### Step 2: Run AI Agent

```bash
cd agent
source venv/bin/activate  # On Windows: venv\Scripts\activate
adk api_server earthquake_agent
```

#### Step 3: Build and Preview Frontend

```bash
cd agent/frontend
npm run build
npm run preview
```

## 🌐 API Endpoints

### MCP Server (Port 3000)

- `GET /health` - Health check endpoint
- `GET /metrics` - Server metrics
- MCP endpoints (accessible via MCP protocol)

### AI Agent (Port 8000)

- Agent API endpoints provided by Google ADK

### Frontend (Port 5173 or 4173)

- Web interface for earthquake monitoring and safety information

## 💻 Development

### MCP Server Development

```bash
cd mcp-server
npm run dev       # Run with hot-reload
npm run build     # Build TypeScript to JavaScript
npm start         # Run production build
```

### Frontend Development

```bash
cd agent/frontend
npm run dev       # Run development server with hot-reload
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Agent Development

The agent automatically reloads when changes are detected in development mode.

## 🔒 Security Notes

- Always change the default `API_KEY` in your `.env` files
- Never commit `.env` files to version control
- Use specific `ALLOWED_ORIGINS` in production instead of `*`
- Keep your API keys secure and rotate them regularly

## 📝 Notes

- The MCP server caches earthquake data to reduce API calls to USGS
- The agent uses Google Gemini for intelligent responses
- The frontend communicates with the agent API server
- All three components must be running for the full system to work

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
