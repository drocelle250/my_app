const { sequelize } = require("../config/db");
const Product      = require("../models/Product");
const StockHistory = require("../models/StockHistory");
const Category     = require("../models/Category");
const { Op } = require("sequelize");

// ─── Helper: Calculate moving average ────────────────────────────────────────
function movingAverage(values, window) {
  if (values.length < window) return values.reduce((s, v) => s + v, 0) / values.length;
  const recent = values.slice(-window);
  return recent.reduce((s, v) => s + v, 0) / window;
}

// ─── Helper: Detect trend (accelerating/stable/decelerating) ─────────────────
function detectTrend(values) {
  if (values.length < 3) return "stable";
  const recent = values.slice(-7); // last 7 data points
  if (recent.length < 3) return "stable";
  
  const first  = recent.slice(0, Math.ceil(recent.length / 2));
  const second = recent.slice(Math.ceil(recent.length / 2));
  
  const avgFirst  = first.reduce((s, v) => s + v, 0) / first.length;
  const avgSecond = second.reduce((s, v) => s + v, 0) / second.length;
  
  const change = ((avgSecond - avgFirst) / (avgFirst || 1)) * 100;
  
  if (change > 20) return "accelerating";
  if (change < -20) return "decelerating";
  return "stable";
}

// ─── Helper: Calculate confidence score ──────────────────────────────────────
function calculateConfidence(dataPoints, variance) {
  // More data points = higher confidence
  // Lower variance = higher confidence
  let score = Math.min(dataPoints / 30, 1) * 50; // max 50 from data points
  
  // Variance penalty (0-50 points)
  if (variance < 0.2) score += 50;
  else if (variance < 0.5) score += 30;
  else if (variance < 1) score += 10;
  
  return Math.round(Math.min(score, 100));
}

// ─── Helper: Detect day-of-week pattern ──────────────────────────────────────
function detectDayPattern(salesByDay) {
  // salesByDay: { 0: [sales on sundays], 1: [sales on mondays], ... }
  const avgByDay = {};
  let maxDay = null;
  let maxAvg = 0;
  
  for (let day = 0; day < 7; day++) {
    const sales = salesByDay[day] || [];
    if (sales.length === 0) continue;
    const avg = sales.reduce((s, v) => s + v, 0) / sales.length;
    avgByDay[day] = avg;
    if (avg > maxAvg) {
      maxAvg = avg;
      maxDay = day;
    }
  }
  
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return maxDay !== null ? dayNames[maxDay] : null;
}

// ─── Main: GET /api/ai/predict-restock ───────────────────────────────────────
exports.predictRestock = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // Get all products
    const allProducts = await Product.findAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });

    // Get all sales history
    const allHistory = await StockHistory.findAll({
      where: {
        type: "sale",
        createdAt: { [Op.gte]: since },
      },
      order: [["createdAt", "ASC"]],
    });

    // ── Analyze each product ──────────────────────────────────────────────
    const predictions = [];

    for (const product of allProducts) {
      const sales = allHistory.filter((h) => h.productId === product.id);
      
      if (sales.length === 0) {
        // No sales data — skip or mark as "no data"
        predictions.push({
          productId:         product.id,
          productName:       product.name,
          sku:               product.sku,
          category:          product.category?.name || "—",
          currentStock:      product.quantity,
          prediction:        "No sales data available",
          confidence:        0,
          urgency:           "low",
          recommendedRestock: 0,
          reason:            "Insufficient data to predict",
          trend:             "unknown",
          peakDay:           null,
        });
        continue;
      }

      // Daily sales array
      const dailySales = [];
      const salesByDay = {}; // { 0: [sun sales], 1: [mon sales], ... }
      
      // Group by date
      const salesByDate = {};
      sales.forEach((s) => {
        const date = new Date(s.createdAt).toISOString().slice(0, 10);
        const day  = new Date(s.createdAt).getDay();
        const qty  = Math.abs(s.quantity);
        
        salesByDate[date] = (salesByDate[date] || 0) + qty;
        if (!salesByDay[day]) salesByDay[day] = [];
        salesByDay[day].push(qty);
      });
      
      Object.values(salesByDate).forEach((v) => dailySales.push(v));

      // ── Calculations ────────────────────────────────────────────────────
      const totalSold       = dailySales.reduce((s, v) => s + v, 0);
      const avgDailySales   = totalSold / Number(days);
      const ma7             = movingAverage(dailySales, 7);
      const ma30            = movingAverage(dailySales, 30);
      const trend           = detectTrend(dailySales);
      const peakDay         = detectDayPattern(salesByDay);

      // Variance (for confidence)
      const mean = avgDailySales;
      const variance = dailySales.length > 1
        ? dailySales.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / dailySales.length
        : 0;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;

      const confidence = calculateConfidence(sales.length, coefficientOfVariation);

      // ── Prediction logic ────────────────────────────────────────────────
      // Use MA7 if trending, else MA30
      let predictedDailySales = trend === "accelerating" ? ma7 : ma30;
      
      // Adjust for trend
      if (trend === "accelerating") predictedDailySales *= 1.2;
      if (trend === "decelerating") predictedDailySales *= 0.8;

      const daysUntilStockout = predictedDailySales > 0
        ? Math.floor(product.quantity / predictedDailySales)
        : null;

      // Recommended restock: 30-day supply
      const recommendedRestock = predictedDailySales > 0
        ? Math.max(0, Math.ceil(predictedDailySales * 30) - product.quantity)
        : 0;

      // ── Urgency ─────────────────────────────────────────────────────────
      let urgency = "low";
      let reason  = "";

      if (daysUntilStockout === null || daysUntilStockout > 30) {
        urgency = "low";
        reason  = "Stock sufficient for 30+ days";
      } else if (daysUntilStockout <= 3) {
        urgency = "critical";
        reason  = `Stock will run out in ${daysUntilStockout} day${daysUntilStockout !== 1 ? "s" : ""}! Immediate restock needed.`;
      } else if (daysUntilStockout <= 7) {
        urgency = "high";
        reason  = `Stock will run out in ${daysUntilStockout} days. Restock soon.`;
      } else if (daysUntilStockout <= 14) {
        urgency = "medium";
        reason  = `Stock will last ${daysUntilStockout} days. Plan restock.`;
      } else {
        urgency = "low";
        reason  = `Stock sufficient for ${daysUntilStockout} days.`;
      }

      // Add trend context
      if (trend === "accelerating") {
        reason += " ⚠️ Sales accelerating — demand increasing!";
      } else if (trend === "decelerating") {
        reason += " ℹ️ Sales slowing down.";
      }

      // Add peak day hint
      if (peakDay) {
        reason += ` Peak sales on ${peakDay}s.`;
      }

      predictions.push({
        productId:         product.id,
        productName:       product.name,
        sku:               product.sku,
        category:          product.category?.name || "—",
        currentStock:      product.quantity,
        avgDailySales:     Math.round(avgDailySales * 100) / 100,
        ma7:               Math.round(ma7 * 100) / 100,
        ma30:              Math.round(ma30 * 100) / 100,
        predictedDailySales: Math.round(predictedDailySales * 100) / 100,
        daysUntilStockout,
        recommendedRestock,
        urgency,
        confidence,
        trend,
        peakDay,
        reason,
        prediction:        reason,
      });
    }

    // ── Sort by urgency ───────────────────────────────────────────────────
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    predictions.sort((a, b) => {
      const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (diff !== 0) return diff;
      return (a.daysUntilStockout ?? 999) - (b.daysUntilStockout ?? 999);
    });

    // ── Summary stats ─────────────────────────────────────────────────────
    const summary = {
      totalProducts:     allProducts.length,
      criticalProducts:  predictions.filter((p) => p.urgency === "critical").length,
      highUrgency:       predictions.filter((p) => p.urgency === "high").length,
      mediumUrgency:     predictions.filter((p) => p.urgency === "medium").length,
      lowUrgency:        predictions.filter((p) => p.urgency === "low").length,
      avgConfidence:     Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length),
    };

    res.json({
      period: Number(days),
      summary,
      predictions,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat  — AI Chatbot for customers
// ─────────────────────────────────────────────────────────────────────────────

// Intent detection patterns
const INTENTS = {
  greeting:    /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup|what'?s up)/i,
  bye:         /^(bye|goodbye|see you|thanks?|thank you|ok thanks?|great thanks?)/i,
  help:        /(help|what can you do|how does this work|commands|options)/i,
  search:      /(find|search|show|looking for|want|need|get me|do you have|any\s+\w+)/i,
  cheap:       /(cheap|affordable|budget|low.?price|inexpensive|under \$?\d+|less than \$?\d+)/i,
  expensive:   /(expensive|premium|luxury|high.?end|best|top|most expensive)/i,
  category:    /(category|type|kind|sort of|what kind)/i,
  instock:     /(in stock|available|have in stock|not out of stock)/i,
  price:       /(price|cost|how much|pricing)/i,
  order:       /(order|buy|purchase|checkout|cart)/i,
  recommend:   /(recommend|suggest|best|popular|top selling|what should i)/i,
  all:         /(all products|everything|show all|list all|full catalog)/i,
};

// Extract price limit from message  e.g. "under $50" or "less than 100"
function extractPriceLimit(msg) {
  const m = msg.match(/(?:under|less than|below|max|maximum|cheaper than)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

// Extract price minimum  e.g. "over $100" or "more than 50"
function extractPriceMin(msg) {
  const m = msg.match(/(?:over|more than|above|min|minimum|at least)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

// Extract keywords that might be product names or categories
function extractKeywords(msg) {
  // Remove common stop words and intent words
  const stopWords = new Set([
    "i","want","need","find","show","me","the","a","an","some","any","do","you","have",
    "looking","for","get","please","can","could","would","like","cheap","affordable",
    "expensive","premium","best","good","great","nice","buy","order","purchase","in",
    "stock","available","under","over","less","more","than","about","around","price",
    "cost","how","much","what","is","are","there","products","items","things","stuff",
    "something","anything","everything","all","list","show","give","tell","help","hi",
    "hello","hey","thanks","thank","bye","goodbye","ok","okay","sure","yes","no",
  ]);
  return msg
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

// Score a product against keywords (name, description, category)
function scoreProduct(product, keywords) {
  if (keywords.length === 0) return 0;
  const haystack = [
    product.name,
    product.description || "",
    product.category?.name || "",
    product.sku || "",
  ].join(" ").toLowerCase();

  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) score += kw.length; // longer match = higher score
  }
  return score;
}

// Format a product for chat display
function formatProduct(p) {
  const inStock = p.quantity > 0;
  const stockLabel = !inStock
    ? "❌ Out of stock"
    : p.quantity <= (p.lowStockThreshold || 5)
    ? `⚡ Only ${p.quantity} left`
    : `✅ In stock (${p.quantity})`;

  return {
    id:          p.id,
    name:        p.name,
    price:       parseFloat(p.price),
    category:    p.category?.name || "—",
    description: p.description || "",
    stockLabel,
    inStock,
    imageUrl:    p.imageUrl || null,
  };
}

exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const msg = message.trim();

    // ── Load all products once ──────────────────────────────────────────────
    const allProducts = await Product.findAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      where: { quantity: { [Op.gt]: 0 } }, // only in-stock by default
    });
    const allProductsAll = await Product.findAll({
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    });
    const categories = await Category.findAll();

    // ── Detect intent ───────────────────────────────────────────────────────
    const isGreeting  = INTENTS.greeting.test(msg);
    const isBye       = INTENTS.bye.test(msg);
    const isHelp      = INTENTS.help.test(msg);
    const isCheap     = INTENTS.cheap.test(msg);
    const isExpensive = INTENTS.expensive.test(msg);
    const isInStock   = INTENTS.instock.test(msg);
    const isOrder     = INTENTS.order.test(msg);
    const isRecommend = INTENTS.recommend.test(msg);
    const isAll       = INTENTS.all.test(msg);

    const priceMax = extractPriceLimit(msg);
    const priceMin = extractPriceMin(msg);
    const keywords = extractKeywords(msg);

    // ── GREETING ────────────────────────────────────────────────────────────
    if (isGreeting) {
      return res.json({
        type: "text",
        text: `👋 Hello! I'm your shopping assistant. I can help you:\n\n• 🔍 **Find products** — "show me shoes"\n• 💰 **Filter by price** — "cheap phones under $50"\n• 📦 **Check availability** — "what's in stock?"\n• 🏆 **Get recommendations** — "what's popular?"\n\nWhat are you looking for today?`,
        products: [],
      });
    }

    // ── BYE ─────────────────────────────────────────────────────────────────
    if (isBye) {
      return res.json({
        type: "text",
        text: "👋 Goodbye! Happy shopping! Come back anytime. 😊",
        products: [],
      });
    }

    // ── HELP ────────────────────────────────────────────────────────────────
    if (isHelp) {
      const catList = categories.map((c) => `• ${c.name}`).join("\n");
      return res.json({
        type: "text",
        text: `🤖 **Here's what I can do:**\n\n🔍 **Search:** "find laptops", "show me shoes"\n💰 **Price filter:** "cheap items under $30", "premium products"\n📦 **Stock check:** "what's available?"\n🏆 **Recommendations:** "what's popular?"\n📂 **By category:** "show electronics"\n\n**Available categories:**\n${catList}\n\nJust type naturally and I'll find what you need!`,
        products: [],
      });
    }

    // ── ORDER / CART ─────────────────────────────────────────────────────────
    if (isOrder) {
      return res.json({
        type: "text",
        text: "🛒 To place an order:\n1. Browse products in the store\n2. Click **Add to Cart** on any product\n3. Click the 🛒 **Cart** button to review\n4. Click **Place Order** to confirm\n\nWould you like me to show you some products?",
        products: [],
      });
    }

    // ── ALL PRODUCTS ─────────────────────────────────────────────────────────
    if (isAll) {
      const products = allProducts.slice(0, 8).map(formatProduct);
      return res.json({
        type: "products",
        text: `📦 Here are all our available products (showing ${products.length} of ${allProducts.length}):`,
        products,
        total: allProducts.length,
      });
    }

    // ── RECOMMENDATIONS ──────────────────────────────────────────────────────
    if (isRecommend) {
      // Get top selling products from stock history
      const salesHistory = await require("../models/StockHistory").findAll({
        where: {
          type: "sale",
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      });

      const salesMap = {};
      salesHistory.forEach((h) => {
        salesMap[h.productId] = (salesMap[h.productId] || 0) + Math.abs(h.quantity);
      });

      const topIds = Object.entries(salesMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => parseInt(id));

      let topProducts = topIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter(Boolean)
        .map(formatProduct);

      // Fallback: just return first 5 if no sales data
      if (topProducts.length === 0) {
        topProducts = allProducts.slice(0, 5).map(formatProduct);
      }

      return res.json({
        type: "products",
        text: `🏆 Here are our **most popular products** this month:`,
        products: topProducts,
      });
    }

    // ── CHEAP / BUDGET ───────────────────────────────────────────────────────
    if (isCheap && !keywords.length && !priceMax) {
      const sorted = [...allProducts]
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        .slice(0, 6)
        .map(formatProduct);
      return res.json({
        type: "products",
        text: `💰 Here are our **most affordable products**:`,
        products: sorted,
      });
    }

    // ── EXPENSIVE / PREMIUM ──────────────────────────────────────────────────
    if (isExpensive && !keywords.length) {
      const sorted = [...allProducts]
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        .slice(0, 6)
        .map(formatProduct);
      return res.json({
        type: "products",
        text: `💎 Here are our **premium products**:`,
        products: sorted,
      });
    }

    // ── KEYWORD + PRICE FILTER SEARCH ────────────────────────────────────────
    let pool = isInStock ? allProducts : allProductsAll;

    // Apply price filters
    if (priceMax !== null) pool = pool.filter((p) => parseFloat(p.price) <= priceMax);
    if (priceMin !== null) pool = pool.filter((p) => parseFloat(p.price) >= priceMin);
    if (isCheap && priceMax === null) pool = pool.filter((p) => parseFloat(p.price) <= 50);
    if (isExpensive && priceMin === null) pool = pool.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

    // Score and rank by keyword relevance
    let results = pool
      .map((p) => ({ product: p, score: scoreProduct(p, keywords) }))
      .filter((r) => r.score > 0 || keywords.length === 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => formatProduct(r.product));

    // If no keyword matches but we have price filters, return price-filtered results
    if (results.length === 0 && (priceMax !== null || priceMin !== null || isCheap)) {
      results = pool.slice(0, 6).map(formatProduct);
    }

    if (results.length > 0) {
      let intro = "";
      if (keywords.length > 0) {
        intro = `🔍 Found **${results.length} product${results.length !== 1 ? "s" : ""}** matching "${keywords.join(", ")}"`;
      } else {
        intro = `📦 Here are **${results.length} products** for you`;
      }
      if (priceMax !== null) intro += ` under $${priceMax}`;
      if (priceMin !== null) intro += ` over $${priceMin}`;
      intro += ":";

      return res.json({ type: "products", text: intro, products: results });
    }

    // ── FALLBACK: no results ─────────────────────────────────────────────────
    const catList = categories.map((c) => c.name).join(", ");
    return res.json({
      type: "text",
      text: `😕 I couldn't find products matching **"${msg}"**.\n\nTry searching for:\n${catList}\n\nOr ask me to "show all products" or "recommend something"!`,
      products: [],
    });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: err.message });
  }
};
