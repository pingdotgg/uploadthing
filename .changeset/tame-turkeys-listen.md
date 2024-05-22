---
"@uploadthing/shared": minor
"uploadthing": minor
---

chore: update paths to future api domain

Previously the SDK version was just sent in the header which made it cumbersome to make large changes on the API without risking breaking older versions. This change improves our flexibility to make changes to the API without needing to do a major bump on the SDK.
