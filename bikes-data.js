// FastXMoto - Used Bikes Record System Data Initializer
// Default to empty array - starts with zero demo records
const INITIAL_BIKES = [];

// Optional demo sample dataset for testing
const SAMPLE_DEMO_BIKES = [
  {
    id: "BIKE-2026-001",
    brand: "Royal Enfield",
    model: "Classic 350",
    variant: "Signals Edition (Desert Sand)",
    year: 2022,
    regNumber: "MH 12 AB 4589",
    chassisNumber: "ME3U3S5C8NA104592",
    engineNumber: "U3S5C8NA104592",
    engineCC: 349,
    odometerKm: 14500,
    color: "Desert Sand",
    fuelType: "Petrol",
    condition: "Excellent",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
    purchaseDate: "2026-01-10",
    sellerName: "Vikram Malhotra",
    sellerPhone: "+91 98230 45678",
    sellerAddress: "Kothrud, Pune, Maharashtra",
    sellerIdProof: "Aadhaar: **** 8734",
    purchasePrice: 142000,
    refurbishments: [
      { id: "ref-1", description: "Engine Oil Service & Filter", cost: 1800, date: "2026-01-12" },
      { id: "ref-2", description: "Detailing & Ceramic Coating", cost: 2500, date: "2026-01-13" }
    ],
    status: "Sold",
    saleDate: "2026-02-05",
    buyerName: "Rahul Deshmukh",
    buyerPhone: "+91 97654 32109",
    buyerAddress: "Viman Nagar, Pune",
    buyerIdProof: "PAN: ABCPD9876E",
    sellingPrice: 172000,
    paymentMode: "UPI / Bank Transfer",
    saleNotes: "Includes 6-month engine warranty and transfer paperwork.",
    rcStatus: "Transferred",
    insuranceValidTill: "2026-09-15",
    pucValidTill: "2026-07-20",
    nocAvailable: true
  },
  {
    id: "BIKE-2026-002",
    brand: "Yamaha",
    model: "YZF-R15 V4",
    variant: "Racing Blue Edition",
    year: 2023,
    regNumber: "KA 03 EQ 7821",
    chassisNumber: "MD626CG45P8014521",
    engineNumber: "G45P8014521",
    engineCC: 155,
    odometerKm: 9200,
    color: "Racing Blue",
    fuelType: "Petrol",
    condition: "Like New",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
    purchaseDate: "2026-01-18",
    sellerName: "Karthik Raja",
    sellerPhone: "+91 94481 23456",
    sellerAddress: "Indiranagar, Bengaluru, Karnataka",
    sellerIdProof: "DL: KA032019001234",
    purchasePrice: 128000,
    refurbishments: [
      { id: "ref-3", description: "Front Fork Fluid & Polishing", cost: 1500, date: "2026-01-20" }
    ],
    status: "In Stock",
    saleDate: "",
    buyerName: "",
    buyerPhone: "",
    buyerAddress: "",
    buyerIdProof: "",
    sellingPrice: 155000,
    paymentMode: "",
    saleNotes: "Full service history provided.",
    rcStatus: "Original Available",
    insuranceValidTill: "2026-11-30",
    pucValidTill: "2026-08-10",
    nocAvailable: true
  }
];
