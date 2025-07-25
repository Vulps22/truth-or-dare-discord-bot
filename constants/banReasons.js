// constants/banReasons.js

const questionBanReasons = [
    { label: "1 - Dangerous or Illegal Content", value: "Dangerous Or Illegal Content" },
    { label: "2 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
    { label: "3 - Not In English", value: "Not In English" },
    { label: "4 - Mentions A Specific Person", value: "Mentions A Specific Person" },
    { label: "5 - Incorrect Category Of Question", value: "Incorrect Category Of Question" },
    { label: "6 - Giver Dare", value: "Giver Dare" },
    { label: "7 - Childish Content", value: "Childish Content" },
    { label: "8 - Nonsense Content", value: "Nonsense Content" },
    { label: "9 - Not A Question", value: "Not A Question" },
    { label: "10 - Likely to be Ignored", value: "Likely To Be Ignored" },
    { label: "11 - Requires More Than One Person", value: "Requires More Than One Person" },
    { label: "12 - Low effort", value: "Low effort" },
    { label: "13 - Poor Spelling or Grammar", value: "Poor Spelling Or Grammar - Feel Free to Resubmit with proper Spelling and Grammer" },
    { label: "14 - Other (Custom Reason)", value: "other" },
];

const serverBanReasons = [
    { label: "1 - Breaches Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
    { label: "2 - Server Name suggests members could be under 18", value: "Server Name suggests members could be under 18" },
    { label: "3 - Server Activity suggests members could be under 18", value: "Server Activity suggests members could be under 18" },
    { label: "3 - Server Name contains Hate Speech", value: "Server Name contains Hate Speech" },
    { label: "4 - Confirmed server members are under 18", value: "Confirmed members are under 18" },
    { label: "5 - Server-wide creation spam", value: "Server-wide creation spam" },
    { label: "6 - Other (Custom Reason)", value: "other" },
];

const userBanReasons = [
    { label: "1 - Breached Discord T&C or Community Guidelines", value: "Breaches Discord T&C or Community Guidelines" },
    { label: "2 - Suspected Under 18 User", value: "Suspected Under 18 User" },
    { label: "3 - Activity Suggests User Could Be Under 18", value: "Activity suggests user could be under 18" },
    { label: "3 - Name Contains Hate Speech", value: "Name contains Hate Speech" },
    { label: "4 - Confirmed User is Under 18", value: "Confirmed user is under 18" },
    { label: "5 - Creation Spam", value: "creation spam" },
    { label: "6 - Other (Custom Reason)", value: "other" },
];

module.exports = {
  questionBanReasons,
  userBanReasons,
  serverBanReasons,
};