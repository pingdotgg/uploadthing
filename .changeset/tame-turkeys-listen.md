---
"@uploadthing/shared": major
"uploadthing": major
---

chore: update paths to new api domain

Previously the SDK version was just sent in the header which made it cumbersome to make large changes on the API without risking breaking older versions. This change improves our flexibility to make changes to the API without needing to do a major bump on the SDK. It should come with some nice performance wins too!
