---
"uploadthing": minor
---

allow overriding filename when using `utapi.uploadFilesFromUrl`. This is useful when the pathname is too long, or when you just want to set your own name.

```ts
utapi.uploadFilesFromUrl({
    url: 'https://example.com/super-long-pathname-that-exceeds-the-limit.jpg',
    name: "my-custom-name.jpg"
})
```