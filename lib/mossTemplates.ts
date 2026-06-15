import { MossClient } from "@moss-dev/moss";

const PROJECT_ID = process.env.MOSS_PROJECT_ID;
const PROJECT_KEY = process.env.MOSS_PROJECT_KEY;
const INDEX_NAME = "hamic-diagnostic-templates";

let mossClient: MossClient | null = null;
let indexInitialized = false;

if (PROJECT_ID && PROJECT_KEY) {
  try {
    mossClient = new MossClient(PROJECT_ID, PROJECT_KEY);
    console.log("✅ Moss Diagnostic Templates Client initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Moss Diagnostic Templates Client:", error);
  }
}

export interface DiagnosticCause {
  cause: string;
  question: string;
  yesConfirms: boolean;
  category: string;
}

export interface DiagnosticTemplate {
  key: string;
  name: string;
  description: string;
  symptoms: string[];
  causes: DiagnosticCause[];
  initialQuestions: string[];
}

export const DIAGNOSTIC_TEMPLATES: Record<string, DiagnosticTemplate> = {
  cooling: {
    key: "cooling",
    name: "Air Conditioner / Cooling Unit Diagnostics",
    description: "Troubleshooting flows for air conditioners, heat pumps, split systems, and cooling equipment.",
    symptoms: ["ac not cooling", "blowing hot air", "air conditioner weak flow", "thermostat wrong", "ac making noise"],
    causes: [
      { cause: "Thermostat set incorrectly", question: "Is the thermostat set to 'Cool' and the target temperature below room temperature?", yesConfirms: false, category: "ac" },
      { cause: "Clogged air filter", question: "Has it been more than 3 months since you last cleaned or replaced the air filter?", yesConfirms: true, category: "ac" },
      { cause: "Outdoor unit power off", question: "Is the outdoor condenser unit fan spinning and humming when the AC is turned on?", yesConfirms: false, category: "ac" },
      { cause: "Refrigerant leak", question: "Do you see any ice forming on the indoor coils or copper tubes?", yesConfirms: true, category: "ac" }
    ],
    initialQuestions: ["What are the symptoms?", "Is the unit blowing air?"]
  },
  spinning: {
    key: "spinning",
    name: "Washing Machine Diagnostics",
    description: "Troubleshooting flows for front loaders, top loaders, washers, dryers, and laundry machines.",
    symptoms: ["washing machine not spinning", "washer vibrating violently", "drum high noise", "washer not draining water", "water leaking"],
    causes: [
      { cause: "Unbalanced load", question: "Is the washing machine shaking violently or did it stop mid-cycle with heavy items inside?", yesConfirms: true, category: "washer" },
      { cause: "Lid switch failure", question: "Does the machine click or acknowledge when you shut the lid completely?", yesConfirms: false, category: "washer" },
      { cause: "Drain pump clog", question: "Is there water remaining in the drum that is failing to drain out?", yesConfirms: true, category: "washer" },
      { cause: "Drive belt broken", question: "Does the motor hum but the drum does not rotate at all when turned by hand?", yesConfirms: true, category: "washer" }
    ],
    initialQuestions: ["What is the error?", "Is the drum rotating?"]
  },
  vacuum: {
    key: "vacuum",
    name: "Vacuum Cleaner Diagnostics",
    description: "Troubleshooting flows for upright, canister, stick, and robotic vacuum cleaners.",
    symptoms: ["vacuum loss of suction", "brush roll not spinning", "vacuum overheating", "robot vacuum stuck", "brush block"],
    causes: [
      { cause: "Blocked brush roll", question: "Is there hair, string, or debris wrapped around the main roller brush preventing it from turning?", yesConfirms: true, category: "general" },
      { cause: "Clogged exhaust filter", question: "Have you emptied the dust cup and checked if the HEPA/foam filter is dirty?", yesConfirms: false, category: "general" },
      { cause: "Obstruction in hose", question: "If you detach the hose, can you drop a coin through it without it getting stuck?", yesConfirms: false, category: "general" },
      { cause: "Thermal cut-off activated", question: "Did the vacuum shut off suddenly after running warm, and refuses to turn on now?", yesConfirms: true, category: "general" }
    ],
    initialQuestions: ["Is there suction?", "Is the brush roll spinning?"]
  },
  generic: {
    key: "generic",
    name: "General Appliance Diagnostics",
    description: "Troubleshooting steps for generic home appliances, electronics, and devices.",
    symptoms: ["device does not turn on", "appliance power glitch", "overheating", "reset needed"],
    causes: [
      { cause: "Power supply issue", question: "Is the power cable securely plugged in and is the outlet working with other devices?", yesConfirms: false, category: "general" },
      { cause: "Device overheating", question: "Does the unit feel unusually warm or shuts down automatically after a few minutes of use?", yesConfirms: true, category: "general" },
      { cause: "Firmware glitch", question: "Have you tried performing a hard reset by unplugging the device for 60 seconds?", yesConfirms: false, category: "general" }
    ],
    initialQuestions: ["Describe the problem you are experiencing."]
  }
};

let indexFailed = false;

/**
 * Initializes and seeds the Moss diagnostics templates index
 */
async function ensureIndexReady() {
  if (!mossClient || indexInitialized || indexFailed) return;
  try {
    const docs = Object.values(DIAGNOSTIC_TEMPLATES).map(t => ({
      id: t.key,
      text: `${t.name}. Symptoms: ${t.symptoms.join(", ")}. Description: ${t.description}`
    }));
    await mossClient.createIndex(INDEX_NAME, docs);
    await mossClient.loadIndex(INDEX_NAME);
    indexInitialized = true;
    console.log("✅ Moss Diagnostics: Templates index seeded and loaded successfully.");
  } catch (error) {
    indexFailed = true;
    console.warn("⚠️ Moss Diagnostics: Free tier index limit reached. Seamlessly using local keyword classification fallback.");
  }
}

/**
 * Matches initial symptom to the best diagnostic template using Moss semantic search or keyword fallback
 */
export async function matchDiagnosticTemplate(symptom: string, productCategory?: string): Promise<DiagnosticTemplate> {
  const normalizedSymptom = symptom.toLowerCase();
  const normalizedCategory = (productCategory || "").toLowerCase();

  // Route directly based on product category if recognized to prevent cross-product symptom contamination
  if (normalizedCategory) {
    if (normalizedCategory.includes("wash") || normalizedCategory.includes("laundry") || normalizedCategory.includes("machine")) {
      return DIAGNOSTIC_TEMPLATES.spinning;
    }
    if (normalizedCategory.includes("ac") || normalizedCategory.includes("air conditioner") || normalizedCategory.includes("cool")) {
      return DIAGNOSTIC_TEMPLATES.cooling;
    }
    if (normalizedCategory.includes("vacuum") || normalizedCategory.includes("cleaner")) {
      return DIAGNOSTIC_TEMPLATES.vacuum;
    }
  }

  // 1. Try Moss Semantic Search if active
  if (mossClient && !indexFailed) {
    try {
      await ensureIndexReady();
      if (indexInitialized) {
        const results = await mossClient.query(INDEX_NAME, symptom, { topK: 1 });
        if (results.docs.length > 0) {
          const matchedKey = results.docs[0].id;
          const matchedTemplate = DIAGNOSTIC_TEMPLATES[matchedKey];
          if (matchedTemplate) {
            console.log(`🎯 Moss matched template semantically: ${matchedTemplate.name} (Score: ${results.docs[0].score})`);
            return matchedTemplate;
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Moss Diagnostic template lookup failed, using local fallback.");
    }
  }

  // 2. Keyword-based local fallback
  if (normalizedSymptom.includes("cool") || normalizedSymptom.includes("heat") || normalizedSymptom.includes("ac") || normalizedSymptom.includes("conditioner")) {
    // Avoid Acme substring matches by checking word boundary
    const words = normalizedSymptom.split(/[^a-zA-Z0-9/]/).filter(Boolean);
    if (words.includes("ac") || words.includes("a/c") || normalizedSymptom.includes("cooling") || normalizedSymptom.includes("conditioner")) {
      return DIAGNOSTIC_TEMPLATES.cooling;
    }
  }

  if (normalizedSymptom.includes("spin") || normalizedSymptom.includes("drain") || normalizedSymptom.includes("wash") || normalizedSymptom.includes("washer") || normalizedSymptom.includes("laundry") || normalizedSymptom.includes("vibrat")) {
    return DIAGNOSTIC_TEMPLATES.spinning;
  }

  if (normalizedSymptom.includes("vacuum") || normalizedSymptom.includes("suction") || normalizedSymptom.includes("brush") || normalizedSymptom.includes("roller")) {
    return DIAGNOSTIC_TEMPLATES.vacuum;
  }

  return DIAGNOSTIC_TEMPLATES.generic;
}
