/**
 * Real AI Intake Engine — replaces mock clujChatEngine for case creation
 * Uses InvokeLLM with structured outputs for deterministic case routing
 */
import { base44 } from '@/api/base44Client';
import { clujInstitutions } from './clujInstitutions';
import workflows from './workflows';
import { retrieveDocuments } from './civicDocuments';
import { CLUJ_PROCEDURES } from '@/lib/rag/clujProcedureKnowledge';

// Build a compact context snapshot for the AI
function buildContextSummary() {
  const institutionSummary = clujInstitutions.map(i =>
    `${i.id}: ${i.name} | services: ${i.services.slice(0, 3).join(', ')} | online: ${i.onlineServices} | queue: ~${i.queue.current}min`
  ).join('\n');

  const workflowSummary = workflows.map(w =>
    `${w.id}: ${w.title} | institution: ${w.institutionId} | online: ${!!w.online} | docs: ${w.documents.slice(0, 3).join(', ')}`
  ).join('\n');

  // Enrich with official Cluj procedure knowledge
  const procedureSummary = CLUJ_PROCEDURES.slice(0, 10).map(p =>
    `${p.id}: ${p.title} | institution: ${p.institutionId} | online: ${p.onlineAvailable} | workflowType: ${p.workflowType} | onlineUrl: ${p.onlineUrl || 'N/A'}`
  ).join('\n');

  return { institutionSummary, workflowSummary, procedureSummary };
}

export async function classifyIntake(userMessage, conversationHistory = []) {
  const { institutionSummary, workflowSummary, procedureSummary } = buildContextSummary();

  const historyContext = conversationHistory.slice(-4).map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content?.slice(0, 200)}`
  ).join('\n');

  const prompt = `You are NoQueue Intake Router for Cluj-Napoca, Romania public procedures.
Your job: classify the user's civic need into a structured case.

Available institutions:
${institutionSummary}

Available workflows:
${workflowSummary}

Official Cluj procedures (with real government data):
${procedureSummary}

Recent conversation:
${historyContext || '(none)'}

User message: "${userMessage}"

Rules:
- ALWAYS check if the procedure can be done online FIRST. Cluj City Hall has 300+ online procedures.
- Set can_do_online=true for: ANAF SPV, passport status checks, civil status records requests, e-Cazier, tax payments.
- If online is possible, set channel="online" and provide the online_url.
- Prefer walking users away from in-person if online is possible.
- Be conservative: if confidence < 0.75, list what additional facts you need.
- Never invent document requirements — only use what's in the workflows above.
- Respond in the same language the user writes in (Romanian or English).
- If the user speaks Romanian, write all response text in Romanian.

Output strict JSON only.`;

  const schema = {
    type: "object",
    properties: {
      procedure_key: { type: "string" },
      procedure_title: { type: "string" },
      institution_key: { type: "string" },
      institution_name: { type: "string" },
      channel: { type: "string", enum: ["online", "appointment", "walk-in", "concierge"] },
      can_do_online: { type: "boolean" },
      online_url: { type: "string" },
      urgency: { type: "string", enum: ["normal", "urgent", "critical"] },
      confidence: { type: "number" },
      required_documents: { type: "array", items: { type: "string" } },
      next_action: { type: "string" },
      missing_facts: { type: "array", items: { type: "string" } },
      reply: { type: "string" },
      online_tip: { type: "string" },
      risks: { type: "array", items: { type: "string" } },
      best_time_hint: { type: "string" }
    }
  };

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema,
  });

  // Enrich with retrieved documents
  const retrievedDocs = retrieveDocuments(userMessage, result.procedure_key);

  return {
    ...result,
    retrievedDocuments: retrievedDocs,
    type: result.can_do_online ? 'online-first' : 'workflow-guidance',
    workflowId: result.procedure_key,
    institutionId: result.institution_key,
    documents: result.required_documents || [],
    followUpQuestion: result.missing_facts?.length > 0
      ? result.missing_facts[0]
      : null,
    suggestedActions: result.can_do_online
      ? ['Open online portal', 'Save as case', 'I need in-person help instead']
      : ['Save as case', 'View institution on map', 'Check queue', 'Book appointment'],
  };
}