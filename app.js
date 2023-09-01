const openAiQuery = require("./utils/openAiQuery");

require("dotenv").config(); // load environment variables from .env file
// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
const token = process.env.WHATSAPP_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

// Accepts POST requests at /webhook endpoint
app.post("/webhook", async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let from_name = req.body.entry[0].changes[0].value.contacts[0].profile.name
      let type = req.body.entry[0].changes[0].value.messages[0].type; 
      if(type === "text") {
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
        let body = "";
        if(msg_body === "Hi" || msg_body === "hi" || msg_body === "Hello" || msg_body === "hello") {
            body = `Hi, I am your personal assistant. I can help you with your sales call amd sync it to your CRM. Please send me the transcript of the sales call.
            Example format:
            Company name: Central Perk
            Company PoC: Chandler
            PoC Role: Creative Head

            Sale person name: Abhinav
            Role: Business Head
            
            Transcript: What did you guys speak about?
            `
        } else {
            const insights = await openAiQuery(msg_body, 'text');
            body = insights ? `
            Successfully pushed to CRM. Send *Hi* to start again. Looking forward to help you again. Have a kickass day!
            ` : "Something went wrong";
        }
        axios({
            method: "POST", // Required, HTTP method, a string, e.g. POST, GET
            url:
              "https://graph.facebook.com/v12.0/" +
              phone_number_id +
              "/messages?access_token=" +
              token,
            data: {
              messaging_product: "whatsapp",
              to: from,
              text: { body: body },
            },
            headers: { "Content-Type": "application/json" },
          });
      } else if (type === "audio") {
        let mediaId = req.body.entry[0].changes[0].value.messages[0].audio.id;
        const transcriptResponse = await axios.post(`http://localhost:8000/get/transcript`, {
            media_id: mediaId,
        },{
            headers: { 
                "Authorization": "Bearer YWRtaW4="
            }
        })

        const transcript = transcriptResponse.data.transcript;

        const insights = await openAiQuery(transcript, 'text');

        const body = insights ? `
        Successfully pushed to CRM. Send *Hi* to start again. Looking forward to help you again. Have a kickass day!
        ` : "Something went wrong";

        axios({
            method: "POST", // Required, HTTP method, a string, e.g. POST, GET
            url:
              "https://graph.facebook.com/v12.0/" +
              phone_number_id +
              "/messages?access_token=" +
              token,
            data: {
              messaging_product: "whatsapp",
              to: from,
              text: { body: body },
            },
            headers: { "Content-Type": "application/json" },
          });

      } 
      
      else  {
        axios({
            method: "POST", // Required, HTTP method, a string, e.g. POST, GET
            url:
              "https://graph.facebook.com/v12.0/" +
              phone_number_id +
              "/messages?access_token=" +
              token,
            data: {
              messaging_product: "whatsapp",
              to: from,
              text: { body: "Unsupported Format" },
            },
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      res.sendStatus(200);

  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests 
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
  **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
