import {
    GetShardsResponse,
    SetShardPresencesRequest,
    ShardInfo,
    ShardStats,
} from '../models/cluster-api';
import { Request, Response, Router } from 'express';
import { checkAuth, mapClass } from '../middleware';

import { Controller } from './controller';
import { Logger } from '../services';
import { ShardingManager } from 'discord.js';
import router from 'express-promise-router';

let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class ShardsController implements Controller {
    public path = '/shards';
    public router: Router = router();
    public authToken: string = Config.api.secret;

    constructor(private shardManager: ShardingManager) {
        this.router.get(this.path, (req, res) => this.getShards(req, res));
        this.router.put(`${this.path}/presence`, mapClass(SetShardPresencesRequest), (req, res) =>
            this.setShardPresences(req, res)
        );
    }

    private async getShards(req: Request, res: Response): Promise<void> {
        let shardDatas = await Promise.all(
            this.shardManager.shards.map(async shard => {
                let shardInfo: ShardInfo = {
                    id: shard.id,
                    ready: shard.ready,
                    error: false,
                };

                try {
                    shardInfo.uptimeSecs = Math.floor(
                        (await shard.fetchClientValue('uptime')) / 1000
                    );
                } catch (error) {
                    Logger.error(Logs.error.shardInfo, error);
                    shardInfo.error = true;
                }

                return shardInfo;
            })
        );

        let stats: ShardStats = {
            shardCount: this.shardManager.shards.size,
            uptimeSecs: Math.floor(process.uptime()),
        };

        let resBody: GetShardsResponse = {
            id: Config.clustering.clusterId,
            shards: shardDatas,
            stats,
        };
        res.status(200).json(resBody);
    }

    private async setShardPresences(req: Request, res: Response): Promise<void> {
        let reqBody = req.body as SetShardPresencesRequest;

        await this.shardManager.broadcastEval(`
            (async () => {
                return await this.setPresence('${reqBody.type}', '${reqBody.name}', '${reqBody.url}');
            })();
        `);

        res.sendStatus(200);
    }
}
