const crypto = require('crypto');

function verifyWerkzeugHash(password, hash) {
    if (!hash.startsWith('scrypt:')) return false;

    try {
        const [params, salt, key] = hash.split('$');
        const [_, nStr, rStr, pStr] = params.split(':');

        const saltBuffer = Buffer.from(salt, 'utf8');
        const derivedKey = crypto.scryptSync(password, saltBuffer, 64, {
            N: parseInt(nStr),
            r: parseInt(rStr),
            p: parseInt(pStr),
            maxmem: 128 * 1024 * 1024
        });

        return derivedKey.toString('hex') === key;
    } catch (error) {
        return false;
    }
}

const passwordsToTry = ['test', 'test123', '123456', '12345678', 'admin', 'password', 'señaldigital', '1234'];
const hashes = [
    { user: 'test', hash: 'scrypt:32768:8:1$HGiNGuYTmfi6Fh6d$965c0ff97e07d4e4441e4e59033a0ad52a7d22cc91920c6f533e5eff3df152a324213f792f1be88c6ab7bad12bec5cb264c4804db1848b962' },
    { user: 'admin', hash: 'scrypt:32768:8:1$N9eW2A2h1jBwqZ66$a1c6e1e6b8c8f0f0c058c42a5a542b8e4e897914619ba113e3fd5f1e839e5b53147f2db83921ae9b4c02f1025a74d2216503e7be7d2df26c710fadb01cf63d09' }
];

for (const h of hashes) {
    for (const p of passwordsToTry) {
        if (verifyWerkzeugHash(p, h.hash)) {
            console.log(`FOUND! User: ${h.user}, Password: ${p}`);
        }
    }
}
