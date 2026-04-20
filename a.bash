curl -X POST "http://rescuegroups-proxy-alb-nonprod-1050928217.us-west-2.elb.amazonaws.com/v2.json"      -H 'Authorization: Bearer 9jyN3X9cnxqAoezNXNzEjKCMgH-qL'      -H 'Content-Type: application/json'      -d $'{
      "values": [
        {
          "journalEntryEntrytypeID": "60461",
          "journalEntryDate": "3/24/2023",
          "journalEntryComment": "Test observation-behavior journal",
          "journalEntryAnimalID": "19013760"
        }
      ],
      "objectAction": "add",
      "objectType": "animalsJournalEntries"
}'

curl -X POST "http://rescuegroups-proxy-alb-nonprod-1050928217.us-west-2.elb.amazonaws.com/v2.json"      -H 'Authorization: Bearer 9jyN3X9cnxqAoezNXNzEjKCMgH-qL' \
     -H 'Content-Type: application/json' \
     -d $'{
      "values": [
        {
          "journalEntryID": "6775497",
          "journalEntryComment": "This is a updating an observation-behavior journal"
        }
      ],
      "objectAction": "edit",
      "objectType": "animalsJournalEntries"
}'
curl -X POST "http://rescuegroups-proxy-alb-nonprod-1050928217.us-west-2.elb.amazonaws.com/v2.json" \
  -H "Authorization: Bearer 9jyN3X9cnxqAoezNXNzEjKCMgH-qL" \
  -H "Content-Type: application/json" \
  -d '{
    "objectType": "animalsJournalEntries",
    "objectAction": "search",
    "search": {
      "fields": [
        "journalEntryID",
        "journalEntryAnimalID",
        "journalEntryDate",
        "journalEntryEntrytypeID",
        "journalEntryComment"
      ],
      "filters": [
        {
          "fieldName": "journalEntryAnimalID",
          "operation": "equals",
          "criteria": "22371961"
        }
      ]
    }
  }'

  curl -X POST "http://rescuegroups-proxy-alb-nonprod-1050928217.us-west-2.elb.amazonaws.com/v2.json" \
  -H 'Authorization: Bearer 9jyN3X9cnxqAoezNXNzEjKCMgH-qL' \
  -H 'Content-Type: application/json' \
  -d '{
    "objectType": "animalsJournalEntries",
    "objectAction": "delete",
    "values": [
      {
        "journalEntryID": "6775497"
      }
    ]
  }'