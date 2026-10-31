import { GoogleGenerativeAI } from '@google/generative-ai';

export async function summarize({ patientName, probability, risk, explanation, record }) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const factors = explanation.slice(0, 5).map((e) => `${e.label} (${e.impact > 0 ? 'raises' : 'lowers'} risk)`).join(', ');
    const prompt = `You are a careful health-education assistant inside a CKD screening tool. A machine-learning model estimated a ${(probability * 100).toFixed(0)}% chance of chronic kidney disease (${risk} risk) for ${patientName}. Main factors: ${factors}. Key values: age ${record.age}, BP ${record.bp}, creatinine ${record.sc}, hemoglobin ${record.hemo}.
Write 4-5 short sentences in simple language: what the result means, which factors mattered, and general next steps (confirmatory tests such as eGFR and urine ACR, consulting a nephrologist, BP/glucose control). Do NOT diagnose, do NOT prescribe medicine or doses, and end by saying a doctor must confirm.`;
    return (await model.generateContent(prompt)).response.text().trim();
  } catch (e) {
    console.warn('Gemini summary skipped:', e.message);
    return null;
  }
}
