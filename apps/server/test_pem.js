const rawKey = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDHid9oFtb3nkfX\\n3WZoLgk4F4Uk9VDhlINDlP6Q2BDHh3/ONM0dknTKx8dKrcKRAeuB9svg9SmtF4xd\\nGp6V67dmTciVgreEm13NrASQ8qc6V7KV0lxAYt/OdJp5Vl4s48zw4aJ+OY10FVyc\\n+Jd7F1GCQohlC8aPH55Qa5igdP9rPrwuXLmMaqy6t5w/E/LX9wdQHtg+RAdMlp5Z\\nBG2DRirV36rPVQSjGBLjiSK7gUjmRdvkcH+afR13aKYydrxHr0siUXND2tXUJ4vE\\nmaeNA+3ZZqaiu8RqIhRmuX932nUtR70vDrh+k4Otkp7rwMvrtNGe9nt4uwdKp7mC\\nVHVl+BEdAgMBAAECggEAEagTvUBcIvV+Ek4UkZO/8WyKCxRWulyrutoJ0U5VOcVg\\nhqIpzlFB2sRlJai3hqD+snWLYpYUay0iGLD80ckAZbdB+xI3OVmNf4rBAq8ozg2p\\nj1QEdsFpCs9K8KwMUaOSDx9K2NQwk1I6ljyccYzFg9Btr6dO7tDo74vTKcurOFWL\\nlNpUv46Sapwdj0dzUETmB2fRWRovBS8XhynJxfFzNgEh3UbNQ+PmrgGgKq0tyvIV\\nVzJD2zith4j8ytvmCCuVM4C67YKKbJNGz0VgU1Lofqx7HHcEh1fzZZCRKjbuNrkf\\nvTedQ04nAP7BdIT75hWhTI7S13tHEfbEJ/BwSEZe/wKBgQDuUVik9Kutow1TiR26\\nKZdQWuaTJV7O23K3859L4qlMSmIWq+JG2K5h++CuyD2UZ/BnFjkZnz8fevdlhzgI\\nM0KLyHCn0W4dbrcScQpvCuJPixmDH8oV19zTasJRAHHfr7pjvpt9yv7ydxK0dzIi\\n5I8/Xt2HItxgM1SZXR0EQFIfZwKBgQDWV/JnTzIPRyucpf7vkYuw+GPnFpOQGKQG\\n2HcX8TXaEtgDla+uQhSk3W64I8sPY27v3C0Q963/RYekMQ1xeGvVXjFLe/Qx0x1C\\ne36U2Wx1Uldy05Fhp/YC+b7G7abw3qHv3i1bbj+GPIz6NcPE+b9pcCSikRdj+Uqw\\nT77Sm7Ks2wKBgHELVyAQCyt3L4gTf21h8yujosHjtSAsSjNltYc6ghH1KqgUamYu\\nvDEwWDiwNT2jPA66JOW5eyjEnHulc3e4UPWbY4zHNBN0BBUUV92qbQVMNxLSznok\\nBdSnTHs92cZARgqwTHOUCfEbeFzwOXEBt81Yg35pk91yG8wPtgbhN9M7AoGBANOC\\nCWNEVOOamUCE1OJWPwAsu3hnYMmKZyGSLULk9PzyJ1KyPJ+5+WEOWJlASLowpmHu\\nZFIf9gS1+bld5iQYbmAoCICyGi+oYXEfJ7N+MXY8AKsAdq9k7G/XPhhSnq+FIUrv\\ndNaKHgk6aurkbwBKakWDMcNxZSFz9+2vY1+z4EaNAoGBAIE15PnKolFyR+NVmFmN\\nvwtQucNeQAfd8IJKBc/7TebADM1mkuODTIZMXS2b5xTpISpu0KBiO8QOrqWSWWgJ\\nhW6Jss6d+G2TKCV0UtTqq6XxmUO3ZxIvWWELDeVgb73y9UHplnVUGymBv5RyP1av\\n/ENMmePzAVIkFtoW1tgjBzqm\\n-----END PRIVATE KEY-----\\n";

function sanitizePrivateKey(key) {
    if (!key) return null;
    let sanitized = key.trim();
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
        sanitized = sanitized.slice(1, -1);
    }
    sanitized = sanitized.replace(/\\n/g, '\n');
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    let core = sanitized
        .replace(header, '')
        .replace(footer, '')
        .replace(/\s+/g, '');
    const wrappedCore = core.match(/.{1,64}/g)?.join('\n') || core;
    return `${header}\n${wrappedCore}\n${footer}\n`;
}

const crypto = require('crypto');
try {
    const key = sanitizePrivateKey(rawKey);
    console.log("Parsing key...");
    const parsed = crypto.createPrivateKey(key);
    console.log("SUCCESS! Key type:", parsed.type);
} catch(err) {
    console.error("FAIL:", err.message);
}
