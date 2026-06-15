import { NextResponse } from 'next/server';
import { connectDB, dbModel } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { processDiagnostics } from '@/lib/diagnosticEngine';

export async function POST(request: Request) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);
    const { productId, sessionId, symptom, message } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    let session: any;

    if (sessionId) {
      // Resume existing session
      session = await dbModel.DiagnosticSession.findById(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
      }

      // Verify session matches product ID to prevent cross-contamination
      if (session.productId.toString() !== productId.toString()) {
        return NextResponse.json({ error: 'Diagnostic session does not match this product.' }, { status: 400 });
      }

      // Add user response to history
      if (message) {
        session.chatHistory.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Start a new session
      if (!symptom) {
        return NextResponse.json({ error: 'Initial symptom is required to start a session.' }, { status: 400 });
      }

      session = await dbModel.DiagnosticSession.create({
        productId,
        userId: user?._id || null,
        symptom,
        status: 'active',
        chatHistory: [
          {
            role: 'user',
            content: symptom,
            timestamp: new Date().toISOString()
          }
        ],
        symptomTracker: [{ symptom, status: 'confirmed' }],
        ruledOutCauses: [],
        suspectedCauses: [],
        createdAt: new Date().toISOString()
      });
    }

    // Process diagnostic reasoning using our engine
    const diagnosticResult = await processDiagnostics(
      productId,
      session.chatHistory,
      session.symptom
    );

    // Append assistant response to chat history
    session.chatHistory.push({
      role: 'assistant',
      content: diagnosticResult.message,
      timestamp: new Date().toISOString()
    });

    // Update session state
    const updateData = {
      chatHistory: session.chatHistory,
      symptomTracker: diagnosticResult.symptomTracker,
      ruledOutCauses: diagnosticResult.ruledOutCauses,
      suspectedCauses: diagnosticResult.suspectedCauses,
      status: diagnosticResult.status
    };

    const updatedSession = await dbModel.DiagnosticSession.findByIdAndUpdate(
      session._id,
      { $set: updateData }
    );

    // Return the latest session data
    return NextResponse.json({
      success: true,
      session: {
        ...session,
        ...updatedSession,
        ...updateData, // ensure latest is returned
        _id: session._id ? session._id.toString() : (updatedSession?._id ? updatedSession._id.toString() : null)
      }
    });
  } catch (error: any) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ error: 'Failed to process diagnosis: ' + error.message }, { status: 500 });
  }
}
