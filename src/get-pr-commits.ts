import github from '@actions/github';
import { paginate } from './paginate';
import { CommitsResult } from './commits.type';
import { groupBy, keys, uniqBy } from 'lodash';

github.context.issue;

const getPRCommitsQuery = /* GraphQL */ `
  query getPRCommits($repo: String!, $owner: String!, $number: Int!, $after: String) {
    repository(name: $repo, owner: $owner) {
      pullRequest(number: $number) {
        commits(first: 100, after: $after) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            commit {
              url
              messageHeadline
              author {
                user {
                  login
                }
              }
              associatedPullRequests(first: 1) {
                nodes {
                  author {
                    login
                  }
                  number
                  title
                  labels(first: 20) {
                    nodes {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const dataPath = ['repository', 'pullRequest', 'commits'];

export async function getPRCommits(
  octokit: ReturnType<typeof github.getOctokit>,
  issue: typeof github.context.issue,
) {
  const commitsResult = (await paginate(octokit, getPRCommitsQuery, issue, dataPath)) as CommitsResult;

  const formattedCommits = commitsResult.repository.pullRequest.commits.nodes.map(({ commit }) => {
    console.log(commit);
    return {
      name: commit.messageHeadline,
      url: commit.url,
      author: commit.author.user?.login || 'unknown',
      pr: commit.associatedPullRequests.nodes.length
        ? {
            author: commit.associatedPullRequests.nodes[0].author.login,
            number: commit.associatedPullRequests.nodes[0].number,
            title: commit.associatedPullRequests.nodes[0].title,
            labels: commit.associatedPullRequests.nodes[0].labels.nodes.map((label) => label.name),
          }
        : null,
    };
  });

  const authorCommits = groupBy(formattedCommits, (commit) => (commit.pr ? commit.pr.author : commit.author));

  const result = keys(authorCommits)
    .map((author) => {
      const uniqCommits = uniqBy(authorCommits[author], (commit) => commit.pr?.title || commit.name);

      const prs = uniqCommits.filter((commit) => commit.pr);
      const directCommits = uniqCommits.filter((commit) => !commit.pr);

      return [
        `### @${author} - ${prs.length} pull requests`,
        ...prs.map((commit) => `   - ${commit.pr!.title} ${'#' + commit.pr!.number}`),
        directCommits.length
          ? [
              `<details>`,
              `  <summary>@${author} direct commits (${directCommits.length})</summary>`,
              ...directCommits.map((commit) => `   - ${commit.name} ${commit.url}`),
              `</details>`,
            ].join('\n\n')
          : '',
      ].join('\n');
    })
    .join(`\n\n`);

  console.log(result);
  return result;
}
