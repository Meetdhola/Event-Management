const { spawn } = require('child_process');
const path = require('path');

const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const heuristicFallback = (text = '') => {
    const positiveWords = ['great', 'awesome', 'excellent', 'good', 'happy', 'love', 'perfect', 'amazing', 'smooth', 'helpful', 'efficient'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'sad', 'hate', 'delay', 'expensive', 'rude', 'unhelpful', 'slow', 'broken'];

    const words = String(text).toLowerCase().split(/\W+/).filter(Boolean);
    let score = 0;

    for (const word of words) {
        if (positiveWords.includes(word)) score += 1;
        if (negativeWords.includes(word)) score -= 1;
    }

    const normalized = words.length === 0 ? 0 : Math.max(-1, Math.min(1, score / Math.max(5, words.length / 4)));
    const label = normalized > 0.2 ? 'positive' : normalized < -0.2 ? 'negative' : 'neutral';

    return {
        label,
        ensemble_score: Number(normalized.toFixed(4)),
        confidence: Number(Math.min(1, Math.abs(normalized)).toFixed(4)),
        sources: {
            huggingface: null,
            textblob: null,
            vader: null,
            fallback: true
        }
    };
};

const runPythonSentiment = (text) => {
    return new Promise((resolve, reject) => {
        const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
        const scriptPath = process.env.SENTIMENT_SCRIPT_PATH
            ? path.resolve(process.env.SENTIMENT_SCRIPT_PATH)
            : path.resolve(__dirname, '../nlp/sentiment_ensemble.py');

        const child = spawn(pythonExecutable, [scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', (error) => {
            reject(new Error(`Python process error: ${error.message}`));
        });

        child.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python sentiment process failed (${code}): ${stderr || 'No stderr output'}`));
            }

            try {
                const parsed = JSON.parse(stdout || '{}');
                resolve(parsed);
            } catch (error) {
                reject(new Error(`Invalid JSON from sentiment script: ${error.message}`));
            }
        });

        child.stdin.write(JSON.stringify({ text: String(text || '') }));
        child.stdin.end();
    });
};

const analyzeFeedbackSentiment = async (text = '') => {
    if (!String(text || '').trim()) {
        return {
            label: 'neutral',
            ensemble_score: 0,
            confidence: 0,
            sources: {
                huggingface: null,
                textblob: null,
                vader: null,
                fallback: false
            }
        };
    }

    try {
        const pythonResult = await runPythonSentiment(text);
        return {
            label: pythonResult.label || 'neutral',
            ensemble_score: toNumber(pythonResult.ensemble_score, 0),
            confidence: toNumber(pythonResult.confidence, 0),
            sources: {
                huggingface: pythonResult.huggingface || null,
                textblob: pythonResult.textblob || null,
                vader: pythonResult.vader || null,
                fallback: false
            }
        };
    } catch (error) {
        console.error('Sentiment Python pipeline failed, using fallback:', error.message);
        return heuristicFallback(text);
    }
};

module.exports = {
    analyzeFeedbackSentiment
};
