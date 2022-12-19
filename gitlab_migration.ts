/*
 * @Description: 
 * @Author: Jemesl
 * @Date: 2022-12-05 18:44:23
 */
import axios from 'axios';
import {
    verify
} from 'crypto';
import * as fs from 'fs';
import * as _ from 'lodash';
import {
    create
} from 'lodash';
import {
    config
} from './config';
import {
    deleteActions
} from './data_delete';
import {
    GitService,
    Migration,
    downloadGitlabInfo,
    CommandOptions,
    DataSource
} from './data_Interface'
import {
    migrationGroup
} from './migration_group';
import {
    migrationProjects
} from './migration_project';
import {
    cloneOldRepos,
    migrationRepositories,
    pushToRemote
} from './migration_repositories';

async function main() {
    const commandOptions = parseCommondOptions();
    switch (commandOptions.command) {
        case 'download':
            await downloadGitlabInfo(commandOptions.service);
            break;
        case 'migration':
            await migrationActions(commandOptions);
            break;
        case 'delete':
            await deleteActions(commandOptions);
            break;
        default:
            throw Error('没有指定命令 [download | migration]');
    }
}

async function migrationActions(commandOptions: CommandOptions) {
    switch (commandOptions.migration) {
        case Migration.all:
            await migrationAll(commandOptions);
            break;
        case Migration.group:
            await migrationGroup(commandOptions);
            break;
        case Migration.project:
            await migrationProjects(commandOptions);
            break;
        case Migration.repo:
            await migrationRepositories(commandOptions);
            break;
        case Migration.clone:
            await cloneOldRepos(commandOptions);
            break;
        case Migration.push:
            await pushToRemote(commandOptions);
            break;
    }
}

async function migrationAll(commandOptions: CommandOptions){
    if (commandOptions.dataSource == DataSource.local) {
        await downloadGitlabInfo(GitService.new);
        await downloadGitlabInfo(GitService.old);
    }
    await migrationGroup(commandOptions);
    if (commandOptions.dataSource == DataSource.local) {
        await downloadGitlabInfo(GitService.new);
    }
    await migrationProjects(commandOptions);
    if (commandOptions.dataSource == DataSource.local) {
        await downloadGitlabInfo(GitService.new);
    }
    await cloneOldRepos(commandOptions);
    await pushToRemote(commandOptions);
}

function parseCommondOptions(): CommandOptions {
    const params: any = process.argv.splice(2, process.argv.length - 1);
    let commandOptions = new CommandOptions();
    commandOptions.verify = false;
    while (params.length > 0) {
        switch (params[0]) {
            case 'download':
            case '-d':
                commandOptions.command = 'download';
                params.shift();
                switch (params[0]) {
                    case 'new':
                        commandOptions.service = GitService.new;
                        break;
                    case 'old':
                        commandOptions.service = GitService.old;
                        break;
                    default:
                        throw Error('[download | -d] 没有指定值[ new | old ]');
                }
                params.shift();
                break;
            case 'migration':
            case '-m':
                commandOptions.command = 'migration';
                params.shift();
                switch (params[0]) {
                    case 'all': 
                        commandOptions.migration = Migration.all;
                        break;
                    case 'group':
                        commandOptions.migration = Migration.group;
                        break;
                    case 'project':
                        commandOptions.migration = Migration.project;
                        break;
                    case 'repo':
                        commandOptions.migration = Migration.repo;
                        break;
                    case 'clone':
                        commandOptions.migration = Migration.clone;
                        break;
                    case 'push':
                        commandOptions.migration = Migration.push;
                        break;
                    default:
                        throw Error('[migration | -m] 没有指定值[ group | pro | repo | clone | push ]');
                }
                params.shift();
                break;
            case 'delete':
                commandOptions.command = 'delete';
                params.shift();
                switch (params[0]) {
                    case 'group':
                        commandOptions.migration = Migration.group;
                        break;
                    case 'project':
                        commandOptions.migration = Migration.project;
                        break;
                    default:
                        throw Error('[delete] 没有指定值[ group | pro ]');
                }
                params.shift();
                break;
            case '--verify':
            case '-v':
                commandOptions.verify = true;
                params.shift();
                break;
            case '--local':
            case '-l':
                commandOptions.dataSource = DataSource.local;
                params.shift();
                break;
            default:
                // throw Error('无效参数');
                break;
        }
    }
    console.log(commandOptions);
    return commandOptions;
}

main()
