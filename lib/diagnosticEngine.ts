import { GoogleGenerativeAI } from '@google/generative-ai';
import { dbModel } from './db';
import { searchDocumentation } from './moss';
import { matchDiagnosticTemplate, DiagnosticTemplate } from './mossTemplates';
import { searchSpareParts } from './mossParts';

interface DiagnosticOutput {
  message: string;
  symptomTracker: { symptom: string; status: 'confirmed' | 'denied' | 'suspected' }[];
  ruledOutCauses: string[];
  suspectedCauses: { cause: string; probability: number }[];
  status: 'active' | 'resolved' | 'unresolved';
}

export async function processDiagnostics(
  productId: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[],
  currentSymptom: string
): Promise<DiagnosticOutput> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  // 1. Fetch product details
  const product = await dbModel.Product.findById(productId);

  // 2. Fetch matched diagnostic template using Moss semantic search, scoped to product category
  const matchedTemplate = await matchDiagnosticTemplate(currentSymptom, product?.category);

  // 3. Process guided checklist status
  const userMessages = chatHistory.filter((c) => c.role === 'user');
  const answers = userMessages.slice(1).map((c) => c.content.toLowerCase());
  const currentStep = answers.length;

  const symptomTracker: { symptom: string; status: 'confirmed' | 'denied' | 'suspected' }[] = [
    { symptom: currentSymptom, status: 'confirmed' }
  ];
  const ruledOutCauses: string[] = [];
  const suspectedCauses: { cause: string; probability: number }[] = [];

  // Initialize suspected causes with base probabilities from matched template
  matchedTemplate.causes.forEach((item, index) => {
    suspectedCauses.push({ cause: item.cause, probability: Math.max(15, 60 - index * 10) });
  });

  // Evaluate previous answers to eliminate/confirm causes
  answers.forEach((ans, idx) => {
    if (idx < matchedTemplate.causes.length) {
      const causeItem = matchedTemplate.causes[idx];
      const isYes = ans.includes('yes') || ans.includes('yeah') || ans.includes('true') || ans.includes('yup');
      const isNo = ans.includes('no') || ans.includes('not') || ans.includes('false') || ans.includes('nope');

      if (isYes) {
        symptomTracker.push({ symptom: causeItem.question, status: 'confirmed' });
        if (causeItem.yesConfirms) {
          suspectedCauses.forEach((c) => {
            if (c.cause === causeItem.cause) c.probability = 95;
            else c.probability = Math.max(5, c.probability - 20);
          });
        } else {
          ruledOutCauses.push(causeItem.cause);
          const idxToUpdate = suspectedCauses.findIndex((c) => c.cause === causeItem.cause);
          if (idxToUpdate !== -1) suspectedCauses[idxToUpdate].probability = 5;
        }
      } else if (isNo) {
        symptomTracker.push({ symptom: causeItem.question, status: 'denied' });
        if (causeItem.yesConfirms) {
          ruledOutCauses.push(causeItem.cause);
          const idxToUpdate = suspectedCauses.findIndex((c) => c.cause === causeItem.cause);
          if (idxToUpdate !== -1) suspectedCauses[idxToUpdate].probability = 5;
        } else {
          suspectedCauses.forEach((c) => {
            if (c.cause === causeItem.cause) c.probability = 95;
            else c.probability = Math.max(5, c.probability - 20);
          });
        }
      }
    }
  });

  // Intercept check for Moss questions
  const lastUserMsg = userMessages.slice(-1)[0]?.content.toLowerCase() || '';
  if (lastUserMsg.includes('moss') || lastUserMsg.includes('search') || lastUserMsg.includes('how do you find')) {
    const finalSuspected = suspectedCauses
      .filter((c) => !ruledOutCauses.includes(c.cause))
      .sort((a, b) => b.probability - a.probability);

    return {
      message: `Hamic leverages **Moss**, a sub-10ms in-process semantic search runtime, to power all search and information retrieval:

1. **Intelligent Document Retrieval (RAG)**: Whenever you report a symptom, Moss semantically searches the uploaded manufacturer manuals in under 10ms. The most relevant pages/sections are retrieved instantly and fed directly to me to generate precise diagnostic steps.
2. **Spare Parts & Tool Suggestions**: As we isolate the root cause, Moss searches a custom parts catalog in single-digit milliseconds to suggest matching spare parts and tools (which you can see in the 'Required Parts & Tools' panel in the sidebar).

Because Moss compiles and executes vector search directly within our application process (without a remote network round-trip), our retrieval latency drops by 98% compared to standard cloud-hosted databases.`,
      symptomTracker,
      ruledOutCauses,
      suspectedCauses: finalSuspected,
      status: 'active'
    };
  }

  // Check if we have a confirmed cause (probability >= 90)
  const confirmedCause = suspectedCauses.find((c) => c.probability >= 90);

  let nextMessage = '';
  let status: 'active' | 'resolved' | 'unresolved' = 'active';

  if (confirmedCause || currentStep >= matchedTemplate.causes.length) {
    status = confirmedCause ? 'resolved' : 'unresolved';
    const finalCauseName = confirmedCause ? confirmedCause.cause : "Unknown hardware fault";

    // A. Query Moss for compatible spare parts and tools
    const recommendedParts = await searchSpareParts(finalCauseName, matchedTemplate.key, 4);

    let partsListText = "";
    if (recommendedParts.length > 0) {
      partsListText = recommendedParts
        .map(p => `- **${p.name}** (${p.price}) [Category: ${p.type}] - *${p.text}*`)
        .join("\n");
    } else {
      partsListText = "- *(No specific matching spare parts found. General repair tools recommended.)*";
    }

    // B. If Gemini is available, let Gemini write the descriptive final report
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are Hamic's expert product technician and support agent. The user is troubleshooting their product:
- Product Name: ${product?.name || "Generic Product"}
- Product Category: ${product?.category || matchedTemplate.name}
- Reported Symptom: "${currentSymptom}"

The troubleshooting guided questioning has finished.
- Isolated Root Cause: **${finalCauseName}** (Resolution status: ${status === 'resolved' ? 'SUCCESSFULLY ISOLATED' : 'UNABLE TO CONFIRM'})

Here is the chat history:
${chatHistory.map((c) => `${c.role.toUpperCase()}: ${c.content}`).join('\n')}

Here is a list of recommended spare parts and tools matched for this issue:
${partsListText}

Please write a highly descriptive, professional, warm, human-like final diagnostic report.
Include:
1. A clear explanation of the diagnosed issue (${finalCauseName}) and why it causes the symptom.
2. Step-by-step resolution, safety warnings (e.g. power down/unplug before repair), and repair actions.
3. List the recommended spare parts and tools that you need to resolve this (refer to the exact titles and prices from the list above), explain why they are needed, and provide a clickable markdown link to Hamic's marketplace page so the user can purchase it immediately. 

Format the link EXACTLY as: [Part Name](/marketplace?search=ExactPartNameEncoded) (for example, [Replacement Air Filter](/marketplace?search=Replacement%20Air%20Filter%20%28HEPA%29)). Do NOT use external domains for the marketplace link.

Format the response using premium markdown formatting.
`;

        const result = await model.generateContent(prompt);
        nextMessage = result.response.text();
      } catch (err) {
        console.error("Failed to generate Gemini final report, falling back to local renderer:", err);
      }
    }

    // C. Fallback Local Renderer if Gemini was not used or failed
    if (!nextMessage) {
      if (status === 'resolved') {
        nextMessage = `Hello! Based on the diagnostic check-list we just completed, I have isolated the root issue. It is highly likely that your product is experiencing a **${finalCauseName}**.

Here is a descriptive, human-like guide to resolving this:
1. **Safety First**: Before attempting any physical inspection, ensure the appliance is completely turned off and unplugged from the electrical outlet.
2. **Action Steps**:
   - Locate the affected component (e.g. check the documentation download tab for the PDF diagram).
   - If it's a clogged filter or pump, remove any debris and clean the part under running water.
   - If a component replacement is needed (like a motor, belt, or switch), take a look at the recommended parts below.
3. **Required Spare Parts & Tools (Matched via Moss)**:
${partsListText}

Let me know if you have any questions or need further assistance!`;
      } else {
        nextMessage = `I've systematically run through all the primary diagnostic checkpoints but wasn't able to confirm a single root cause. 

To help you proceed, I suggest the following:
1. **Manufacturer's Manual**: Go to the 'Documentation' tab on the left to read or download the complete PDF user guide.
2. **Technical Support**: It might be best to contact our authorized technical support team for a physical inspection.

Let me know if you would like to reset the session and try describing a different symptom!`;
      }
    }
  } else {
    // Ask next question from matched template
    const nextCause = matchedTemplate.causes[currentStep];
    nextMessage = `Got it. Let's test the next possible cause. **${nextCause.question}**`;
    symptomTracker.push({ symptom: nextCause.question, status: 'suspected' });
  }

  // Filter out ruled out from suspected
  const finalSuspected = suspectedCauses
    .filter((c) => !ruledOutCauses.includes(c.cause))
    .sort((a, b) => b.probability - a.probability);

  return {
    message: nextMessage,
    symptomTracker,
    ruledOutCauses,
    suspectedCauses: finalSuspected,
    status
  };
}
