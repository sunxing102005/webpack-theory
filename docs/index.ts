import { PageConfig } from '@ke/ditto'
import { IProjectConfig, IH5Config, IH5RouterConfig, IDeviceRatio } from '@ke/ditto/types/compile'
import wxTransformer from '@ke/ditto-transformer-wx'
import * as babel from 'babel-core'
import traverse, { NodePath, TraverseOptions } from 'babel-traverse'
import * as t from 'babel-types'
import generate from 'better-babel-generator'
import * as chokidar from 'chokidar'
import * as fs from 'fs-extra'
import * as klaw from 'klaw'
//@ts-ignore
import { compact, findLastIndex, first, fromPairs, get, identity, merge, transform, uniqBy, kebabCase,uniq  } from 'lodash'
import { partial, pipe } from 'lodash/fp'
import * as path from 'path'
// import * as resolve from 'resolve'
import {traverseObjectNode} from '../util'
import CONFIG from '../config'
import {
  isAliasPath,
  isNpmPkg,
  mergeVisitors,
  printLog,
  promoteRelativePath,
  recursiveMerge,
  replaceAliasPath,
  resolveScriptPath,
  // checkCliAndFrameworkVersion
} from '../util'
import {
  convertAstExpressionToVariable as toVar,
  convertObjectToAstExpression as objToAst,
  convertSourceStringToAstExpression as toAst
} from '../util/astConvert'
import { BUILD_TYPES, processTypeEnum, PROJECT_CONFIG, REG_SCRIPTS, REG_TYPESCRIPT, DEFAULT_Component_SET } from '../util/constants'
import * as npmProcess from '../util/npm'
import { IBuildOptions, IOption } from '../util/types'
import {
  APIS_NEED_TO_APPEND_THIS,
  deviceRatioConfigName,
  FILE_TYPE,
  MAP_FROM_COMPONENTNAME_TO_ID,
  nervJsImportDefaultName,
  providerComponentName,
  setStoreFuncName,
  tabBarComponentName,
  tabBarConfigName,
  tabBarContainerComponentName,
  tabBarPanelComponentName,
  DEFAULT_ENTRY,
} from './constants'
import {
  addLeadingSlash,
  createRoute,
  isDittoClass,
  isUnderSubPackages,
  pRimraf,
  removeLeadingSlash,
  resetTSClassProperty,
  stripTrailingSlash
} from './helper'
//@ts-ignore
const { exec } = require('child_process');
const chalk = require('chalk')
const defaultH5Config: Partial<IH5Config> = {
  router: {
    mode: 'hash',
    customRoutes: {},
    basename: '/'
  }
}

type PageName = string
type FilePath = string

const BLOCK_TAG_NAME = 'Block'

class Compiler {
  projectConfig: IProjectConfig
  h5Config: IH5Config
  routerConfig: IH5RouterConfig
  sourceRoot: string
  sourcePath: string
  outputPath: string
  outputDir: string
  tempDir: string
  tempPath: string
  entryFilePath: string
  entryFileName: string
  pxTransformConfig
  pathAlias: {
    [key: string]: string
  }
  pages: [PageName, FilePath, any][] = []
  isUi: boolean
  currentTrack: any
  subPackages?: string
  subPackagesList: any
  constructor(public appPath: string, entryFile?: string, isUi?: boolean) {
    const projectConfig = recursiveMerge({
      h5: defaultH5Config
    }, require(path.join(appPath, PROJECT_CONFIG))(merge))
    this.projectConfig = projectConfig
    const sourceDir = projectConfig.sourceRoot || CONFIG.SOURCE_DIR
    this.sourceRoot = sourceDir
    const outputDir = projectConfig.outputRoot || CONFIG.OUTPUT_DIR
    this.outputDir = outputDir
    this.h5Config = get(projectConfig, 'h5')
    this.routerConfig = get(projectConfig, 'h5.router', {})
    this.sourcePath = path.join(appPath, sourceDir)
    this.outputPath = path.join(appPath, outputDir)
    this.tempDir = CONFIG.BK_DIR
    this.tempPath = path.join(appPath, this.tempDir)
    this.entryFilePath = resolveScriptPath(path.join(this.sourcePath, entryFile || CONFIG.ENTRY))
    this.entryFileName = path.basename(this.entryFilePath)
    this.pathAlias = projectConfig.alias || {}
    this.pxTransformConfig = { designWidth: projectConfig.designWidth || 750 }
    if (projectConfig.hasOwnProperty(deviceRatioConfigName)) {
      this.pxTransformConfig.deviceRatio = projectConfig.deviceRatio
    }
    this.isUi = !!isUi
    this.subPackagesList = []
  }

  async clean() {
    const tempPath = this.tempPath
    const outputPath = this.outputPath
    try {
      await pRimraf(tempPath)
      await pRimraf(outputPath)
    } catch (e) {
      console.log(e)
    }
  }

  copyFiles() { }

  classifyFiles(filename) {
    const pages = this.pages
    const appPath = this.appPath
    const entryFilePath = this.entryFilePath
    const relPath = path.normalize(
      path.relative(appPath, filename)
    )
    if (path.relative(filename, entryFilePath) === '') return FILE_TYPE.ENTRY

    let relSrcPath = path.relative(this.sourceRoot, relPath)
    relSrcPath = path.format({
      dir: path.dirname(relSrcPath),
      base: path.basename(relSrcPath, path.extname(relSrcPath))
    })

    const isPage = pages.some(([pageName, filePath]) => {
      const relPage = path.normalize(
        path.relative(appPath, pageName)
      )
      if (path.relative(relPage, relSrcPath) === '') return true
      return false
    })

    if (isPage) {
      return FILE_TYPE.PAGE
    } else {
      return FILE_TYPE.NORMAL
    }
  }

  buildTemp() {
    const tempPath = this.tempPath
    const sourcePath = this.sourcePath
    const appPath = this.appPath

    fs.ensureDirSync(tempPath)
    const readPromises: any[] = []

    const isFilesInSubPackagesWhiteList = (relativePath) => {
      if (!this.subPackages) return true;
      // 指定子包的话，不要主包页面
      if (relativePath.startsWith('src/pages/')) return false
      // 其他非子包留下
      if (!relativePath.startsWith('src/subpackages/')) return true
      return this.subPackages.split(',').some(item => relativePath.startsWith('src/subpackages/' + item))
    }

    function readFiles(sourcePath, originalFilePath) {
      readPromises.push(new Promise((resolve, reject) => {
        klaw(sourcePath)
          .on('data', file => {
            const REG_IGNORE = /(\\|\/)\.(svn|git)\1/i;
            const relativePath = path.relative(appPath, file.path)
            if (file.stats.isSymbolicLink()) {
              let linkFile = fs.readlinkSync(file.path)
              if (!path.isAbsolute(linkFile)) {
                linkFile = path.resolve(file.path, '..', linkFile)
              }
              readFiles.call(this, linkFile, file.path)
            } else if (!file.stats.isDirectory() && !REG_IGNORE.test(relativePath) && isFilesInSubPackagesWhiteList(relativePath)) {
              printLog(processTypeEnum.CREATE, '发现文件', relativePath)
              this.processFiles(file.path, originalFilePath)
            }
          })
          .on('end', () => {
            resolve()
          })
      }))
    }
    readFiles.call(this, sourcePath, sourcePath)
    const pkgJsonPath = path.resolve(appPath, 'package.json');
    const original = fs.readFileSync(pkgJsonPath, { encoding: 'utf8' })
    this.generatePkgJson(original, pkgJsonPath);
    // hack
    fs.writeFileSync(path.join(this.tempPath, `.env`), 'SKIP_PREFLIGHT_CHECK=true');
    return Promise.all(readPromises)
  }

  async buildDist({ watch, port }: IBuildOptions) {
    const isMultiRouterMode = get(this.h5Config, 'router.mode') === 'multi'
    const entryFileName = this.entryFileName
    const projectConfig = this.projectConfig
    /** 不是真正意义上的IH5Config对象 */
    const h5Config: IH5Config & {
      deviceRatio?: IDeviceRatio
      env?: IOption
    } = this.h5Config
    const outputDir = this.outputDir
    const sourceRoot = this.sourceRoot
    const tempPath = this.tempPath
    const pathAlias = this.pathAlias

    const getEntryFile = (filename: string) => {
      return path.join(tempPath, filename)
    }

    const entryFile = path.basename(entryFileName, path.extname(entryFileName)) + '.js'
    const defaultEntry = isMultiRouterMode
      ? fromPairs(this.pages.map(([pagename, filePath]) => {
        return [filePath, [getEntryFile(filePath) + '.js']]
      }))
      : {
        app: [getEntryFile(entryFile)]
      }
    if (projectConfig.deviceRatio) {
      h5Config.deviceRatio = projectConfig.deviceRatio
    }
    if (projectConfig.env) {
      h5Config.env = projectConfig.env
    }
    recursiveMerge(h5Config, {
      alias: pathAlias,
      copy: projectConfig.copy,
      homePage: first(this.pages),
      defineConstants: projectConfig.defineConstants,
      designWidth: projectConfig.designWidth,
      entry: merge(defaultEntry, h5Config.entry),
      env: {
        DITTO_ENV: JSON.stringify(BUILD_TYPES.H5)
      },
      isWatch: !!watch,
      outputRoot: outputDir,
      babel: projectConfig.babel,
      csso: projectConfig.csso,
      uglify: projectConfig.uglify,
      sass: projectConfig.sass,
      plugins: projectConfig.plugins,
      port,
      sourceRoot
    })

    const webpackRunner = await npmProcess.getNpmPkg('@ke/ditto-webpack-runner', this.appPath)
    webpackRunner(this.appPath, h5Config)
  }

  async processFlagFile() {
    const content = Date.now()
    // const wtPath = this.tempPath + '/_wt.txt'
    // fs.writeFile(wtPath, content, 'utf8');
    const serverPath = path.resolve(this.tempPath, '../ditto-hobber-dev/server/src')
    fs.writeFile(serverPath + '/_wt.txt', content, 'utf8', (err) => {
      err && console.log('\x1B[31m%s\x1B[0m', '未找到ditto-hobber-dev服务端代码，请先执行 `npm run dev:server`')
    })
  }
  watchFiles() {
    const sourcePath = this.sourcePath
    const appPath = this.appPath
    const watcher = chokidar.watch(path.join(sourcePath), {
      ignored: /(^|[/\\])\../,
      persistent: true,
      ignoreInitial: true
    })
    console.log(chalk.gray('\n监听文件修改中...\n'))
    watcher
      .on('add', filePath => {
        const relativePath = path.relative(appPath, filePath)
        printLog(processTypeEnum.CREATE, '添加文件', relativePath)
        this.processFiles(filePath, filePath)
        // this.processFlagFile()
      })
      .on('change', filePath => {
        const relativePath = path.relative(appPath, filePath)
        printLog(processTypeEnum.MODIFY, '文件变动', relativePath)
        this.processFiles(filePath, filePath)
        // this.processFlagFile()
      })
      .on('unlink', filePath => {
        const relativePath = path.relative(appPath, filePath)
        const extname = path.extname(relativePath)
        const distDirname = this.getTempDir(filePath, filePath)
        const isScriptFile = REG_SCRIPTS.test(extname)
        const dist = this.getDist(distDirname, filePath, isScriptFile)
        printLog(processTypeEnum.UNLINK, '删除文件', relativePath)
        fs.unlinkSync(dist)
        // this.processFlagFile()
      })
  }

  async processEntry(code, filePath) {
    const pages = this.pages
    if (filePath === this.entryFilePath && this.isUi) {
      const temp = path.basename(filePath, path.extname(filePath))
      return [[temp, code]]
    }
    const pathAlias = this.pathAlias
    // const pxTransformConfig = this.pxTransformConfig
    const routerMode = this.routerConfig.mode
    const isMultiRouterMode = routerMode === 'multi'
    const routerLazyload = 'lazyload' in this.routerConfig
      ? this.routerConfig.lazyload
      : !isMultiRouterMode
    const customRoutes: Record<string, string> = isMultiRouterMode
      ? {}
      : get(this.h5Config, 'router.customRoutes', {})
    const routerBasename = isMultiRouterMode
      ? get(this.h5Config, 'publicPath', '/')
      : addLeadingSlash(stripTrailingSlash(get(this.h5Config, 'router.basename')))

    const renamePagename = get(this.h5Config, 'router.renamePagename', identity)
    const isUi = this.isUi
    const subPackages = this.subPackages;

    let ast = wxTransformer({
      code,
      sourcePath: filePath,
      isNormal: true,
      isTyped: REG_TYPESCRIPT.test(filePath),
      adapter: 'h5'
    }).ast
    let dittoImportDefaultName: string
    let providerImportName: string
    let storeName: string
    let renderCallCode: string

    let tabBar
    let tabbarPos
    let hasConstructor = false
    let hasComponentWillMount = false
    let hasComponentDidMount = false
    let hasComponentDidShow = false
    let hasComponentDidHide = false
    let hasComponentWillUnmount = false
    //@ts-ignore
    let hasNerv = false
    let configObj = {};
    let componentClassName: string = ''
    // let stateNode: t.ClassProperty
    console.log('xx', hasComponentWillMount, hasComponentDidMount, hasComponentWillUnmount, )
    const additionalConstructorNode = toAst(`Ditto._$app = this`)
    const callComponentDidShowNode = toAst(`this.componentDidShow()`)
    const callComponentDidHideNode = toAst(`this.componentDidHide()`)
    const initTabbarApiNode = toAst(`Ditto.initTabBarApis(this, Ditto)`)

    ast = babel.transformFromAst(ast, '', {
      plugins: [
        [require('babel-plugin-preval')],
        [require('babel-plugin-danger-remove-unused-import'), { ignore: ['@ke/ditto', 'react', 'nervjs'] }],
        [require('@ke/ditto-babel-plugin-transform-api').default, {
          // apis: require(resolve.sync('@ke/ditto-h5/dist/dittoApis', { basedir: this.appPath })),
          // packageName: '@ke/ditto-h5'
        }]
      ]
    }).ast

    const ClassDeclarationOrExpression = {
      enter(astPath: NodePath<t.ClassDeclaration> | NodePath<t.ClassExpression>) {
        const node = astPath.node
        if (!node.superClass) return
        if (isDittoClass(astPath)) {
          resetTSClassProperty(node.body.body)
        }
        if (node.id === null) {
          componentClassName = '_DittoComponentClass'
        } else if (node.id.name === 'App') {
          componentClassName = '_App'
        } else {
          componentClassName = node.id.name
        }
        // constructor中config提取
        astPath.traverse({
          ClassMethod(astPath) {
            const node = astPath.node
            if (node.kind === 'constructor') {
              astPath.traverse({
                ExpressionStatement(astPath) {
                  const node = astPath.node
                  if (node.expression &&
                    node.expression.type === 'AssignmentExpression' &&
                    node.expression.operator === '=') {
                    const left = node.expression.left
                    if (left.type === 'MemberExpression' &&
                      left.object.type === 'ThisExpression' &&
                      left.property.type === 'Identifier' &&
                      left.property.name === 'config') {
                      configObj = traverseObjectNode(node.expression.right)
                      astPath.remove();
                    }
                  }
                }
              })
            }
          }
        })
      }
    }

    const wrapWithTabbar = (currentPagename: string, funcBody: string) => {
      const firstPage = first(pages)
      const homePage = firstPage ? firstPage[0] : ''

      const panel = `
        <${tabBarPanelComponentName}>
          ${funcBody}
        </${tabBarPanelComponentName}>`

      const comp = `
        <${tabBarComponentName}
          conf={this.state.${tabBarConfigName}}
          homePage="${homePage}"
          ${currentPagename ? `currentPagename={'${currentPagename}'}` : ''}
          ${tabbarPos === 'top' ? `tabbarPos={'top'}` : ''} />`

      return `
        <${tabBarContainerComponentName}>
          ${tabbarPos === 'top' ? `${comp}${panel}` : `${panel}${comp}`}
        </${tabBarContainerComponentName}>`
    }

    const wrapWithProvider = (funcBody: string) => {
      return `
        <${providerImportName} store={${storeName}}>
          ${funcBody}
        </${providerImportName}>
      `
    }

    const wrapWithFuncBody = (funcBody: string) => {
      return `{return (${funcBody});}`
    }

    /**
     * 收集子包中的router文件
     */
    const getSubPackagesRouterFile = async () => {
      const subpackagesDir = path.join(this.sourceRoot, 'subpackages')
      const items: string[] = []
      if (fs.existsSync(subpackagesDir)) {
        for await (const item of klaw(subpackagesDir, {depthLimit: 1})) {
          if (!item.stats.isDirectory() && /router\.js/.test(path.basename(item.path))) {
            items.push(item.path)
          }
        }
      }
      return items
    }

    /**
     * 收集子包中的router配置
     */
    const getSubPackagesRouter = async () => {
      const fileList = await getSubPackagesRouterFile() as string[];
      const subpackages: {root: string, pages: string[]}[] = []
      // const subPackagesRouterArray: any = [];
      const currentEnv = process.env.DITTO_ENV
      fileList.forEach(path => {
        // const temp = path.match(/subpackages\/(\S+)\/router/)
        // const packageName = temp && temp[1]
        const router: any = require(path)
        // const customRoutes: any = {}
        let routerPaths: any = []
        // const rootPath = router.rootPath 
        if (router && Array.isArray(router.pages)) {
          router.pages.forEach((item: any) => {
            let path = ''
            if (typeof item === 'string') {
              path = item
            } else if (item.path) {
              let ignore = item.ignore || []
              if (!ignore.includes(currentEnv)) {
                path = item.path
              }
            }
            path && routerPaths.push(path) 
          })
        }
        // subPackagesRouterArray.push({packageName, router, customRoutes})
        const code = `export default { pages: ${JSON.stringify(routerPaths)} }`
        const transformResult = wxTransformer({
          code,
          sourcePath: path,
          sourceDir: this.sourceRoot,
          isTyped: REG_TYPESCRIPT.test(path),
          isApp: true,
          adapter: 'h5'
        }).ast
        if (transformResult) {
          traverse(transformResult, {
            ObjectProperty(astPath) {
              const node = astPath.node
            if (!t.isIdentifier(node.key)) return
            const keyName = node.key.name
            const value = node.value
            if (keyName === 'pages' && t.isArrayExpression(value)) {
              const elements = value.elements
              const temp = path.match(/subpackages\/(\S+)\/router/)
              const packageName = temp && temp[1]
              const pages = {
                root: `subpackages/${packageName}`,
                pages: elements.filter(ele => t.isStringLiteral(ele)).map((ele: t.StringLiteral) => ele.value)
              }
              subpackages.push(pages)
            }
            }
          })
        }
      })
      return subpackages
    }

    /**
     * ProgramExit使用的visitor
     * 负责修改render函数的内容，在componentDidMount中增加componentDidShow调用，在componentWillUnmount中增加componentDidHide调用。
     */
    // @ts-ignore
    let allRoutes: string[] = []
    const programExitVisitor = {
      ClassMethod: {
        exit(astPath: NodePath<t.ClassMethod>) {
          if (isMultiRouterMode) return

          const node = astPath.node
          const key = node.key
          const keyName = toVar(key)

          const isRender = keyName === 'render'
          const isComponentWillMount = keyName === 'componentWillMount'
          const isComponentDidMount = keyName === 'componentDidMount'
          const isComponentWillUnmount = keyName === 'componentWillUnmount'
          const isConstructor = keyName === 'constructor'

          if (isRender) {
            const createFuncBody = (pages: [PageName, FilePath, any][]) => {
              allRoutes = pages.map(([pageName, filePath, oriPath], k) => {
                const shouldLazyloadPage = typeof routerLazyload === 'function'
                  ? routerLazyload(pageName)
                  : routerLazyload
                return createRoute({
                  pageName,
                  oriPath,
                  lazyload: shouldLazyloadPage,
                  isIndex: k === 0
                })
              })
              return `
                <Router
                  mode={${JSON.stringify(routerMode)}}
                  history={_dittoHistory}
                  routes={_dittoRoutes}
                  customRoutes={_customRoutes} />
                `
            }

            const buildFuncBody = pipe(
              ...compact([
                createFuncBody,
                tabBar && partial(wrapWithTabbar, ['']),
                providerComponentName && storeName && wrapWithProvider,
                wrapWithFuncBody
              ])
            )

            node.body = toAst(buildFuncBody(pages), { preserveComments: true })
          } else {
            node.body.body = compact([
              hasComponentDidHide && isComponentWillUnmount && callComponentDidHideNode,
              ...node.body.body,
              tabBar && isComponentWillMount && initTabbarApiNode,
              hasConstructor && isConstructor && additionalConstructorNode,
              hasComponentDidShow && isComponentDidMount && callComponentDidShowNode
            ])
          }
        }
      },
      ClassBody: {
        exit(astPath: NodePath<t.ClassBody>) {
          const node = astPath.node
          if (hasComponentDidShow && !hasComponentDidMount) {
            node.body.push(t.classMethod(
              'method', t.identifier('componentDidMount'), [],
              t.blockStatement([callComponentDidShowNode]), false, false))
          }
          if (hasComponentDidHide && !hasComponentWillUnmount) {
            node.body.push(t.classMethod(
              'method', t.identifier('componentWillUnmount'), [],
              t.blockStatement([callComponentDidHideNode]), false, false))
          }
          if (!hasConstructor) {
            node.body.push(t.classMethod(
              'method', t.identifier('constructor'), [t.identifier('props'), t.identifier('context')],
              t.blockStatement([toAst('super(props, context)'), additionalConstructorNode] as t.Statement[]), false, false))
          }
          if (tabBar) {
            if (!hasComponentWillMount) {
              node.body.push(t.classMethod(
                'method', t.identifier('componentWillMount'), [],
                t.blockStatement([initTabbarApiNode]), false, false))
            }
            // if (!stateNode) {
            //   stateNode = t.classProperty(
            //     t.identifier('state'),
            //     t.objectExpression([])
            //   )
            //   node.body.unshift(stateNode)
            // }
            // if (t.isObjectExpression(stateNode.value)) {
            //   stateNode.value.properties.push(t.objectProperty(
            //     t.identifier(tabBarConfigName),
            //     tabBar
            //   ))
            // }
          }
        }
      }
    }

    /**
     * 设置页面路由
     * @param astPath page的astPath
     * @param value page的value
     */
    //@ts-ignore
    const setPageRouter = (astPath, value) => {
      const subPackageParent = astPath.findParent(isUnderSubPackages)
      if (subPackageParent) {
        /* 在subPackages属性下，说明是分包页面，需要处理root属性 */
        const parent = astPath.parent as t.ObjectExpression
        const rootNode = parent.properties.find(v => {
          if (t.isSpreadProperty(v)) return false
          return toVar(v.key) === 'root'
        }) as t.ObjectProperty
        const root = rootNode ? toVar(rootNode.value) : '';
        value.elements.forEach((v: t.StringLiteral) => {
          const pathObj = toVar(v)
          const vPath = typeof pathObj === 'string' ? pathObj : pathObj.path
          const pagePath = `${root}/${vPath}`.replace(/\/{2,}/g, '/')
          const pageName = removeLeadingSlash(pagePath)
          pages.push([pageName, renamePagename(pageName).replace(/\//g, ''), pathObj])
          v.value = addLeadingSlash(vPath)
        })
      } else {
        if (subPackages) {
          value.elements = []
        } else {
          value.elements.forEach((v: t.StringLiteral) => {
            const pathObj = toVar(v)
            const vPath = typeof pathObj === 'string' ? pathObj : pathObj.path
            const pagePath = vPath.replace(/\/{2,}/g, '/')
            const pageName = removeLeadingSlash(pagePath)
            pages.push([pageName, renamePagename(pageName).replace(/\//g, ''), pathObj])
            v.value = addLeadingSlash(vPath)
          })
        }
      }
    }

    /**
     * 设置TabBar路由
     * @param astPath tabBar的astPath
     * @param value tabBar的value
     */
    // @ts-ignore
    const setTabBar = (value) => {
      // tabBar相关处理
      tabBar = value
      value.properties.forEach((node) => {
        if (t.isSpreadProperty(node)) return
        switch (toVar(node.key)) {
          case 'position':
            tabbarPos = toVar(node.value)
            break
          case 'list':
            t.isArrayExpression(node.value) && node.value.elements.forEach(v => {
              if (!t.isObjectExpression(v)) return
              v.properties.forEach(property => {
                if (!t.isObjectProperty(property)) return
                switch (toVar(property.key)) {
                  case 'iconPath':
                  case 'selectedIconPath':
                    if (t.isStringLiteral(property.value)) {
                      property.value = t.callExpression(
                        t.identifier('require'),
                        [t.stringLiteral(`./${property.value.value}`)]
                      )
                    }
                    break
                  case 'pagePath':
                    property.value = t.stringLiteral(addLeadingSlash(toVar(property.value)))
                    break
                }
              })
            })
        }
      })
      value.properties.push(t.objectProperty(
        t.identifier('mode'),
        t.stringLiteral(routerMode)
      ))
      value.properties.push(t.objectProperty(
        t.identifier('basename'),
        t.stringLiteral(routerBasename)
      ))
      value.properties.push(t.objectProperty(
        t.identifier('customRoutes'),
        t.objectExpression(objToAst(customRoutes))
      ))
    }

    /**
     * 过滤subPackages
     * @param subPackages 子包白名单
     * @param value subPackages的value
     */
    // @ts-ignore
    const filterSubPackagesRouter = (subPackages: string, value) => {
      const subPackagesList = subPackages.split(',')
      const elements = value.elements.filter((ele: t.ObjectExpression) => {
        if (!t.isObjectExpression(ele)) return false;
        let root = '';
        ele.properties.filter(node => t.isObjectProperty(node)).forEach((node: t.ObjectProperty) => {
          switch (t.isIdentifier(node.key) && node.key.name) {
            case 'root':
              t.isStringLiteral(node.value) && (root = node.value.value);
              break;
            default:
              break;
          }
        })
        return subPackagesList.some((item: string) => root === 'subpackages/' + item)
      })
      value.elements = elements;
    }

    /**
     * 合并两个ArrayExpression
     * @param subPackages1 app.tsx中的subPackages
     * @param subPackages2 子包中router
     */
    // @ts-ignore
    const mergeSubPackagesArrayExpression = (subPackages1: t.ArrayExpression, subPackages2: t.ArrayExpression) => {
      const subPackages: t.ArrayExpression = t.arrayExpression([])
      const record = {}
      if (!subPackages1.elements.length) {
        return subPackages2
      }
      if (!subPackages2.elements.length) {
        return subPackages1
      }
      subPackages1.elements.concat(subPackages2.elements).forEach((element: t.ObjectExpression) => {
        const { root, pages } = element.properties.reduce((total, property: t.ObjectProperty) => {
          if (t.isIdentifier(property.key)) {
            total[property.key.name] = property
          }
          return total
        }, {} as {root: t.ObjectProperty, pages: t.ObjectProperty})

        if (!root || !t.isObjectProperty(root) || !t.isStringLiteral(root.value)) return
        if (!pages || !t.isObjectProperty(pages) || !t.isArrayExpression(pages.value)) return

        const rootStr: string = root.value.value

        if (record[rootStr] === undefined) {
          record[rootStr] = subPackages.elements.length
          subPackages.elements.push(element)
        } else {
          const index = record[rootStr]
          const temp = subPackages.elements[index] as t.ObjectExpression

          if (!t.isObjectExpression(temp)) return

          const property = temp.properties.find((property: t.ObjectProperty) => t.isIdentifier(property.key) && property.key.name === 'pages') as t.ObjectProperty

          if (!t.isObjectProperty(property)) return

          const value = property.value as t.ArrayExpression;
          value.elements = uniqBy(value.elements.concat(pages.value.elements), (node: t.StringLiteral) => node.value);
          subPackages.elements[index] = temp
        }
      })
      return subPackages
    }

    /**
     * 合并app.tsx中的subPackages和子包中router
     * @param node config节点
     */
    // const mergeSubPackagesRouter = (node) => {
      // if (!subPackagesRouter.elements.length) return
      // const sNode = t.isObjectExpression(node.value) && node.value.properties.find((node: t.ObjectProperty) => t.isIdentifier(node.key) && node.key.name === 'subPackages')
      // if (!sNode) {
      //   node.value.properties.push(t.objectProperty(t.stringLiteral('subPackages'), subPackagesRouter))
      //   return
      // }
      // if (!t.isSpreadProperty(sNode) && t.isArrayExpression(sNode.value)) {
      //   sNode.value = mergeSubPackagesArrayExpression(sNode.value, subPackagesRouter)
      // } else {
      //   sNode.value = subPackagesRouter;
      // }
    // }
    /**
     * ClassProperty使用的visitor
     * 负责收集config中的pages，收集tabbar的position，替换icon。
     */
    const classPropertyVisitor = {
      ObjectProperty(astPath: NodePath<t.ObjectProperty>) {
        const node = astPath.node
        const key = node.key
        const value = node.value
        const keyName = toVar(key)
        if (keyName === 'pages' && t.isArrayExpression(value)) {
          setPageRouter(astPath, value)
        } 
        // else if (keyName === 'tabBar' && t.isObjectExpression(value)) {
        //   setTabBar(value)
        // } else if (subPackages && keyName === 'subPackages' && t.isArrayExpression(value)) {
        //   filterSubPackagesRouter(subPackages, value)
        // }
      }
    }
     
    let subPackages2 = await getSubPackagesRouter()
    // const subPackagesRouter: t.ArrayExpression = subPackagesRouterAst
    // let subCustomRoutes = {}
    // subPackagesRouterArray.forEach(router => {
    //   subCustomRoutes = { ...subCustomRoutes, ...router.customRoutes }
    // })
    // Object.assign(customRoutes, subCustomRoutes)

    traverse(ast, {
      ClassExpression: ClassDeclarationOrExpression,
      ClassDeclaration: ClassDeclarationOrExpression,
      ClassProperty: {
        enter(astPath: NodePath<t.ClassProperty>) {
          const node = astPath.node
          const key = node.key
          const keyName = toVar(key)

          if (keyName === 'state') {
            // stateNode = node
          } else if (keyName === 'config') {
            configObj = traverseObjectNode(node);
            // mergeSubPackagesRouter(node)
            astPath.traverse(classPropertyVisitor)
            astPath.remove();
            // if (isMultiRouterMode) {
            //   merge(customRoutes, transform(pages, (res, [pageName, filePath], key) => {
            //     res[addLeadingSlash(pageName)] = addLeadingSlash(filePath)
            //   }, {}))
            // }
          }
        }
      },
      ImportDeclaration: {
        enter: (astPath: NodePath<t.ImportDeclaration>) => {
          const node = astPath.node
          const source = node.source
          const specifiers = node.specifiers

          if (source.value === '@ke/ditto') {
            const specifier = specifiers.find(item => t.isImportDefaultSpecifier(item))
            console.log('specifier', node);
            if (specifier) {
              dittoImportDefaultName = toVar(specifier.local)
              specifier.local.name = 'React'
            }
            source.value = 'react'
          } else if (source.value === '@ke/ditto-redux') {
            const specifier = specifiers.find(item => {
              return t.isImportSpecifier(item) && item.imported.name === providerComponentName
            })
            if (specifier) {
              providerImportName = specifier.local.name
            } else {
              providerImportName = providerComponentName
              specifiers.push(t.importSpecifier(t.identifier(providerComponentName), t.identifier(providerComponentName)))
            }
            source.value = '@ke/ditto-redux-h5'
          } else if (source.value === '@ke/ditto-mobx') {
            const specifier = specifiers.find(item => {
              return t.isImportSpecifier(item) && item.imported.name === providerComponentName
            })
            if (specifier) {
              providerImportName = specifier.local.name
            } else {
              providerImportName = providerComponentName
              specifiers.push(t.importSpecifier(t.identifier(providerComponentName), t.identifier(providerComponentName)))
            }
            source.value = '@ke/ditto-mobx-h5'
          } else if (source.value === 'nervjs') {
            hasNerv = true
            const defaultSpecifier = specifiers.find(item => t.isImportDefaultSpecifier(item))
            if (!defaultSpecifier) {
              specifiers.unshift(
                t.importDefaultSpecifier(t.identifier(nervJsImportDefaultName))
              )
            }
          }

          if (isAliasPath(source.value, pathAlias)) {
            source.value = this.transformToTempDir(replaceAliasPath(filePath, source.value, pathAlias))
          }

          if (!isNpmPkg(source.value)) {
            if (source.value.indexOf('.') === 0) {
              const pathArr = source.value.split('/')

              /* FIXME: 会导致误删除 */
              if (pathArr.indexOf('pages') >= 0) {
                astPath.remove()
              } else if (REG_SCRIPTS.test(source.value) || path.extname(source.value) === '') {
                /* 移除后缀名 */
                const absolutePath = path.resolve(filePath, '..', source.value)
                const dirname = path.dirname(absolutePath)
                const extname = path.extname(absolutePath)
                const realFilePath = resolveScriptPath(path.join(dirname, path.basename(absolutePath, extname)))
                const removeExtPath = realFilePath.replace(path.extname(realFilePath), '')
                source.value = promoteRelativePath(path.relative(filePath, removeExtPath)).replace(/\\/g, '/')
              }
            }
          }
        }
      },
      CallExpression: {
        enter(astPath: NodePath<t.CallExpression>) {
          const node = astPath.node
          const callee = node.callee
          const calleeName = toVar(callee)
          const parentPath = astPath.parentPath
          const arg0 = node.arguments[0]

          if (calleeName === 'require' && t.isStringLiteral(arg0)) {
            const required = arg0.value
            if (required === '@ke/ditto-h5') {
              arg0.value = `@ke/ditto-h5/dist/index.cjs.js`
            }
          } else if (t.isMemberExpression(callee)) {
            const object = callee.object as t.Identifier
            const property = callee.property as t.Identifier
            if(object.name == 'Ditto' && property.name === 'render'){
              // Ditto.render转译
              object.name = 'React'
            }
            if (object.name === dittoImportDefaultName && property.name === 'render') {
              // object.name = nervJsImportDefaultName
              // property.name = 'hydrate'
              // renderCallCode = `Loadable.preloadReady().then(() => {
              //   ${generate(astPath.node).code}
              // })`
              // // renderCallCode = generate(astPath.node).code
              // astPath.remove()
            }
          } else {
            if (calleeName === setStoreFuncName) {
              if (parentPath.isAssignmentExpression() ||
                parentPath.isExpressionStatement() ||
                parentPath.isVariableDeclarator()) {
                parentPath.remove()
              }
            }
          }
        }
      },
      ClassMethod: {
        exit(astPath: NodePath<t.ClassMethod>) {
          const node = astPath.node
          const key = node.key
          const keyName = toVar(key)
          if (keyName === 'constructor') {
            hasConstructor = true
          } else if (keyName === 'componentWillMount') {
            hasComponentWillMount = true
          } else if (keyName === 'componentDidMount') {
            hasComponentDidMount = true
          } else if (keyName === 'componentDidShow') {
            hasComponentDidShow = true
          } else if (keyName === 'componentDidHide') {
            hasComponentDidHide = true
          } else if (keyName === 'componentWillUnmount') {
            hasComponentWillUnmount = true
          }
        }
      },
      JSXOpeningElement: {
        enter(astPath: NodePath<t.JSXOpeningElement>) {
          const node = astPath.node
          if (toVar(node.name) === 'Provider') {
            for (const v of node.attributes) {
              if (v.name.name !== 'store') continue
              if (!t.isJSXExpressionContainer(v.value)) return
              storeName = toVar(v.value.expression)
              break
            }
          }
        }
      },
      AssignmentExpression(astPath) {
        const node = astPath.node
        const left = node.left
        if (t.isMemberExpression(left) && t.isIdentifier(left.object)) {
          if (left.object.name === componentClassName
            && t.isIdentifier(left.property)
            && left.property.name === 'config') {
              console.log('AssignmentExpression')
            configObj = traverseObjectNode(node.right)
            astPath.remove()
          }
        }
      },
      Program: {
        exit(astPath: NodePath<t.Program>) {
          const node = astPath.node
          // const lastImportIndex = findLastIndex(astPath.node.body, t.isImportDeclaration)
          // const lastImportNode = astPath.get(`body.${lastImportIndex > -1 ? lastImportIndex : 0}`) as NodePath<t.ImportDeclaration>
          // const firstPage = first(pages)
          // const routerConfigs = JSON.stringify({
          //   basename: routerBasename,
          //   customRoutes
          // })

          astPath.traverse(programExitVisitor)
          // const extraNodes: (t.Node | false)[] = [
          //   !hasNerv && toAst(`import ${nervJsImportDefaultName} from 'nervjs'`),
            // tabBar && toAst(`import { View, ${tabBarComponentName}, ${tabBarContainerComponentName}, ${tabBarPanelComponentName}} from '@ke/ditto-components'`),
            // toAst(`import { Router, createHistory, mountApis } from '@ke/ditto-router'`),
            // toAst(`import { AsyncLoad, Loadable } from '@ke/ditto-router/loadable'`),
            // toAst(`import { setRoutes } from '@ke/ditto-react-ssr/routeConfig'`),
            // toAst(`import { getRoutes as _getRoutes } from './_routes'`),
            // toAst(`const _dittoRoutes = _getRoutes(false)`),
            // toAst(`Ditto.initPxTransform(${JSON.stringify(pxTransformConfig)})`),
            // toAst(`
            //   const _customRoutes = ${JSON.stringify(customRoutes)}`),
            // toAst(`
            //   const _dittoHistory = createHistory({
            //     mode: "${routerMode}",
            //     basename: "${routerBasename}",
            //     customRoutes: _customRoutes,
            //     firstPagePath: "${addLeadingSlash(firstPage ? firstPage[0] : '')}"
            //   });
            // `),
            // toAst(`setRoutes(_dittoRoutes, _customRoutes)`),
            // isMultiRouterMode ? toAst(`mountApis(${routerConfigs});`) : toAst(`mountApis(${routerConfigs}, _dittoHistory);`)
          // ]

          if (!isUi) {
            // lastImportNode.insertAfter(compact(extraNodes))
          }
          if (renderCallCode) {
            const renderCallNode = toAst(renderCallCode)
            node.body.push(renderCallNode)
          }
        }
      }
    })

    const generateCode = (ast) => {
      return generate(ast, {
        jsescOption: {
          minimal: true
        }
      }).code
    }
    return {code: generateCode(ast), config: configObj, subpackagesRouter: subPackages2}
  }

  processOthers(code, filePath, fileType) {
    const pathAlias = this.pathAlias

    const componentnameMap = new Map()
    const dittoapiMap = new Map()
    const isPage = fileType === FILE_TYPE.PAGE
    let ast = wxTransformer({
      code,
      sourcePath: filePath,
      isNormal: true,
      isTyped: REG_TYPESCRIPT.test(filePath),
      adapter: 'h5'
    }).ast
    let dittoImportDefaultName
    let hasJSX = false
    let hasOnPageScroll = false
    let hasOnReachBottom = false
    let hasOnPullDownRefresh = false
    let pageConfig: PageConfig = {}
    let componentDidMountNode: t.ClassMethod
    let componentDidShowNode: t.ClassMethod
    let componentDidHideNode: t.ClassMethod
    let importDittoComponentNode: t.ImportDeclaration
    //@ts-ignore
    let importNervNode: t.ImportDeclaration
    //@ts-ignore
    let importDittoNode: t.ImportDeclaration
    let renderClassMethodNode: t.ClassMethod
    let exportDefaultDeclarationNode: t.ExportDefaultDeclaration
    let exportNamedDeclarationPath: NodePath<t.ExportNamedDeclaration>
    let componentClassName
    let needSetConfigFromHooks
    //@ts-ignore
    let configFromHooks
    let moduleNames;
    let configObj = {};
    const depComponents: {[key: string]: {path: string, name: string}} = {};

    const renderReturnStatementPaths: NodePath<t.ReturnStatement>[] = []
    ast = babel.transformFromAst(ast, '', {
      plugins: [
        [require('babel-plugin-preval')],
        [require('babel-plugin-danger-remove-unused-import'), { ignore: ['@ke/ditto', 'react', 'nervjs'] }],
        [require('@ke/ditto-babel-plugin-transform-api').default, {
          // apis: require(resolve.sync('@ke/ditto-h5/dist/dittoApis', { basedir: this.appPath })),
          // packageName: '@ke/ditto'
        }]
      ]
    }).ast

    const ClassDeclarationOrExpression = {
      enter(astPath: NodePath<t.ClassDeclaration> | NodePath<t.ClassExpression>) {
        const node = astPath.node
        if (!node.superClass) return
        if (isDittoClass(astPath)) {
          resetTSClassProperty(node.body.body)
          if (t.isClassDeclaration(astPath)) {
            if (node.id === null) {
              componentClassName = '_DittoComponentClass'
              astPath.replaceWith(
                t.classDeclaration(
                  t.identifier(componentClassName),
                  node.superClass as t.Expression,
                  node.body as t.ClassBody,
                  node.decorators as t.Decorator[] || []
                )
              )
            } else {
              componentClassName = node.id.name
            }
             // 继承的Ditto.Component 替换 React.Component
             if(t.isMemberExpression(node.superClass)){
              if(t.isIdentifier(node.superClass.object) && node.superClass.object.name === 'Ditto'){
                node.superClass.object.name = 'React'
              }
            }
          } else {
            if (node.id === null) {
              const parentNode = astPath.parentPath.node as any
              if (t.isVariableDeclarator(astPath.parentPath)) {
                componentClassName = parentNode.id.name
              } else {
                componentClassName = '_DittoComponentClass'
              }
              astPath.replaceWith(
                t.classExpression(
                  t.identifier(componentClassName),
                  node.superClass as t.Expression,
                  node.body as t.ClassBody,
                  node.decorators as t.Decorator[] || []
                )
              )
            } else {
              componentClassName = node.id.name
            }
            // constructor中config提取
            // astPath.traverse({
            //   ClassMethod(astPath) {
            //     const node = astPath.node
            //     if (node.kind === 'constructor') {
            //       astPath.traverse({
            //         ExpressionStatement(astPath) {
            //           const node = astPath.node
            //           if (node.expression &&
            //             node.expression.type === 'AssignmentExpression' &&
            //             node.expression.operator === '=') {
            //             const left = node.expression.left
            //             if (left.type === 'MemberExpression' &&
            //               left.object.type === 'ThisExpression' &&
            //               left.property.type === 'Identifier' &&
            //               left.property.name === 'config') {
            //                 console.log('traverse', node.expression.right)
            //               configObj = traverseObjectNode(node.expression.right)
            //               astPath.remove()
            //             }
            //           }
            //         }
            //       })
            //     }
            //   }
            // })
          }
        }
      }
    }

    const getComponentId = (componentName: string, node: t.JSXOpeningElement) => {
      const idAttrName = MAP_FROM_COMPONENTNAME_TO_ID.get(componentName)
      return node.attributes.reduce((prev, attribute) => {
        if (prev) return prev
        const attrName = toVar(attribute.name)
        if (attrName === idAttrName) return toVar(attribute.value)
        else return false
      }, false as string | false)
    }
    const getComponentRef = (node: t.JSXOpeningElement) => {
      return node.attributes.find(attribute => {
        return toVar(attribute.name) === 'ref'
      })
    }
    const createRefFunc = (componentId: string) => {
      return t.arrowFunctionExpression(
        [t.identifier('ref')],
        t.blockStatement([
          toAst(`this['__dittoref_${componentId}'] = ref`) as t.Statement
        ])
      )
    }

    /**
     * 把namedExport换成defaultExport。应对情况：
     *
     *  - export function example () {}
     *  - export class example {}
     *  - export const example
     *  - export { example }
     */
    const replaceExportNamedToDefault = (astPath: NodePath<t.ExportNamedDeclaration>) => {
      if (!astPath) return

      const node = astPath.node
      if (t.isFunctionDeclaration(node.declaration)) {

        astPath.replaceWithMultiple([
          node.declaration,
          t.exportDefaultDeclaration(node.declaration.id)
        ])
      } else if (t.isClassDeclaration(node.declaration)) {
        astPath.replaceWithMultiple([
          node.declaration,
          t.exportDefaultDeclaration(node.declaration.id)
        ])
      } else if (t.isVariableDeclaration(node.declaration)) {
        const declarationId = node.declaration.declarations[0].id
        if (t.isIdentifier(declarationId)) {
          astPath.replaceWithMultiple([
            node.declaration,
            t.exportDefaultDeclaration(declarationId)
          ])
        }
      } else if (node.specifiers && node.specifiers.length) {
        astPath.replaceWithMultiple([
          t.exportDefaultDeclaration(node.specifiers[0].local)
        ])
      }
    }

    const defaultVisitor: TraverseOptions = {
      ClassExpression: ClassDeclarationOrExpression,
      ClassDeclaration: ClassDeclarationOrExpression,
      ImportDeclaration: {
        enter: (astPath: NodePath<t.ImportDeclaration>) => {
          const node = astPath.node
          const source = node.source
          const specifiers = node.specifiers

          if (source.value === '@ke/ditto') {
            importDittoNode = node
            specifiers.forEach(specifier => {
              if (t.isImportDefaultSpecifier(specifier)) {
                dittoImportDefaultName = toVar(specifier.local)
                specifier.local.name = 'React'
              } else if (t.isImportSpecifier(specifier)) {
                dittoapiMap.set(toVar(specifier.local), toVar(specifier.imported))
              }
            })
            source.value = 'react'
          } else if (source.value === '@ke/ditto-redux') {
            source.value = '@ke/ditto-redux-h5'
          } else if (source.value === '@ke/ditto-mobx') {
            source.value = '@ke/ditto-mobx-h5'
          } else if (source.value === '@ke/ditto-components') {
            importDittoComponentNode = node
            node.specifiers.forEach((specifier) => {
              if (!t.isImportSpecifier(specifier)) return
              componentnameMap.set(toVar(specifier.local), toVar(specifier.imported))
            })
            astPath.remove() // 删除@ke/ditto-components引用组件
          } else if (source.value === 'nervjs') {
            importNervNode = node
          } else if(source.value === '@ke/ditto-components'){
            specifiers.forEach(specifier => {
              if (t.isImportSpecifier(specifier)) {
                console.log('dittoapiMap', specifier.local, specifier.imported)
                dittoapiMap.set(toVar(specifier.local), toVar(specifier.imported))
              }
            })
          }

          if (isAliasPath(source.value, pathAlias)) {
            source.value = this.transformToTempDir(replaceAliasPath(filePath, source.value, pathAlias))
          }

          if (!isNpmPkg(source.value)) {
            if (REG_SCRIPTS.test(source.value) || path.extname(source.value) === '') {
              const absolutePath = path.resolve(filePath, '..', source.value)
              const dirname = path.dirname(absolutePath)
              const extname = path.extname(absolutePath)
              const realFilePath = resolveScriptPath(path.join(dirname, path.basename(absolutePath, extname)))
              const removeExtPath = realFilePath.replace(path.extname(realFilePath), '')
              source.value = promoteRelativePath(path.relative(filePath, removeExtPath)).replace(/\\/g, '/')
            }
          }
        },
        exit(astPath: NodePath<t.ImportDeclaration>) {
          const node = astPath.node
          const source = node.source
          if (/\@ke\/ditto\-ui.+\.less$/.test(source.value)) { // 以 @ke/ditto-ui 开头的进行处理，要符合dittoUI多端组件规范
            source.value = source.value.replace('weapp', 'h5').replace('.less', '.css')
          }
        }
      },
      JSXElement: {
        exit(astPath: NodePath<t.JSXElement>) {
          hasJSX = true
        }
      },
      JSXOpeningElement: {
        exit(astPath: NodePath<t.JSXOpeningElement>) {
          const node = astPath.node
          const tagName = toVar(node.name)
          const componentName = componentnameMap.get(tagName)
          const componentId = getComponentId(componentName, node)
          const componentRef = getComponentRef(node)

          if (tagName === BLOCK_TAG_NAME) {
            node.name = t.jSXMemberExpression(
              t.jSXIdentifier('Nerv'),
              t.jSXIdentifier('Fragment')
            )
          }
          if(componentName){
            const kebabName = kebabCase(tagName);
            console.log('tagName', tagName, kebabName);
            node.name = t.jSXIdentifier(kebabCase(kebabName));

          }
          if (!componentId) return 
          const refFunc = createRefFunc(componentId)

          if (componentRef) {
            const expression = (componentRef.value as t.JSXExpressionContainer).expression;
            (refFunc.body as t.BlockStatement).body.unshift(
              t.expressionStatement(
                t.callExpression(expression, [t.identifier('ref')])
              )
            );
            (componentRef.value as t.JSXExpressionContainer).expression = refFunc
          } else {
            node.attributes.push(
              t.jSXAttribute(
                t.jSXIdentifier('ref'),
                t.jSXExpressionContainer(refFunc)
              )
            )
          }
        }
      },
      JSXClosingElement: {
        exit(astPath: NodePath<t.JSXClosingElement>) {
          const node = astPath.node
          const tagName = toVar(node.name)
          const componentName = componentnameMap.get(tagName);
          if(componentName){
            const kebabName = kebabCase(tagName);
            node.name = t.jSXIdentifier(kebabCase(kebabName));
          }
          if (tagName === BLOCK_TAG_NAME) {
            node.name = t.jSXMemberExpression(
              t.jSXIdentifier('Nerv'),
              t.jSXIdentifier('Fragment')
            )
          }
        }
      },
      ClassProperty: {
        enter(astPath: NodePath<t.ClassProperty>) {
          const node = astPath.node
          const key = toVar(node.key)
          if (key === 'config') {
            pageConfig = toVar(node.value)
            configObj = traverseObjectNode(node)
            console.log('ClassProperty', configObj);
            astPath.remove();
          }
        }
      },
      CallExpression: {
        enter(astPath: NodePath<t.CallExpression>) {
          const node = astPath.node
          const callee = node.callee
          if (t.isMemberExpression(callee)) {
            const objName = toVar(callee.object)
            const object = callee.object as t.Identifier;
            if(objName === 'Ditto'){
              // ditto api转为bk api
              dittoapiMap.set(toVar(callee.property), toVar(callee.property));
              console.log('ssset', toVar(object))
              object.name = 'bk'
            }
          }
        },
        exit(astPath: NodePath<t.CallExpression>) {
          const node = astPath.node
          const callee = node.callee
          const calleeName = toVar(callee)
          let needToAppendThis = false
          let funcName = ''

          const arg0 = node.arguments[0]

          if (calleeName === 'require' && t.isStringLiteral(arg0)) {
            const required = arg0.value
            if (required === '@ke/ditto-h5') {
              arg0.value = `@ke/ditto-h5/dist/index.cjs.js`
            }
          } else if (t.isMemberExpression(callee)) {
            const objName = toVar(callee.object)
            const tmpFuncName = toVar(callee.property)
            if (objName === dittoImportDefaultName && APIS_NEED_TO_APPEND_THIS.has(tmpFuncName)) {
              needToAppendThis = true
              funcName = tmpFuncName
            }
          } else if (t.isIdentifier(callee)) {
            const tmpFuncName = toVar(callee)
            const oriFuncName = dittoapiMap.get(tmpFuncName)
            if (APIS_NEED_TO_APPEND_THIS.has(oriFuncName)) {
              console.log('tmpFuncName', tmpFuncName, oriFuncName, APIS_NEED_TO_APPEND_THIS)
              needToAppendThis = true
              funcName = oriFuncName
            }
          }
          if (needToAppendThis) {
            const thisOrder = APIS_NEED_TO_APPEND_THIS.get(funcName)
            if (thisOrder && !node.arguments[thisOrder]) {
              node.arguments[thisOrder] = t.thisExpression()
            }
          }
        }
      },
      AssignmentExpression(astPath) {
        const node = astPath.node
        const left = node.left
        if (t.isMemberExpression(left) && t.isIdentifier(left.object)) {
          if (left.object.name === componentClassName
            && t.isIdentifier(left.property)
            && left.property.name === 'config') {
            needSetConfigFromHooks = true
            configFromHooks = node.right
            pageConfig = toVar(node.right)
            configObj = traverseObjectNode(node.right);
            astPath.remove()
          }
        }
      },
      Program: {
        exit(astPath: NodePath<t.Program>) {
          console.log('bbbbk', dittoapiMap, Object.keys(dittoapiMap).length)
          if(dittoapiMap && dittoapiMap.size){
            // 插入bk引用
            const lastImportIndex = findLastIndex(astPath.node.body, t.isImportDeclaration)
            const lastImportNode = astPath.get(`body.${lastImportIndex > -1 ? lastImportIndex : 0}`) as NodePath<t.ImportDeclaration>
            const extraNodes: (t.Node | false)[] = [
            toAst(`import { bk } from '@ke/jaye'`),
            ]
            lastImportNode.insertAfter(compact(extraNodes))
          }
          // const node = astPath.node
          if (hasJSX) {
            // if (!importNervNode) {
            //   importNervNode = t.importDeclaration(
            //     [t.importDefaultSpecifier(t.identifier(nervJsImportDefaultName))],
            //     t.stringLiteral('nervjs')
            //   )
            //   const specifiers = importNervNode.specifiers
            //   const defaultSpecifier = specifiers.find(item => t.isImportDefaultSpecifier(item))
            //   if (!defaultSpecifier) {
            //     specifiers.unshift(
            //       t.importDefaultSpecifier(t.identifier(nervJsImportDefaultName))
            //     )
            //   }
            //   node.body.unshift(importNervNode)
            // }
            // if (!importDittoNode) {
            //   importDittoNode = t.importDeclaration(
            //     [t.importDefaultSpecifier(t.identifier('Ditto'))],
            //     t.stringLiteral('@ke/ditto-h5')
            //   )
            //   node.body.unshift(importDittoNode)
            // }
            astPath.traverse({
              ClassBody(astPath) {
                if (needSetConfigFromHooks) {
                  // const classPath = astPath.findParent((p: NodePath<t.Node>) => p.isClassExpression() || p.isClassDeclaration()) as NodePath<t.ClassDeclaration>
                  // classPath.node.body.body.unshift(
                  //   t.classProperty(
                  //     t.identifier('config'),
                  //     configFromHooks as t.ObjectExpression
                  //   )
                  // )
                }
              }
            })
          }
        }
      }
    }

    const pageVisitor: TraverseOptions = {
      ClassMethod: {
        exit(astPath: NodePath<t.ClassMethod>) {
          const node = astPath.node
          const key = node.key
          const keyName = toVar(key)
          if (keyName === 'componentWillUnmount') {
            node.body.body.push(toAst(`this.componentDidHide()`))
          } else if (keyName === 'componentDidMount') {
            node.body.body.push(toAst(`this.componentDidShow()`))
            componentDidMountNode = node
          } else if (keyName === 'componentDidShow') {
            componentDidShowNode = node
          } else if (keyName === 'componentDidHide') {
            componentDidHideNode = node
          } else if (keyName === 'onPageScroll') {
            hasOnPageScroll = true
          } else if (keyName === 'onReachBottom') {
            hasOnReachBottom = true
          } else if (keyName === 'onPullDownRefresh') {
            hasOnPullDownRefresh = true
          } else if (keyName === 'render') {
            renderReturnStatementPaths.length = 0
            renderClassMethodNode = node
            astPath.traverse({
              ReturnStatement: {
                exit(returnAstPath: NodePath<t.ReturnStatement>) {
                  renderReturnStatementPaths.push(returnAstPath)
                }
              }
            })
          }
          // 如果h5: 增加骨架屏逻辑
          // if (keyName === 'render') {
          //   const addCode = `
          //   if (super.getH5FrameComponent){
          //     const Frame = super.getH5FrameComponent(this.loading)
          //     if (this.props[this.constructor._diorName] && !this.props[this.constructor._diorName].__asyncComplete__ && Frame) {
          //       return <Frame />
          //     }
          //   }`
          //   node.body.body.unshift(toAst(addCode))
          // }
        }
      },
      ClassBody: {
        exit(astPath: NodePath<t.ClassBody>) {
          const node = astPath.node
          if (!componentDidMountNode) {
            componentDidMountNode = t.classMethod('method', t.identifier('componentDidMount'), [],
              t.blockStatement([
                toAst('super.componentDidMount && super.componentDidMount()') as t.Statement,
                toAst('this.componentDidShow && this.componentDidShow()') as t.Statement
              ]), false, false)
            node.body.push(componentDidMountNode)
          }
          if (!componentDidShowNode) {
            componentDidShowNode = t.classMethod('method', t.identifier('componentDidShow'), [],
              t.blockStatement([
                toAst('super.componentDidShow && super.componentDidShow()') as t.Statement
              ]), false, false)
            node.body.push(componentDidShowNode)
          }
          if (!componentDidHideNode) {
            componentDidHideNode = t.classMethod('method', t.identifier('componentDidHide'), [],
              t.blockStatement([
                toAst('super.componentDidHide && super.componentDidHide()') as t.Statement
              ]), false, false)
            node.body.push(componentDidHideNode)
          }
          if (hasOnReachBottom) {
            componentDidShowNode.body.body.push(
              toAst(`
                this._offReachBottom = Ditto.onReachBottom({
                  callback: this.onReachBottom,
                  ctx: this,
                  onReachBottomDistance: ${JSON.stringify(pageConfig.onReachBottomDistance)}
                })
              `)
            )
            componentDidHideNode.body.body.push(
              toAst('this._offReachBottom && this._offReachBottom()')
            )
          }
          if (hasOnPageScroll) {
            componentDidShowNode.body.body.push(
              toAst('this._offPageScroll = Ditto.onPageScroll({ callback: this.onPageScroll, ctx: this })')
            )
            componentDidHideNode.body.body.push(
              toAst('this._offPageScroll && this._offPageScroll()')
            )
          }
          if (hasOnPullDownRefresh) {
            componentDidShowNode.body.body.push(
              toAst(`
                this.pullDownRefreshRef && this.pullDownRefreshRef.bindEvent()
              `)
            )
            componentDidHideNode.body.body.push(
              toAst(`
                this.pullDownRefreshRef && this.pullDownRefreshRef.unbindEvent()
              `)
            )
          }
        }
      },
      ExportDefaultDeclaration: {
        exit(astPath: NodePath<t.ExportDefaultDeclaration>) {
          exportDefaultDeclarationNode = astPath.node
        }
      },
      ExportNamedDeclaration: {
        exit(astPath: NodePath<t.ExportNamedDeclaration>) {
          exportNamedDeclarationPath = astPath
        }
      },
      JSXElement(path) {
        const id = path.node.openingElement.name
        if (
          t.isJSXIdentifier(id) &&
          !DEFAULT_Component_SET.has(id.name)
        ) {
          if (moduleNames.indexOf(id.name) !== -1) {
            const name = id.name
            const binding = path.scope.getBinding(name)
            if (binding && t.isImportDeclaration(binding.path.parent)) {
              depComponents[name] = {
                path: binding.path.parent.source.value,
                name: name
              }
            }
          }
        }
      },
      Program: {
        enter(astPath: NodePath<t.Program>) {
          const module = astPath.scope.getAllBindings('module') || {};
          moduleNames = Object.keys(module)
        },
        exit(astPath: NodePath<t.Program>) {
          if (hasOnPullDownRefresh) {
            // 增加PullDownRefresh组件
            if (!importDittoComponentNode) {
              importDittoComponentNode = t.importDeclaration(
                [],
                t.stringLiteral('@ke/ditto-components')
              )
              astPath.node.body.unshift(importDittoComponentNode)
            }
            const specifiers = importDittoComponentNode.specifiers
            const pos = importDittoComponentNode.specifiers.findIndex(specifier => {
              if (!t.isImportSpecifier(specifier)) return false
              const importedComponent = toVar(specifier.imported)
              return importedComponent === 'PullDownRefresh'
            })
            if (pos === -1) {
              specifiers.push(
                t.importSpecifier(
                  t.identifier('PullDownRefresh'),
                  t.identifier('PullDownRefresh')
                )
              )
            }
            const returnStatement = renderReturnStatementPaths.filter(renderReturnStatementPath => {
              const funcParentPath: NodePath = renderReturnStatementPath.getFunctionParent()
              return funcParentPath.node === renderClassMethodNode
            })
            returnStatement.forEach(returnAstPath => {
              const statement = returnAstPath.node
              const varName = returnAstPath.scope.generateUid()
              const returnValue = statement.argument
              const pullDownRefreshNode = t.variableDeclaration(
                'const',
                [t.variableDeclarator(
                  t.identifier(varName),
                  returnValue
                )]
              )
              returnAstPath.insertBefore(pullDownRefreshNode)
              statement.argument = (toAst(`
                <PullDownRefresh
                  onRefresh={this.onPullDownRefresh && this.onPullDownRefresh.bind(this)}
                  ref={ref => {
                    if (ref) this.pullDownRefreshRef = ref
                }}>{${varName}}</PullDownRefresh>`) as t.ExpressionStatement).expression
            })
          }

          if (!exportDefaultDeclarationNode && exportNamedDeclarationPath) {
            replaceExportNamedToDefault(exportNamedDeclarationPath)
          }
        }
      }
    }

    const visitor: TraverseOptions = mergeVisitors({}, defaultVisitor, isPage ? pageVisitor : {})

    traverse(ast, visitor)

    const generateCode = generate(ast, {
      jsescOption: {
        minimal: true
      }
    }).code
    if (this.currentTrack && isPage) {
      this.currentTrack.collectPageInfo(path.relative(this.appPath, filePath), Object.values(depComponents))
    }
    return {code: generateCode, config: configObj}
  }

  getTempDir(filePath, originalFilePath) {
    const appPath = this.appPath
    const sourcePath = this.sourcePath
    const tempDir = this.tempDir
    let dirname = path.dirname(filePath)

    if (filePath.indexOf(sourcePath) < 0) {
      dirname = path.extname(originalFilePath) ? path.dirname(originalFilePath) : originalFilePath
    }
    const relPath = path.relative(sourcePath, dirname)

    return path.resolve(appPath, tempDir, relPath)
  }

  transformToTempDir(filePath: string) {
    const sourcePath = this.sourcePath
    const isAbsolute = path.isAbsolute(filePath)
    if (!isAbsolute) return filePath

    const relPath = path.relative(sourcePath, filePath)
    return relPath.startsWith('..')
      ? filePath
      : path.resolve(this.tempPath, relPath)
  }
  /**
   * 合并app.tsx中的subPackages和子包中router
   * @param subPackages1 app.tsx中的subPackages
   * @param subPackages2 子包中router
   */
  mergeSubPackages(subPackages1, subPackages2) {
    const subPackages: any[] = []
    const record = {}
    subPackages1.concat(subPackages2).forEach(element => {
      if (record[element.root] === undefined) {
        record[element.root] = subPackages.length
        subPackages.push(element)
      } else {
        const index = record[element.root]
        const temp = subPackages[index]
        temp.pages = uniq(temp.pages.concat(element.pages));
        subPackages[index] = temp
      }
    })
    return subPackages
  }
  filterSubPackages(subPackages) {
    let subPackagesList: any[] = []
    if (this.subPackages) {
      if (this.subPackages === 'inquirer') {
        // subPackagesList = await inquirer.prompt([
        //   {
        //     type: 'checkbox',
        //     name: 'subPackagesList',
        //     message: '请选择要编译的子包！',
        //     choices: subPackages.map(item => item.root)
        //   }
        // ]).subPackagesList
      } else {
        subPackagesList = this.subPackages.split(',').map(root => 'subpackages/' + root)
      }
      // compiler.subPackagesList = subPackagesList
      subPackages = subPackages.filter(subPackage => subPackagesList.includes(subPackage.root))
    }
    return subPackages
  }
  generatePkgJson(code, filePath){
    const sourcePath = this.sourcePath
    const distDirname = this.getTempDir(filePath, sourcePath)
    // const distPath = this.getDist(distDirname, filePath, false)
    console.log('generatePkgJson', sourcePath, distDirname)
    const pkgConfig = JSON.parse(code);
    const dependencies = {};
    const devDependencies = {};
    Object.keys(pkgConfig.dependencies).forEach(item=>{
      if(!/^@ke\/ditto/g.test(item)){
        dependencies[item] = pkgConfig.dependencies[item]
      }
    })
    Object.keys(pkgConfig.devDependencies).forEach(item=>{
      if(!/^@ke\/ditto/g.test(item)){
        devDependencies[item] = pkgConfig.devDependencies[item]
      }
    })
    dependencies['@ke/jaye'] = "^0.0.51";
    dependencies['@ke/jaye-scripts'] = "0.0.36";
    pkgConfig.dependencies = dependencies;
    pkgConfig.devDependencies = devDependencies;
    pkgConfig.scripts = {
      "start": "jaye-scripts start",
      "build": "jaye-scripts build"
    }
    pkgConfig.projectType = 'beikeMiniProgram'
    delete pkgConfig.templateInfo
    fs.writeFileSync(path.join(distDirname, `package.json`), JSON.stringify(pkgConfig));
  }
  async processFiles(filePath, originalFilePath) {
    const original = fs.readFileSync(filePath, { encoding: 'utf8' })
    const extname = path.extname(filePath)
    const distDirname = this.getTempDir(filePath, originalFilePath)
    const isScriptFile = REG_SCRIPTS.test(extname)
    const distPath = this.getDist(distDirname, filePath, isScriptFile)
    fs.ensureDirSync(distDirname)

    try {
      if (isScriptFile) {
        // 脚本文件 处理一下
        const fileType = this.classifyFiles(filePath)
        if (fileType === FILE_TYPE.ENTRY) {
          this.pages = [];
          // @ts-ignore
          const {code, config: configObj, subpackagesRouter} = await this.processEntry(original, filePath);
          fs.writeFileSync(path.join(distDirname, `app.js`), DEFAULT_ENTRY);

          console.log('sbbbb', configObj.subPackages, subpackagesRouter)
          let subPackages = this.filterSubPackages(this.mergeSubPackages(configObj.subPackages, subpackagesRouter));
          console.log('subPackages', subPackages)
          configObj.subPackages = subPackages;
          console.log('kooooo', distPath, distDirname,extname)
          const jsonPath = distPath.replace(`.js`, '.json');
          const jsonStr = JSON.stringify(configObj);
          fs.writeFileSync(jsonPath, jsonStr);

          // if (Array.isArray(result)) {
          //   result.forEach(([pageName, code]) => {
          //     fs.writeFileSync(
          //       path.join(distDirname, `${pageName}.js`),
          //       code
          //     )
          //   })
          // } else if(typeof result === 'object'){
          //   fs.writeFileSync(distPath, result.app)
          //   // 分离路由文件
          //   const routesPath = distPath.replace('/app.js', '/_routes.js')
          //   fs.writeFileSync(routesPath, result.routes)
          // }
        } else {
          const {code, config: configObj} = this.processOthers(original, filePath, fileType)
          fs.writeFileSync(distPath, code)
          if(configObj && Object.keys(configObj).length){
            console.log('configobj', configObj)
            // 生成json
            const jsonPath = distPath.replace(`.js`, '.json');
            const jsonStr = JSON.stringify(configObj)
            fs.writeFileSync(jsonPath, jsonStr);
          }
        }
      } else {
        // 其他 直接复制
        fs.copySync(filePath, distPath)
      }
    } catch (e) {
      console.log(e)
    }
  }

  getDist(distDirname, filename, isScriptFile) {
    return isScriptFile
      ? path.format({
        dir: distDirname,
        ext: '.js',
        name: path.basename(filename, path.extname(filename))
      })
      : path.format({
        dir: distDirname,
        base: path.basename(filename)
      })
  }
}

export { Compiler }

export async function build(appPath: string, buildConfig: IBuildOptions) {
  process.env.DITTO_ENV = BUILD_TYPES.H5
  // await checkCliAndFrameworkVersion(appPath, BUILD_TYPES.H5)
  const compiler = new Compiler(appPath)
  compiler.currentTrack = buildConfig.currentTrack
  compiler.subPackages = buildConfig.subPackages
  await compiler.clean()
  await compiler.buildTemp()
  console.log('process.cwd()', process.cwd(), this.tempDir);
  printLog(processTypeEnum.GENERATE, 'node modules 安装中...')
  const child = exec('npm install', { cwd: path.join(process.cwd(), CONFIG.BK_DIR) },(err)=>{
    if(err) {
      console.log('etr', err);
      return;
    }
    printLog(processTypeEnum.REMIND, 'node modules 安装完成 ✅')
    if (buildConfig.watch) {
      compiler.watchFiles()
    }
  });
  child.stdout.on('data', function (data) {
    console.log(data)
  })
  child.stderr.on('data', function (data) {
    console.log(data)
  })

  // await compiler.currentTrack.sendTrack()
  // if (compiler.h5Config.transformOnly !== true) {
  //   await compiler.buildDist(buildConfig)
  // }
  // compiler.processFlagFile()
  // if (buildConfig.watch) {
  //   compiler.watchFiles()
  // }
}
