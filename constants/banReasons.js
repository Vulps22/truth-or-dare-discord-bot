// constants/banReasons.js

const questionBanReasons = [
    { name: "1 - Dangerous or Illegal Content", value: "Dangerous Or Illegal Content" },
    { name: "2 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
    { name: "3 - Not In English", value: "Not In English" },
    { name: "4 - Mentions A Specific Person", value: "Mentions A Specific Person" },
    { name: "5 - Incorrect Category Of Question", value: "Incorrect Category Of Question" },
    { name: "6 - Giver Dare", value: "Giver Dare" },
    { name: "7 - Childish Content", value: "Childish Content" },
    { name: "8 - Nonsense Content", value: "Nonsense Content" },
    { name: "9 - Not A Question", value: "Not A Question" },
    { name: "10 - Likely to be Ignored", value: "Likely To Be Ignored" },
    { name: "11 - Requires More Than One Person", value: "Requires More Than One Person" },
    { name: "12 - Low effort", value: "Low effort" },
    { name: "13 - Poor Spelling or Grammar", value: "Poor Spelling Or Grammar - Feel Free to Resubmit with proper Spelling and Grammer" },
    { name: "14 - Other (Custom Reason)", value: "other" },
];

const serverBanReasons = [
    { name: "1 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
    { name: "2 - Server Name suggests members could be under 18", value: "Server Name suggests members could be under 18" },
    { name: "3 - Server Activity suggests members could be under 18", value: "Server Activity suggests members could be under 18" },
    { name: "3 - Server Name contains Hate Speech", value: "Server Name contains Hate Speech" },
    { name: "4 - Confirmed server members are under 18", value: "Confirmed members are under 18" },
    { name: "5 - Server-wide creation spam", value: "Server-wide creation spam" },
    { name: "6 - Other (Custom Reason)", value: "other" },
];

const userBanReasons = [
    { name: "1 - Breached Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
    { name: "2 - Suspected Under 18 User", value: "Suspected Under 18 User" },
    { name: "3 - Activity Suggests User Could Be Under 18", value: "Activity suggests user could be under 18" },
    { name: "3 - Name Contains Hate Speech", value: "Name contains Hate Speech" },
    { name: "4 - Confirmed User is Under 18", value: "Confirmed user is under 18" },
    { name: "5 - Creation Spam", value: "creation spam" },
    { name: "6 - Other (Custom Reason)", value: "other" },
];

module.exports = {
  questionBanReasons,
  userBanReasons,
  serverBanReasons,
};