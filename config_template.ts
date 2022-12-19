/*
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-07 18:30:18
 */

export const config = {
    // 旧 gitlab 可 clone 的地址前缀, 去掉项目路径
    // 例如:
    // git@git.example.com:group_full_path/project_name.git
    // ${old_ssh_domain}group_full_path/project_name.git
    // old_ssh_domain = 'git@git.example.com:'
    // ssh://git@git.example.com:8801/group_full_path/project_name.git
    // ${old_ssh_domain}group_full_path/project_name.git
    // old_ssh_domain = 'ssh://git@git.example.com:8801/'
    old_ssh_domain: '',
    // Gitlab->Profile->Access Token 申请
    old_private_token: '',
    // Gitlab API 地址, 一般为 gitlab 地址后加上 `/api/v4`
    // 例如:
    // http://git.example.com/api/v4
    old_baseURL: '',

    // 新 gitlab, 配置同上
    new_ssh_domain: '',
    new_private_token: '',
    new_baseURL: '',

    // 缺省的 group, 指定的是转换后的 namespace
    default_group_full_path: '',


    // 需要忽略的 group 的 full_path(旧 gitlab)
    ignore_groups_full_path: [],
    // 需要忽略的 project 的 full_path(旧 gitlab)
    ignore_projects_full_path: []
};

// 转换为新 group 地址(old_group_full_path -> new_group_full_path)
// 例如:
// 旧 gitlab 所有的 group 都移动到 `oldGitlab`(新 gitlab 下的一个 group) 下 
// return `oldGitlab/${oldGroupFullPath}`
export function getNewGroupFullPathByOldGroupFullPath(oldGroupFullPath: string) {
    return oldGroupFullPath
}

// 转换新项目地址
export function transformNewProjectFullPathFrom(oldProjectFullPath: string) {
    return oldProjectFullPath
}

// 文件默认路径
export const filePath = {
    // clone 下来的仓库目录地址
    repo_download_path: './data/repositories',
    //  新旧 repo path 映射文件地址
    repositories_map: './data/repositories_map.json',
    
    old_groups: './data/old_groups.json',
    old_projects: './data/old_projects.json',
    old_namespaces: './data/old_namespaces.json',

    new_groups: './data/new_groups.json',
    new_projects: './data/new_projects.json',
    new_namespaces: './data/new_namespaces.json',
}
