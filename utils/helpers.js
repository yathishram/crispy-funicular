const convertResponseToJSON = (response, original_message) => { 
    const data = JSON.parse(response);

    const convertedData = {
        Name: data["Opportunity Name"],
        StageName: "Qualify",
        NextStep: data["Next Step"],
        Business_Case__c: data["Business Case / Metric"],
        Date_of_Follow_up__c: data["Date of Follow up"],
        Decision_Criteria__c: data["Decision Criteria"],
        Decision_Process__c: data["Decision Process"],
        Pain_Point__c: data["Pain Point"],
        User_Case__c: data["User-Case"],
        Buyer__c: data["Buyer"],
        Questions_Asked__c: JSON.stringify(data["Questions Asked"]),
        Customer_Doubts__c: JSON.stringify(data["Customer Doubts"]),
        CloseDate: calculateCloseDate(),
        additional__c: original_message
    };

    return convertedData;
}

function calculateCloseDate() {
    const today = new Date();
    const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    return formatDate(twoWeeksFromNow);
}

function formatDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

module.exports = convertResponseToJSON;