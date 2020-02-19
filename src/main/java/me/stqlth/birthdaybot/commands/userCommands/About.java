package me.stqlth.birthdaybot.commands.userCommands;

import com.jagrosh.jdautilities.command.Command;
import com.jagrosh.jdautilities.command.CommandEvent;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.JDAInfo;
import net.dv8tion.jda.api.entities.TextChannel;

import java.awt.*;

import static me.stqlth.birthdaybot.utils.Utilities.isPrivate;


public class About extends Command {

    public About()
    {
        this.name = "about";
        this.aliases = new String[]{"botabout","hi"};
        this.guildOnly = false;
        this.help = "View information about BirthdayBot.";
        this.category = new Category("Info");
    }

    @Override
    protected void execute(CommandEvent event) {
        EmbedBuilder builder = new EmbedBuilder();

        builder.setDescription("Hello! I am <@656621136808902656>, a bot built by <@478288246858711040>!"+
                "\n"+
                "\nI was written for Discord in Java, using the JDA library ("+ JDAInfo.VERSION+")"+
                "\nI'm currently in Version 1.0.0" +
                "\n"+
                "\nType `bday help` and I'll display you a list of commands you can use!"+
//                "\nSee some of my other stats with `" + getMessageInfo.getPrefix(g) + "stats`"+
                "\n"+
                "\nFor additional help, contact <@478288246858711040> or join our discord server [here](https://discord.gg/CJnWuWn)")
                .setColor(Color.decode("#00e1ff"));
        if (!isPrivate(event)) event.getTextChannel().sendMessage(builder.build()).queue(); else event.getPrivateChannel().sendMessage(builder.build()).queue();;
    }

}
