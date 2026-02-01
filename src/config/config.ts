import { Schema } from 'koishi';

export interface Config {
  bili: {
    secretKey: string;
    allowedGroups: string[];
  };
}

export const Config: Schema<Config> = Schema.object({
  bili: Schema.object({
    secretKey: Schema.string().default(''),
    allowedGroups: Schema.array(Schema.string()).default([]),
  }),
});
