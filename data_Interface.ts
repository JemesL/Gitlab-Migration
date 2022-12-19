/*
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-07 18:35:45
 */
import {
    config, filePath
} from './config';
import axios from 'axios';
import * as fs from 'fs';

export enum GitService {
    old,
    new
}

export enum Migration {
    all,
    group,
    project,
    repo,
    clone,
    push
}

export enum DataSource {
    local,
    online
}

export class CommandOptions {
    command: string = ""
    service: GitService = GitService.new
    migration: Migration = Migration.group
    verify: boolean = false
    dataSource: DataSource = DataSource.online
}

export let oldService = axios.create({
    baseURL: config.old_baseURL,
    headers: {
        'private-token': config.old_private_token,
        'Accept-Encoding': 'compress'
    }
})

export let newService = axios.create({
    baseURL: config.new_baseURL,
    headers: {
        'private-token': config.new_private_token,
        'Accept-Encoding': 'compress'
    }
})


export async function createNewProject(obj: any) {
    let res = await newService.post('/projects', null, {
        params: obj
    })
    return res.data;
}

export async function createNewGroup(obj: any) {
    let res = await newService.post('/groups', null, {
        params: obj
    })
    return res.data;
}

export async function deleteNewGroup(id: any) {
    let service = newService;
    const res = await service.delete(`/groups/${id}`);
    console.log(res.data);
    return res.data;
}

export async function deleteNewProject(id: any) {
    let service = newService;
    const res = await service.delete(`/projects/${id}`);
    console.log(res.data);
    return res.data;
}

export async function pullProjects(type: GitService, path ? : string) {
    let service = type == GitService.new ? newService : oldService;
    const res1 = await service.get('/projects', {
        params: {
            per_page: 100,
            page: 1
        }
    });
    const res2 = await service.get('/projects', {
        params: {
            per_page: 100,
            page: 2
        }
    });
    let list = res1.data.concat(res2.data);
    if (path) {
        await writeToLocal(path, list)
    }
    return list;
}

export async function pullGroups(type: GitService, path ? : string) {
    let service = type == GitService.new ? newService : oldService;
    const res = await service.get('/groups', {
        params: {
            per_page: 100,
            page: 1
        }
    });
    const list = res.data.sort(function (a: any, b: any) {
        return a.id - b.id
    })
    if (path) {
        await writeToLocal(path, list)
    }
    return list;
}

export async function pullNamespaces(type: GitService, path ? : string) {
    let service = type == GitService.new ? newService : oldService;
    const res = await service.get('/namespaces', {
        params: {
            per_page: 100,
            page: 1
        }
    });
    const list = res.data.sort(function (a: any, b: any) {
        return a.id - b.id
    })
    if (path) {
        await writeToLocal(path, list)
    }
    return list;
}

export async function createNewProjectInfoLogs(log: any, path: string) {
    await writeToLocal(path, log);
}

export async function writeToLocal(path: string, obj: any) {
    // 判断目录是否存在, 不存在则递归创建
    checkPathExist(getParentDir(path));
    var buf = Buffer.from(JSON.stringify(obj));
    await fs.writeFileSync(path, buf);
}

export function checkPathExist(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        // 判断父文件夹是否存在
        if (getParentDir(dirPath)) {
            checkPathExist(getParentDir(dirPath));
        }
        fs.mkdirSync(dirPath);
    }
}

function getParentDir(dirPath: string): any {
    const arr = dirPath.split('/');
    let res;
    if (arr.length > 1) {
        arr.pop();
        res = arr.join('/');
    } else {
        res = null;
    }
    if (res == '.' || res == '') {
        res = null;
    }
    return res;
}

export async function downloadGitlabInfo(service: GitService) {
    console.log('downloadGitlabInfo');
    if (service == GitService.new) {
        await pullGroups(GitService.new, filePath.new_groups);
        await pullProjects(GitService.new, filePath.new_projects);
        await pullNamespaces(GitService.new, filePath.new_namespaces);
    } else {
        await pullGroups(GitService.old, filePath.old_groups);
        await pullProjects(GitService.old, filePath.old_projects);
        await pullNamespaces(GitService.old, filePath.old_namespaces);
    }
    console.log('download success!');
}

export async function getOldGroups(dataSource: DataSource) {
    switch (dataSource) {
        case DataSource.online:
            return await pullGroups(GitService.old);
        case DataSource.local:
            return readLocalFile(filePath.old_groups);
    }
}

export async function getOldProjects(dataSource: DataSource) {
    switch (dataSource) {
        case DataSource.online:
            return await pullProjects(GitService.old);
        case DataSource.local:
            return readLocalFile(filePath.old_projects);
    }
}

export async function getOldNamespaces(dataSource: DataSource) {
    switch (dataSource) {
        case DataSource.online:
            return await pullNamespaces(GitService.old);
        case DataSource.local:
            return readLocalFile(filePath.old_namespaces);
    }
}

export async function getNewGroups(dataSource: DataSource) {
    switch (dataSource) {
        case DataSource.online:
            return await pullGroups(GitService.new);
        case DataSource.local:
            return readLocalFile(filePath.new_groups);
    }
}

export async function getNewProjects(dataSource: DataSource) {
    switch (dataSource) {
        case DataSource.online:
            return await pullProjects(GitService.new);
        case DataSource.local:
            return readLocalFile(filePath.new_projects);
    }
}

export async function getNewNamespaces(dataSource: DataSource) {
    switch (dataSource) {
        case DataSource.online:
            return await pullNamespaces(GitService.new);
        case DataSource.local:
            return readLocalFile(filePath.new_namespaces);
    }
}

export function getGitAddrMap() {
    console.log(filePath.repositories_map);
    return readLocalFile(filePath.repositories_map);
}

export function readLocalFile(path: string) {
    const jsonBuffer = fs.readFileSync(path, {
        encoding: 'utf-8'
    });
    return JSON.parse(jsonBuffer);
}

/**
 * 获取 { group.full_path: {group_id, parent_id} } 的映射
 * 
 * @param groups 
 * @returns { group.full_path: {group_id, parent_id} }
 */
export function getExistGroupsMap(groups: any) {
    const groupsMap: any = {};
    for (let group of groups) {
        groupsMap[group.full_path] = {
            id: group.id,
            parent_id: group.parent_id
        };
    }
    return groupsMap
}

export function getParentFullPath(fullPath: string) {
    const arr = fullPath.split('/');
    if (arr.length > 1) {
        return fullPath.replace(`/${arr[arr.length - 1]}`, '');
    }
    return null
}

export function isIgnoreProject(projectFullPath: string): Boolean {
    for (let ignoreProject of config.ignore_projects_full_path) {
        if (projectFullPath == ignoreProject) {
            return true
        }
    }
    return false;
}

export function isIgnoreGroup(groupFullPath: string): Boolean {
    for (let ignoreGroup of config.ignore_groups_full_path) {
        if (groupFullPath == ignoreGroup) {
            return true
        }
    }
    return false;
}
