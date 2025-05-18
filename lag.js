const { spawn } = require('child_process');

let previousProcess = null;
let cycle = 0;

function startBotProcess() {
    cycle++;
    console.log(`Starting botCycle.js (Cycle ${cycle})`);

    const newProcess = spawn('node', ['botCycle.js'], { stdio: 'inherit' });

    if (previousProcess) {
        console.log(`Killing botCycle.js (Cycle ${cycle - 1})`);
        previousProcess.kill('SIGTERM');
    }

    previousProcess = newProcess;

    setTimeout(() => {
        startBotProcess();
    }, 8800);
}

startBotProcess();
