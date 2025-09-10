# 🎯 **FACEBOOK PIXEL SETUP GUIDE FOR PARLEYAPP**

## 📋 **OVERVIEW**
This guide will help you set up Facebook Pixel tracking for your ParleyApp web application to optimize your Meta ads campaign.

---

## 🚀 **PART 1: META BUSINESS MANAGER SETUP** (You Do This)

### **Step 1: Create Facebook Pixel**
1. **Go to Meta Business Manager**: https://business.facebook.com
2. **Login** with your Facebook account
3. **Navigate to Events Manager**:
   - Click "All Tools" (hamburger menu)
   - Under "Measure & Report" → Click "Events Manager"
4. **Create New Pixel**:
   - Click "Connect Data Sources" 
   - Choose "Web"
   - Select "Facebook Pixel"
   - Click "Connect"

### **Step 2: Configure Your Pixel**
1. **Name Your Pixel**: `Predictive Play Website Pixel`
2. **Enter Website URL**: `https://www.predictive-play.com`
3. **Choose Setup Method**: Select "Manually install the code yourself"
4. **Copy Your Pixel ID**: You'll see a number like `1234567890123456` - COPY THIS!

### **Step 3: Configure Conversion Events** 
After creating the pixel, you need to set up custom conversion events:

1. **In Events Manager** → Click your pixel name
2. **Go to "Events" tab**
3. **Create Custom Conversions**:

   **Event 1: Account Signup**
   - Name: `Account Registration`
   - Rules: `Event equals CompleteRegistration`
   - Value: Leave blank
   - Category: `Other`

   **Event 2: App Store Download**
   - Name: `Mobile App Download Intent`  
   - Rules: `Event equals Lead` AND `content_name contains App Store`
   - Value: Leave blank
   - Category: `Other`

   **Event 3: Subscription Purchase** (if you have subscription tracking)
   - Name: `Subscription Purchase`
   - Rules: `Event equals Purchase`
   - Value: Use event value
   - Category: `Purchase`

---

## 🔧 **PART 2: WEBSITE CONFIGURATION** (Already Done)

✅ **Facebook Pixel Code**: Installed in your Next.js app
✅ **Event Tracking**: Added to key conversion points
✅ **Google Analytics**: Set up as additional tracking
✅ **Environment Variables**: Template created

### **What You Need to Do:**

1. **Add Your Pixel ID** to environment variables:
   ```bash
   cp .env.local.analytics .env.local
   ```
   
2. **Edit `.env.local`** and replace `your_pixel_id_here` with your actual Pixel ID:
   ```
   NEXT_PUBLIC_FACEBOOK_PIXEL_ID=1234567890123456
   ```

3. **Install Dependencies** (if needed):
   ```bash
   npm install
   ```

4. **Deploy Your Changes**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📊 **PART 3: FACEBOOK ADS CAMPAIGN SETUP** (You Do This)

### **Step 1: Create New Campaign**
1. **Go to Meta Ads Manager**: https://adsmanager.facebook.com
2. **Click "Create"** button
3. **Choose Campaign Objective**: 
   - Select "Conversions" (this is key!)
   - Name: `ParleyApp Web Conversions`

### **Step 2: Campaign Settings**
- **Performance Goal**: Maximize number of conversions
- **Event**: Select "Account Registration" (the custom event you created)
- **Budget**: Set your daily/lifetime budget
- **Schedule**: Set start date and time

### **Step 3: Ad Set Configuration**
- **Conversion Location**: Website
- **Pixel**: Select "Predictive Play Website Pixel"
- **Event**: Choose "Account Registration"
- **Budget**: $20/day (or your preferred amount)
- **Audience**: 
  - Location: United States
  - Age: 21-65
  - Interests: Sports betting, Fantasy sports, Sports analytics
  - Behaviors: Frequent sports app users

### **Step 4: Placement Settings**
- **Placements**: Automatic (recommended)
- Or manually select: Facebook Feed, Instagram Feed, Stories, Reels

### **Step 5: Create Your Ad**
- **Format**: Single image or video
- **Primary Text**: Focus on AI-powered predictions and winning
- **Headline**: "AI Sports Betting Predictions"
- **Description**: "Smart betting with 65%+ win rates"
- **Call to Action**: "Sign Up"
- **Website URL**: `https://www.predictive-play.com`

---

## 🎯 **PART 4: TRACKING EVENTS SETUP**

### **Events Already Configured:**

1. **🔥 PageView**: Automatically tracks every page visit
2. **📝 InitiateCheckout**: When user clicks "Sign Up" buttons  
3. **✅ CompleteRegistration**: When user successfully creates account
4. **📱 Lead**: App Store download clicks and CTA interactions
5. **💰 Purchase**: Subscription completions (when implemented)

### **Custom Parameters Tracked:**
- **content_name**: Describes the specific action
- **content_category**: Groups related events
- **value**: Dollar amounts for purchases
- **user_id**: For advanced tracking

---

## 🧪 **PART 5: TESTING & VERIFICATION**

### **Step 1: Test Facebook Pixel**
1. **Install Facebook Pixel Helper**: Chrome extension
2. **Visit your website**: https://www.predictive-play.com
3. **Check Pixel Helper**: Should show green checkmark and "PageView" event
4. **Test Signup Flow**: 
   - Click "Get Started" → Should fire "InitiateCheckout"
   - Complete signup → Should fire "CompleteRegistration"

### **Step 2: Verify in Events Manager**
1. **Go to Events Manager** → Your Pixel
2. **Click "Test Events"** tab
3. **Visit your website** in another tab
4. **Check real-time events** appear in test events

### **Step 3: Check Data Flow**
- **Wait 20-30 minutes** for data to appear in Ads Manager
- **Go to Ads Manager** → Columns → Customize Columns
- **Add Event Columns**: Website Registrations, Cost per Registration
- **Verify events** are being attributed to your ads

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **No Pixel Data**: 
   - Check if Pixel ID is correct in `.env.local`
   - Verify website is deployed with new code
   - Check browser console for JavaScript errors

2. **Events Not Firing**:
   - Use Facebook Pixel Helper to debug
   - Check browser console for tracking logs
   - Verify buttons are actually calling tracking functions

3. **No Conversions in Ads Manager**:
   - Wait 24-48 hours for attribution
   - Check if ad creative includes your website URL
   - Verify pixel domain verification is complete

### **Debug Mode:**
Your tracking includes console logging. Open browser dev tools to see:
```
📊 Tracking FB Pixel Event: CompleteRegistration {user_id: "abc123"}
📈 Tracking GA Event: signup_complete {method: "email"}
```

---

## 📈 **OPTIMIZATION TIPS**

### **For Better Campaign Performance:**

1. **Create Lookalike Audiences**: Based on your pixel data after 100+ conversions
2. **Set Up Retargeting**: Target website visitors who didn't convert  
3. **A/B Test Ad Creative**: Different images, copy, and CTAs
4. **Use Value-Based Bidding**: When you have subscription revenue data
5. **Optimize for Higher-Value Events**: Switch from registrations to purchases

### **Advanced Tracking (Next Steps):**
- **Subscription Events**: Track paid conversions with actual revenue
- **Lifetime Value**: Track user retention and long-term value
- **Cross-Device Tracking**: Link mobile app and web conversions

---

## ✅ **CHECKLIST**

**Meta Business Manager:**
- [ ] Created Facebook Pixel 
- [ ] Copied Pixel ID
- [ ] Set up custom conversion events
- [ ] Verified pixel installation

**Website Configuration:**
- [ ] Added Pixel ID to `.env.local`
- [ ] Deployed website with tracking code
- [ ] Tested signup flow with Pixel Helper

**Facebook Ads Campaign:**
- [ ] Created conversion campaign
- [ ] Selected correct pixel and events
- [ ] Set appropriate audience and budget
- [ ] Launched ads with proper tracking

**Testing & Verification:**
- [ ] Pixel Helper shows events firing
- [ ] Events appear in Events Manager
- [ ] Conversions attributed in Ads Manager

---

## 🎉 **SUCCESS METRICS**

**Week 1-2**: Focus on pixel data collection and event optimization
**Week 3-4**: Optimize for cost per registration under $10
**Month 2+**: Scale successful ad sets and create lookalike audiences

**Target KPIs:**
- **Cost Per Registration**: $5-15
- **Registration Rate**: 2-5% of website visitors  
- **Return on Ad Spend**: 3:1 or better (when tracking subscriptions)

---

## 🆘 **NEED HELP?**

If you run into issues:
1. Check Facebook Pixel Helper chrome extension
2. Review Events Manager for real-time data
3. Use Meta's Pixel Troubleshooting tool
4. Contact Meta support if pixel isn't firing

**Remember**: Data may take 24-48 hours to fully populate in Ads Manager!
