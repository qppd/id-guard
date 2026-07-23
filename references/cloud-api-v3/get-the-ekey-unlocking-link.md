# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/ekey/getUnlockLinkEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Get the eKey unlocking link

`https://euapi.ttlock.com/v3/key/getUnlockLink`

After the administrator sends the eKey to the user (with a hyperlink to the eKey interface document), if the lock is connected to the Internet and both the lock and the eKey have remote unlocking enabled, the administrator can generate a remote unlocking link and send it to the user, and the user can unlock the lock through the link.

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

 

x

1

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/key/getUnlockLink' \\

2

\--data\-urlencode 'clientId=4773aa036f7f49c68d876bb4be85c80c' \\

3

\--data\-urlencode 'accessToken=dfd5489d0cee31f0bdfaf59d0d42d71f' \\

4

\--data\-urlencode 'keyId=27619' \\

5

\--data\-urlencode 'date=1625025703000'

### 2 Request parameters

**Name**

**Required**

**Type**

**Description**

client\_id

Y

String

Client\_id from [Create application](https://euopen.ttlock.com/CreateApplication)

accessToken

Y

String

Access token，refer to: [Get access token](https://euopen.ttlock.com/document/doc?urlName=cloud/oauth2/getAccessTokenEn.html)

keyId

Y

Int

The ID of the eKey

date

Y

Long

Current time (timestamp in millisecond)

### 3 Response and example

\*\* Parameter\*\*

**Type**

**Description**

link

String

the link of unlocking

 

xxxxxxxxxx

3

1

{

2

    "link": "https://c.ttekey.com/h?k=0qFsTwJF"

3

}