import { DMChannel, Message, TextChannel } from 'discord.js';

import { Command } from './command';
import { Lang } from '../services';
import { LangCode } from '../models/enums';
import { MessageUtils } from '../utils';

export class SupportCommand implements Command {
    public name: string = 'support';
    public aliases = ['supportserver', 'server'];
    public requireSetup = false;
    public guildOnly = false;
    public adminOnly = false;
    public ownerOnly = false;
    public voteOnly = false;
    public requirePremium = false;
    public getPremium = false;

    public async execute(
        args: string[],
        msg: Message,
        channel: TextChannel | DMChannel
    ): Promise<void> {
        await MessageUtils.send(msg.channel, Lang.getEmbed('info.support', LangCode.EN_US));
    }
}
