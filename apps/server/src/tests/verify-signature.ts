import * as crypto from 'crypto';
import axios from 'axios';

/**
 * Verification script for Beacon Sovereignty (Ed25519 interactions).
 * This simulates a signed interaction from the platform to the bot.
 */
async function testInteraction() {
    const PUBLIC_KEY = process.env.BEACON_PUBLIC_KEY;
    const PRIVATE_KEY = process.env.BEACON_PRIVATE_KEY; // Only for testing

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
        console.error('Error: BEACON_PUBLIC_KEY and BEACON_PRIVATE_KEY must be set in env.');
        process.exit(1);
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = JSON.stringify({
        type: 1, // PING
        applicationId: 'beacon-bot-authority'
    });

    const signature = crypto.sign(
        null,
        Buffer.from(timestamp + body),
        crypto.createPrivateKey({
            key: Buffer.from(PRIVATE_KEY, 'hex'),
            format: 'der',
            type: 'pkcs8'
        })
    ).toString('hex');

    console.log(`[Test] Sending Interaction with signature: ${signature}`);

    try {
        const response = await axios.post('http://localhost:3001/interactions', body, {
            headers: {
                'X-Signature-Ed25519': signature,
                'X-Signature-Timestamp': timestamp,
                'Content-Type': 'application/json'
            }
        });

        console.log('[Test] Response status:', response.status);
        if (response.data.type === 1) {
            console.log('[Test] SUCCESS: Received PONG');
        } else {
            console.log('[Test] Received unexpected response:', response.data);
        }
    } catch (error: any) {
        console.error('[Test] FAILED:', error.response?.data || error.message);
    }
}

testInteraction();
