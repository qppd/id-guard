# TTLock Open Platform

<iframe data-v-a6887e72="" id="frame" name="frame" src="/documentPages/htmlPages/cloud/user/listEn.html" width="101%" height="1300" frameborder="0" scrolling="auto"></iframe>

## Embedded Content

# Get user list

**`https://euapi.ttlock.com/v3/user/list`**

List the users registered by cloud API: [Register user](/document/doc?urlName=cloud/user/registerEn.html)，this API will not return users registered in TTLock APP.

### 1 Request example

xxxxxxxxxx

curl \--location \-g \--request GET 'https://euapi.ttlock.com/v3/user/list?clientId=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&clientSecret=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx&date=1625025703000&pageNo=1&pageSize=20'

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

startDate

Long

N

query by register time，start time (timestamp in millisecond)

endDate

Long

N

query by register time，end time (timestamp in millisecond)

pageNo

Int

Y

Page no, start from 1

pageSize

Int

Y

Items per page, max 200

date

Long

Y

Current time (timestamp in millisecond)

### 3 Response and example

Parameter

Type

Description

list

JSONArray

list of records

pageNo

Int

Page no, start from 1

pageSize

Int

Items per page, max 200

pages

Int

Total number of pages

total

Int

Total number of records

The objects in the list

Parameter

Type

Description

username

String

The prefixed username return by cloud API: [User register](/document/doc?urlName=cloud/user/registerEn.html)

regtime

Long

Register time(timestamp in milliseconds)

xxxxxxxxxx

{

    "list": \[

        {

            "username": "abcd\_c042f4db68f23406c6cecf84a7ebb0fe",

            "regtime": 1625019027000,

        }

    \],

    "pageNo":1,

    "pageSize":20,

    "pages":1,

    "total":1

}