import fs from 'fs';
import axios from 'axios';

// Update this path to the location of your JSON file
const dataFilePath = '../data/unitData2.json';

// Load JSON data from a file
const loadData = (filePath) => {
  try {
    const rawData = fs.readFileSync(filePath);
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error loading JSON data:", error);
    return null;
  }
};

// Send JSON data to the LLM using chat completions format
const analyzeDataWithLLM = async (data, temperature, retries = 3) => {
  const endpoint = 'http://localhost:1234/v1/chat/completions';

  // Define the prompt with refined instructions
  const prompt = `
  You are provided with a JSON dataset containing information about units. Each unit has a unique "id" and several properties, including "name" and "points". Your task is to identify each unit and return only the "name" and "points" fields for each unit.

  Please iterate through each unit and return a JSON array with objects in the following format:
  [
    { "id": <unit id>, "name": "<unit name>", "points": <unit points> },
    { "id": <unit id>, "name": "<unit name>", "points": <unit points> },
    ...
  ]

  Return only the JSON array. Do not include any variable declarations, explanations, code blocks, or additional formatting. The output should look exactly like a JSON array, with no extra words, comments, or other symbols around it.
  `;

  const payload = {
    model: 'llama', // Replace with the actual model name you're using
    messages: [
      {
        role: 'user',
        content: prompt,
      },
      {
        role: 'system',
        content: JSON.stringify(data),
      }
    ],
    temperature: temperature || 0.3,
    max_tokens: 500
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
      });

      // Clean the response by removing variable declarations or other extraneous text
      let responseText = response.data.choices[0].message.content;
      
      // Remove any code-like structures, keeping only the JSON array
      responseText = responseText.replace(/^[^{[]+/, '').replace(/[^}\]]+$/, '').trim();

      // Attempt to parse JSON after cleanup
      return JSON.parse(responseText);
    } catch (error) {
      console.error(`Attempt ${attempt} failed. Error parsing LLM response:`, error.message);
      if (attempt === retries) {
        console.error("Max retries reached. Could not parse LLM response.");
      }
    }
  }
  return null;
};

// Accumulate and merge unique results across multiple attempts
const accumulateResults = (accumulatedData, newData) => {
  newData.forEach((entry) => {
    // Check for unique entries by id
    if (!accumulatedData.some((existing) => existing.id === entry.id)) {
      accumulatedData.push(entry);
    }
  });
  return accumulatedData;
};

// Main function to run multiple attempts for improved accuracy
const main = async (numAttempts = 5) => {
  const data = loadData(dataFilePath);
  if (!data) return;

  let accumulatedResults = [];
  let temperature = 0.3;

  for (let i = 0; i < numAttempts; i++) {
    console.log(`Attempt ${i + 1}/${numAttempts}...`);
    const llmResponse = await analyzeDataWithLLM(data, temperature);
    
    if (llmResponse) {
      accumulatedResults = accumulateResults(accumulatedResults, llmResponse);
    }

    // Adjust temperature slightly to see if results vary
    temperature = Math.min(temperature + 0.1, 0.8);
  }

  console.log("Final accumulated results:", accumulatedResults);
};

// Execute the script
main();
