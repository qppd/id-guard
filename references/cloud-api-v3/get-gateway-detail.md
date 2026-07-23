# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/gateway/detailEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Get gateway detail

**`https://euapi.ttlock.com/v3/gateway/detail`**

You can use gatewayId which from [init gateway](/document/doc?urlName=cloud/gateway/isinitSuccess.html) API to gain gateway detail

### 1 Request example

xxxxxxxxxx

curl \--location \--request GET 'https://euapi.ttlock.com/v3/gateway/detail?clientId=4773aa036f7f49c68d876bb4be85c80c&accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f&gatewayId=347&date=1626674054000'

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

gatewayId

Int

Y

GatewayId, from [init gateway](/document/doc?urlName=cloud/gateway/isinitSuccess.html) API

date

Long

Y

Current time (timestamp in millisecond)

### 3 Response and example

Parameter

Type

Description

gatewayId

Int

Gateway ID

gatewayMac

String

Gateway MAC

gatewayName

String

Gateway name

gatewayVersion

Int

The version of gateway, 1-G1，2-G2，3-G3(wired gateway)，4-G4（4G gateway）

networkName

String

The network name gateway connected to.

networkMac

String

Mac address of the network to which the gateway is connected

lockNum

Int

The number of locks connected to the gateway.

isOnline

Int

Is it online: 0-No, 1-Yes. The gateway will maintain a TCP connection with the gateway server, the cloud server consider it online if the connection is present, plug off the gateway may not break the connection immediately, it may take several minutes for the gateway server to break the connection after heartbeat timeout.

xxxxxxxxxx

{

    "gatewayMac": "DC:A4:53:85:39:74",

    "lockNum": 1,

    "gatewayName": "G2\_743985",

    "networkName": "ttlock",

    "isOnline": 0,

    "gatewayVersion": 2,

    "gatewayId": 347

}