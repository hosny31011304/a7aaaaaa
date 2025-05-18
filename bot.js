const WebSocket = require('ws');
const https = require('https');

const MAX_NAME_LENGTH = 18;
const MAX_PARALLEL_BOTS = 500; // الحد الأقصى للبوتات المتوازية في كل مرة

const charToHex = {
    " ": "0020",
    "ا": "0627", "ب": "0628", "ت": "062a", "ث": "062b", "ج": "062c",
    "ح": "062d", "خ": "062e", "د": "062f", "ذ": "0630", "ر": "0631",
    "ز": "0632", "س": "0633", "ش": "0634", "ص": "0635", "ض": "0636",
    "ط": "0637", "ظ": "0638", "ع": "0639", "غ": "063a", "ف": "0641",
    "ق": "0642", "ك": "0643", "ل": "0644", "م": "0645", "ن": "0646",
    "ه": "0647", "و": "0648", "ي": "064a",
    "a": "0061", "b": "0062", "c": "0063", "d": "0064", "e": "0065",
    "f": "0066", "g": "0067", "h": "0068", "i": "0069", "j": "006a",
    "k": "006b", "l": "006c", "m": "006d", "n": "006e", "o": "006f",
    "p": "0070", "q": "0071", "r": "0072", "s": "0073", "t": "0074",
    "u": "0075", "v": "0076", "w": "0077", "x": "0078", "y": "0079",
    "z": "007a",
    "1": "0031", "2": "0032", "3": "0033", "4": "0034", "5": "0035",
    "6": "0036", "7": "0037", "8": "0038", "9": "0039", "0": "0030"
};

function encodeMessage(text) {
    const filteredChars = [...text].filter(c => charToHex.hasOwnProperty(c.toLowerCase()));
    const length = filteredChars.length;
    const hexBody = filteredChars.map(c => charToHex[c.toLowerCase()]).join('');

    if (length >= 10 && length <= 18) {
        const hexMap = {
            10: "810af00000230a",
            11: "810af00000230b",
            12: "810af00000230c",
            13: "810af00000230d",
            14: "810af00000230e",
            15: "810af00000230f",
            16: "810af000002310",
            17: "810af000002311",
            18: "810af000002312"
        };
        return hexMap[length] + hexBody;
    } else {
        return "810af00000230" + length + hexBody;
    }
}

function createControlPacket(angle, boost = false) {
    let angleValue = Math.floor((angle / (2 * Math.PI)) * 128) % 128;
    if (boost) angleValue |= 128;
    return Buffer.from([angleValue]);
}

function loadConfigFromUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const config = JSON.parse(data);

                    if (!config.serverUrl.startsWith('wss://')) {
                        reject(new Error("❌ Server URL must start with wss://"));
                        return;
                    }

                    if (config.message.length > MAX_NAME_LENGTH) {
                        reject(new Error(`❌ Name must be ${MAX_NAME_LENGTH} characters or less.`));
                        return;
                    }

                    resolve(config);
                } catch (err) {
                    reject(new Error("⚠️ Error parsing JSON: " + err.message));
                }
            });
        }).on('error', err => reject(err));
    });
}

function startBot(i, serverUrl, message) {
    const ws = new WebSocket(serverUrl);

    ws.on('open', () => {
        console.log(`🤖 Bot ${i + 1} connected`);
        const hexPayload = encodeMessage(message);
        const buffer = Buffer.from(hexPayload, 'hex');
        ws.send(buffer);

        let currentAngle = Math.random() * 2 * Math.PI;
        let lastAngleChange = Date.now();

        function moveBot() {
            if (ws.readyState === WebSocket.OPEN) {
                if (Date.now() - lastAngleChange > 100) {
                    const changeAngle = (Math.random() - 0.5) * Math.PI * 1.5;
                    currentAngle += changeAngle;
                    lastAngleChange = Date.now();
                }
                currentAngle += (Math.random() - 0.5) * 0.2;
                const boost = Math.random() < 0.9;
                const controlPacket = createControlPacket(currentAngle, boost);
                ws.send(controlPacket);
            }
            // Call moveBot again immediately
            setImmediate(moveBot);
        }

        // Start moving the bot
        setImmediate(moveBot);
    });

    ws.on('close', () => {
        console.log(`✖ Bot ${i + 1} disconnected`);
    });

    ws.on('error', (err) => {
        console.error(`❕Bot ${i + 1} error: ${err.message}`);
    });
}

function startBots(serverUrl, message) {
    let botCount = 0;

    // Create a limited number of bots at a time (controlled parallelism)
    setInterval(() => {
        if (botCount < MAX_PARALLEL_BOTS) {
            botCount++;
            startBot(botCount, serverUrl, message);
        } else {
            console.log(`Max number of parallel bots (${MAX_PARALLEL_BOTS}) reached.`);
        }
    }, 0); // Launch a bot every 100ms (يمكنك ضبط التوقيت حسب الحاجة)
}

const configUrl = 'https://khatab.store/omar/confing.json';

loadConfigFromUrl(configUrl)
    .then(({ serverUrl, message }) => {
        startBots(serverUrl, message);
    })
    .catch(err => {
        console.error(err.message);
        process.exit(1);
    });
