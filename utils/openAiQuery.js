const OpenAI = require('openai');
const convertResponseToJSON = require('./helpers');
const pushToSalesforce = require('./salesforce');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const pre_prompt = `Persona: Imagine you are an expert sales manager skilled in creating meeting scripts and extracting meaningful insights that can help convert leads to potential customers.

Action: Assist in converting the sales call transcript to obtain meaningful information that can be linked to salesforce and it's easier to make sense of the sales call. `


const post_prompt = `Format: The insights should be of JSON format consisting of the following. Remember if those data points for the JSON fields doesn't exist keep it blank, don't make up the answers. Just give us meaningful insights and extract the data. But we are syncing it to salesforce, if you find any other relevant data within it add it as a field.
{
Opportunity Name: 
Next Step:
Business Case / Metric:
Date of Follow up:
Decision Criteria:
Decision Process:
Pain Point:
User-Case:
Buyer:
Pricing Reaction:
Questions Asked:
Customer Doubts:
}`


const openAiQuery = async (query, format) => { 
    try{
        if(format === 'text'){
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo-16k',
                messages: [
                    {
                        role: 'user',
                        content: pre_prompt + query + post_prompt
                    }
                ]
            })

            const salesforceData = convertResponseToJSON(response['choices'][0]['message']['content'], query);

            const result = await pushToSalesforce(salesforceData);

            return result;
        }

    }catch(err){
        console.log(err);
        return null;
    }
}

module.exports = openAiQuery;
