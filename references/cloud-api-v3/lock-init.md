# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/lock/initializeEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Lock init

**`https://euapi.ttlock.com/v3/lock/initialize`**

**Alert：Call this api after calling APP SDK method to add a lock, `lockData` must be get from the callback function of [Lock initialie method of APP SDK](/document/doc?urlName=appSdkV3/androidSdkDemoV3/androidExample/addLockEn.html).**

This API will initialize the lock in the cloud server，and will generate an admin ekey for the user.

**If the lock is successfully added in TTLock APP，it is already initialized, there is no need to request this API. Just request cloud API: [Get the lock list of an account](/document/doc?urlName=cloud/lock/listEn.html) to get the lock. You can also get `lockId` in TTLock APP 's lock basics page (Settings->Basics)，as shown in screenshot below:**

![image-20211018144743022](https://i.loli.net/2021/10/18/jUXCnyuPqf9HkBS.png)

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/lock/initialize' \\

\--data\-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \\

\--data\-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \\

\--data\-urlencode 'lockAlias=Lock of 1-4-201' \\

\--data\-urlencode 'lockData=xxxxxxxxxxxxx' \\

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

lockData

String

Y

Lock Data，must be get from the callback function of [Lock initialie method of APP SDK](/document/doc?urlName=appSdkV3/androidSdkDemoV3/androidExample/addLockEn.html)

lockAlias

String

N

Lock alias

groupId

Int

N

group ID，refer to cloud API: [Add group](/document/doc?urlName=cloud/group/add.html)

nbInitSuccess

Int

N

Is NB-IoT lock inited Successfully? 1-yes, 0-no. Only NB-IoT lock need this parameter.

date

Long

Y

Current time (timestamp in millisecond)

### 3 Response and example

Parameter

Type

Description

lockId

Int

Lock ID

keyId

Int

Admin ekey id

xxxxxxxxxx

{

    "lockId": 123132, 

    "keyId": "2342342"

}