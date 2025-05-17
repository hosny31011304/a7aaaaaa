const WebSocket = require('ws');
const chalk = require('chalk');
const readline = require('readline');
const https = require('https');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const MAX_NAME_LENGTH = 18;
const MAX_BOT_COUNT = 5000;
const API_KEY = 'v3';

const franceServers = [
    "wss://gra-a.wormate.io:31038/wormy",
    "wss://vin-a.wormate.io:32465/wormy",
    "wss://gra-a.wormate.io:32223/wormy",
    "wss://gra-a.wormate.io:30265/wormy",
    "wss://gra-a.wormate.io:30909/wormy",
    "wss://gra-a.wormate.io:31038/wormy",
    "wss://gra-a.wormate.io:31695/wormy",
    "wss://gra-a.wormate.io:31819/wormy",
    "wss://gra-a.wormate.io:32054/wormy",
    "wss://gra-a.wormate.io:30171/wormy",
    "wss://gra-a.wormate.io:32054/wormy",
    "wss://gra-a.wormate.io:32054/wormy",
    "wss://gra-a.wormate.io:31038/wormy",
    "wss://gra-a.wormate.io:31533/wormy"
];
const germanyServers = [
    "wss://fra-c.wormate.io:30055/wormy",
    "wss://fra-c.wormate.io:30106/wormy",
    "wss://fra-c.wormate.io:30259/wormy",
    "wss://fra-c.wormate.io:30055/wormy",
    "wss://fra-c.wormate.io:30055/wormy",
    "wss://fra-c.wormate.io:31819/wormy",
    "wss://fra-c.wormate.io:31163/wormy",
    "wss://fra-c.wormate.io:31750/wormy",
    "wss://fra-c.wormate.io:30171/wormy",
    "wss://fra-c.wormate.io:31339/wormy",
    "wss://fra-c.wormate.io:32054/wormy",
    "wss://fra-c.wormate.io:30657/wormy",
    "wss://fra-c.wormate.io:32054/wormy",
    "wss://fra-c.wormate.io:31695/wormy",
    "wss://fra-c.wormate.io:30055/wormy",
    "wss://fra-c.wormate.io:31038/wormy",
    "wss://fra-c.wormate.io:30208/wormy",
    "wss://fra-c.wormate.io:32584/wormy",
    "wss://fra-c.wormate.io:30140/wormy",
    "wss://fra-c.wormate.io:30702/wormy",
    "wss://fra-c.wormate.io:30725/wormy",
    "wss://fra-c.wormate.io:30135/wormy",
    "wss://fra-c.wormate.io:30809/wormy",
    "wss://fra-c.wormate.io:31084/wormy",
    "wss://fra-c.wormate.io:31091/wormy",
    "wss://fra-c.wormate.io:31533/wormy",
    "wss://fra-c.wormate.io:30510/wormy",
    "wss://fra-c.wormate.io:31230/wormy",
    "wss://fra-c.wormate.io:30909/wormy",
    "wss://fra-c.wormate.io:30327/wormy",
    "wss://fra-c.wormate.io:31908/wormy",
    "wss://fra-c.wormate.io:32405/wormy",
    "wss://fra-c.wormate.io:32577/wormy",
    "wss://fra-c.wormate.io:30161/wormy",
    "wss://fra-c.wormate.io:31123/wormy",
    "wss://fra-c.wormate.io:31451/wormy",
    "wss://fra-c.wormate.io:31392/wormy",
    "wss://fra-c.wormate.io:30371/wormy",
    "wss://fra-c.wormate.io:30265/wormy",
    "wss://fra-c.wormate.io:31859/wormy",
    "wss://fra-c.wormate.io:32611/wormy"
];


const banner = `
 ____    ___  ___    ______    ______    __        ______      ___       __   __   _______  __      
|___ \\  |   \\/   |  /  __  \\  |   _  \\  |  |      |   _  \\    /   \\     |  \\ |  | |   ____||  |     
  __) | |  \\  /  | |  |  |  | |  |_)  | |  |      |  |_)  |  /  ^  \\    |   \\|  | |  |__   |  |     
 |__ <  |  |\\/|  | |  |  |  | |      /  |  |      |   ___/  /  /_\\  \\   |       | |   __|  |  |     
 ___) | |  |  |  | |  \`--'  | |  |\\  \\  |  |      |  |     /  _____  \\  |  |\\   | |  |____ |  \`----.
|____/  |__|  |__|  \\______/  | _| \`._| |__|      | _|    /__/     \\__\\ |__| \\__| |_______||_______| 
`;
console.log(chalk.hex('#8000ff')(banner));

let connectedBots = 0;
let disconnectedBots = 0;

function showStatus(total) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(chalk.green(`Connected: ${connectedBots}/${total}`) + chalk.red(` | Disconnected: ${disconnectedBots}`));
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function ask(q, clearLinesAbove = 1) {
    return new Promise(resolve => {
        rl.question(chalk.cyan(q), answer => {
            for (let i = 0; i <= clearLinesAbove; i++) {
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 0);
            }
            resolve(answer);
        });
    });
}

async function askQuestions() {
    console.log(chalk.cyan('1- Custom'));
    console.log(chalk.cyan('2- Timmap'));
    const serverType = await ask('Select server type: ', 2);

    let serverUrl = '';
    if (serverType === '2') {
        console.log(chalk.cyan('1- France'));
        console.log(chalk.cyan('2- Germany'));
        const country = await ask('Select country: ', 2);

        let servers = [];
        if (country === '1') servers = franceServers;
        else if (country === '2') servers = germanyServers;
        else {
            console.error(chalk.red('Invalid country.'));
            process.exit(1);
        }

        const num = await ask(`Select server number 1 - ${servers.length}: `, 0);
        const index = parseInt(num);
        if (isNaN(index) || index < 1 || index > servers.length) {
            console.error(chalk.red('Invalid server number.'));
            process.exit(1);
        }

        serverUrl = servers[index - 1];
    } else if (serverType === '1') {
        serverUrl = await ask('Enter server URL: ', 0);
        if (!serverUrl.startsWith('wss://')) {
            console.error(chalk.red('Invalid URL.'));
            process.exit(1);
        }
    } else {
        console.error(chalk.red('Invalid option.'));
        process.exit(1);
    }

    const message = await ask('Enter name: ', 0);
    if (message.length > MAX_NAME_LENGTH) {
        console.error(chalk.red(`Name must be max ${MAX_NAME_LENGTH} characters.`));
        process.exit(1);
    }

    const countRaw = await ask('Enter bot count: ', 0);
    const botCount = parseInt(countRaw);
    if (isNaN(botCount) || botCount < 1 || botCount > MAX_BOT_COUNT) {
        console.error(chalk.red(`Bot count must be between 1 and ${MAX_BOT_COUNT}.`));
        process.exit(1);
    }

    rl.close();
    return { serverUrl, message, botCount };
}

const charToHex = {
    " ": "0020", "ا": "0627", "ب": "0628", "ت": "062a", "ث": "062b", "ج": "062c",
    "ح": "062d", "خ": "062e", "د": "062f", "ذ": "0630", "ر": "0631", "ز": "0632",
    "س": "0633", "ش": "0634", "ص": "0635", "ض": "0636", "ط": "0637", "ظ": "0638",
    "ع": "0639", "غ": "063a", "ف": "0641", "ق": "0642", "ك": "0643", "ل": "0644",
    "م": "0645", "ن": "0646", "ه": "0647", "و": "0648", "ي": "064a",
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
    const chars = [...text].filter(c => charToHex.hasOwnProperty(c.toLowerCase()));
    const length = chars.length;
    const hexBody = chars.map(c => charToHex[c.toLowerCase()]).join('');

    const prefix = {
        10: "810af00000230a", 11: "810af00000230b", 12: "810af00000230c",
        13: "810af00000230d", 14: "810af00000230e", 15: "810af00000230f",
        16: "810af000002310", 17: "810af000002311", 18: "810af000002312"
    };

    return (prefix[length] || "810af00000230" + length.toString(16)) + hexBody;
}

function getDeviceId() {
    const interfaces = os.networkInterfaces();
    const macs = Object.values(interfaces).flat().map(i => i.mac).join('');
    const hash = crypto.createHash('sha256').update(macs + os.hostname()).digest('hex').slice(0, 16);
    return hash;
}

function checkRemoteConfig(url) {
    const deviceId = getDeviceId();
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.apiKey === API_KEY && json.enabled === 1 && json.allowedDevices?.includes(deviceId));
                } catch {
                    reject('Invalid JSON');
                }
            });
        }).on('error', err => reject(err.message));
    });
}

async function startBots() {
    const { serverUrl, message, botCount } = await askQuestions();
    const hexPayload = encodeMessage(message);
    const buffer = Buffer.from(hexPayload, 'hex');

    function createControlPacket(angle, boost = false) {
        let angleValue = Math.floor((angle / (2 * Math.PI)) * 128) % 128;
        if (boost) angleValue |= 128;
        return Buffer.from([angleValue]);
    }

    for (let i = 0; i < botCount; i++) {
        const ws = new WebSocket(serverUrl);

        ws.on('open', () => {
            connectedBots++;
            showStatus(botCount);
            ws.send(buffer);

            let currentAngle = Math.random() * 2 * Math.PI;
            let lastChange = Date.now();

            const interval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    if (Date.now() - lastChange > 100) {
                        currentAngle += (Math.random() - 0.5) * Math.PI * 1.5;
                        lastChange = Date.now();
                    }
                    currentAngle += (Math.random() - 0.5) * 0.2;
                    const boost = Math.random() < 0.9;
                    ws.send(createControlPacket(currentAngle, boost));
                } else {
                    clearInterval(interval);
                }
            }, 30);
        });

        ws.on('close', () => {
            disconnectedBots++;
            showStatus(botCount);
        });

        ws.on('error', () => {
            disconnectedBots++;
            showStatus(botCount);
        });
    }
}

(async () => {
    try {
        const enabled = await checkRemoteConfig('https://khatab.store/js/active.json');
        if (!enabled) {
            const rawData = await new Promise((resolve, reject) => {
                https.get('https://khatab.store/js/active.json', res => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(data));
                }).on('error', err => reject(err.message));
            });

            try {
                const json = JSON.parse(rawData);
                if (json.enabled !== 1) {
                    console.log(chalk.red('Tool is not active now.'));
                    console.log(chalk.yellow('tiktok : rce_w'));
                    console.log(chalk.yellow('Telegram : i3_000'));
                    console.log(chalk.yellow('Discord : .w7_'));
                } else {
                    const id = getDeviceId();
                    console.log(chalk.red('Not athorized.'));
                    console.log(chalk.green(`Id: ${id}`));
                    console.log(chalk.yellow('Send  this to 3mori.'));
                    console.log(chalk.yellow('Tiktok : rce_w'));
                    console.log(chalk.yellow('Telegram : i3_000'));
                    console.log(chalk.yellow('Discord : .w7_'));
                }
            } catch {
                console.log(chalk.red('Error'));
            }

            console.log(chalk.red('Press Enter to exit.'));
            process.stdin.once('data', () => process.exit(0));
            return;
        }

        await startBots();
    } catch {
        console.error(chalk.red('Error'));
        process.exit(1);
    }
})();