/*
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-14 22:55:30
 */

import Bluebird from "bluebird";
import { getNewProjects, deleteNewProject, CommandOptions, Migration, getNewGroups, deleteNewGroup } from "./data_Interface";


export async function deleteActions(commandOptions: CommandOptions) {
    switch (commandOptions.migration) {
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
    Bluebird.map(allProjects, async (project: any)=> {
        if (!commandOptions.verify) {
            await deleteNewProject(project.id);
        }
        console.log(`delete project success id:${project.id}, path: ${project.path_with_namespace}`);
    });
}

async function deleteGroups(commandOptions: CommandOptions) {
    const allGroups = await getNewGroups(commandOptions.dataSource);
    Bluebird.map(allGroups, async (group: any)=> {
        if (!commandOptions.verify) {
            await deleteNewGroup(group.id);
        }
        console.log(`delete group success id:${group.id}, path: ${group.full_path}`);
    });
}
