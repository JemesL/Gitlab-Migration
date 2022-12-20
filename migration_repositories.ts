/*
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-08 16:07:12
 */
import * as fs from 'fs';
import * as _ from 'lodash';
import {
    config, filePath
} from './config';
import {
    checkPathExist,
    CommandOptions,
    getGitAddrMap,
    getOldProjects,
} from './data_Interface'
import {
    simpleGit
} from 'simple-git';
import Bluebird from 'bluebird';

// 迁移项目数据
export async function migrationRepositories(commandOptions: CommandOptions) {
    await cloneOldRepos(commandOptions)
    await pushToRemote(commandOptions);
}

// 空项目map
async function emptyProjectsMap(commandOptions: CommandOptions) {
    // 读取 旧项目列表
    const oldProjects = await getOldProjects(commandOptions.dataSource);
    let maps: any = {};
    for (const pro of oldProjects) {
        maps[pro.path_with_namespace] = pro.empty_repo
    }
    return maps;
}

// 迁移项目数据
export async function cloneOldRepos(commandOptions: CommandOptions) {
    checkPathExist(filePath.repo_download_path);
    let gitsMap: any = getGitAddrMap();
    let emptyMap: any = await emptyProjectsMap(commandOptions);
    const successMaps: any = [];
    const errorMaps: any = [];
    const errors: any = [];
    await Bluebird.each(gitsMap, async (map: any) => {
        const oldGitAddr = `${config.old_ssh_domain}${map.old}.git`
        const newGitAddr = `${config.new_ssh_domain}${map.new}.git`

        const projectName = map.new.split('/').pop();
        const projectDirName = map.old;
        const projectPath = `${filePath.repo_download_path}/${projectDirName}`;

        if (emptyMap[map.old]) { // 说明是空项目
            console.log(`repo is empty: ${map.old}`)
            return;
        }

        // 判断路径存在
        if (fs.existsSync(projectPath)) {
            console.log(`dir exist: ${projectPath}`)
            return
        }
        try {
            if (!commandOptions.verify) {
                const res_clone = await simpleGit(filePath.repo_download_path).raw(['clone', oldGitAddr, `${projectDirName}`, '--bare']);
            }
            console.log(`clone success, dir: ${filePath.repo_download_path}, old: ${oldGitAddr} `);
            successMaps.push(map);
        } catch (error: any) {
            console.log(`clone failed: ${oldGitAddr}`);
            console.log(error);
            errorMaps.push(map);
        }
    })
    if (errorMaps.length > 0) {
        console.log('errorMaps');
        console.log(errorMaps);
    } else {
        console.log('clone all repos successed!')
    }
}

export async function pushToRemote(commandOptions: CommandOptions) {
    let gitsMap: any = getGitAddrMap();
    let emptyMap: any = await emptyProjectsMap(commandOptions);
    const successMaps: any = [];
    const errorMaps: any = [];
    console.log(emptyMap);
    await Bluebird.each(gitsMap, async (map: any) => {
        const oldGitAddr = `${config.old_ssh_domain}${map.old}.git`
        const newGitAddr = `${config.new_ssh_domain}${map.new}.git`

        const projectName = map.new.split('/').pop();
        const projectDirName = map.old;
        const projectPath = `${filePath.repo_download_path}/${projectDirName}`;

        if (emptyMap[map.old]) { // 说明是空项目
            console.log(`repo is empty: ${map.old}`)
            return;
        }
        // 判断是否路径存在
        if (!fs.existsSync(projectPath)) {
            console.log(`dir did not exist: ${projectPath}`)
            return
        }

        try {
            if (!commandOptions.verify) {
                const res_push = await simpleGit(projectPath).raw(['push', '--mirror', newGitAddr]);
            }
            console.log(`push success, new:${newGitAddr} old: ${oldGitAddr}`);
            successMaps.push(map);
        } catch (error: any) {
            console.log(`push failed, new:${newGitAddr} old: ${oldGitAddr}`);
            console.log(error);
            errorMaps.push(map);
        }
    })
    if (errorMaps.length > 0) {
        console.log('errorMaps');
        console.log(errorMaps);
    } else {
        console.log('push all repos successed!')
    }
}
