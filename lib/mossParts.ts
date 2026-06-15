const INDEX_NAME = "hamic-spare-parts";

let mossClient: any = null;
let mossClientInitialized = false;
let indexInitialized = false;

async function getMossClient() {
  if (mossClientInitialized) return mossClient;

  const PROJECT_ID = process.env.MOSS_PROJECT_ID;
  const PROJECT_KEY = process.env.MOSS_PROJECT_KEY;

  if (PROJECT_ID && PROJECT_KEY) {
    try {
      const { MossClient } = await import("@moss-dev/moss");
      mossClient = new MossClient(PROJECT_ID, PROJECT_KEY);
      console.log("✅ Moss Spare Parts Client initialized successfully.");
    } catch (error) {
      console.error("❌ Failed to initialize Moss Spare Parts Client:", error);
    }
  }
  mossClientInitialized = true;
  return mossClient;
}

export interface SparePart {
  id: string;
  name: string;
  type: string;
  category: string;
  text: string;
  price: string;
  score: number;
}

export const PARTS_CATALOG = [
  // Air Conditioners
  { id: "p1", name: "Replacement Air Filter (HEPA)", type: "Spare Part", category: "ac", text: "Replacement HEPA air filter for cooling units and split air conditioners. Solves clogged filters, weak air flow, dust, and cooling issues.", price: "$24.99" },
  { id: "p2", name: "AC Condenser Fan Motor", type: "Spare Part", category: "ac", text: "Condenser fan motor for outdoor unit. Solves fan not spinning, humming noises, overheating, and lack of outdoor air circulation.", price: "$89.50" },
  { id: "p3", name: "Digital Thermostat Sensor", type: "Spare Part", category: "ac", text: "Replacement ambient temperature thermistor sensor. Resolves incorrect thermostat reading, temperature mismatch, or auto shut-off glitches.", price: "$15.99" },
  { id: "p4", name: "Refrigerant Recharge Kit", type: "Consumable", category: "ac", text: "Refrigerant R410A recharge kit with pressure gauge. Helps resolve low refrigerant leaks and evaporator coil freezing.", price: "$45.00" },
  { id: "p5", name: "AC Fin Comb & Cleaning Brush", type: "Tool", category: "ac", text: "Stainless steel fin straightener comb and condenser coil cleaning brush. Restores airflow efficiency and clears clogged dirt.", price: "$12.50" },

  // Washing Machines
  { id: "p6", name: "Heavy Duty Drum Drive Belt", type: "Spare Part", category: "washer", text: "Heavy duty rubber drive belt for washer drum motor pulley. Solves washer not spinning, motor humming but drum not rotating.", price: "$19.99" },
  { id: "p7", name: "Universal Drain Pump Assembly", type: "Spare Part", category: "washer", text: "Electric drain pump motor assembly. Clears clogged drum, standing water, failure to drain, or pump humming issues.", price: "$34.99" },
  { id: "p8", name: "Lid Switch & Door Lock Assembly", type: "Spare Part", category: "washer", text: "Safety lid switch actuator lock. Solves washing machine refusing to spin or start due to unacknowledged door closure.", price: "$22.50" },
  { id: "p9", name: "Water Inlet Valve", type: "Spare Part", category: "washer", text: "Dual solenoid water inlet valve for hot and cold supply lines. Solves slow filling or water not entering washer drum.", price: "$28.00" },
  { id: "p10", name: "Hose Clamp Pliers & Clamps set", type: "Tool", category: "washer", text: "Spring hose clamp removal pliers and replacement clamps. Stops water leaks from drain hoses and pumps.", price: "$16.99" },

  // General tools
  { id: "p11", name: "Digital Multimeter Tester", type: "Tool", category: "general", text: "Precision digital multimeter for testing electrical continuity, outlet voltage, fuses, switches, and thermostat resistance.", price: "$29.99" },
  { id: "p12", name: "108-Piece Socket & Screwdriver Kit", type: "Tool", category: "general", text: "Mechanic's socket wrench set, hex keys, and screwdrivers for opening panels, removing chassis covers, and securing bolts.", price: "$39.99" },
  { id: "p13", name: "Heat-Resistant Electrical Tape", type: "Consumable", category: "general", text: "Insulating electrical tape roll for repairing minor wire abrasions and wrapping connector terminals securely.", price: "$4.50" }
];

let indexFailed = false;

/**
 * Initializes and seeds the Moss spare parts index
 */
async function ensureIndexReady() {
  const client = await getMossClient();
  if (!client || indexInitialized || indexFailed) return;
  try {
    const docs = PARTS_CATALOG.map(p => ({
      id: p.id,
      text: `${p.name} (${p.type}). Category: ${p.category}. Description: ${p.text}`
    }));
    await client.createIndex(INDEX_NAME, docs);
    await client.loadIndex(INDEX_NAME);
    indexInitialized = true;
    console.log("✅ Moss Spare Parts: Catalog index seeded and loaded successfully.");
  } catch (error) {
    indexFailed = true;
    console.warn("⚠️ Moss Spare Parts: Free tier index limit reached. Seamlessly using local database matching fallback.");
  }
}

/**
 * Semantic search for spare parts and tools
 */
export async function searchSpareParts(
  query: string,
  categoryFilter?: string,
  topK: number = 3
): Promise<SparePart[]> {
  const normalizedQuery = (query || "").toLowerCase();

  // If query is empty, return all matching parts for marketplace display
  if (!normalizedQuery || normalizedQuery.trim() === "") {
    const activeCat = (categoryFilter || "").toLowerCase();
    const list = PARTS_CATALOG.filter(item => {
      if (!activeCat || activeCat === "all" || activeCat === "") return true;
      const itemCat = item.category.toLowerCase();
      return itemCat === "general" || activeCat.includes(itemCat) || itemCat.includes(activeCat);
    });
    return list.map(item => ({
      ...item,
      score: 1.0
    })).slice(0, topK);
  }

  // If Moss is active, query semantically
  const client = await getMossClient();
  if (client && !indexFailed) {
    try {
      await ensureIndexReady();
      if (indexInitialized) {
        const results = await client.query(INDEX_NAME, query, { topK: 5 });
        
        const parts: SparePart[] = [];
        for (const doc of results.docs) {
          const item = PARTS_CATALOG.find(p => p.id === doc.id);
          if (item) {
            // Optional: filter parts by general category match
            const itemCat = item.category.toLowerCase();
            const activeCat = (categoryFilter || "").toLowerCase();
            const isCategoryMatch = 
              itemCat === "general" ||
              activeCat.includes(itemCat) ||
              itemCat.includes(activeCat);

            if (isCategoryMatch) {
              parts.push({
                ...item,
                score: doc.score
              });
            }
          }
        }
        return parts.slice(0, topK);
      }
    } catch (err) {
      console.warn("⚠️ Moss Spare Parts query failed, using local database fallback.");
    }
  }

  // Local fallback: keyword matching
  const keywords = normalizedQuery.split(/\s+/).filter(k => k.length > 2);
  const matched = PARTS_CATALOG.map(item => {
    const text = (item.name + " " + item.text + " " + item.type).toLowerCase();
    let hits = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) hits += 1.5;
    });

    // Add extra score for category alignment
    const itemCat = item.category.toLowerCase();
    const activeCat = (categoryFilter || "").toLowerCase();
    if (activeCat.includes(itemCat) || itemCat.includes(activeCat)) {
      hits += 1.0;
    }

    return {
      ...item,
      score: hits > 0 ? hits / (keywords.length + 1) : 0
    };
  })
  .filter(p => p.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, topK);

  return matched;
}
