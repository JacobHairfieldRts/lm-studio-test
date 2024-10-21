import fetch from 'node-fetch';

async function chatCompletions(prompt) {
    const url = 'http://localhost:1234/v1/chat/completions';

    const body = {
        model: 'your-model-name', // Replace with the actual model name from the `/v1/models` response
        messages: [{ role: 'user', content: prompt }], // The user's message
    };

    try {
        console.log("Waiting for server response...");
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Error with chat completions: ${response.statusText}`);
        }

        const result = await response.json();

        // Access the message content in the `choices[0].message.content`
        const messageContent = result.choices[0].message.content;
        console.log("LLM response message:", messageContent);
        

    } catch (error) {
        console.error("Error:", error);
    }
}

// Example usage:
chatCompletions('Hello, what is the best way to clean hardwood floors?');

