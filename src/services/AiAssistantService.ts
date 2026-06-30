import Groq from 'groq-sdk';
import { ParkingLotManager } from './ParkingLotManager';
import { env } from '../config/env';

export class AiAssistantService {
    private groq: Groq;
    private parkingManager: ParkingLotManager;

    constructor(parkingManager: ParkingLotManager) {
        this.groq = new Groq({
            apiKey: env.GROQ_API_KEY
        });
        this.parkingManager = parkingManager;
    }

    async askAssistant(query: string, history: Array<{role: 'user' | 'assistant', content: string}> = []): Promise<string> {
        // Fetch real-time availability to provide context to the LLM
        const availability = await this.parkingManager.getAvailability();
        
        let ticketContext = '';
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
        const allText = history.map(h => h.content).join(' ') + ' ' + query;
        const match = allText.match(uuidRegex);
        
        if (match) {
            const ticketId = match[0];
            try {
                const ticket = await this.parkingManager.getTicketDetails(ticketId);
                if (ticket) {
                    ticketContext = `\nThe user is asking about ticket ID: ${ticketId}. Details:
- License Plate: ${ticket.licensePlate}
- Entry Time: ${ticket.entryTime}
- Spot: Floor ${ticket.spot.floorNumber}, Spot ${ticket.spot.spotNumber} (${ticket.spot.spotType})
- Status: ${ticket.status}
Use this info to answer their questions.`;
                }
            } catch (e) {
                // Ignore
            }
        }
        
        const systemPrompt = `
You are an intelligent parking assistant for a smart parking lot. 
Here is the current real-time availability of parking spots:
- SMALL spots: ${availability.SMALL || 0}
- MEDIUM spots: ${availability.MEDIUM || 0}
- LARGE spots: ${availability.LARGE || 0}

Rules for parking:
- MOTORCYCLEs can park in SMALL, MEDIUM, or LARGE spots.
- CARs can park in MEDIUM or LARGE spots.
- BUSes can ONLY park in LARGE spots.
- Pricing: Motorcycles (₹10/hr), Cars (₹20/hr), Buses (₹50/hr). First 15 minutes are free.
${ticketContext}
Please answer the user's question concisely based on the provided context. If they ask if they can park, verify based on the rules and current availability.
`;

        const chatCompletion = await this.groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: query }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2, // Low temperature for highly factual and consistent responses
            max_tokens: 150
        });

        return chatCompletion.choices[0]?.message?.content || 'Sorry, I could not process your request.';
    }
}
