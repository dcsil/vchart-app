import { NextRequest } from 'next/server';

const BETTER_STACK_TOKEN = process.env.BETTER_STACK_TOKEN || "biugVd7TdtBnhjKW6qAydKKC";
const BETTER_STACK_URL = "https://s1222213.eu-nbg-2.betterstackdata.com";

async function sendLogToBetterStack(message: string, level: string = 'info') {
  const timestamp = new Date().toISOString();
  
  try {
    const response = await fetch(BETTER_STACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BETTER_STACK_TOKEN}`
      },
      body: JSON.stringify({
        dt: timestamp,
        message: message,
        level: level
      })
    });
    
    if (!response.ok) {
      console.error(`Failed to send log to Better Stack: ${response.status} ${response.statusText}`);
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error sending log to Better Stack:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, level = 'info' } = body;
        
        const success = await sendLogToBetterStack(message, level);
        
        return new Response(
          JSON.stringify({ 
            message: success ? "Log sent successfully" : "Failed to send log", 
            data: body 
          }), 
          { 
            status: success ? 201 : 500, 
            headers: { "Content-Type": "application/json" } 
          }
        );
    } catch (error) {
        console.error('Error in log API route:', error);
        return new Response(
          JSON.stringify({ error: "Error processing log request" }), 
          { status: 500 }
        );
    }
}
