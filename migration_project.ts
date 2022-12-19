import axios from 'axios';
import * as _ from 'lodash';
import * as fs from 'fs';
import {
    config,
    filePath,
    getNewGroupFullPathByOldGroupFullPath,
    transformNewProjectFullPathFrom
} from './config';
import {
    getOldProjects,
    getNewNamespaces,
    getOldNamespaces,
    createNewProject,
    getNewProjects,
    createNewProjectInfoLogs,
    DataSource,
    CommandOptions,
    getParentFullPath,
    writeToLocal,
    isIgnoreProject,
    isIgnoreGroup
} from './data_Interface'

/**
 * 迁移 Projects 项目信息
 * @param commandOptions 
 */
export async function migrationProjects(commandOptions: CommandOptions) {
    console.log('migration project start:')
    await getCreateProjectsInfo(commandOptions);
    console.log('migration project end!')
}

/**
 * 生成待创建 Projects 所需要的信息
 * @param commandOptions 
 * @returns 
 */
async function getCreateProjectsInfo(commandOptions: CommandOptions) {
    // 读取 旧项目列表
    const oldProjects = await getOldProjects(commandOptions.dataSource);

    // 新 gitlab 已经存在的项目(这些要过滤掉)
    const newProjectExistMap: any = await getExistNewProjectsMap(commandOptions);

    // 新 groups 的存在 map
    const newNamespacesExistMap = await getNewNamespacesMap(commandOptions);
    
    const sshMap: any = [];
    // 遍历生成新项目信息
    for (let oldPro of oldProjects) {
        // 判断项目所属的 group 是否被忽略
        if (isIgnoreGroup(oldPro.namespace.full_path)) {
            console.log(`Project 所属的 Group 被忽略, group: ${oldPro.namespace.full_path}, project: ${oldPro.path_with_namespace}`);
            continue;
        }
        // 判断项目本身是否被忽略
        if (isIgnoreProject(oldPro.path_with_namespace)) {
            console.log(`忽略 Project: ${oldPro.path_with_namespace}`);
            continue;
        }
        let newProjectFullPath: string;
        // 转换路径, 确定是目标 project 的地址
        // 1. 判断是否有 project 级别的地址转换
        if (transformNewProjectFullPathFrom(oldPro.path_with_namespace)) {
            // 1.1 有则确定新项目的 full_path
            newProjectFullPath = transformNewProjectFullPathFrom(oldPro.path_with_namespace) || oldPro.path_with_namespace;
        } else {
            if (oldPro.namespace.kind == 'group') {
                // 1.2 没有则判断是否有 group 级别的地址转换
                if (getNewGroupFullPathByOldGroupFullPath(oldPro.namespace.full_path)) {
                    // 1.2.1 有则确定 group, 拼接新项目的 full_path
                    newProjectFullPath = `${getNewGroupFullPathByOldGroupFullPath(oldPro.namespace.full_path)}/${oldPro.path}`;
                } else {
                    newProjectFullPath = oldPro.path_with_namespace;
                }
            } else { // kind == 'user'
                newProjectFullPath = oldPro.path_with_namespace;
            }
        }

        let groupFullPath: any = getParentFullPath(newProjectFullPath) || '';
        // 是否存在对应的 namespace
        if (!newNamespacesExistMap[groupFullPath]) { // 不存在
            // 不存在, 则判断是否有缺省 group
            if (config.default_group_full_path) {

                if (!newNamespacesExistMap[config.default_group_full_path]) { // 指定的 group 不存在
                    console.log(`指定的 config.default_group_full_path 不存在:${config.default_group_full_path}`);
                    continue;
                }
                // 有则确定group, 拼接新项目的 full_path
                newProjectFullPath = `${config.default_group_full_path}/${oldPro.path}`;
            } else {
                // 没有则略过
                // 2.2.2 不存在 namespace, 略过
                console.log(`new_gitlab不存在namespace: ${groupFullPath}, 且没有指定缺省 group, oldProject: ${oldPro.path_with_namespace}`)
                continue;
            }
        }

        groupFullPath = getParentFullPath(newProjectFullPath) || '';
        // 创建项目
        // 2. 判断 new_project 是否存在
        if (newProjectExistMap[newProjectFullPath]) { // 
            // 2.1 项目存在, 跳过
            console.log(`项目已存在, old: ${oldPro.path_with_namespace}, new: ${newProjectFullPath}`);
        } else {
            // 2.2 不存在则准备创建 project
            const namespaceID = newNamespacesExistMap[groupFullPath];
            let description = oldPro.description;
            if (groupFullPath == config.default_group_full_path) {
                description = `${oldPro.description}\n原用户: ${oldPro.namespace.full_path}`;
            }
            // 生成新项目的信息
            const newProjectInfo = {
                name: oldPro.name,
                path: oldPro.path,
                namespace_id: namespaceID,
                description: description,
                issues_enabled: oldPro.issues_enabled,
                merge_requests_enabled: oldPro.merge_requests_enabled,
                jobs_enabled: oldPro.jobs_enabled,
                wiki_enabled: oldPro.wiki_enabled,
                snippets_enabled: oldPro.snippets_enabled,
                resolve_outdated_diff_discussions: oldPro.resolve_outdated_diff_discussions,
                container_registry_enabled: oldPro.container_registry_enabled,
                shared_runners_enabled: oldPro.shared_runners_enabled,
                visibility: oldPro.visibility,
                public_jobs: oldPro.public_jobs,
                only_allow_merge_if_pipeline_succeeds: oldPro.only_allow_merge_if_pipeline_succeeds,
                only_allow_merge_if_all_discussions_are_resolved: oldPro.only_allow_merge_if_all_discussions_are_resolved,
                lfs_enabled: oldPro.lfs_enabled,
                request_access_enabled: oldPro.request_access_enabled,
                tag_list: oldPro.tag_list,
                printing_merge_request_link_enabled: oldPro.printing_merge_request_link_enabled,
            }
            if (newProjectInfo.namespace_id == undefined) {
                // 有问题
                throw Error(`namespace ID is null, projectFullPath: ${oldPro.path_with_namespace}, groupFullPath: ${groupFullPath}`)
            }
            // 创建 project
            if (!commandOptions.verify) {
                await createNewProject(newProjectInfo);
            }
            // 创建成功, 写入 map
            sshMap.push({
                old: oldPro.path_with_namespace,
                new: newProjectFullPath
            })
            console.log(`create success: oldPath: ${oldPro.path_with_namespace}, newPath: ${newProjectFullPath}`)
        }
    }
    // map 写入本地文件
    const endfix = new Date().getTime();
    await writeToLocal(filePath.repositories_map, sshMap);
    console.log(sshMap);
}

/**
 * { new_space.full_path: new_space.id }
 * @param commandOptions 
 * @returns 
 */
async function getNewNamespacesMap(commandOptions: CommandOptions) {
    const newSpaces: any = await getNewNamespaces(commandOptions.dataSource);
    const newSpacesMap: any = {};

    for (let space of newSpaces) {
        newSpacesMap[space.full_path] = space.id;
    }
    return newSpacesMap;
}

/**
 * 生成新 gitlab 已存在的项目 map
 * { new_project_for_path_with_namespace : true }
 * @param commandOptions 
 * @returns 
 */
async function getExistNewProjectsMap(commandOptions: CommandOptions) {
    const newProjects = await getNewProjects(commandOptions.dataSource);
    const map: any = {};
    for (let pro of newProjects) {
        map[pro.path_with_namespace] = true;
    }
    if (commandOptions.verify) {
        console.log('getExistNewProjectsMap');
        console.log(map);
    }
    return map;
}
