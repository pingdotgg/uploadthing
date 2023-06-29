import { createNuxtRouteHandler } from 'uploadthing/nuxt'
import { uploadRouter } from '../../fileRouter'

export default createNuxtRouteHandler({
    router: uploadRouter
})
