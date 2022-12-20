/*
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-14 22:55:30
 */

import Bluebird from "bluebird";
import {
    getNewProjects,
    deleteNewProject,
    CommandOptions,
    Migration,
    getNewGroups,
    deleteNewGroup,
    getNewUsers,
    deleteNewUser
} from "./data_Interface";


export async function deleteActions(commandOptions: CommandOptions) {
    switch (commandOptions.migration) {
        case Migration.user:
            await deleteUsers(commandOptions);
            break;
        case Migration.group:
            await deleteGroups(commandOptions);
            break;
        case Migration.project:
            await deleteProjects(commandOptions);
            break;
    }
}

async function deleteProjects(commandOptions: CommandOptions) {
    const allProjects = await getNewProjects(commandOptions.dataSource);
    Bluebird.map(allProjects, async (project: any) => {
        if (!commandOptions.verify) {
            await deleteNewProject(project.id);
        }
        console.log(`delete project success id:${project.id}, path: ${project.path_with_namespace}`);
    });
}

async function deleteGroups(commandOptions: CommandOptions) {
    const allGroups = await getNewGroups(commandOptions.dataSource);
    Bluebird.map(allGroups, async (group: any) => {
        if (!commandOptions.verify) {
            await deleteNewGroup(group.id);
        }
        console.log(`delete group success id:${group.id}, path: ${group.full_path}`);
    });
}

async function deleteUsers(commandOptions: CommandOptions) {
    const allUsers = await getNewUsers(commandOptions.dataSource);
    Bluebird.map(allUsers, async (user: any) => {
        if (!commandOptions.verify) {
            if (user.username != 'root') {
                await deleteNewUser(user.id);
            }
        }
        console.log(`delete user success id:${user.id}, path: ${user.username}`);
    });
}
