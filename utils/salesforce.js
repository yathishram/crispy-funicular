require("dotenv").config();
const axios = require("axios").default;

const pushToSalesforce = async (data) => {
  const instance_url = process.env.SALESFORCE_INSTANCE_URL;
  let access_token = process.env.SALESFORCE_ACCESS_TOKEN  
  const refresh_token = process.env.SALESFORCE_REFRESH_TOKEN  
  const url = `${instance_url}/services/data/v58.0/sobjects/Opportunity`;
  const headers = { Authorization: `Bearer ${access_token}` };

  try {
    const response = await axios.post(url, data, { headers });

    if (response.status === 201) {
      return true;
    }
  } catch (err) {
    if (err.response && (err.response.data.errorCode === "INVALID_SESSION_ID" || err.response.status === 401)) {
      try {
        const refresh_token_url = `${instance_url}/services/oauth2/token?client_id=${process.env.SALESFORCE_CLIENT_ID}&client_secret=${process.env.SALESFORCE_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${refresh_token}&format=json`;

        const access_token_response = await axios.post(refresh_token_url);
        access_token = access_token_response.data.access_token;
        headers.Authorization = `Bearer ${access_token}`;

        const response = await axios.post(url, data, { headers });

        if (response.status === 201) {
          return true;
        }

      } catch (err) {
        console.error('Error refreshing access token and retrying:', err.response ? err.response.data : err.message);
        return false;
      }
    } else {
      console.error('Error pushing data to Salesforce:', err.response ? err.response.data : err.message);
      return false;
    }
  }
};

module.exports = pushToSalesforce;
