import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import {
    ChatInputApplicationCommandData,
    CommandInteraction,
    MessageEmbed,
    PermissionString,
} from 'discord.js';

import { EventData } from '../models/index.js';
import { Lang } from '../services/index.js';
import { InteractionUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './index.js';

export class HelpCommand implements Command {
    public metadata: ChatInputApplicationCommandData = {
        name: Lang.getCom('commands.help'),
        description: 'The help command.',
        options: [
            {
                name: Lang.getCom('arguments.category'),
                description: 'Help category to display.',
                required: true,
                type: ApplicationCommandOptionType.String.valueOf(),
                choices: [
                    {
                        name: 'general',
                        value: 'GENERAL',
                    },
                    {
                        name: 'blacklist',
                        value: 'BLACKLIST',
                    },
                    {
                        name: 'config',
                        value: 'CONFIG',
                    },
                    {
                        name: 'message',
                        value: 'MESSAGE',
                    },
                    {
                        name: 'trusted_role',
                        value: 'TRUSTED_ROLE',
                    },
                    {
                        name: 'member_anniversary_role',
                        value: 'MEMBER_ANNIVERSARY_ROLE',
                    },
                    {
                        name: 'premium',
                        value: 'PREMIUM',
                    },
                ],
            },
        ],
    };
    public deferType = CommandDeferType.PUBLIC;
    public requireDev = false;
    public requireGuild = false;
    public requireClientPerms: PermissionString[] = [];
    public requireUserPerms: PermissionString[] = [];
    public requireSetup = false;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let link = intr.options.getString('link').toLowerCase() ?? 'general';
        let embed: MessageEmbed;
        switch (link) {
            case 'general': {
                embed = Lang.getEmbed('info', 'help.general', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'blacklist': {
                embed = Lang.getEmbed('info', 'help.blacklist', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'config': {
                embed = Lang.getEmbed('info', 'embeds.config', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'message': {
                embed = Lang.getEmbed('info', 'embeds.message', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'trusted_role': {
                embed = Lang.getEmbed('info', 'embeds.trusted', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'member_anniversary_role': {
                embed = Lang.getEmbed('info', 'embeds.mar', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            case 'premium': {
                embed = Lang.getEmbed('info', 'embeds.premium', data.lang(), {
                    BOT: intr.client.user.toString(),
                });
                break;
            }
            default: {
                return;
            }
        }

        await InteractionUtils.send(intr, embed);
    }
}
