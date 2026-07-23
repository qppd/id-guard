# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/gateway/transferEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Transfer Gateway

**`https://euapi.ttlock.com/v3/gateway/transfer`**

The Selected Gateway(s) will be Permanently Transferred to the receiver accout.

Notice：The lock and gateway must belong to the same administrator account, otherwise, they can't connect each other. You should also transfer the related locks to the receiver account, refer to cloud API: [Transfer lock](/document/doc?urlName=cloud/lock/transferEn.html).

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/gateway/transfer' \\

\--data\-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \\

\--data\-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \\

\--data\-urlencode 'receiverUsername=lock@google.com' \\

\--data\-urlencode 'gatewayIdList=\[78979,78980\]' \\

\--data\-urlencode 'date=1625025703000'

### 2 Request parameters

Name

Type

Required

Description

clientId

String

Y

client\_id from [Create application](/CreateApplication)

accessToken

String

Y

Access token，refer to: [Get access token](/document/doc?urlName=cloud/oauth2/getAccessTokenEn.html)

receiverUsername

String

Y

The receiver's username, must be a registered account.

gatewayIdList

String

Y

Gateway ID list, example:\[1234,3332\]

date

Long

Y

Current time (timestamp in millisecond)

### 3 Response and example

Parameter

Type

Description

errcode

Int

Error code

errmsg

String

Error message

xxxxxxxxxx

{

    "errcode": 0, 

    "errmsg": "none error message"

}