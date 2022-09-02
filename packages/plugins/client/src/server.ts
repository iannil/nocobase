import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import serve from 'koa-static';
import { isAbsolute, resolve } from 'path';

export class ClientPlugin extends Plugin {
  async beforeLoad() {
    // const cmd = this.app.findCommand('install');
    // if (cmd) {
    //   cmd.option('--import-demo');
    // }
    this.app.on('afterInstall', async (app, options) => {
      const [opts] = options?.cliArgs || [{}];
      if (opts?.importDemo) {
        //
      }
    });
  }

  async load() {
    this.app.acl.allow('app', 'getLang');
    this.app.acl.allow('app', 'getInfo');
    this.app.acl.allow('app', 'getPlugins', 'loggedIn');
    this.app.acl.allow('plugins', 'getPinned', 'loggedIn');
    this.app.resource({
      name: 'app',
      actions: {
        async getInfo(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
          const currentUser = ctx.state.currentUser;
          let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
          if (enabledLanguages.includes(currentUser?.appLang)) {
            lang = currentUser?.appLang;
          }
          ctx.body = {
            version: await ctx.app.version.get(),
            lang,
          };
          await next();
        },
        async getLang(ctx, next) {
          const SystemSetting = ctx.db.getRepository('systemSettings');
          const systemSetting = await SystemSetting.findOne();
          const enabledLanguages: string[] = systemSetting.get('enabledLanguages') || [];
          const currentUser = ctx.state.currentUser;
          let lang = enabledLanguages?.[0] || process.env.APP_LANG || 'en-US';
          if (enabledLanguages.includes(currentUser?.appLang)) {
            lang = currentUser?.appLang;
          }
          ctx.body = {
            lang,
          };
          await next();
        },
        async getPlugins(ctx, next) {
          ctx.body = ['china-region', 'export', 'audit-logs', 'workflow'];
          await next();
        },
      },
    });
    this.app.resource({
      name: 'plugins',
      actions: {
        // TODO: 临时
        async getPinned(ctx, next) {
          ctx.body = [
            { component: 'DesignableSwitch', pin: true },
            { component: 'CollectionManagerShortcut', pin: true },
            { component: 'ACLShortcut' },
            { component: 'WorkflowShortcut' },
            { component: 'SchemaTemplateShortcut' },
            { component: 'SystemSettingsShortcut' },
            { component: 'FileStorageShortcut' },
          ];
          await next();
        },
      },
    });
    let root = this.options.dist || `./packages/app/client/dist`;
    if (!isAbsolute(root)) {
      root = resolve(process.cwd(), root);
    }
    if (process.env.APP_ENV !== 'production' && root) {
      this.app.middleware.unshift(async (ctx, next) => {
        if (ctx.path.startsWith(this.app.resourcer.options.prefix)) {
          return next();
        }
        await serve(root)(ctx, next);
        // console.log('koa-send', root, ctx.status);
        if (ctx.status == 404) {
          return send(ctx, 'index.html', { root });
        }
      });
    }
  }

  getName(): string {
    return this.getPackageName(__dirname);
  }
}

export default ClientPlugin;
