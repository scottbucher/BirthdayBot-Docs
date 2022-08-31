import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import {
    BaseCommandInteraction,
    CommandInteraction,
    MessageComponentInteraction,
    Modal,
    ModalSubmitInteraction,
    PermissionString,
    TextBasedChannel,
} from 'discord.js';
import { ExpireFunction } from 'discord.js-collector-utils';

import { EventData } from '../../models/index.js';
import { GuildRepo } from '../../services/database/repos/index.js';
import { Lang } from '../../services/index.js';
import {
    ClientUtils,
    CollectorUtils,
    FormatUtils,
    InteractionUtils,
    PermissionUtils,
} from '../../utils/index.js';
import { Command } from '../index.js';

export class ChannelSubCommand implements Command {
    constructor(public guildRepo: GuildRepo) {}
    public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        name: Lang.getCom('settingType.channel'),
        description: undefined,
    };

    public deferType = undefined;
    public requireDev = false;
    public requireClientPerms: PermissionString[] = ['VIEW_CHANNEL', 'MANAGE_CHANNELS'];
    public requireSetup = true;
    public requireVote = false;
    public requirePremium = false;

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        let type: string;
        let reset = intr.options.getBoolean(Lang.getCom('arguments.reset')) ?? false;
        let nextIntr:
            | BaseCommandInteraction
            | MessageComponentInteraction
            | ModalSubmitInteraction = intr;
        let expireFunction: ExpireFunction = async () => {
            await InteractionUtils.send(
                nextIntr,
                Lang.getEmbed('results', 'fail.promptExpired', data.lang())
            );
        };

        let celebrationTypePrompt = await InteractionUtils.sendWithEnterResponseButton(
            nextIntr,
            data,
            Lang.getEmbed('prompts', 'config.channelType', data.lang())
        );

        let typeResult = await CollectorUtils.collectByModal(
            celebrationTypePrompt,
            new Modal({
                customId: 'modal', // Will be overwritten
                title: Lang.getRef('info', 'terms.celebrationType', data.lang()),
                components: [
                    {
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'TEXT_INPUT',
                                customId: 'type',
                                label: Lang.getRef('info', 'terms.celebrationType', data.lang()),
                                required: true,
                                style: 'SHORT',
                                minLength: 6,
                                maxLength: 18,
                                placeholder: Lang.getRef('info', 'terms.birthday', data.lang()),
                            },
                        ],
                    },
                ],
            }),
            intr.user,
            async (intr: ModalSubmitInteraction) => {
                let input = intr.components[0].components[0].value;
                let givenType = FormatUtils.extractCelebrationType(input.toLowerCase());
                if (
                    !givenType ||
                    givenType === 'userSpecificBirthday' ||
                    givenType === 'userSpecificMemberAnniversary'
                ) {
                    await InteractionUtils.send(
                        intr,
                        Lang.getErrorEmbed('validation', 'errorEmbeds.invalidSetting', data.lang())
                    );
                    return;
                }

                return { intr, value: givenType };
            },
            expireFunction
        );

        if (typeResult === undefined) return;
        nextIntr = typeResult.intr;
        type = typeResult.value;

        let displayType = Lang.getRef('info', `terms.${type}`, data.lang());

        let channel: string;

        if (!reset) {
            let guild = intr.guild;

            let promptEmbed = Lang.getEmbed('prompts', 'config.channel', data.lang(), {
                TYPE: displayType,
                TYPE_LOWERCASE: displayType.toLowerCase(),
                DOC_LINK: Lang.getCom(
                    `docLinks.whatIs${
                        type === 'birthday'
                            ? 'Birthday'
                            : type === 'memberAnniversary'
                            ? 'MemberAnniversary'
                            : 'ServerAnniversary'
                    }Channel`
                ),
            });

            let channelResult = await CollectorUtils.getSetupChoiceFromButton(
                nextIntr,
                data,
                promptEmbed
            );

            if (channelResult === undefined) return;

            nextIntr = channelResult.intr;

            switch (channelResult.value) {
                case 'create': {
                    let title = Lang.getRef('info', `defaults.${type}ChannelName`, data.lang());
                    let topic = Lang.getRef('info', `defaults.${type}ChannelTopic`, data.lang());
                    // Create channel with desired attributes
                    channel = (
                        await guild.channels.create(title, {
                            type: 'GUILD_TEXT',
                            topic,
                            permissionOverwrites: [
                                {
                                    id: guild.id,
                                    deny: ['SEND_MESSAGES'],
                                    allow: ['VIEW_CHANNEL'],
                                },
                                {
                                    id: guild.me.roles.cache.filter(role => role.managed)?.first()
                                        ?.id,
                                    allow: [
                                        'VIEW_CHANNEL',
                                        'SEND_MESSAGES',
                                        'EMBED_LINKS',
                                        'ADD_REACTIONS',
                                        'READ_MESSAGE_HISTORY',
                                    ],
                                },
                            ],
                        })
                    )?.id;
                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getSuccessEmbed(
                            'results',
                            'successEmbeds.channelCreate',
                            data.lang(),
                            {
                                CHANNEL: `<#${channel}>`,
                            }
                        )
                    );
                    break;
                }
                case 'select': {
                    let channelPrompt = await InteractionUtils.sendWithEnterResponseButton(
                        nextIntr,
                        data,
                        Lang.getEmbed('prompts', 'setup.inputChannel', data.lang())
                    );

                    let placeholder =
                        type === 'birthday'
                            ? Lang.getRef('info', 'defaults.birthdayChannelName', data.lang())
                            : type === 'memberAnniversary'
                            ? Lang.getRef(
                                  'info',
                                  'defaults.memberAnniversaryChannelName',
                                  data.lang()
                              )
                            : Lang.getRef(
                                  'info',
                                  'defaults.serverAnniversaryChannelName',
                                  data.lang()
                              );

                    let channelResult = await CollectorUtils.collectByModal(
                        channelPrompt,
                        new Modal({
                            customId: 'modal', // Will be overwritten
                            title: Lang.getRef('info', `terms.${type}Channel`, data.lang()),
                            components: [
                                {
                                    type: 'ACTION_ROW',
                                    components: [
                                        {
                                            type: 'TEXT_INPUT',
                                            customId: 'channel',
                                            label: Lang.getRef(
                                                'info',
                                                `terms.${type}Channel`,
                                                data.lang()
                                            ),
                                            required: true,
                                            style: 'SHORT',
                                            minLength: 1,
                                            placeholder: placeholder.split(' ').join('-'), // format like #channel-name
                                        },
                                    ],
                                },
                            ],
                        }),
                        intr.user,
                        async (intr: ModalSubmitInteraction) => {
                            let input = intr.components[0].components[0].value;
                            // Find mentioned channel
                            let channelInput: TextBasedChannel = await ClientUtils.findTextChannel(
                                intr.guild,
                                input
                            );

                            if (!channelInput) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getErrorEmbed(
                                        'validation',
                                        'errorEmbeds.invalidChannel',
                                        data.lang()
                                    )
                                );
                                return;
                            }

                            // Bot needs to be able to message in the desired channel
                            if (!PermissionUtils.canSend(channelInput)) {
                                await InteractionUtils.send(
                                    intr,
                                    Lang.getEmbed(
                                        'validation',
                                        'embeds.noAccessToChannel',
                                        data.lang(),
                                        {
                                            CHANNEL: channelInput.toString(),
                                        }
                                    )
                                );
                                return;
                            }

                            return { intr, value: channelInput?.id };
                        },
                        expireFunction
                    );

                    if (channelResult === undefined) return;
                    nextIntr = channelResult.intr;
                    channel = channelResult.value;

                    await InteractionUtils.send(
                        nextIntr,
                        Lang.getSuccessEmbed('results', 'successEmbeds.channelSet', data.lang(), {
                            CHANNEL: `<#${channel}>`,
                            TYPE: displayType.toLowerCase(),
                        })
                    );
                    break;
                }
                case 'deny': {
                    channel = '0';
                    break;
                }
            }
            nextIntr = channelResult.intr;
        } else channel = '0';

        if (channel === '0') {
            await InteractionUtils.send(
                nextIntr,
                Lang.getSuccessEmbed('results', 'successEmbeds.channelClear', data.lang(), {
                    TYPE: displayType.toLowerCase(),
                })
            );
        }

        // Save the channel
        type === 'birthday'
            ? await this.guildRepo.updateBirthdayChannel(intr.guild.id, channel)
            : type === 'memberAnniversary'
            ? await this.guildRepo.updateMemberAnniversaryChannel(intr.guild.id, channel)
            : await this.guildRepo.updateServerAnniversaryChannel(intr.guild.id, channel);
    }
}
