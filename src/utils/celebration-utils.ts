import { ArrayUtils, TimeUtils } from '.';
import {
    CustomMessage,
    CustomMessages,
    GuildCelebrationData,
    GuildData,
    RawGuildCelebrationData,
    SplitUsers,
    UserData,
} from '../models/database';

import { Moment } from 'moment-timezone';
import moment from 'moment';

let Debug = require('../../config/debug.json');

let Config = require('../../config/config.json');

export class CelebrationUtils {
    public static getNextUsers(userDatas: UserData[], timeZone: string): UserData[] {
        let userTime = timeZone ? moment.tz(timeZone) : moment.tz();

        let { before: usersBefore, after: usersAfter } = this.splitUserDatasByTime(
            userDatas,
            userTime
        );

        if (usersAfter.length > 0) {
            let nextBirthday = usersAfter[0].Birthday; // First birthday after current date
            return usersAfter.filter(userData => userData.Birthday === nextBirthday); // TODO: Check by only month and day
        }

        if (usersBefore.length > 0) {
            let nextBirthday = usersBefore[0].Birthday; // First birthday starting at beginning of year
            return usersBefore.filter(userData => userData.Birthday === nextBirthday); // TODO: Check by only month and day
        }
    }

    public static splitUserDatasByTime(userDatas: UserData[], splitTime: Moment): SplitUsers {
        // TODO: Split into before and after, and sort by dates
        return {
            before: userDatas
                .filter(user => moment(user.Birthday).format('MM-DD') < splitTime.format('MM-DD'))
                .sort(this.compareUserDatas),
            after: userDatas
                .filter(user => moment(user.Birthday).format('MM-DD') > splitTime.format('MM-DD'))
                .sort(this.compareUserDatas),
        };
    }

    public static compareUserDatas(a: UserData, b: UserData): number {
        let aBday = moment(a.Birthday).format('MM-DD');
        let bBday = moment(b.Birthday).format('MM-DD');

        if (aBday > bBday) {
            return 1;
        }

        if (aBday < bBday) {
            return -1;
        }

        return 0;
    }

    public static isTimeForBirthdayMessage(messageHour: number, userData: UserData): boolean {
        if (Debug.alwaysSendBirthdayMessage) {
            return true;
        }

        let currentDate = moment().tz(userData.TimeZone);
        let currentHour = currentDate.hour();
        return currentHour === messageHour;
    }

    public static isTimeForBirthdayRole(userData: UserData): boolean {
        if (Debug.alwaysGiveBirthdayRole) {
            return true;
        }

        let currentDate = moment().tz(userData.TimeZone);

        let currentHour = currentDate.hour();
        return currentHour === 0;
    }

    public static isBirthday(userData: UserData, guildData: GuildData): boolean {
        if (Debug.alwaysGiveBirthdayRole) {
            return true;
        }

        // If the server doesn't have a default timezone, use the user's timezone
        // Else, since we have a server timezone, if the UseTimezone setting in the server does not prioritize the server, use the user's timezone
        // Else, use the server's default timezone
        let currentDate = moment().tz(
            guildData.DefaultTimezone === '0'
                ? userData.TimeZone
                : guildData.UseTimezone !== 'server'
                ? userData.TimeZone
                : guildData.DefaultTimezone
        );
        let birthday = moment(userData.Birthday);

        let currentDateFormatted = currentDate.format('MM-DD');
        let birthdayFormatted = birthday.format('MM-DD');

        if (birthdayFormatted === '02-29' && !TimeUtils.isLeap(moment().year()))
            birthdayFormatted = '02-28';
        return currentDateFormatted === birthdayFormatted;
    }

    public static randomMessage(messages: CustomMessages, hasPremium: boolean): CustomMessage {
        if (messages.customMessages.length > 0) {
            if (hasPremium) {
                // Choose a random one
                return ArrayUtils.chooseRandom(messages.customMessages);
            } else {
                // Only choose from the first 10
                return ArrayUtils.chooseRandom(
                    messages.customMessages.slice(
                        0,
                        Config.validation.message.maxCount.birthday.free
                    )
                ).Message;
            }
        } else {
            // Return null
            return null;
        }
    }

    public static convertCelebrationData(
        rawGuildCelebrationData: RawGuildCelebrationData
    ): GuildCelebrationData[] {
        let dataSet: GuildCelebrationData[];

        for (let rawData of rawGuildCelebrationData.guildDatas) {
            let celebrationData = new GuildCelebrationData();
            celebrationData.guildData = rawData;
            celebrationData.customMessages = rawGuildCelebrationData.customMessages.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            celebrationData.blacklistedMembers = rawGuildCelebrationData.blacklistedMembers.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            celebrationData.trustedRoles = rawGuildCelebrationData.trustedRoles.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            celebrationData.anniversaryRoles = rawGuildCelebrationData.anniversaryRoles.filter(
                guild => (guild.GuildId = rawData.GuildId)
            );
            dataSet.push(celebrationData);
        }

        return dataSet;
    }
}
