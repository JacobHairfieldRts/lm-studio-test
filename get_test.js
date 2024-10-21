import fetch from 'node-fetch';

async function getModels() {
    const url = 'http://localhost:1234/v1/models';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error fetching models: ${response.statusText}`);
        }
        const models = await response.json();
        console.log("Available models:", models);
    } catch (error) {
        console.error("Error:", error);
    }
}

getModels();
