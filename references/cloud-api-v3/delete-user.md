# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/user/deleteEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Delete user

**`https://euapi.ttlock.com/v3/user/delete`**

Only user registered by cloud API: [User register](/document/doc?urlName=cloud/user/registerEn.html) can be deleted，you can't delete user account registered in TTLock APP。

If a user is deleted, it's access token and ekeys will also be deleted.

If the user still owns lock(s), it can't be deleted, it's locks should be deleted or transfered to others before it can be deleted .

### 1 Request example

`POST, ContentType:application/x-www-form-urlencoded`

xxxxxxxxxx

curl \--location \-g \--request POST 'https://euapi.ttlock.com/v3/user/delete' \\

\--header 'Content-Type: application/x-www-form-urlencoded' \\

\--data\-urlencode 'clientId=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \\

\--data\-urlencode 'clientSecret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \\

\--data\-urlencode 'username=abcd\_c042f4db68f23406c6cecf84a7ebb0fe' \\

\--data\-urlencode 'date=1625019027000'

### 2 Request parameters

Name

Type

Required

Description

clientId

String

Y

client\_id from [Create application](/CreateApplication)

clientSecret

String

Y

client\_secret from [Create application](/CreateApplication)

username

String

Y

The prefixed username return by cloud API: [User register](/document/doc?urlName=cloud/user/registerEn.html)

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