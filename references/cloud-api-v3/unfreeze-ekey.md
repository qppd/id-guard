# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/ekey/unfreezeEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Unfreeze ekey

**`https://euapi.ttlock.com/v3/key/unfreeze`**

Unfreeze a frozen ekey, the `keyStatus` of the ekey will change from`110405` to normal`110401`.

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/key/unfreeze' \\

\--data\-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \\

\--data\-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \\

\--data\-urlencode 'keyId=27619' \\

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

keyId

Int

Y

Ekey ID

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