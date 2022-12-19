<!--
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-16 16:09:28
-->
# Gitlab-Migration
> 基于 Gitlab API 和 git 命令来迁移 gitlab 数据

由于旧 gitlab 服务器出现问题, 导致需要更换服务器. 但是数据库迁移由于版本问题, 迁移难以执行.
后采用通过 clone&push 方式迁移数据.

## 前置条件

- 可以获取到新旧 gitlab 的 Access token, 用以访问项目数据
- 可以执行 clone&push 操作权限

## 安装

1. 下载项目, 进入项目目录
2. 执行 `npm install`

## 命令格式

```shell
npx ts-node ./gitlab_migration.ts Command [Options]
```

Commands:

- download, -d SERVICE
  - SERVICE 可以取值 new, old
- migration, -m ACTION
  - ACTION 可以取值 group, project, repo, clone, push
- delete ACTION
  - ACTION 可以取值 group, project

Options:

- --verify, -v
  - 验证流程, 不执行数据写入操作
- --local, -l
  - 走本地数据

## Config

- 创建 `config.ts` 文件, 文件模版`config_template.ts`
  - 配置必须的参数
  - 可以修改 Group 路径, 相当于移动 Group 的位置
  - 可以修改 Project 的路径, 相当于修改 Project 所属的 Group

```json
export const config = {
    // 旧 gitlab 可 clone 的地址前缀, 去掉项目路径
    // 举个🌰:
    // git@git.example.com:group_full_path/project_name.git
    // ${old_ssh_domain}group_full_path/project_name.git
    // old_ssh_domain = 'git@git.example.com:'

    // 举个🌰:
    // ssh://git@git.example.com:8801/group_full_path/project_name.git
    // ${old_ssh_domain}group_full_path/project_name.git
    // old_ssh_domain = 'ssh://git@git.example.com:8801/'
    // ****** require ******
    old_ssh_domain: '',

    // Gitlab->Profile->Access Token 申请
    // ****** require ******
    old_private_token: '',

    // Gitlab API 地址, 一般为 gitlab 地址后加上 `/api/v4`
    // 举个🌰:
    // http://git.example.com/api/v4
    // ****** require ******
    old_baseURL: '',

    // 新 gitlab, 配置同上
    // ****** require ******
    new_ssh_domain: '',
    // ****** require ******
    new_private_token: '',
    // ****** require ******
    new_baseURL: '',

    // 缺省的 group, 指定的是转换后的 namespace
    // ****** optional ******
    default_group_full_path: '',


    // 需要忽略的 group 的 full_path(旧 gitlab)
    // ****** optional ******
    ignore_groups_full_path: [],

    // 需要忽略的 project 的 full_path(旧 gitlab)
    // ****** optional ******
    ignore_projects_full_path: []
};

// 转换为新 group 地址(old_group_full_path -> new_group_full_path)
// 举个🌰:
// 旧 gitlab 所有的 group 都移动到 `oldGitlab`(新 gitlab 下的一个 group) 下, `oldGitlab` 不存在则自动创建
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
```

## 一键迁移

```shell
npx ts-node ./gitlab_migration.ts -m all
```

## 分步迁移

1. 下载组/项目信息
当后续步骤希望从本地拿数据时, 可以通过该命令下载数据至指定路径(config 中指定)
ps: 执行写入操作后, 要注意重新更新本地数据

```shell
// 下载新 gitlab 信息
npx ts-node ./gitlab_migration.ts -d new
// 下载旧 gitlab 信息
npx ts-node ./gitlab_migration.ts -d old
```

1. 迁移 Group
获取新旧 gitlab 的 Group信息. 根据 config 配置, 忽略或者路径重新映射, 创建 Group

```shell
npx ts-node ./gitlab_migration.ts -m group [-v] [-l]
```

3. 迁移 Project
获取新旧 gitlab 的 Project 信息. 根据 config 配置, 忽略或者路径重新映射, 创建 Project
会生成新旧 Project 地址的映射, 写入 `config.repositories_map` 指定的文件
ps: 如果走本地数据`-l`, 调用前需要更新 `新gitlab` 的信息

```shell
npx ts-node ./gitlab_migration.ts -m project [-v] [-l]
```

4. Clone repos
根据`config.repositories_map`文件, 来 clone 项目到`config.repo_download_path`

```shell
npx ts-node ./gitlab_migration.ts -m clone [-v] [-l]
```

5. Push repos
根据`config.repositories_map`文件, 将之前 clone 下来的项目 push 到新 gitlab 上

```shell
npx ts-node ./gitlab_migration.ts -m push [-v] [-l]
```

## 参考

- Gitlab API: [https://docs.gitlab.com/ee/api/api_resources.html]
- git-simple: [https://www.npmjs.com/package/simple-git]
