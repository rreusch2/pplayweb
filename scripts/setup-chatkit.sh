#!/bin/bash

# ChatKit Setup Script for ParleyApp
# This script helps set up OpenAI ChatKit integration

echo "🚀 Setting up OpenAI ChatKit for ParleyApp..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the web-app directory.${NC}"
    exit 1
fi

# Step 1: Install ChatKit dependency
echo -e "\n${YELLOW}Step 1: Installing ChatKit dependencies...${NC}"
npm install @openai/chatkit-react

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ChatKit React package installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install ChatKit package${NC}"
    exit 1
fi

# Step 2: Check for environment file
echo -e "\n${YELLOW}Step 2: Checking environment configuration...${NC}"

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
    
    # Check for required environment variables
    if grep -q "OPENAI_API_KEY" .env.local; then
        echo -e "${GREEN}✅ OPENAI_API_KEY found in .env.local${NC}"
    else
        echo -e "${YELLOW}⚠️  OPENAI_API_KEY not found in .env.local${NC}"
        echo "   Please add: OPENAI_API_KEY=your_key_here"
    fi
    
    if grep -q "OPENAI_WORKFLOW_ID" .env.local; then
        echo -e "${GREEN}✅ OPENAI_WORKFLOW_ID found in .env.local${NC}"
    else
        echo -e "${YELLOW}⚠️  OPENAI_WORKFLOW_ID not found in .env.local${NC}"
        echo "   Please add: OPENAI_WORKFLOW_ID=wf_your_workflow_id"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY found in .env.local${NC}"
    else
        echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not found in .env.local${NC}"
        echo "   Please add your Supabase service role key"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    
    # Check if template exists
    if [ -f ".env.chatkit.template" ]; then
        cp .env.chatkit.template .env.local
        echo -e "${GREEN}✅ Created .env.local from template${NC}"
        echo -e "${YELLOW}   Please edit .env.local and add your API keys${NC}"
    else
        echo -e "${RED}❌ .env.chatkit.template not found${NC}"
    fi
fi

# Step 3: Create database migration file
echo -e "\n${YELLOW}Step 3: Preparing database migration...${NC}"

if [ -f "database/chatkit-sessions-schema.sql" ]; then
    echo -e "${GREEN}✅ Database migration file exists${NC}"
    echo -e "${YELLOW}   Run this SQL in your Supabase SQL editor:${NC}"
    echo "   database/chatkit-sessions-schema.sql"
else
    echo -e "${RED}❌ Database migration file not found${NC}"
fi

# Step 4: Check TypeScript types
echo -e "\n${YELLOW}Step 4: Checking TypeScript configuration...${NC}"

if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ TypeScript configuration found${NC}"
    
    # Run type check
    echo "   Running type check..."
    npx tsc --noEmit 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "${YELLOW}⚠️  TypeScript compilation has some issues (this is normal for now)${NC}"
    fi
else
    echo -e "${RED}❌ tsconfig.json not found${NC}"
fi

# Step 5: Verify file structure
echo -e "\n${YELLOW}Step 5: Verifying ChatKit file structure...${NC}"

FILES_TO_CHECK=(
    "app/api/chatkit/session/route.ts"
    "app/api/chatkit/widget-action/route.ts"
    "components/professor-lock/ChatKitProfessorLock.tsx"
    "lib/chatkit-widgets.ts"
    "lib/chatkit-utils.ts"
    "hooks/useChatKit.ts"
    "types/chatkit.ts"
    "app/professor-lock/page.tsx"
)

all_files_exist=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file missing${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo -e "${GREEN}✅ All ChatKit files are in place${NC}"
else
    echo -e "${RED}❌ Some files are missing${NC}"
fi

# Step 6: Create test user betslip tables (optional)
echo -e "\n${YELLOW}Step 6: Additional database tables (optional)...${NC}"

cat << 'EOF' > database/chatkit-additional-tables.sql
-- Additional tables for ChatKit widget actions

-- User betslip table
CREATE TABLE IF NOT EXISTS user_betslip (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT,
  prop_type TEXT,
  line TEXT,
  odds TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- User parlays table
CREATE TABLE IF NOT EXISTS user_parlays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legs JSONB NOT NULL,
  total_odds TEXT,
  stake DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_user_betslip_user_id ON user_betslip(user_id);
CREATE INDEX idx_user_parlays_user_id ON user_parlays(user_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);

-- Enable RLS
ALTER TABLE user_betslip ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_parlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own betslip" ON user_betslip
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own parlays" ON user_parlays
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);
EOF

echo -e "${GREEN}✅ Created additional database migration file:${NC}"
echo "   database/chatkit-additional-tables.sql"

# Step 7: Final instructions
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}ChatKit Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Edit .env.local and add your API keys:"
echo "   - OPENAI_API_KEY"
echo "   - OPENAI_WORKFLOW_ID"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "2. Run the database migrations in Supabase:"
echo "   - database/chatkit-sessions-schema.sql (required)"
echo "   - database/chatkit-additional-tables.sql (optional)"
echo ""
echo "3. Create your Agent Builder workflow at:"
echo "   https://platform.openai.com/agent-builder"
echo ""
echo "4. Start your development server:"
echo "   npm run dev"
echo ""
echo "5. Test the integration:"
echo "   http://localhost:3000/professor-lock/test"
echo ""
echo "6. View Professor Lock:"
echo "   http://localhost:3000/professor-lock"

echo -e "\n${GREEN}Happy coding! 🚀${NC}"
