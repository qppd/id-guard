# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/gateway/renameEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Rename Gateway

**`https://euapi.ttlock.com/v3/gateway/rename`**

Rename the gateway.

### 1 HTTP Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/gateway/rename' \\

\--data\-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \\

\--data\-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \\

\--data\-urlencode 'gatewayId=124242' \\

\--data\-urlencode 'gatewayName=Gateway of Room 201' \\

\--data\-urlencode 'date=1625025703000'

### 2 Request Parameter Description

Name

Type

Required

Description

clientId

String

Y

The app\_id which is assigned by system when you create an application

accessToken

String

Y

Access token

gatewayId

Int

Y

gateway id

gatewayName

String

Y

new gateway name

date

Long

Y

Current time (timestamp in millisecond)

### 3 Response

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