/* eslint-disable @typescript-eslint/no-namespace */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly BOT_TOKEN: string;
      readonly NODE_ENV: 'development' | 'production';
    }
  }
}

export const IS_DEV = process.env.NODE_ENV === 'development';
