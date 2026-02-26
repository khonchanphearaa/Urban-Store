import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import ChatHistory from "../models/ChatHistory.js";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

let discoveredModelsCache = null;
const modelCooldownUntil = new Map();

async function discoverGeminiModels() {
  if (!process.env.GEMINI_API_KEY) return [];
  if (Array.isArray(discoveredModelsCache)) return discoveredModelsCache;

  try {
    /* AI Agent googleapis */
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`ListModels failed with status ${response.status}`);
    }

    const payload = await response.json();
    const discovered = (payload.models || [])
      .filter((model) =>
        Array.isArray(model.supportedGenerationMethods) &&
        model.supportedGenerationMethods.includes("generateContent")
      )
      .map((model) => String(model.name || "").replace(/^models\//, ""))
      .filter((name) => /^gemini/i.test(name));

    discoveredModelsCache = [...new Set(discovered)];
    return discoveredModelsCache;
  } catch (error) {
    console.error("Gemini model discovery failed:", error?.message || error);
    discoveredModelsCache = [];
    return discoveredModelsCache;
  }
}

function getModelCandidates() {
  const envModel = normalizeText(process.env.GEMINI_MODEL || "");
  const defaults = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
  ];

  return envModel ? [envModel, ...defaults.filter((model) => model !== envModel)] : defaults;
}

async function getRuntimeModelCandidates() {
  const fromConfig = getModelCandidates();
  const discovered = await discoverGeminiModels();

  return [...new Set([...discovered, ...fromConfig])];
}

function getErrorMessage(error) {
  return String(error?.message || error || "");
}

function isQuotaExceededError(error) {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("429") || message.includes("quota exceeded") || message.includes("too many requests");
}

function parseRetryDelayMs(error) {
  const message = getErrorMessage(error);
  const secondsMatch = message.match(/retry in\s+([\d.]+)s/i) || message.match(/"retryDelay":"(\d+)s"/i);
  if (!secondsMatch) return null;

  const seconds = Number(secondsMatch[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.ceil(seconds * 1000);
}

function isModelOnCooldown(modelName) {
  const cooldownUntil = modelCooldownUntil.get(modelName);
  if (!cooldownUntil) return false;
  if (Date.now() >= cooldownUntil) {
    modelCooldownUntil.delete(modelName);
    return false;
  }
  return true;
}

function setModelCooldown(modelName, retryDelayMs = 60_000) {
  modelCooldownUntil.set(modelName, Date.now() + retryDelayMs);
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function detectSuggestionIntent(message) {
  return /(recommend|suggest|suggestion|buy|best|top|looking for|find me|need|find)/i.test(message);
}

function detectGreetingIntent(message) {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|yo)\b/i.test(message);
}

function detectThanksIntent(message) {
  return /\b(thank you|thanks|thx|appreciate it)\b/i.test(message);
}

function detectIdentityIntent(message) {
  return /\b(who are you|what are you|your name|about you)\b/i.test(message);
}

function detectDeveloperIntent(message) {
  return /\b(developer|who made you|who built you|creator|owner|author)\b/i.test(message);
}

function buildGeneralFallbackReply(message) {
  if (detectDeveloperIntent(message)) {
    return "The developer is khonchanphearaa.";
  }

  if (detectIdentityIntent(message)) {
    return "I am your AI assistant in this app. I can answer general questions and also help with product recommendations, prices, and details.";
  }

  if (detectGreetingIntent(message)) {
    return "Hi! I am your AI assistant. You can ask general questions or shopping questions.";
  }

  if (detectThanksIntent(message)) {
    return "You are welcome! Ask me anything, and I can also help with product suggestions if needed.";
  }

  return "I can answer general questions and help with shopping too. Ask any question, or ask for product recommendations when you need them.";
}

function extractProductQuery(message) {
  const query = normalizeText(
    message
      .replace(/(tell me about|what is|price of|info on|detail(?:s)? about|about)/gi, "")
      .replace(/[?!.]+$/g, "")
  );

  if (!query || query.length < 2) return null;
  return query;
}

function formatTopSuggestions(products) {
  if (!products?.length) {
    return "I couldn't find available products right now. Please try again in a moment.";
  }

  return [
    "Here are 3 products you may like:",
    ...products.slice(0, 3).map((p, index) => `${index + 1}. ${p.name} - $${p.price} (${p.category || "General"})`),
  ].join("\n");
}

/* Suggest products based on user behavior */
async function suggestProducts(userId) {
  const [orders, cart] = await Promise.all([
    Order.find({ user: userId })
      .populate({
        path: "items.product",
        select: "name category price",
        populate: { path: "category", select: "name" },
      })
      .sort({ createdAt: -1 })
      .limit(10),
    Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "name category price",
      populate: { path: "category", select: "name" },
    }),
  ]);

  const purchased = orders.flatMap(o =>
    o.items.map(i => i.product?.name).filter(Boolean)
  );
  const inCart = cart?.items.map(i => i.product?.name) || [];

  const purchasedCategories = orders.flatMap((order) =>
    order.items
      .map((item) => item.product?.category?.name)
      .filter(Boolean)
      .map((cat) => String(cat))
  );

  const cartCategories =
    cart?.items
      .map((item) => item.product?.category?.name)
      .filter(Boolean)
      .map((cat) => String(cat)) || [];

  const suggestions = await Product.find({
    name: { $nin: purchased },
    stock: { $gt: 0 },
  })
    .populate("category", "name")
    .select("name price description category images")
    .limit(30);

  const affinityCategories = [...purchasedCategories, ...cartCategories];
  const rankedProducts = suggestions
    .map((product) => {
      const categoryName = product.category?.name || "";
      const affinityScore = affinityCategories.filter(
        (category) => category.toLowerCase() === categoryName.toLowerCase()
      ).length;

      return {
        id: product._id,
        name: product.name,
        price: product.price,
        category: categoryName,
        description: product.description?.slice(0, 100),
        score: affinityScore,
      };
    })
    .sort((a, b) => b.score - a.score || a.price - b.price);

  return {
    purchaseHistory: purchased,
    currentCart: inCart,
    availableProducts: rankedProducts,
    topSuggestions: rankedProducts.slice(0, 3),
  };
}

/* Answer questions about a specific product */
async function getProductInfo(productName) {
  const cleanName = normalizeText(productName);
  if (!cleanName) return null;

  const product = await Product.findOne({
    name: { $regex: cleanName, $options: "i" },
    stock: { $gt: 0 },
  }).populate("category", "name");

  if (!product) return null;

  return {
    id: product._id,
    name: product.name,
    price: product.price,
    description: product.description,
    category: product.category?.name,
    stock: product.stock,
    images: product.images,
  };
}

/* LOAD chat history from MongoDB */
async function loadHistory(userId) {
  const record = await ChatHistory.findOne({ user: userId });
  if (!record) return [];

  return record.messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
}

/* SAVE new messages to MongoDB */
async function saveMessages(userId, userText, modelText) {
  const cleanUserText = normalizeText(userText);
  const cleanModelText = normalizeText(modelText);
  if (!cleanUserText || !cleanModelText) return;

  await ChatHistory.findOneAndUpdate(
    { user: userId },
    {
      $push: {
        messages: {
          $each: [
            { role: "user", text: cleanUserText },
            { role: "model", text: cleanModelText },
          ],
        },
      },
    },
    { upsert: true, new: true }
  );
}

/* MAIN AGENT FUNCTION */
export async function runAgent(userId, userMessage) {
  const cleanMessage = normalizeText(userMessage);
  if (!cleanMessage) {
    throw new Error("Message is required");
  }

  const isSuggestionRequest = detectSuggestionIntent(cleanMessage);
  const productKeywords = cleanMessage.match(/about|detail|details|info on|price of|product/i);
  const needsShoppingContext = isSuggestionRequest || Boolean(productKeywords);

  const history = await loadHistory(userId);

  let suggestionData = {
    purchaseHistory: [],
    currentCart: [],
    availableProducts: [],
    topSuggestions: [],
  };

  let productInfo = null;

  if (needsShoppingContext) {
    suggestionData = await suggestProducts(userId);

    if (productKeywords) {
      const cleanQuery = extractProductQuery(cleanMessage);
      productInfo = await getProductInfo(cleanQuery);
    }
  }

  if (!genAI) {
    if (productInfo) {
      return `${productInfo.name} costs $${productInfo.price}. Category: ${productInfo.category || "General"}. ${productInfo.description || "No description available."}`;
    }

    const fallbackReply = isSuggestionRequest
      ? formatTopSuggestions(suggestionData.topSuggestions)
      : buildGeneralFallbackReply(cleanMessage);

    await saveMessages(userId, cleanMessage, fallbackReply);
    return fallbackReply;
  }

  const systemContext = needsShoppingContext
    ? `
You are a smart and friendly AI assistant inside an e-commerce app.
You can answer general questions, and you should be especially helpful for shopping and product-related requests.

USER BEHAVIOR DATA:
- Purchase history: ${suggestionData.purchaseHistory.join(", ") || "No purchases yet"}
- Current cart: ${suggestionData.currentCart.join(", ") || "Empty cart"}

AVAILABLE PRODUCTS IN STORE:
${suggestionData.availableProducts
      .map(p => `• ${p.name} | $${p.price} | Category: ${p.category || "General"} | ${p.description || "No description"}`)
      .join("\n")}

TOP 3 RECOMMENDED PRODUCTS BASED ON USER HISTORY:
${suggestionData.topSuggestions
      .map(p => `• ${p.name} | $${p.price} | Category: ${p.category || "General"}`)
      .join("\n") || "No preference data yet"}

${productInfo ? `SPECIFIC PRODUCT DETAILS:\n${JSON.stringify(productInfo, null, 2)}` : ""}

RULES:
- For shopping requests, only recommend products that exist in the list above
- Be concise, friendly, and helpful
- If user asks for suggestions, pick top 3 most relevant based on their history
- If user asks about a product, prefer the product details provided in this context
- Always mention the price
- If user asks who developed/built/created you, answer exactly: "The developer is khonchanphearaa."
- Respond in the same language the user writes in
  `
    : `
You are a smart and friendly AI assistant inside an e-commerce app.
You can answer general questions clearly and naturally.

RULES:
- Be concise, friendly, and accurate
- If user asks who developed/built/created you, answer exactly: "The developer is khonchanphearaa."
- Respond in the same language the user writes in
  `;

  let agentReply = "";

  try {
    const modelCandidates = (await getRuntimeModelCandidates()).filter((modelName) => !isModelOnCooldown(modelName));
    let lastError = null;
    let hasQuotaExceeded = false;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemContext,
        });

        const chat = model.startChat({
          history: history.slice(-20),
        });

        const result = await chat.sendMessage(cleanMessage);
        agentReply = result.response.text();
        break;
      } catch (error) {
        lastError = error;
        if (isQuotaExceededError(error)) {
          hasQuotaExceeded = true;
          const retryDelayMs = parseRetryDelayMs(error) || 60_000;
          setModelCooldown(modelName, retryDelayMs);
        }
        console.error(`Gemini model failed (${modelName}):`, error?.message || error);
      }
    }

    if (!agentReply && modelCandidates.length === 0) {
      throw new Error("All Gemini models are temporarily on cooldown due to quota limits");
    }

    if (!agentReply) {
      const defaultError = hasQuotaExceeded
        ? new Error("Gemini quota exceeded. Please retry later or upgrade API quota.")
        : new Error("All Gemini models failed");
      throw lastError || defaultError;
    }
  } catch (error) {
    console.error("Gemini chat error:", error?.message || error);

    if (productInfo) {
      agentReply = `${productInfo.name} costs $${productInfo.price}. Category: ${productInfo.category || "General"}. ${productInfo.description || "No description available."}`;
    } else if (isSuggestionRequest) {
      agentReply = formatTopSuggestions(suggestionData.topSuggestions);
    } else if (isQuotaExceededError(error)) {
      agentReply = "The AI service is temporarily rate-limited (quota exceeded). Please try again shortly.";
    } else {
      agentReply = buildGeneralFallbackReply(cleanMessage);
    }
  }

  await saveMessages(userId, cleanMessage, agentReply);

  return agentReply;
}