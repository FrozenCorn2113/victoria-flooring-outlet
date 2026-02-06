// lib/chat/openai.js
// OpenAI integration for AI chat responses

import OpenAI from 'openai';
import products from '../../products';

// Initialize OpenAI client
let openaiClient = null;

export function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are Ty's AI assistant for Victoria Flooring Outlet, a local flooring store in Victoria, BC, Canada. You help customers with questions about flooring products, pricing, installation, and general inquiries.

## About Victoria Flooring Outlet
- Located in Victoria, British Columbia, Canada
- Owner: Ty (local flooring expert)
- Phone: 778-871-7681
- Email: hello@victoriaflooringoutlet.ca
- Hours: Monday to Friday, 9-5
- Website: victoriaflooringoutlet.ca
- Business model: Weekly rotating flooring deals (limited quantity, first come first served)
- Inventory: In-stock flooring only (no special orders)
- Who it’s for: Homeowners and contractors
- Specializes in: Luxury Vinyl Plank (LVP), hardwood, laminate, and flooring accessories
- Offers: Product sales, expert advice, and installer referrals
- Pickup: Free local pickup in Victoria (details confirmed after purchase)
- Delivery: Local delivery may be available for an added fee (quote required)
- Installation: Not provided directly (installer referrals available)
- Pricing: Discounted vs retail; varies weekly
- Returns: All sales are final due to discounted pricing; returns only for manufacturer defects; unopened packaging; report promptly
- Warranty: Manufacturer warranty only; terms vary by product; installation-related issues not covered
- Samples: Availability varies by product; not guaranteed for all weekly deals; ask before purchase if samples are important
- Payment: Secure online checkout; credit/debit cards accepted; no in-house financing
- No showroom (pickup arranged after purchase)

## Your Role
- Be friendly, helpful, and knowledgeable about flooring
- Answer questions about products, pricing, installation, and delivery
- Be clear and straightforward with no sales pressure
- Emphasize limited availability and weekly rotation when relevant
- If you don't know something specific, say so honestly and offer to have Ty follow up
- Keep responses concise and conversational (2-4 sentences when possible)
- Use Canadian English spelling (colour, metre, etc.)
- Prices are in Canadian dollars (CAD)

## Important Guidelines
1. For complex quotes, contractor pricing, delivery quotes, installer referrals, or specific project estimates, recommend talking to Ty directly
2. If the customer seems frustrated or asks to speak to a person, acknowledge this and let them know Ty can help
3. Don't make up information about products or services you're not sure about
4. Be helpful with general flooring questions (installation tips, maintenance, comparisons)
5. If asked about competitors, stay professional and focus on Victoria Flooring Outlet's strengths
6. If something depends on the specific product or weekly deal, say so and offer to connect them with Ty

## Flagging for Human Attention
Add "[NEEDS_HUMAN]" at the END of your response if:
- Customer explicitly asks to speak to a person/Ty
- Customer expresses frustration or dissatisfaction
- Question requires a custom quote or site visit
- You're unable to help with their specific request
- The question is about complaints, returns, or issues with orders

## Current Products (use this for accurate pricing):
${products.map(p => `- ${p.name}: $${p.pricePerSqFt ? p.pricePerSqFt + '/sq ft' : (p.price / 100).toFixed(2)}${p.compareAtPricePerSqFt ? ` (regular $${p.compareAtPricePerSqFt}/sq ft)` : ''}${p.isWeeklyDeal ? ' [WEEKLY DEAL]' : ''}`).join('\n')}

## Sample Responses
Q: "What are your hours?"
A: "We're open Monday to Friday, 9-5. Feel free to text or call Ty at 778-871-7681 if you'd like to confirm before stopping by."

Q: "How much is your LVP?"
A: "Our Harbinger Contract Series LVP is currently on sale for $2.69/sq ft (regular $3.49/sq ft). It's a great waterproof option perfect for kitchens, basements, and high-traffic areas. Would you like more details about this flooring?"

Q: "I need 500 sq ft of flooring for my basement"
A: "For 500 sq ft, our Harbinger Contract Series LVP would be about $1,345 at the current sale price. It's 100% waterproof which is ideal for basements. Want me to tell you more about this product, or would you like to discuss your project with Ty?"`;

/**
 * Build context from current page and cart
 */
export function buildContext({ pageUrl, productViewed, cartContents }) {
  let context = '';

  if (pageUrl) {
    context += `\nCustomer is currently viewing: ${pageUrl}`;
  }

  if (productViewed) {
    const product = products.find(p => p.id === productViewed || p.slug === productViewed);
    if (product) {
      context += `\nCustomer is looking at: ${product.name}`;
      context += `\nProduct details: ${product.description}`;
      context += `\nPrice: $${product.pricePerSqFt ? product.pricePerSqFt + '/sq ft' : (product.price / 100).toFixed(2)}`;
      if (product.isWeeklyDeal) {
        context += ' (Weekly Deal!)';
      }
    }
  }

  if (cartContents && Object.keys(cartContents).length > 0) {
    context += '\nCustomer has items in their cart:';
    Object.values(cartContents).forEach(item => {
      const itemUnit = item.pricePerSqFt
        ? 'sq ft'
        : (item.subType === 'Adhesive' ? 'gallons' : 'units');
      context += `\n- ${item.name}: ${item.quantity} ${itemUnit}`;
    });
  }

  return context;
}

/**
 * Analyze sentiment of customer message
 */
export function analyzeSentiment(message) {
  const lowerMessage = message.toLowerCase();

  // Check for negative indicators
  const negativeKeywords = [
    'frustrated', 'angry', 'upset', 'annoyed', 'disappointed',
    'terrible', 'awful', 'horrible', 'worst', 'hate',
    'problem', 'issue', 'complaint', 'wrong', 'broken',
    'refund', 'return', 'cancel', 'never', 'waste'
  ];

  // Check for human request indicators
  const humanRequestKeywords = [
    'speak to', 'talk to', 'real person', 'human', 'someone',
    'representative', 'manager', 'ty', 'call me', 'phone'
  ];

  // Check for urgent indicators
  const urgentKeywords = [
    'urgent', 'asap', 'emergency', 'immediately', 'today',
    'right now', 'deadline', 'rush'
  ];

  const isNegative = negativeKeywords.some(kw => lowerMessage.includes(kw));
  const wantsHuman = humanRequestKeywords.some(kw => lowerMessage.includes(kw));
  const isUrgent = urgentKeywords.some(kw => lowerMessage.includes(kw));

  if (wantsHuman) return { sentiment: 'needs_human', requiresHuman: true };
  if (isUrgent) return { sentiment: 'urgent', requiresHuman: true };
  if (isNegative) return { sentiment: 'negative', requiresHuman: true };

  return { sentiment: 'neutral', requiresHuman: false };
}

/**
 * Generate AI response
 */
export async function generateAIResponse({ messages, context = '' }) {
  const openai = getOpenAIClient();

  // Build conversation history for OpenAI
  const conversationHistory = messages.map(msg => ({
    role: msg.sender === 'customer' ? 'user' : 'assistant',
    content: msg.message
  }));

  // Add system prompt with context
  const systemMessage = context
    ? `${SYSTEM_PROMPT}\n\n## Current Context:${context}`
    : SYSTEM_PROMPT;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...conversationHistory
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiMessage = response.choices[0].message.content;

    // Check if AI flagged for human attention
    const needsHuman = aiMessage.includes('[NEEDS_HUMAN]');
    const cleanedMessage = aiMessage.replace('[NEEDS_HUMAN]', '').trim();

    // Calculate approximate confidence based on response characteristics
    const confidence = calculateConfidence(cleanedMessage, messages);

    return {
      message: cleanedMessage,
      needsHuman,
      confidence,
      tokensUsed: response.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error('OpenAI API error:', error);

    // Return fallback message
    return {
      message: "I'm having trouble connecting right now. Please text Ty directly at 778-871-7681 for immediate assistance!",
      needsHuman: true,
      confidence: 0,
      error: error.message
    };
  }
}

/**
 * Calculate confidence score for the response
 */
function calculateConfidence(response, messages) {
  let confidence = 0.8; // Start with reasonable confidence

  // Lower confidence for certain phrases
  const uncertainPhrases = [
    "i'm not sure", "i don't know", "you should ask ty",
    "contact ty", "speak to ty", "i can't", "unable to"
  ];

  const lowerResponse = response.toLowerCase();
  uncertainPhrases.forEach(phrase => {
    if (lowerResponse.includes(phrase)) {
      confidence -= 0.15;
    }
  });

  // Lower confidence for long conversations (might be going in circles)
  if (messages.length > 10) {
    confidence -= 0.1;
  }

  // Ensure confidence is between 0 and 1
  return Math.max(0.1, Math.min(1, confidence));
}

/**
 * Get suggested responses for common questions
 */
export function getSuggestedQuestions() {
  return [
    "What's this week's flooring deal?",
    "Do you offer local pickup or delivery?",
    "Are all sales final? What about defects?",
    "Do you have samples for this product?",
    "Can you recommend an installer?",
    "Do you offer contractor pricing?",
    "How much extra should I order for waste?",
    "What payment methods do you accept?",
    "What are your store hours?",
    "Is LVP good for basements?"
  ];
}
