import { MossClient } from "@moss-dev/moss";
import { dbModel } from "./db";

const PROJECT_ID = process.env.MOSS_PROJECT_ID;
const PROJECT_KEY = process.env.MOSS_PROJECT_KEY;
const INDEX_NAME = "hamic-support-docs";

let mossClient: MossClient | null = null;

if (PROJECT_ID && PROJECT_KEY) {
  try {
    mossClient = new MossClient(PROJECT_ID, PROJECT_KEY);
    console.log("✅ Moss Search Client initialized successfully.");
  } catch (error) {
    console.error("❌ Failed to initialize Moss Search Client:", error);
  }
} else {
  console.log("ℹ️ Moss Search: MOSS_PROJECT_ID or MOSS_PROJECT_KEY missing. Running in database fallback mode.");
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  productId: string;
  title: string;
}

/**
 * Indexes all support materials for a product or updates the global Moss index
 */
export async function syncMossIndex(): Promise<boolean> {
  if (!mossClient) return false;

  try {
    // Fetch all text materials from database
    const materials = await dbModel.SupportMaterial.find({});
    
    // Format documents for Moss
    const docs = materials
      .filter((m: any) => m.rawText && m.rawText.trim().length > 0)
      .map((m: any) => ({
        id: m._id.toString(),
        text: `Product: ${m.productId}. Title: ${m.title}. Manual Content: ${m.rawText}`
      }));

    if (docs.length === 0) {
      console.log("ℹ️ Moss Sync: No text manuals found to index.");
      return true;
    }

    console.log(`🌱 Moss Sync: Indexing ${docs.length} support materials...`);
    await mossClient.createIndex(INDEX_NAME, docs);
    await mossClient.loadIndex(INDEX_NAME);
    console.log("✅ Moss Sync: Indexing completed successfully.");
    return true;
  } catch (error) {
    console.error("❌ Moss Sync failed:", error);
    return false;
  }
}

/**
 * Queries Moss for relevant documentation matching the symptom/message.
 * Falls back to Mongoose text search if Moss is not configured.
 */
export async function searchDocumentation(
  productId: string,
  query: string,
  topK: number = 3
): Promise<SearchResult[]> {
  // If Moss is active, load and run query
  if (mossClient) {
    try {
      // Lazy load/sync if index is not loaded (or ensure loaded)
      await mossClient.loadIndex(INDEX_NAME);
      const results = await mossClient.query(INDEX_NAME, query, { topK });
      
      const matchedResults: SearchResult[] = [];
      for (const doc of results.docs) {
        // Find corresponding support material in database to get metadata
        const material = await dbModel.SupportMaterial.findById(doc.id);
        if (material && material.productId.toString() === productId.toString()) {
          matchedResults.push({
            id: doc.id,
            text: material.rawText || "",
            score: doc.score,
            productId: material.productId.toString(),
            title: material.title
          });
        }
      }

      if (matchedResults.length > 0) {
        console.log(`⚡ Moss Search: Returned ${matchedResults.length} matching segments in ${results.timeTakenInMs}ms`);
        return matchedResults;
      }
    } catch (err) {
      console.error("⚠️ Moss search query failed, using local database fallback:", err);
    }
  }

  // Database fallback: search locally
  console.log("🔍 Database Search: Running local query fallback...");
  const materials = await dbModel.SupportMaterial.find({ productId });
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  const matched = materials
    .filter((m: any) => m.rawText && m.rawText.trim().length > 0)
    .map((m: any) => {
      const text = m.rawText.toLowerCase();
      // Calculate a simple keyword-matching relevance score
      let hits = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) hits += 1;
      });
      return {
        id: m._id.toString(),
        text: m.rawText,
        score: hits > 0 ? hits / keywords.length : 0,
        productId: m.productId.toString(),
        title: m.title
      };
    })
    .filter((res: any) => res.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, topK);

  return matched;
}
