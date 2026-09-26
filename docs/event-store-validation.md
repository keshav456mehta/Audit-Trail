# Day 12 � Event Type Validation Test

## Test Case

An invalid eventType was supplied to the EventStore schema:

WrongEventType

## Expected Result

The EventStore schema should reject the event because eventType is restricted by the schema enum.

## Actual Result

The invalid eventType was rejected by Mongoose validation.

## Conclusion

The EventStore eventType enum validation correctly prevents unsupported event types from being stored.


Haan — Day 15 (Sep 23) ka kaam coding nahi hai. Is din tumhe Mid Review mein apne Event Store schema ko explain karne ke liye ready rehna hai.

Tumhare schema ko explain karne ke liye ye short notes yaad rakho:

EventStore schema
Field	Purpose
aggregateId	Event kis shipment/entity se related hai
eventType	Kaunsa event hua, jaise ShipmentCreated, ShipmentPacked, ShipmentShipped, ShipmentDelivered
payload	Event ke saath actual data
timestamp	Event kab hua
version	Same aggregate ke events ka sequence/version
Validation
aggregateId → required
eventType → required + allowed enum values
payload → required
timestamp → required
version → required
Indexes
eventSchema.index({ aggregateId: 1 });
eventSchema.index({ timestamp: 1 });

Why?

aggregateId → kisi shipment ke events efficiently find karne ke liye
timestamp → time-based event queries ke liye
Version ka simple explanation

"version same aggregate ke events ko sequence mein track karta hai. First event version 1 se start hota hai, aur next event latest version se increment hota hai.