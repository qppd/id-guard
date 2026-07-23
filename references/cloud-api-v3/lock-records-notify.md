# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/lockRecord/notifyEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Lock Records Notify

This API should be developed yourself on your system, you can set the callback URL in the detail page of your application in [Management Center](/manager).

If your locks are WiFi lock or they are connected to [gateways](/document/doc?urlName=userGuide/gatewayEn.html) , the cloud server will call this callback URL to notify your system when there are new lock records.

Lock records will be automatically uploaded to cloud by the gateway when they are generated, the cloud server will request the callback URL to notify your system in real time.

**Notice: to receive lock records notify, please make sure the lock's administrator have get access token with your application's clientId.**

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

5

1

curl \--location \-g \--request POST 'https://example.com/lockRecord/callback' \\

2

\--data\-urlencode 'notifyType=1' \\

3

\--data\-urlencode 'lockId=163377' \\

4

\--data\-urlencode 'lockMac=AA:BB:CC:DD:EE:FF' \\

5

\--data\-urlencode 'records=\[{"electricQuantity":85,"lockDate":1625025703000,"username":"alexa","serverDate":1628522539000,"recordType":1,"success":1}\]' 

Notice: please replace [https://example.com/lockRecord/callback](https://example.com/lockRecord/callback) with your callback URL.

### 2 Request parameters

Name

Type

Description

notifyType

Int

1, mean lock records notify

lockId

Int

Lock ID

lockMac

String

Lock MAC

records

String

Converting a list of records from a JsonArray to a String, please refer to the example above.

parameters in the records

Parameter

Type

Description

recordType

Int

Record type, refer to: [Record type of cloud](/document/doc?urlName=cloud/lockRecord/recordTypeFromCloudEn.html) for details

success

Int

Is success: 0-No, 1-Yes

username

String

Operator account or username：  
APP user account for records of unlocking by APP  
password name for records of unlocking by passcodes  
Card name for records of unlocking by cards  
Fingerprint name for records of unlocking by fingerprints

keyboardPwd

String

Passcode, card number or fingerprint number

lockDate

Long

Operate time on the lock (timestamp in millisecond).

electricQuantity

Int

Lock battery

serverDate

Long

Time of record uploaded to the cloud server (timestamp in millisecond).

### 3 Response and example

Response a raw string: "success" in the response body.