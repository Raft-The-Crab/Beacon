import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testVerificationExpiry() {
    const email = `test_expiry_${Date.now()}@example.com`;
    const username = `test_user_${Date.now()}`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const verificationCode = '123456';
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 30);

    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Expected expiry: ${verificationExpires.toISOString()}`);

    try {
        const user = await prisma.user.create({
            data: {
                email,
                username,
                displayName: username,
                password: hashedPassword,
                discriminator: '0001',
                isVerified: false,
                verificationCode,
                verificationExpires
            }
        });

        console.log(`User created. Expiry in DB: ${user.verificationExpires?.toISOString()}`);
        
        const diffMs = (user.verificationExpires?.getTime() || 0) - new Date().getTime();
        const diffMins = Math.round(diffMs / 60000);
        
        if (diffMins >= 28 && diffMins <= 31) {
            console.log(`✅ Success: Expiry is approximately ${diffMins} minutes from now.`);
        } else {
            console.log(`❌ Failure: Expiry is ${diffMins} minutes from now (Expected ~30).`);
        }

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
    } catch (e) {
        console.error('Test failed', e);
    } finally {
        await prisma.$disconnect();
    }
}

testVerificationExpiry();
