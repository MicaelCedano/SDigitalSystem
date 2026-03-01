const crypto = require('crypto');

function verifyScrypt(password, hash) {
    if (!hash.startsWith('scrypt:')) return false;

    const [params, salt, key] = hash.split('$');
    const [_, n, r, p] = params.split(':').map(Number);

    // Werkzeug usually uses salt as a string (utf8)
    const saltBuffer = Buffer.from(salt, 'utf8');
    const keyLen = key.length / 2; // hex to bytes

    return new Promise((resolve, reject) => {
        crypto.scrypt(password, saltBuffer, keyLen, { N: n, r, p }, (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey.toString('hex') === key);
        });
    });
}

// Example from my lookup
const testHash = 'scrypt:32768:8:1$HGiNGuYTmfi6Fh6d$965c0ff97e07d4e4441e4e59033a0ad52a7d22cc91920c6f533e5eff3df152a324213f792f1be88c6ab7bad12bec5cb264c4804db1848b962';

// Testing common passwords
const common = ['test', 'test123', 'test1234', '123456', 'admin'];

async function check() {
    for (const p of common) {
        const ok = await verifyScrypt(p, testHash);
        console.log(`Password "${p}": ${ok}`);
    }
}

check();
