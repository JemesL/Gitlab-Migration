/*
 * @Description:
 * @Author: Jemesl
 * @Date: 2022-12-20 18:37:47
 */
import * as _ from "lodash";
import {
    CommandOptions,
    getNewUsers,
    getOldUsers,
    isIgnoreUser,
    createNewUser,
} from "./data_Interface";

let ID_init = 1000;

export async function migrationUser(commandOptions: CommandOptions) {
    console.log("migration user start");
    const newUsers = await getNewUsers(commandOptions.dataSource);
    const oldUsers = await getOldUsers(commandOptions.dataSource);

    const newUsersExistMap = getExistUsersMap(newUsers);

    for (const oldUser of oldUsers) {
        // 判断是否忽略
        if (isIgnoreUser(oldUser.username)) {
            console.log(`忽略掉的user, username: ${oldUser.username}`);
            continue;
        }
        // 判断是否存在
        if (newUsersExistMap[oldUser.username]) {
            console.log(`已存在的user, username: ${oldUser.username}`);
            continue;
        }

        const user = {
            admin: oldUser.is_admin,
            bio: oldUser.bio,
            can_create_group: oldUser.can_create_group,
            commit_email: oldUser.commit_email,
            email: oldUser.email,
            linkedin: oldUser.linkedin,
            location: oldUser.location,
            name: oldUser.name,
            note: oldUser.note,
            organization: oldUser.organization,
            public_email: oldUser.public_email,
            twitter: oldUser.twitter,
            username: oldUser.username,
            website_url: oldUser.website_url,
            reset_password: true
        }
        if (!commandOptions.verify) {
            await createNewUser(user);
        }
        console.log(`create user success: newUsername: ${user.username}`);
        console.log(user);
    }

    console.log("migration user end");
}
export function getExistUsersMap(users: any) {
    const usersMap: any = {};
    for (let user of users) {
        usersMap[user.username] = true;
    }
    return usersMap;
}
