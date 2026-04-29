import { addComponentsDir, addImportsDir, addServerHandler, addTemplate, createResolver, defineNuxtModule, useLogger, useNuxt } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { defu } from 'defu'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'pathe'
import type { RouteHandlerConfig } from 'uploadthing/types'

const MODULE_NAME = 'nuxt-uploadthing'
const logger = useLogger(MODULE_NAME)
const resolver = createResolver(import.meta.url)

// Module options TypeScript interface definition
export interface ModuleOptions {

  /**
   * Path to the file where your file router is defined.
   * Supports Nuxt aliases like `~` and `@`.
   * @default '@@/server/uploadthing'
   */
  fileRouterPath: string

  /**
   * Name of the exported file router from `fileRouterPath`.
   * @default 'fileRouter'
   * @example
   * // server/uploadthing.ts
   * export const fileRouter = createUploadthing()({ ... })
   */
  fileRouterExport: string
  /**
   * Whether to enable Tailwind CSS integration for UploadThing components.
   *
   * When enabled, the module injects UploadThing Tailwind styles and
   * configures Tailwind to scan UploadThing's internal components.
   *
   * @default false
   */
  useTailwindStyles: boolean

  /**
   * Prefix applied to auto-registered UploadThing components.
   *
   *
   * @example
   * componentPrefix: 'UT'
   * // Results in components like:
   * // <UTUploadButton />
   * // <UTUploadDropzone />
   *
   * @default 'Uploadthing'
   */
  componentPrefix: string
  /**
   * Configuration passed directly to the UploadThing route handler.
   * @see https://docs.uploadthing.com/api-reference/server#config-parameters
   */
  routeHandlerConfig?: RouteHandlerConfig
}

export default defineNuxtModule<ModuleOptions>().with({
  meta: {
    name: 'nuxt-uploadthing',
    configKey: 'uploadthing',
    compatibility: {
      nuxt: '^4.0.0'
    }
  },
  defaults: {
    fileRouterPath: '@@/server/uploadthing',
    fileRouterExport: 'fileRouter',
    useTailwindStyles: false,
    componentPrefix: 'Uploadthing',
  },
  async setup(options, _nuxt) {
    const fileRouterPathResolved = await resolver.resolvePath(options.fileRouterPath)

    const currentConfig = (_nuxt.options.runtimeConfig.uploadthing ?? {}) as Partial<ModuleOptions>
    _nuxt.options.runtimeConfig.uploadthing = defu(
      currentConfig,
      options,
    )

    if (!existsSync(fileRouterPathResolved)) {
      logger.warn(
        `To use uploadthing, please create a router file at \`${options.fileRouterPath}\`.`,
      )

      _nuxt.options.alias['#ut-router'] = resolver.resolve(
        './runtime/server/router',
      )
    }
    else {
      _nuxt.options.alias['#ut-router'] = fileRouterPathResolved
    }

    applyUploadthingStyles()

    generateUploadthingArtifacts()

    _nuxt.hook('builder:watch', (event, path) => {
      if (event !== 'add' && event !== 'unlink') {
        return
      }
      path = resolve(_nuxt.options.srcDir, path)
      if (path === fileRouterPathResolved || path.startsWith(fileRouterPathResolved)) {
        void _nuxt.hooks.callHook('restart', { hard: true })
      }
    })
  },
}) satisfies NuxtModule<ModuleOptions>

function getTailwindVersion(): '3' | '4' | null {
  try {
    const nuxt = useNuxt()
    // const _require = createRequire(import.meta.url)
    const _require = createRequire(nuxt.options.rootDir + '/')
    const tailwindPackagePath = _require.resolve('tailwindcss/package.json')
    const tailwindPackage = JSON.parse(readFileSync(tailwindPackagePath, 'utf-8')) as { version?: string }

    if (tailwindPackage.version?.startsWith('4')) {
      return '4'
    }

    if (tailwindPackage.version?.startsWith('3')) {
      return '3'
    }

    return null
  }
  catch {
    return null
  }
}

function applyUploadthingStyles() {
  const nuxt = useNuxt()
  const uploadthingOptions = nuxt.options.runtimeConfig.uploadthing as ModuleOptions
  const useTailwindStyles = uploadthingOptions.useTailwindStyles

  if (!useTailwindStyles) {
    logger.info('[nuxt-uploadthing] Using UploadThing default CSS')
    return registerUploadthingCss()
  }

  const tailwindVersion = getTailwindVersion()

  if (!tailwindVersion) {
    logger.warn(
      '[nuxt-uploadthing] `useTailwindStyles` is enabled, but `tailwindcss` is missing or an unsupported version is installed. Falling back to default UploadThing CSS.',
    )
    return registerUploadthingCss()
  }

  if (tailwindVersion === '3') {
    logger.warn(
      '[nuxt-uploadthing] Tailwind CSS v3 detected. To enable UploadThing Tailwind integration, wrap your Tailwind config with `withUt` from "uploadthing/tw". See: https://docs.uploadthing.com/concepts/theming#configuring-tailwind-css.',
    )
    return
  }

  logger.info('[nuxt-uploadthing] Using UploadThing Tailwind CSS integration')

  const dist = resolveUploadthingVueDist()

  if (!dist) {
    logger.warn(
      '[nuxt-uploadthing] Could not resolve `@uploadthing/vue/dist` for Tailwind source scanning. Falling back to default UploadThing CSS.',
    )
    return registerUploadthingCss()
  }

  registerUploadthingTailwindCss(dist)
}

function registerUploadthingCss() {
  addTemplate({
    write: true,
    filename: 'uploadthing-tw.css',
    dst: resolver.resolve('./runtime/uploadthing-tw.css'),
    getContents: () =>
      `
/**
 * Tailwind styles are disabled.
 * UploadThing default CSS is being used instead.
 * This file is intentionally left empty.
 */
    `,
  })

  const nuxt = useNuxt()
  return nuxt.options.css.push('@uploadthing/vue/styles.css')
}

function registerUploadthingTailwindCss(distPath: string) {
  addTemplate({
    write: true,
    filename: 'uploadthing-tw.css',
    dst: resolver.resolve('./runtime/uploadthing-tw.css'),
    getContents: () =>
      `@import "uploadthing/tw/v4";\n@source "${distPath}";\n`,
  })
}

function resolveUploadthingVueDist(): string | null {
  try {
    const nuxt = useNuxt()
    const _require = createRequire(nuxt.options.rootDir + '/')

    const packageJsonPath = _require.resolve('@uploadthing/vue/package.json')

    const distPath = join(dirname(packageJsonPath), 'dist')

    if (!existsSync(distPath)) {
      return null
    }
    // const relativeDist = relative(nuxt.options.rootDir, distPath)
    // return relativeDist
    return distPath
  }
  catch {
    return null
  }
}

function generateUploadthingArtifacts() {
  const nuxt = useNuxt()
  const uploadthingOptions = nuxt.options.runtimeConfig.uploadthing as ModuleOptions
  const { fileRouterExport, componentPrefix } = uploadthingOptions

  addTemplate({
    write: true,
    filename: 'upload-button.ts',
    dst: resolver.resolve('./runtime/components/upload-button.ts'),
    getContents: () => `
import { generateUploadButton } from '@uploadthing/vue'
import type { FileRouter } from 'uploadthing/h3'
type RouterModule = typeof import('#ut-router')
type RouterExport = ${JSON.stringify(fileRouterExport)}
type UserFileRouter =
  RouterExport extends keyof RouterModule
    ? RouterModule[RouterExport] extends FileRouter
      ? RouterModule[RouterExport]
      : FileRouter
    : FileRouter
const RuntimeUploadButton = generateUploadButton<UserFileRouter>()
export default RuntimeUploadButton
`,
  })

  addTemplate({
    write: true,
    filename: 'upload-dropzone.ts',
    dst: resolver.resolve('./runtime/components/upload-dropzone.ts'),
    getContents: () => `
import { generateUploadDropzone } from '@uploadthing/vue'
import type { FileRouter } from 'uploadthing/h3'
type RouterModule = typeof import('#ut-router')
type RouterExport = ${JSON.stringify(fileRouterExport)}
type UserFileRouter =
  RouterExport extends keyof RouterModule
    ? RouterModule[RouterExport] extends FileRouter
      ? RouterModule[RouterExport]
      : FileRouter
    : FileRouter
const RuntimeUploadDropzone = generateUploadDropzone<UserFileRouter>()
export default RuntimeUploadDropzone
`,
  })

  addComponentsDir({
    path: resolver.resolve('./runtime/components'),
    prefix: componentPrefix,
    pathPrefix: false,
  })

  addTemplate({
    write: true,
    filename: 'upload-helpers.ts',
    dst: resolver.resolve('./runtime/utils/upload-helpers.ts'),
    getContents: () => `
import { generateVueHelpers } from '@uploadthing/vue'
import type { FileRouter } from 'uploadthing/h3'
type RouterModule = typeof import('#ut-router')
type RouterExport = ${JSON.stringify(fileRouterExport)}
type UserFileRouter =
  RouterExport extends keyof RouterModule
    ? RouterModule[RouterExport] extends FileRouter
      ? RouterModule[RouterExport]
      : FileRouter
    : FileRouter

const helpers = generateVueHelpers<UserFileRouter>()

export const useUploadThing = helpers.useUploadThing
export const createUpload = helpers.createUpload
export const routeRegistry = helpers.routeRegistry
export const uploadFiles = helpers.uploadFiles
`,
  })

  addImportsDir(resolver.resolve('./runtime/utils'))

  const uploadthingHandlerTemplate = addTemplate({
    write: true,
    dst: resolver.resolve('./runtime/server/api/uploadthing.ts'),
    // filename: 'nuxt-uploadthing/runtime/server/api/uploadthing.mjsts',
    filename: 'uploadthing.ts',
    getContents: () => `
import { useRuntimeConfig } from '#imports'
import { defineEventHandler } from 'h3'
import { createRouteHandler } from 'uploadthing/h3'
import * as RouterModule from '#ut-router'

const ROUTER_EXPORT = ${JSON.stringify(fileRouterExport)}

const emptyStringToUndefined = (obj) => {
  const next = {}
  for (const key in obj) {
    next[key] = obj[key] === '' ? undefined : obj[key]
  }
  return next
}

export default defineEventHandler((event) => {
  const runtime = useRuntimeConfig()
  const config = emptyStringToUndefined(runtime.uploadthing?.routeHandlerConfig ?? {})
  const hasConfig = Object.keys(config).length > 0


  const router = RouterModule[ROUTER_EXPORT]
  if (!router) {
    throw new Error('[nuxt-uploadthing] Router export not found: ' + ROUTER_EXPORT)
  }

  return createRouteHandler({
    router,
      ...(hasConfig ? { config } : {}),
  })(event)
})
`,
  })

  // Register generated server handler
  addServerHandler({
    route: '/api/uploadthing',
    handler: uploadthingHandlerTemplate.dst,
  })
}
