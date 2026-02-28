require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_PASSWORD = process.env.JWT_PASSWORD || '123Random';
const prisma = new PrismaClient();

async function main() {
    console.log('JWT secret:', JWT_PASSWORD.substring(0, 8) + '...');

    const user = await prisma.user.findFirst({
        where: { email: 'vikash.nemu6268@gmail.com' }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User id:', user.id, '| email:', user.email);
    console.log('Password (first 10):', user.password.substring(0, 10));

    // Re-hash the password regardless (set to a known value)
    const NEW_PASS = 'Vikash@123';
    const hashed = await bcrypt.hash(NEW_PASS, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    console.log('\nPassword set to:', NEW_PASS);

    // Verify it works
    const ok = await bcrypt.compare(NEW_PASS, hashed);
    console.log('bcrypt verify:', ok);

    // Issue a fresh token
    const token = jwt.sign({ id: user.id }, JWT_PASSWORD, { expiresIn: '7d' });

    // Decode to confirm
    const decoded = jwt.decode(token);
    console.log('\nDecoded token payload:', JSON.stringify(decoded));

    console.log('\n=== PASTE THIS IN YOUR BROWSER CONSOLE (F12 > Console) ===');
    console.log("localStorage.setItem('token', '" + token + "')");
    console.log("localStorage.setItem('user', JSON.stringify({id:" + user.id + ",email:'" + user.email + "',name:'" + user.name + "'}))");
    console.log('\nThen refresh the page.');
}

main().catch(e => console.error('ERROR:', e.message)).finally(() => prisma.$disconnect());
