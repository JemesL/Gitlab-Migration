import { group } from 'console';
import * as _ from 'lodash';
import {
    config,
    getNewGroupFullPathByOldGroupFullPath,
} from './config';
import {
    getOldGroups,
    getNewGroups,
    getExistGroupsMap,
    createNewGroup,
    DataSource,
    CommandOptions,
    getParentFullPath,
    isIgnoreGroup
} from './data_Interface'
let ID_init = 1000;

export async function migrationGroup(commandOptions: CommandOptions) {
    console.log('migration group start');

    const dataSource = commandOptions.dataSource;
    // 获取 Groups
    const oldGroups = await getOldGroups(dataSource);
    const newGroups = await getNewGroups(dataSource);

    // 映射 知道存在对应的 newGroup
    // { full_path: new_group_id }
    // 获取 newGroup, 生成映射
    const newGroupsExistMap: any = getExistGroupsMap(newGroups);
    if (true) { // 纯打印
        console.log('new GroupsMap init data:');
        console.log(newGroupsExistMap);

        const om: any = getExistGroupsMap(oldGroups);
        console.log('old GroupsMap init data:');
        console.log(om);
    }
    // 开始创建 group
    await createGroupList(oldGroups, newGroupsExistMap, commandOptions)

    console.log('new GroupsMap final data:');
    console.log(newGroupsExistMap);
    console.log('migration group end');
}

async function createGroupList(groups: any, newGroupsMap: any, commandOptions: any) {
    let groupWithDepth: any = [];
    let maxDepth = 1;
    for (let group of groups) {
        // 判断是否 ignore
        if (isIgnoreGroup(group.full_path)) {
            console.log(`忽略 Group: ${group.full_path}`);
            continue;
        }
        const newGroupFullPathAfterTransform = getNewGroupFullPathByOldGroupFullPath(group.full_path) || group.full_path;
        const depth = newGroupFullPathAfterTransform.split('/').length;
        if (depth > maxDepth) {
            maxDepth = depth;
        }
        groupWithDepth.push({ depth: depth, newPath: newGroupFullPathAfterTransform, group})
    }

    for (let i = 1; i <= maxDepth; i++) {
        for (let groupD of groupWithDepth) {
            if (groupD.depth == i) { // depth 匹配成功
                await createGroup(groupD.newPath, groupD.group, newGroupsMap, commandOptions)
            }
        }
    }
}

function getPathFromFullPath(fullPath: string) {
    const arr = fullPath.split('/');
    return arr.pop();
}

async function createGroup(newGroupFullPath: string, oldGroup: any, newGroupsExistMap: any, commandOptions: CommandOptions) {
    // 判断是否已经创建了该 Group
    if  (newGroupsExistMap[newGroupFullPath]) {
        console.log(`${newGroupFullPath}(old: ${oldGroup ? oldGroup.full_path : '无'}) 已创建, newID: ${newGroupsExistMap[newGroupFullPath].id}, new_parent_id: ${newGroupsExistMap[newGroupFullPath].parent_id}`);
        return newGroupsExistMap[newGroupFullPath];
    }

    // 设置 parent_id
    let parent_id = null

    // 创建 parent_group
    if (getParentFullPath(newGroupFullPath)) {
        // 拿到 parent_group_full_path
        const new_parentFullPath = getParentFullPath(newGroupFullPath) || '';
        // 创建 parent group
        const parentGroup = await createGroup(new_parentFullPath, null, newGroupsExistMap, commandOptions);
        parent_id = parentGroup.id;
    }

    console.log(`创建Group: ${newGroupFullPath}`);
    let newGroup: any;
    if (oldGroup) { // 存在对应的 group , 则填充对应的 group 信息
        newGroup = {
            name: oldGroup.name,
            path: oldGroup.path,
            description: oldGroup.description,
            visibility: oldGroup.visibility,
            lfs_enabled: oldGroup.lfs_enabled,
            request_access_enabled: oldGroup.request_access_enabled,
            parent_id: parent_id
        }
    } else {
        // 从 fullpath 获取 path
        const pathOrName = getPathFromFullPath(newGroupFullPath);
        newGroup = {
            name: pathOrName,
            path: pathOrName,
            description: 'auto create',
            visibility: "public",
            parent_id: parent_id
        }
    }
    if (commandOptions.verify) {
        newGroup.id = ID_init;
        ID_init += 1;
    } else {
        newGroup = await createNewGroup(newGroup);
    }

    // 创建成功 则添加到 newGroups 中
    newGroupsExistMap[newGroupFullPath] = {
        id: newGroup.id,
        parent_id: newGroup.parent_id
    };
    
    console.log(newGroup);
    return newGroup;
}
