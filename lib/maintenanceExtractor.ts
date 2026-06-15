import { GoogleGenerativeAI } from '@google/generative-ai';

interface ExtractedTask {
  title: string;
  description: string;
  intervalMonths: number;
}

/**
 * Extracts maintenance tasks from raw manual text using Gemini AI or regex fallback.
 */
export async function extractMaintenanceTasks(
  manualText: string,
  productCategory: string
): Promise<ExtractedTask[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (GEMINI_API_KEY && manualText.trim().length > 100) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `
You are a smart technical assistant. Extract a list of recommended routine maintenance schedules, service tasks, and inspection intervals from the following product documentation manual.

Product Category: ${productCategory}

Documentation:
"""
${manualText}
"""

Extract all preventive maintenance actions (e.g. cleaning, replacing, checking parts). 
Return the result in the following JSON schema:
[
  {
    "title": "Short title of the task (e.g. Replace air filter)",
    "description": "Short explanation of how to perform the action",
    "intervalMonths": 12 // Interval frequency in months. If it is once a year, use 12. If once a month, use 1.
  }
]
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as ExtractedTask[];
    } catch (error) {
      console.error('Failed to extract maintenance tasks via Gemini, falling back to regex:', error);
    }
  }

  // Regex fallback: Search for keywords and numbers
  const tasks: ExtractedTask[] = [];
  const lines = manualText.split('\n');

  // Match sentences containing "every X months", "every year", "clean X", "replace Y"
  const intervalRegex = /every\s+(\d+)\s+months?/i;
  const yearlyRegex = /every\s+year|annually|once\s+a\s+year/i;
  const actionKeywords = ['clean', 'replace', 'inspect', 'check', 'lubricate', 'drain', 'service'];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 15) continue;

    // Check if line contains an action keyword
    const hasAction = actionKeywords.some(kw => trimmed.toLowerCase().includes(kw));
    if (!hasAction) continue;

    let intervalMonths = 6; // Default to 6 months
    let matched = false;

    const matchMonths = trimmed.match(intervalRegex);
    if (matchMonths) {
      intervalMonths = parseInt(matchMonths[1], 10);
      matched = true;
    } else if (yearlyRegex.test(trimmed)) {
      intervalMonths = 12;
      matched = true;
    } else if (trimmed.toLowerCase().includes('monthly')) {
      intervalMonths = 1;
      matched = true;
    } else if (trimmed.toLowerCase().includes('every 3 months') || trimmed.toLowerCase().includes('quarterly')) {
      intervalMonths = 3;
      matched = true;
    }

    if (matched) {
      // Create a task title
      let title = 'Routine Maintenance';
      const lowercaseLine = trimmed.toLowerCase();
      
      if (lowercaseLine.includes('filter')) {
        title = lowercaseLine.includes('clean') ? 'Clean Air Filter' : 'Replace Filter';
      } else if (lowercaseLine.includes('coil')) {
        title = 'Clean Condenser Coils';
      } else if (lowercaseLine.includes('belt')) {
        title = 'Inspect Drive Belt';
      } else if (lowercaseLine.includes('pump') || lowercaseLine.includes('drain')) {
        title = 'Clean Drain Pump Filter';
      } else {
        // Grab first few words of the line
        const words = trimmed.split(' ');
        title = words.slice(0, 4).join(' ');
      }

      tasks.push({
        title,
        description: trimmed,
        intervalMonths
      });
    }
  }

  // If we found nothing, generate default fallback tasks based on product category
  if (tasks.length === 0) {
    const cat = productCategory.toLowerCase();
    if (cat.includes('ac') || cat.includes('air conditioner')) {
      tasks.push(
        { title: 'Clean Air Filter', description: 'Wash the dust filter with warm water to maintain airflow.', intervalMonths: 3 },
        { title: 'Inspect Outdoor Condenser', description: 'Clear leaves, debris, or dust blocking the outdoor unit coils.', intervalMonths: 6 }
      );
    } else if (cat.includes('wash') || cat.includes('washer')) {
      tasks.push(
        { title: 'Clean Drain Pump Filter', description: 'Open the service panel at the bottom right and clean debris from pump filter.', intervalMonths: 3 },
        { title: 'Run Tub Clean Cycle', description: 'Run a hot self-clean cycle with vinegar or tub cleaner to prevent mold.', intervalMonths: 1 }
      );
    } else {
      tasks.push(
        { title: 'General Inspection', description: 'Inspect cables, check connections, and wipe clean the exterior.', intervalMonths: 6 }
      );
    }
  }

  return tasks;
}
