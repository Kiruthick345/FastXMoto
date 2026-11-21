# FastXMoto - Used Bikes Buying, Selling & Workshop Management Portal

A modern, responsive, and full-featured web application built specifically for motorcycle dealerships, bike brokers, and garage traders to track buying, workshop refurbishment, and selling records with real-time profit analytics and secure admin access.

---

## 🔐 Admin Authentication Gate

The portal is protected by an admin security login screen:
- **Default Username**: `admin`
- **Standard Default Password**: `FastX@2026` *(also accepts `admin123`)*
- **Remember Me**: Persists login credentials across sessions on the device.
- **Change Password**: Change the admin password directly from the top header using the 🔑 icon (persists in LocalStorage).
- **Logout**: 1-click logout button clears the session and locks the portal.

---

## 🏍️ Modules Overview

The application features two dedicated modules easily switchable via the top navigation bar:

### 1. 🏍️ Inventory & Sales Module
- **Buying (Procurement)**:
  - Motorcycle specifications: Make, Model, Variant, Year, Registration Number (e.g. `MH 12 AB 4589`), Engine CC, Odometer (KM), Color, Condition, Chassis/VIN, and Engine Number.
  - Previous owner/seller records: Name, phone, city/address, ID proof, purchase date, and purchase price.
- **Selling & Profit Calculation**:
  - 1-Click "Mark as Sold" dialog with live profit and margin calculation as you type the selling price.
  - Buyer records: Customer name, phone, address, sale date, and payment mode (UPI, Bank Transfer, Cash, Loan).
  - Celebration feedback with confetti upon closing sales.
- **Financial Intelligence & Analytics**:
  - Active stock value, total revenue, realized net profit, and average margin `%`.
  - Visual Chart.js charts: Monthly Revenue vs Costs vs Profit, and Brand Distribution.
- **Official Bill of Sale / Delivery Challan**:
  - Instant print-ready Bill of Sale with FastXMoto dealership header, vehicle technical schedule, financial breakdown, legal transfer clauses, and signature blocks (`Ctrl + P` / Save as PDF).

### 2. 🔧 Workshop & Refurbish Hub (Separate Module)
- **Dedicated Garage Dashboard**:
  - **Active Workshop Jobs**: Track bikes currently undergoing repairs or awaiting parts.
  - **Total Workshop Investment**: Real-time sum of all parts, labor, and servicing costs.
  - **Completed / Showroom Ready**: Track restored bikes certified for showroom display.
- **Itemized Work & Spares Tracking**:
  - Log repairs under categories: *Mechanical & Engine, Tyres & Suspension, Brakes & Fluids, Electricals & Battery, Bodywork & Paint, Detailing & Wash, Spare Parts*.
  - Track vendor / garage name, mechanic notes, and invoice/bill reference numbers.
  - Automatically updates the vehicle's Total Cost Basis (`Purchase Price + Workshop Costs`).
- **Vehicle Status Transitions**:
  - 1-Click `Mark Showroom Ready` (transitions status to `In Stock`).
  - 1-Click `Move to Workshop` (transitions status to `Refurbishing`).
- **Printable Workshop Job Card**:
  - Generate an official Workshop Job Card & Service Order with vehicle schedule, itemized repair tasks, and mechanic/supervisor signature blocks.

---

## 🚀 Live on Vercel & Local Deployment

### 🌐 Live Production URL:
👉 **[https://fastxmoto.vercel.app](https://fastxmoto.vercel.app)**

### 💻 Run Locally:
```powershell
python -m http.server 8080
```
Open in browser: `http://localhost:8080`

---

## 📁 File Structure

- `index.html` - Dual-module interface (Inventory & Sales + Workshop Hub), Admin Login gate, and modals.
- `styles.css` - Custom automotive dark design, category badges, glassmorphic cards, shake animations, and print stylesheets.
- `app.js` - Complete application logic: Admin auth, module switching, workshop job tracking, Chart.js analytics, and data persistence.
- `bikes-data.js` - Data initializer (starts with clean 0 records, includes optional sample dataset).
- `package.json` & `vercel.json` - Deployment configurations.
