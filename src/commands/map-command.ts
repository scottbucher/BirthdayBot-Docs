import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { Command } from './command';
import { EventData } from '../models/internal-models';
import { Lang } from '../services';

export class MapCommand implements Command {
    public data: ApplicationCommandData = {
        name: Lang.getCom('commands.map'),
        description: 'View the timezone map.',
    };
    public requireDev = false;
    public requireGuild = false;
    public requirePerms = [];

    public async execute(intr: CommandInteraction, data: EventData): Promise<void> {
        // yeet
    }
}
