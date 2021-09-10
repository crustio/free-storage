import axios from 'axios';
import { Octokit } from 'octokit';
import { isValidAddr } from '..';
import { githubUserName, githubRepoName, githubOauthToken } from '../consts'
import { validateGithub } from '../util';
import _ from 'lodash';

export interface GithubApplicant {
    address: string;
    githubId: string;
    githubName: string
}

export interface IssueParseResult {
    status: boolean;
    result?: any;
    githubInfo?: GithubApplicant
}

// basic auth
const octokit = new Octokit({ auth: githubOauthToken });

export const judgeGithubIdentityByIssueNum = async (issueId: number): Promise<IssueParseResult> => {
    try {
        let remoteIssue = await octokit.rest.issues.get({
            owner: githubUserName,
            repo: githubRepoName,
            issue_number: issueId
        })
        const issueData = remoteIssue.data;
        if (issueData) {
            const issueTittle = issueData.title;
            if (isValidAddr(issueTittle)) {
                const creatorId = issueData.user?.id;
                if (creatorId) {     
                    try {
                        const userInfo = await axios({
                            method: 'get',
                            url: `https://api.github.com/user/${creatorId}`
                        });
                        const isValid = validateGithub(Date.parse(userInfo.data.created_at));
                        const isStarred = await maybeStarred(creatorId as number);
                        if (isValid) {
                            if (isStarred) {
                                return {
                                    status: true,
                                    githubInfo: {
                                        address: issueTittle as any as string,
                                        githubId: creatorId as any as string,
                                        githubName: userInfo.data.login
                                    }
                                }
                            } else {  
                                return {
                                    status: false,
                                    result: '🌟  Please **star crust repo**(https://github.com/crustio/crust), then apply it again.'
                                };
                            }
                        } else {
                            return {
                                status: false,
                                result: '🕹   Your Github account registration time is not long enough, please try again **when reached half a year**.'
                            };
                        }
                    } catch (error) {
                        return {
                            status: false,
                            result: `💥  Bad request(cannot get github user), please double check your github account.`
                        };
                    }
                } else {
                    return {
                        status: false,
                        result: `💥  Bad request(invalid github user), please double check your github account.`
                    }
                }
            } else {
                return {
                    status: false,
                    result: '💥  Bad request(invalid Crust address), the issue title must be a legal Crust address.'
                } 
            }
        } else {
            return {
                status: false,
                result: '💥 Bad request(issue not exist), please double check your issue link.'
            }
        }
    } catch (error) {
        return {
            status: false,
            result: '💥 Bad request(invalid issue), please double check your github account.'
        }
    }
}

export const maybeStarred = async (githubId: number) => {
    const repoInfo = await octokit.rest.repos.get({
        owner: 'crustio',
        repo: 'crust'
    })
    const total_stargazers_count = repoInfo.data.stargazers_count;
    const requestCount = Math.floor(_.divide(total_stargazers_count, 100)) + 1
    const starInfo: any[] = [];
    for (let i = 1; i < requestCount; i ++ ) {
        const starInfoResult = await octokit.request('GET /repos/{owner}/{repo}/stargazers', {
            owner: 'crustio',
            repo: 'crust',
            per_page: 100,
            page: i
        })
        const stars = starInfoResult.data as any[]
        starInfo.push(...stars)
    }

    const index = _.findIndex(starInfo, (info) => {
        return info.id == githubId
    })

    return index >= 0;
}